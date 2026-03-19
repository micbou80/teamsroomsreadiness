import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { CategoryId, CategoryResult, CheckStatus } from '@/checks/types';
import { computeCategoryScore, computeOverallScore, deriveStatus } from '@/checks/scoring';

/**
 * POST /api/assessment/merge-network?id=<assessmentId>
 *
 * Merges browser-based network check results into an existing assessment.
 * Called automatically after the assessment page runs /api/network-check.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assessmentId = searchParams.get('id');

  if (!assessmentId) {
    return NextResponse.json({ error: 'Missing assessment id.' }, { status: 400 });
  }

  let checks: NetworkCheckInput[];
  try {
    checks = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!Array.isArray(checks) || checks.length === 0) {
    return NextResponse.json({ error: 'Expected a non-empty array of checks.' }, { status: 400 });
  }

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
  });

  if (!assessment) {
    return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
  }

  const categories: CategoryResult[] = JSON.parse(assessment.results);
  let mergedCount = 0;

  for (const check of checks) {
    const category = categories.find((c) => c.categoryId === check.categoryId);
    if (!category) continue;

    const existingIdx = category.checks.findIndex((c) => c.checkId === check.checkId);
    if (existingIdx !== -1) {
      // Update existing pending check with real result
      category.checks[existingIdx] = {
        ...category.checks[existingIdx],
        status: check.status as CheckStatus,
        details: check.details,
        rawData: check.rawData,
        source: 'graph', // server-side check, not PowerShell
      };
      mergedCount++;
    } else {
      // Append new check
      category.checks.push({
        checkId: check.checkId,
        categoryId: check.categoryId as CategoryId,
        name: check.checkId,
        status: check.status as CheckStatus,
        source: 'graph',
        severity: 'medium',
        details: check.details,
        rawData: check.rawData,
        timestamp: new Date().toISOString(),
      });
      mergedCount++;
    }
  }

  // Recalculate scores
  for (const cat of categories) {
    cat.score = computeCategoryScore(cat.checks);
    cat.status = deriveStatus(cat.checks);
  }

  const newOverallScore = computeOverallScore(categories);
  const allChecks = categories.flatMap((c) => c.checks);

  const existingMeta = JSON.parse(assessment.metadata);
  existingMeta.networkChecksMerged = (existingMeta.networkChecksMerged ?? 0) + mergedCount;

  await prisma.assessment.update({
    where: { id: assessmentId },
    data: {
      overallScore: newOverallScore,
      overallStatus: deriveStatus(allChecks),
      results: JSON.stringify(categories),
      metadata: JSON.stringify(existingMeta),
    },
  });

  return NextResponse.json({
    success: true,
    mergedCount,
    newOverallScore,
  });
}

interface NetworkCheckInput {
  checkId: string;
  categoryId: string;
  status: string;
  details: string;
  rawData?: any;
}
