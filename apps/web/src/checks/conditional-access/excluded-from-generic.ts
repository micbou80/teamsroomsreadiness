import { CheckDefinition, CheckResult } from '../types';
import { getConditionalAccessPolicies } from '@/lib/graph-queries';
import { UNSUPPORTED_GRANT_CONTROLS } from '@/lib/constants';

export const excludedFromGeneric: CheckDefinition = {
  id: 'ca-excluded-from-generic',
  categoryId: 'conditional-access',
  name: 'Excluded from Generic MFA Policies',
  description:
    'For each enabled CA policy targeting "All" users with MFA or password-change grant controls, verify that room resource accounts are in excludeUsers or excludeGroups.',
  source: 'graph',
  severity: 'critical',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/conditional-access',
  execute: async (context): Promise<CheckResult> => {
    const policies = await getConditionalAccessPolicies(context.graphClient);
    const resourceAccountIds = context.resourceAccounts.map((a) => a.id);

    // Find enabled policies targeting "All" users with unsupported grant controls
    const problematicPolicies: string[] = [];

    for (const policy of policies) {
      if (policy.state !== 'enabled') continue;

      const includesAll = policy.conditions.users?.includeUsers?.includes('All');
      if (!includesAll) continue;

      const grants = policy.grantControls?.builtInControls ?? [];
      const hasUnsupportedGrant = grants.some((g) =>
        (UNSUPPORTED_GRANT_CONTROLS as readonly string[]).includes(g),
      );
      if (!hasUnsupportedGrant) continue;

      // Check if all resource accounts are excluded
      const excludedUsers = policy.conditions.users?.excludeUsers ?? [];
      const excludedGroups = policy.conditions.users?.excludeGroups ?? [];

      const allExcluded = resourceAccountIds.every(
        (id) => excludedUsers.includes(id),
      );

      // If not all are excluded by user and there are no exclude groups, flag it
      if (!allExcluded && excludedGroups.length === 0) {
        problematicPolicies.push(policy.displayName);
      }
    }

    if (problematicPolicies.length === 0) {
      return {
        checkId: excludedFromGeneric.id,
        categoryId: excludedFromGeneric.categoryId,
        name: excludedFromGeneric.name,
        status: 'pass',
        source: 'graph',
        severity: excludedFromGeneric.severity,
        details: 'All generic MFA/password-change CA policies properly exclude room resource accounts.',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      checkId: excludedFromGeneric.id,
      categoryId: excludedFromGeneric.categoryId,
      name: excludedFromGeneric.name,
      status: 'fail',
      source: 'graph',
      severity: excludedFromGeneric.severity,
      details: `${problematicPolicies.length} CA policy(ies) target "All" users with MFA/password-change grants but do not exclude room accounts: ${problematicPolicies.join(', ')}`,
      remediation:
        'Add room resource accounts (or a group containing them) to the "Exclude" section of each listed policy. Do not require MFA or password change for Teams Rooms resource accounts.',
      docUrl: excludedFromGeneric.docUrl,
      rawData: { problematicPolicies },
      timestamp: new Date().toISOString(),
    };
  },
};
