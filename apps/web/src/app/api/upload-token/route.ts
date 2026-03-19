import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import path from 'path';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * POST /api/upload-token
 *
 * Generates a short-lived token that the PowerShell module can use
 * to POST results directly to /api/upload?token=xxx without browser cookies.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isDemo = searchParams.get('demo') === 'true';
  const assessmentId = searchParams.get('assessmentId');

  if (!assessmentId) {
    return NextResponse.json({ error: 'Missing assessmentId.' }, { status: 400 });
  }

  let tenantId: string;
  if (isDemo) {
    tenantId = 'demo-tenant-00000000';
  } else {
    const session = await auth();
    if (!session?.tenantId) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }
    tenantId = session.tenantId;
  }

  // Verify the assessment exists and belongs to this tenant
  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, tenantId },
  });

  if (!assessment) {
    return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
  }

  // Generate a cryptographically random token (32 bytes, base64url)
  const token = randomBytes(32).toString('base64url');

  // Token expires in 1 hour
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.uploadToken.create({
    data: {
      token,
      assessmentId,
      tenantId,
      expiresAt,
    },
  });

  // Build the upload URL
  const origin = request.headers.get('origin') || request.headers.get('host') || 'localhost:3000';
  const protocol = origin.startsWith('localhost') || origin.startsWith('127.') ? 'http' : 'https';
  const baseUrl = origin.includes('://') ? origin : `${protocol}://${origin}`;
  const uploadUrl = `${baseUrl}/api/upload?token=${token}`;

  // Derive the absolute path to the local PowerShell module.
  // process.cwd() is apps/web when running Next.js — repo root is two levels up.
  const psModulePath = path.resolve(
    process.cwd(),
    '../../packages/powershell/MTRReadiness/MTRReadiness.psd1',
  );

  return NextResponse.json({
    token,
    uploadUrl,
    psModulePath,
    expiresAt: expiresAt.toISOString(),
    assessmentId,
  });
}
