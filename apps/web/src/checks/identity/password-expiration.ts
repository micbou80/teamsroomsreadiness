import { CheckDefinition, CheckResult } from '../types';
import { getUserProperties } from '../../lib/graph-queries';

export const passwordExpiration: CheckDefinition = {
  id: 'identity-password-expiration',
  categoryId: 'identity',
  name: 'Password Expiration Disabled',
  description: 'Checks that each resource account has passwordPolicies set to DisablePasswordExpiration to prevent sign-in failures.',
  source: 'graph',
  severity: 'critical',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/create-resource-account#configure-the-account',

  async execute(context): Promise<CheckResult> {
    const base = {
      checkId: this.id,
      categoryId: this.categoryId,
      name: this.name,
      source: this.source,
      severity: this.severity,
      docUrl: this.docUrl,
      timestamp: new Date().toISOString(),
    } as const;

    try {
      if (context.resourceAccounts.length === 0) {
        return { ...base, status: 'not-applicable', details: 'No resource accounts found to evaluate.' };
      }

      const failing: string[] = [];

      for (const account of context.resourceAccounts) {
        const user = await getUserProperties(context.graphClient, account.id);
        const policies: string = user.passwordPolicies ?? '';
        if (!policies.includes('DisablePasswordExpiration')) {
          failing.push(account.userPrincipalName);
        }
      }

      if (failing.length > 0) {
        return {
          ...base,
          status: 'fail',
          details: `${failing.length} resource account(s) do not have DisablePasswordExpiration set: ${failing.join(', ')}.`,
          remediation:
            'Set passwordPolicies to "DisablePasswordExpiration" for each resource account using Set-MgUser or the Entra admin center. Expired passwords will cause the room to sign out.',
          rawData: { failing },
        };
      }

      return {
        ...base,
        status: 'pass',
        details: `All ${context.resourceAccounts.length} resource account(s) have DisablePasswordExpiration set.`,
      };
    } catch (error) {
      return {
        ...base,
        status: 'warning',
        details: `Unable to check password policies: ${error instanceof Error ? error.message : String(error)}`,
        remediation: 'Ensure the app has User.Read.All permission to read user properties.',
      };
    }
  },
};
