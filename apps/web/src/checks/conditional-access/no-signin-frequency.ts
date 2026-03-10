import { CheckDefinition, CheckResult } from '../types';
import { getConditionalAccessPolicies, ConditionalAccessPolicy } from '@/lib/graph-queries';

function policyAppliesToRoomAccounts(
  policy: ConditionalAccessPolicy,
  resourceAccountIds: string[],
): boolean {
  const includeUsers = policy.conditions.users?.includeUsers ?? [];
  const excludeUsers = policy.conditions.users?.excludeUsers ?? [];

  const targetsAll = includeUsers.includes('All');
  const targetsSpecific = resourceAccountIds.some((id) => includeUsers.includes(id));

  if (!targetsAll && !targetsSpecific) return false;

  if (targetsAll) {
    const allExcluded = resourceAccountIds.every((id) => excludeUsers.includes(id));
    if (allExcluded) return false;
  }

  return true;
}

export const noSignInFrequency: CheckDefinition = {
  id: 'ca-no-signin-frequency',
  categoryId: 'conditional-access',
  name: 'No Sign-In Frequency Policy',
  description:
    'Specifically verify that no signInFrequency session control policy applies to room accounts. Sign-in frequency causes periodic re-authentication that disrupts room devices.',
  source: 'graph',
  severity: 'critical',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/conditional-access#supported-conditional-access-policies',
  execute: async (context): Promise<CheckResult> => {
    const policies = await getConditionalAccessPolicies(context.graphClient);
    const resourceAccountIds = context.resourceAccounts.map((a) => a.id);

    const violatingPolicies: { name: string; value: number; type: string }[] = [];

    for (const policy of policies) {
      if (policy.state !== 'enabled') continue;
      if (!policyAppliesToRoomAccounts(policy, resourceAccountIds)) continue;

      const sif = policy.sessionControls?.signInFrequency;
      if (sif?.isEnabled) {
        violatingPolicies.push({
          name: policy.displayName,
          value: sif.value,
          type: sif.type,
        });
      }
    }

    if (violatingPolicies.length === 0) {
      return {
        checkId: noSignInFrequency.id,
        categoryId: noSignInFrequency.categoryId,
        name: noSignInFrequency.name,
        status: 'pass',
        source: 'graph',
        severity: noSignInFrequency.severity,
        details: 'No sign-in frequency policies apply to room resource accounts.',
        timestamp: new Date().toISOString(),
      };
    }

    const policyList = violatingPolicies
      .map((p) => `${p.name} (every ${p.value} ${p.type})`)
      .join('; ');

    return {
      checkId: noSignInFrequency.id,
      categoryId: noSignInFrequency.categoryId,
      name: noSignInFrequency.name,
      status: 'fail',
      source: 'graph',
      severity: noSignInFrequency.severity,
      details: `${violatingPolicies.length} CA policy(ies) enforce sign-in frequency on room accounts: ${policyList}. This causes periodic re-authentication that disrupts Teams Rooms devices.`,
      remediation:
        'Exclude room resource accounts from all policies with sign-in frequency controls. Teams Rooms needs persistent sign-in to function correctly.',
      docUrl: noSignInFrequency.docUrl,
      rawData: { violatingPolicies },
      timestamp: new Date().toISOString(),
    };
  },
};
