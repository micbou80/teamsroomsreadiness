import { CheckDefinition, CheckResult } from '../types';
import { getUserAuthMethods } from '../../lib/graph-queries';

// Auth method OData types that indicate interactive MFA registration
const INTERACTIVE_AUTH_METHOD_TYPES = [
  '#microsoft.graph.phoneAuthenticationMethod',
  '#microsoft.graph.fido2AuthenticationMethod',
  '#microsoft.graph.microsoftAuthenticatorAuthenticationMethod',
  '#microsoft.graph.softwareOathAuthenticationMethod',
];

export const noInteractiveMfa: CheckDefinition = {
  id: 'identity-no-interactive-mfa',
  categoryId: 'identity',
  name: 'No Interactive MFA Methods Registered',
  description:
    'Ensures resource accounts do not have phone, FIDO2, or Authenticator auth methods registered, as Teams Rooms cannot satisfy interactive MFA prompts.',
  source: 'graph',
  severity: 'high',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/conditional-access',

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

      const accountsWithMfa: { upn: string; methods: string[] }[] = [];

      for (const account of context.resourceAccounts) {
        const methods = await getUserAuthMethods(context.graphClient, account.id);
        const interactiveMethods = methods.filter((m) =>
          INTERACTIVE_AUTH_METHOD_TYPES.includes(m['@odata.type']),
        );
        if (interactiveMethods.length > 0) {
          accountsWithMfa.push({
            upn: account.userPrincipalName,
            methods: interactiveMethods.map((m) => m['@odata.type']),
          });
        }
      }

      if (accountsWithMfa.length > 0) {
        const list = accountsWithMfa.map((a) => a.upn).join(', ');
        return {
          ...base,
          status: 'fail',
          details: `${accountsWithMfa.length} resource account(s) have interactive MFA methods registered: ${list}.`,
          remediation:
            'Remove interactive authentication methods (phone, FIDO2, Authenticator) from resource accounts. Teams Rooms devices cannot respond to MFA prompts. Use Conditional Access device-compliance or trusted-location policies instead.',
          rawData: { accountsWithMfa },
        };
      }

      return {
        ...base,
        status: 'pass',
        details: `No interactive MFA methods found on any of the ${context.resourceAccounts.length} resource account(s).`,
      };
    } catch (error) {
      return {
        ...base,
        status: 'warning',
        details: `Unable to check authentication methods: ${error instanceof Error ? error.message : String(error)}`,
        remediation: 'Ensure the app has UserAuthenticationMethod.Read.All permission to read auth methods.',
      };
    }
  },
};
