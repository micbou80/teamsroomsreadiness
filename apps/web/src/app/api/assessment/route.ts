import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createGraphClient } from '@/lib/graph-client';
import { runAssessment } from '@/checks/engine';
import { getAllChecks, categories } from '@/checks/registry';
import type {
  Assessment,
  CategoryId,
  CategoryResult,
  CheckResult,
  CheckStatus,
} from '@/checks/types';
import { computeCategoryScore, computeOverallScore, deriveStatus } from '@/checks/scoring';

// Import all check category index files to register checks
import '@/checks/licensing';
import '@/checks/identity';
import '@/checks/calendar';
import '@/checks/conditional-access';
import '@/checks/network';
import '@/checks/platform';
import '@/checks/security';
import '@/checks/management';
import '@/checks/voice';

// ---------------------------------------------------------------------------
// Demo mode helpers
// ---------------------------------------------------------------------------

const DEMO_TENANT_ID = 'demo-tenant-00000000';

function randomStatus(): CheckStatus {
  const roll = Math.random();
  if (roll < 0.5) return 'pass';
  if (roll < 0.7) return 'fail';
  if (roll < 0.85) return 'warning';
  return 'info';
}

function generateDemoAssessment(): Assessment {
  const allChecks = getAllChecks();
  const now = new Date().toISOString();

  const results: CheckResult[] = allChecks.map((check) => ({
    checkId: check.id,
    categoryId: check.categoryId,
    name: check.name,
    status: check.source === 'powershell' ? 'pending' : randomStatus(),
    source: check.source,
    severity: check.severity,
    details:
      check.source === 'powershell'
        ? 'Requires PowerShell companion module. Run Invoke-MTRReadinessCheck and upload results.'
        : 'Demo result generated for testing purposes.',
    remediation: check.docUrl ? `See documentation: ${check.docUrl}` : undefined,
    docUrl: check.docUrl,
    timestamp: now,
  }));

  const categoryResults: CategoryResult[] = categories.map((cat) => {
    const catChecks = results.filter((r) => r.categoryId === cat.id);
    return {
      categoryId: cat.id,
      name: cat.name,
      icon: cat.icon,
      checks: catChecks,
      score: computeCategoryScore(catChecks),
      status: deriveStatus(catChecks),
    };
  });

  const overallScore = computeOverallScore(categoryResults);

  return {
    id: crypto.randomUUID(),
    tenantId: DEMO_TENANT_ID,
    createdAt: now,
    categories: categoryResults,
    overallScore,
    overallStatus: deriveStatus(results),
    metadata: {
      webChecksRun: results.filter((r) => r.source === 'graph').length,
      powershellChecksMerged: 0,
      manualChecksCompleted: 0,
      duration: Math.floor(Math.random() * 3000) + 500,
    },
  };
}

// ---------------------------------------------------------------------------
// POST  /api/assessment  — Run a new assessment (or generate demo)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isDemo = searchParams.get('demo') === 'true';

  let assessment: Assessment;

  if (isDemo) {
    // Demo mode: generate sample results without real Azure AD
    assessment = generateDemoAssessment();
  } else {
    // Real mode: requires authenticated session with access token
    const session = await auth();
    if (!session?.tenantId) {
      return NextResponse.json(
        { error: 'Not authenticated. Please sign in with your Microsoft account.' },
        { status: 401 },
      );
    }

    // Retrieve access token from the JWT (server-side only)
    // The token is stored by the jwt callback in auth.ts
    const tokenRes = await auth();
    const accessToken = (tokenRes as any)?.accessToken as string | undefined;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token expired. Please sign in again.' },
        { status: 401 },
      );
    }

    const graphClient = createGraphClient(accessToken);

    try {
      assessment = await runAssessment({
        graphClient,
        tenantId: session.tenantId,
        config: {
          namingConventionPrefix: 'MTR-',
          expectedTimezones: {},
          includeVoiceChecks: true,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json({ error: `Assessment failed: ${message}` }, { status: 500 });
    }
  }

  // Persist to database
  try {
    // Ensure tenant record exists for demo mode
    if (isDemo) {
      await prisma.tenant.upsert({
        where: { tenantId: DEMO_TENANT_ID },
        update: {},
        create: {
          tenantId: DEMO_TENANT_ID,
          displayName: 'Demo Tenant',
        },
      });
    }

    await prisma.assessment.create({
      data: {
        id: assessment.id,
        tenantId: assessment.tenantId,
        overallScore: assessment.overallScore,
        overallStatus: assessment.overallStatus,
        results: JSON.stringify(assessment.categories),
        metadata: JSON.stringify(assessment.metadata),
      },
    });
  } catch (dbErr) {
    // Log but don't fail — the assessment result is still useful
    console.error('Failed to persist assessment:', dbErr);
  }

  return NextResponse.json(assessment);
}

// ---------------------------------------------------------------------------
// GET  /api/assessment  — List past assessments for the tenant
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isDemo = searchParams.get('demo') === 'true';
  const id = searchParams.get('id');

  let tenantId: string;

  if (isDemo) {
    tenantId = DEMO_TENANT_ID;
  } else {
    const session = await auth();
    if (!session?.tenantId) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }
    tenantId = session.tenantId;
  }

  // Latest assessment
  if (searchParams.get('latest') === 'true') {
    const latest = await prisma.assessment.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      id: latest.id,
      tenantId: latest.tenantId,
      overallScore: latest.overallScore,
      overallStatus: latest.overallStatus,
      categories: JSON.parse(latest.results),
      metadata: JSON.parse(latest.metadata),
      createdAt: latest.createdAt.toISOString(),
    });
  }

  // Single assessment by ID
  if (id) {
    const assessment = await prisma.assessment.findFirst({
      where: { id, tenantId },
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
    }

    return NextResponse.json({
      id: assessment.id,
      tenantId: assessment.tenantId,
      overallScore: assessment.overallScore,
      overallStatus: assessment.overallStatus,
      categories: JSON.parse(assessment.results),
      metadata: JSON.parse(assessment.metadata),
      createdAt: assessment.createdAt.toISOString(),
    });
  }

  // List assessments
  const assessments = await prisma.assessment.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      overallScore: true,
      overallStatus: true,
      createdAt: true,
    },
    take: 50,
  });

  return NextResponse.json(
    assessments.map((a) => ({
      id: a.id,
      score: a.overallScore,
      status: a.overallStatus,
      createdAt: a.createdAt.toISOString(),
    })),
  );
}
