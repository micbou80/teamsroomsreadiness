import { getAllChecks, categories, getCategoryDefinition } from './registry';
import { Assessment, AssessmentConfig, CategoryResult, CheckContext, CheckResult, CheckStatus, PowerShellUpload, ResourceAccount } from './types';
import { computeCategoryScore, computeOverallScore, deriveStatus } from './scoring';
import { isCheckRelevant } from './device-relevance';

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

  const allRegistered = getAllChecks();

  // Filter checks by selected device types (if provided)
  const selectedDevices = fullContext.selectedDevices;
  const allChecks = selectedDevices && selectedDevices.size > 0
    ? allRegistered.filter((c) => isCheckRelevant(c.id, selectedDevices))
    : allRegistered;

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

  // Execute PowerShell checks — they may auto-resolve (e.g. via Exchange API)
  // or return 'pending' if the required permissions/tokens aren't available.
  let psMergedCount = 0;
  const psResults = await Promise.allSettled(
    psChecks.map(async (check) => {
      // If uploaded PS data has this check, use it directly (override)
      if (fullContext.powershellData) {
        const uploaded = fullContext.powershellData.checks.find((c) => c.checkId === check.id);
        if (uploaded) {
          psMergedCount++;
          return {
            checkId: uploaded.checkId,
            categoryId: uploaded.categoryId,
            name: check.name,
            status: uploaded.status,
            source: 'powershell' as const,
            severity: check.severity,
            details: uploaded.details,
            rawData: uploaded.rawData,
            timestamp: fullContext.powershellData.generatedAt,
          } satisfies CheckResult;
        }
      }

      // Otherwise, try executing the check (may use Exchange API or return pending)
      try {
        const result = await check.execute(fullContext);
        completed++;
        onProgress?.(completed, allChecks.length, check.name);
        return result;
      } catch {
        completed++;
        onProgress?.(completed, allChecks.length, check.name);
        return {
          checkId: check.id,
          categoryId: check.categoryId,
          name: check.name,
          status: 'pending' as CheckStatus,
          source: check.source,
          severity: check.severity,
          details: 'Requires PowerShell companion module. Run Invoke-MTRReadinessCheck and upload results.',
          timestamp: new Date().toISOString(),
        } satisfies CheckResult;
      }
    }),
  );

  for (const result of psResults) {
    if (result.status === 'fulfilled') {
      results.push(result.value);
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
