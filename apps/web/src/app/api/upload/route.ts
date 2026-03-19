import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { CategoryResult, CheckStatus } from '@/checks/types';

// ---------------------------------------------------------------------------
// Zod schema for the PowerShell JSON upload
// ---------------------------------------------------------------------------

const checkStatusEnum = z.enum([
  'pass',
  'fail',
  'warning',
  'info',
  'not-applicable',
  'pending',
]);

const categoryIdEnum = z.enum([
  'licensing',
  'identity',
  'calendar',
  'conditional-access',
  'network',
  'platform',
  'security',
  'management',
  'voice',
]);

const psCheckSchema = z.object({
  checkId: z.string().min(1),
  categoryId: categoryIdEnum,
  status: checkStatusEnum,
  details: z.string(),
  rawData: z.record(z.string(), z.unknown()).optional(),
});

const uploadSchema = z.object({
  version: z.string().min(1),
  generatedAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
  hostname: z.string().min(1),
  checks: z.array(psCheckSchema).min(1),
});

// ---------------------------------------------------------------------------
// POST  /api/upload  — Accept PowerShell JSON results
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isDemo = searchParams.get('demo') === 'true';
  const uploadToken = searchParams.get('token');

  let tenantId: string;
  let targetAssessmentId: string | null = null;

  if (uploadToken) {
    // Token-based auth (from PowerShell -AutoUpload)
    const tokenRecord = await prisma.uploadToken.findUnique({
      where: { token: uploadToken },
    });

    if (!tokenRecord) {
      return NextResponse.json({ error: 'Invalid upload token.' }, { status: 401 });
    }
    if (tokenRecord.usedAt) {
      return NextResponse.json({ error: 'Upload token has already been used.' }, { status: 401 });
    }
    if (new Date() > tokenRecord.expiresAt) {
      return NextResponse.json({ error: 'Upload token has expired.' }, { status: 401 });
    }

    tenantId = tokenRecord.tenantId;
    targetAssessmentId = tokenRecord.assessmentId;
  } else if (isDemo) {
    tenantId = 'demo-tenant-00000000';
  } else {
    const session = await auth();
    if (!session?.tenantId) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }
    tenantId = session.tenantId;
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = uploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation failed.',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const upload = parsed.data;

  // Find the target assessment: specific ID from token, or latest for tenant
  const latestAssessment = targetAssessmentId
    ? await prisma.assessment.findFirst({
        where: { id: targetAssessmentId, tenantId },
      })
    : await prisma.assessment.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });

  if (!latestAssessment) {
    return NextResponse.json(
      {
        error:
          'No existing assessment found. Run an assessment first, then upload PowerShell results to merge.',
      },
      { status: 404 },
    );
  }

  // Merge PowerShell results into the existing categories
  const existingCategories: CategoryResult[] = JSON.parse(latestAssessment.results);
  let mergedCount = 0;

  for (const psCheck of upload.checks) {
    const category = existingCategories.find((c) => c.categoryId === psCheck.categoryId);
    if (!category) continue;

    const existingIdx = category.checks.findIndex((c) => c.checkId === psCheck.checkId);
    if (existingIdx !== -1) {
      // Update existing check result
      category.checks[existingIdx] = {
        ...category.checks[existingIdx],
        status: psCheck.status as CheckStatus,
        details: psCheck.details,
        rawData: psCheck.rawData,
        source: 'powershell',
        timestamp: upload.generatedAt,
      };
      mergedCount++;
    } else {
      // Append new check result
      category.checks.push({
        checkId: psCheck.checkId,
        categoryId: psCheck.categoryId,
        name: psCheck.checkId, // fallback name
        status: psCheck.status as CheckStatus,
        source: 'powershell',
        severity: 'medium',
        details: psCheck.details,
        rawData: psCheck.rawData,
        timestamp: upload.generatedAt,
      });
      mergedCount++;
    }
  }

  // Recalculate scores — import scoring inline to keep this server-only
  const { computeCategoryScore, computeOverallScore, deriveStatus } = await import(
    '@/checks/scoring'
  );

  for (const cat of existingCategories) {
    cat.score = computeCategoryScore(cat.checks);
    cat.status = deriveStatus(cat.checks);
  }

  const newOverallScore = computeOverallScore(existingCategories);
  const allChecks = existingCategories.flatMap((c) => c.checks);

  // Parse existing metadata and update PS merged count
  const existingMeta = JSON.parse(latestAssessment.metadata);
  existingMeta.powershellChecksMerged =
    (existingMeta.powershellChecksMerged ?? 0) + mergedCount;

  // Update the assessment in the database
  await prisma.assessment.update({
    where: { id: latestAssessment.id },
    data: {
      overallScore: newOverallScore,
      overallStatus: deriveStatus(allChecks),
      results: JSON.stringify(existingCategories),
      metadata: JSON.stringify(existingMeta),
    },
  });

  // Mark token as used only after a successful upload
  if (uploadToken) {
    await prisma.uploadToken.update({
      where: { token: uploadToken },
      data: { usedAt: new Date() },
    });
  }

  return NextResponse.json({
    success: true,
    mergedCount,
    assessmentId: latestAssessment.id,
    newOverallScore,
  });
}
