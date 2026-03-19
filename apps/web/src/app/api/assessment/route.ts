import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decode } from '@auth/core/jwt';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createGraphClient } from '@/lib/graph-client';
import { getExchangeToken } from '@/lib/exchange-token';
import { runAssessment } from '@/checks/engine';
import { getAllChecks, categories } from '@/checks/registry';
import type {
  Assessment,
  CategoryId,
  CategoryResult,
  CheckResult,
  CheckStatus,
  DeviceType,
} from '@/checks/types';
import { computeCategoryScore, computeOverallScore, deriveStatus } from '@/checks/scoring';
import { isCheckRelevant } from '@/checks/device-relevance';

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

function generateDemoAssessment(deviceTypes?: DeviceType[]): Assessment {
  const allRegistered = getAllChecks();
  const selectedDevices = deviceTypes && deviceTypes.length > 0
    ? new Set<DeviceType>(deviceTypes)
    : null;
  const allChecks = selectedDevices
    ? allRegistered.filter((c) => isCheckRelevant(c.id, selectedDevices))
    : allRegistered;
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

  // Parse request body for device types
  let deviceTypes: DeviceType[] | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    if (Array.isArray(body.deviceTypes)) {
      deviceTypes = body.deviceTypes;
    }
  } catch {
    // No body or invalid JSON — continue without device filter
  }

  let assessment: Assessment;

  if (isDemo) {
    // Demo mode: generate sample results without real Azure AD
    assessment = generateDemoAssessment(deviceTypes);
  } else {
    // Real mode: requires authenticated session with access token
    // Read chunked session cookie (authjs splits large JWTs into .0, .1, etc.)
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const prefix = allCookies.some(c => c.name.startsWith('__Secure-authjs.session-token'))
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token';

    // Reassemble chunked cookie
    let sessionToken = cookieStore.get(prefix)?.value;
    if (!sessionToken) {
      const chunks: string[] = [];
      for (let i = 0; ; i++) {
        const chunk = cookieStore.get(`${prefix}.${i}`)?.value;
        if (!chunk) break;
        chunks.push(chunk);
      }
      if (chunks.length > 0) sessionToken = chunks.join('');
    }

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated. Please sign in with your Microsoft account.' },
        { status: 401 },
      );
    }

    const secret = process.env.AUTH_SECRET!;
    const decoded = await decode({ token: sessionToken, secret, salt: prefix });
    const accessToken = decoded?.accessToken as string | undefined;
    const tenantIdFromJwt = decoded?.tenantId as string | undefined;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token expired. Please sign in again.' },
        { status: 401 },
      );
    }

    const tenantId = tenantIdFromJwt || process.env.AZURE_AD_TENANT_ID || '';

    const graphClient = createGraphClient(accessToken);

    // Acquire Exchange Online token (optional — enables automatic calendar checks)
    const exchangeToken = await getExchangeToken(tenantId) ?? undefined;

    try {
      assessment = await runAssessment({
        graphClient,
        tenantId,
        exchangeToken,
        selectedDevices: deviceTypes && deviceTypes.length > 0
          ? new Set<DeviceType>(deviceTypes)
          : undefined,
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
    // Ensure tenant record exists
    await prisma.tenant.upsert({
      where: { tenantId: assessment.tenantId },
      update: {},
      create: {
        tenantId: assessment.tenantId,
        displayName: isDemo ? 'Demo Tenant' : assessment.tenantId,
      },
    });

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
