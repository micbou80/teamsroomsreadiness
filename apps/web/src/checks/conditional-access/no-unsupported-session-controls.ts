import { CheckDefinition, CheckResult } from '../types';
import { getConditionalAccessPolicies, ConditionalAccessPolicy } from '@/lib/graph-queries';
import { UNSUPPORTED_SESSION_CONTROLS } from '@/lib/constants';

function policyAppliesToRoomAccounts(
  policy: ConditionalAccessPolicy,
  resourceAccountIds: string[],
): boolean {
  const includeUsers = policy.conditions.users?.includeUsers ?? [];
  const excludeUsers = policy.conditions.users?.excludeUsers ?? [];

  const targetsAll = includeUsers.includes('All');
  const targetsSpecific = resourceAccountIds.some((id) => includeUsers.includes(id));

  if (!targetsAll && !targetsSpecific) return false;

  // If targets all, check exclusions
  if (targetsAll) {
    const allExcluded = resourceAccountIds.every((id) => excludeUsers.includes(id));
    if (allExcluded) return false;
  }

  return true;
}

export const noUnsupportedSessionControls: CheckDefinition = {
  id: 'ca-no-unsupported-session-controls',
  categoryId: 'conditional-access',
  name: 'No Unsupported Session Controls',
  description:
    'Check that no unsupported session controls (signInFrequency, persistentBrowser, cloudAppSecurity, applicationEnforcedRestrictions) apply to room accounts.',
  source: 'graph',
  severity: 'high',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/conditional-access',
  execute: async (context): Promise<CheckResult> => {
    const policies = await getConditionalAccessPolicies(context.graphClient);
    const resourceAccountIds = context.resourceAccounts.map((a) => a.id);

    const violatingPolicies: { name: string; controls: string[] }[] = [];

    for (const policy of policies) {
      if (policy.state !== 'enabled') continue;
      if (!policyAppliesToRoomAccounts(policy, resourceAccountIds)) continue;
      if (!policy.sessionControls) continue;

      const enabledControls: string[] = [];
      for (const controlName of UNSUPPORTED_SESSION_CONTROLS) {
        const control = policy.sessionControls[controlName as keyof typeof policy.sessionControls];
        if (control && typeof control === 'object' && 'isEnabled' in control && control.isEnabled) {
          enabledControls.push(controlName);
        }
      }

      if (enabledControls.length > 0) {
        violatingPolicies.push({ name: policy.displayName, controls: enabledControls });
      }
    }

    if (violatingPolicies.length === 0) {
      return {
        checkId: noUnsupportedSessionControls.id,
        categoryId: noUnsupportedSessionControls.categoryId,
        name: noUnsupportedSessionControls.name,
        status: 'pass',
        source: 'graph',
        severity: noUnsupportedSessionControls.severity,
        details: 'No unsupported session controls apply to room resource accounts.',
        timestamp: new Date().toISOString(),
      };
    }

    const policyList = violatingPolicies
      .map((p) => `${p.name} (${p.controls.join(', ')})`)
      .join('; ');

    return {
      checkId: noUnsupportedSessionControls.id,
      categoryId: noUnsupportedSessionControls.categoryId,
      name: noUnsupportedSessionControls.name,
      status: 'fail',
      source: 'graph',
      severity: noUnsupportedSessionControls.severity,
      details: `${violatingPolicies.length} CA policy(ies) apply unsupported session controls to room accounts: ${policyList}`,
      remediation:
        'Exclude room resource accounts from policies with unsupported session controls, or disable those controls. Teams Rooms does not support signInFrequency, persistentBrowser, cloudAppSecurity, or applicationEnforcedRestrictions.',
      docUrl: noUnsupportedSessionControls.docUrl,
      rawData: { violatingPolicies },
      timestamp: new Date().toISOString(),
    };
  },
};
