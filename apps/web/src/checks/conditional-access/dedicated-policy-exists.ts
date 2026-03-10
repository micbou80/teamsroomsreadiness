import { CheckDefinition, CheckResult } from '../types';
import { getConditionalAccessPolicies } from '@/lib/graph-queries';

export const dedicatedPolicyExists: CheckDefinition = {
  id: 'ca-dedicated-policy-exists',
  categoryId: 'conditional-access',
  name: 'Dedicated CA Policy for Rooms',
  description:
    'Search for a Conditional Access policy that specifically targets room resource accounts or a group containing them.',
  source: 'graph',
  severity: 'medium',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/conditional-access',
  execute: async (context): Promise<CheckResult> => {
    const policies = await getConditionalAccessPolicies(context.graphClient);
    const resourceAccountIds = context.resourceAccounts.map((a) => a.id);

    // Look for a policy that explicitly includes room account IDs or appears room-targeted
    const dedicatedPolicies = policies.filter((policy) => {
      if (policy.state === 'disabled') return false;

      const includeUsers = policy.conditions.users?.includeUsers ?? [];
      const includeGroups = policy.conditions.users?.includeGroups ?? [];

      // Check if any resource account is directly included
      const targetsRoomUser = resourceAccountIds.some((id) =>
        includeUsers.includes(id),
      );

      // Check if policy name suggests it targets rooms
      const nameHint = policy.displayName.toLowerCase();
      const nameTargetsRooms =
        nameHint.includes('room') ||
        nameHint.includes('mtr') ||
        nameHint.includes('teams room');

      return targetsRoomUser || (nameTargetsRooms && includeGroups.length > 0);
    });

    if (dedicatedPolicies.length > 0) {
      return {
        checkId: dedicatedPolicyExists.id,
        categoryId: dedicatedPolicyExists.categoryId,
        name: dedicatedPolicyExists.name,
        status: 'pass',
        source: 'graph',
        severity: dedicatedPolicyExists.severity,
        details: `Found ${dedicatedPolicies.length} dedicated CA policy(ies) for room accounts: ${dedicatedPolicies.map((p) => p.displayName).join(', ')}`,
        rawData: { policies: dedicatedPolicies.map((p) => ({ id: p.id, displayName: p.displayName })) },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      checkId: dedicatedPolicyExists.id,
      categoryId: dedicatedPolicyExists.categoryId,
      name: dedicatedPolicyExists.name,
      status: 'warning',
      source: 'graph',
      severity: dedicatedPolicyExists.severity,
      details: 'No dedicated Conditional Access policy found targeting room resource accounts. Microsoft recommends a specific CA policy scoped to room accounts.',
      remediation:
        'Create a dedicated CA policy that targets a security group containing all Teams Rooms resource accounts. Use compliant-device grant control instead of MFA.',
      docUrl: dedicatedPolicyExists.docUrl,
      timestamp: new Date().toISOString(),
    };
  },
};
