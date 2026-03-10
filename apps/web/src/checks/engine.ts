import { getAllChecks, categories, getCategoryDefinition } from './registry';
import { Assessment, AssessmentConfig, CategoryResult, CheckContext, CheckResult, CheckStatus, PowerShellUpload, ResourceAccount } from './types';
import { computeCategoryScore, computeOverallScore, deriveStatus } from './scoring';

export async function runAssessment(
  context: Omit<CheckContext, 'resourceAccounts'> & { resourceAccounts?: ResourceAccount[] },
  onProgress?: (completed: number, total: number, current: string) => void,
): Promise<Assessment> {
  const startTime = Date.now();

  // If resource accounts not pre-fetched, the caller should provide them
  const fullContext: CheckContext = {
    ...context,
    resourceAccounts: context.resourceAccounts ?? [],
  };

  const allChecks = getAllChecks();
  const results: CheckResult[] = [];
  let completed = 0;

  // Run all Graph-based checks concurrently
  const graphChecks = allChecks.filter((c) => c.source === 'graph');
  const psChecks = allChecks.filter((c) => c.source === 'powershell');
  const manualChecks = allChecks.filter((c) => c.source === 'manual');

  // Execute graph checks with error isolation per check
  const graphResults = await Promise.allSettled(
    graphChecks.map(async (check) => {
      try {
        const result = await check.execute(fullContext);
        completed++;
        onProgress?.(completed, allChecks.length, check.name);
        return result;
      } catch (error) {
        completed++;
        onProgress?.(completed, allChecks.length, check.name);
        return {
          checkId: check.id,
          categoryId: check.categoryId,
          name: check.name,
          status: 'warning' as CheckStatus,
          source: check.source,
          severity: check.severity,
          details: `Check failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date().toISOString(),
        } satisfies CheckResult;
      }
    }),
  );

  // Collect graph results
  for (const result of graphResults) {
    if (result.status === 'fulfilled') {
      results.push(result.value);
    }
  }

  // Merge PowerShell data if uploaded
  let psMergedCount = 0;
  if (fullContext.powershellData) {
    for (const psCheck of psChecks) {
      const uploaded = fullContext.powershellData.checks.find((c) => c.checkId === psCheck.id);
      if (uploaded) {
        results.push({
          checkId: uploaded.checkId,
          categoryId: uploaded.categoryId,
          name: psCheck.name,
          status: uploaded.status,
          source: 'powershell',
          severity: psCheck.severity,
          details: uploaded.details,
          rawData: uploaded.rawData,
          timestamp: fullContext.powershellData.generatedAt,
        });
        psMergedCount++;
      } else {
        results.push({
          checkId: psCheck.id,
          categoryId: psCheck.categoryId,
          name: psCheck.name,
          status: 'pending',
          source: 'powershell',
          severity: psCheck.severity,
          details: 'Requires PowerShell companion module. Run Invoke-MTRReadinessCheck and upload results.',
          timestamp: new Date().toISOString(),
        });
      }
    }
  } else {
    // No PS data — mark all PS checks as pending
    for (const psCheck of psChecks) {
      results.push({
        checkId: psCheck.id,
        categoryId: psCheck.categoryId,
        name: psCheck.name,
        status: 'pending',
        source: 'powershell',
        severity: psCheck.severity,
        details: 'Requires PowerShell companion module. Run Invoke-MTRReadinessCheck and upload results.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Mark manual checks as pending
  for (const manualCheck of manualChecks) {
    results.push({
      checkId: manualCheck.id,
      categoryId: manualCheck.categoryId,
      name: manualCheck.name,
      status: 'pending',
      source: 'manual',
      severity: manualCheck.severity,
      details: 'Requires manual on-site validation.',
      timestamp: new Date().toISOString(),
    });
  }

  // Aggregate into categories
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
    tenantId: fullContext.tenantId,
    createdAt: new Date().toISOString(),
    categories: categoryResults,
    overallScore,
    overallStatus: deriveStatus(results),
    metadata: {
      webChecksRun: graphResults.length,
      powershellChecksMerged: psMergedCount,
      manualChecksCompleted: 0,
      duration: Date.now() - startTime,
    },
  };
}
