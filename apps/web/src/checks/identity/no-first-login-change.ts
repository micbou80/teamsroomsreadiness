import { CheckDefinition, CheckResult } from '../types';
import { getUserProperties } from '../../lib/graph-queries';

export const noFirstLoginChange: CheckDefinition = {
  id: 'identity-no-first-login-change',
  categoryId: 'identity',
  name: 'No Force Password Change on Next Sign-In',
  description: 'Ensures forceChangePasswordNextSignIn is false on all resource accounts so the room device can sign in unattended.',
  source: 'graph',
  severity: 'high',
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
        if (user.passwordProfile?.forceChangePasswordNextSignIn === true) {
          failing.push(account.userPrincipalName);
        }
      }

      if (failing.length > 0) {
        return {
          ...base,
          status: 'fail',
          details: `${failing.length} resource account(s) have forceChangePasswordNextSignIn enabled: ${failing.join(', ')}.`,
          remediation:
            'Set forceChangePasswordNextSignIn to false using Update-MgUser -PasswordProfile @{ForceChangePasswordNextSignIn=$false} or the Entra admin center.',
          rawData: { failing },
        };
      }

      return {
        ...base,
        status: 'pass',
        details: `All ${context.resourceAccounts.length} resource account(s) have forceChangePasswordNextSignIn set to false.`,
      };
    } catch (error) {
      return {
        ...base,
        status: 'warning',
        details: `Unable to check password profiles: ${error instanceof Error ? error.message : String(error)}`,
        remediation: 'Ensure the app has User.Read.All permission to read user password profiles.',
      };
    }
  },
};
