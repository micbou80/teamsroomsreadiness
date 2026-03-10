import { CategoryResult, CheckResult, CheckStatus } from './types';

const SEVERITY_WEIGHTS: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Compute score for a set of checks within a category.
 * Excludes 'not-applicable' and 'pending' checks from the calculation.
 * Returns 0-100.
 */
export function computeCategoryScore(checks: CheckResult[]): number {
  const scorableChecks = checks.filter(
    (c) => c.status !== 'not-applicable' && c.status !== 'pending',
  );

  if (scorableChecks.length === 0) return 100;

  const totalWeight = scorableChecks.reduce(
    (sum, c) => sum + (SEVERITY_WEIGHTS[c.severity] ?? 1),
    0,
  );

  const passedWeight = scorableChecks
    .filter((c) => c.status === 'pass' || c.status === 'info')
    .reduce((sum, c) => sum + (SEVERITY_WEIGHTS[c.severity] ?? 1), 0);

  return Math.round((passedWeight / totalWeight) * 100);
}

/**
 * Compute overall score as a weighted average of category scores.
 * Categories with no scorable checks are excluded.
 */
export function computeOverallScore(categories: CategoryResult[]): number {
  const scorable = categories.filter((c) => {
    const hasScorableChecks = c.checks.some(
      (ch) => ch.status !== 'not-applicable' && ch.status !== 'pending',
    );
    return hasScorableChecks;
  });

  if (scorable.length === 0) return 0;
  const total = scorable.reduce((sum, c) => sum + c.score, 0);
  return Math.round(total / scorable.length);
}

/**
 * Derive an overall status from a set of check results.
 * Priority: fail > warning > info > pass. Pending and N/A are ignored.
 */
export function deriveStatus(checks: CheckResult[]): CheckStatus {
  const statuses = checks
    .filter((c) => c.status !== 'not-applicable' && c.status !== 'pending')
    .map((c) => c.status);

  if (statuses.length === 0) return 'pending';
  if (statuses.includes('fail')) return 'fail';
  if (statuses.includes('warning')) return 'warning';
  if (statuses.includes('info')) return 'info';
  return 'pass';
}
