import { CheckDefinition, CheckResult } from '../types';

export const namingConvention: CheckDefinition = {
  id: 'identity-naming-convention',
  categoryId: 'identity',
  name: 'Resource Account Naming Convention',
  description: 'Checks that resource account UPNs start with the configurable naming convention prefix for consistent identification.',
  source: 'graph',
  severity: 'low',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/create-resource-account',

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

      const prefix = context.config.namingConventionPrefix;

      if (!prefix) {
        return {
          ...base,
          status: 'not-applicable',
          details: 'No naming convention prefix configured. Set a prefix in the assessment configuration to enable this check.',
        };
      }

      const nonCompliant: string[] = [];

      for (const account of context.resourceAccounts) {
        const localPart = account.userPrincipalName.split('@')[0] ?? '';
        if (!localPart.toLowerCase().startsWith(prefix.toLowerCase())) {
          nonCompliant.push(account.userPrincipalName);
        }
      }

      if (nonCompliant.length > 0) {
        return {
          ...base,
          status: 'warning',
          details: `${nonCompliant.length} of ${context.resourceAccounts.length} resource account(s) do not follow the naming convention (prefix: "${prefix}"): ${nonCompliant.join(', ')}.`,
          remediation:
            `Rename non-compliant resource accounts so the UPN local-part starts with "${prefix}". Consistent naming makes it easier to manage rooms at scale and target Conditional Access policies.`,
          rawData: { prefix, nonCompliant },
        };
      }

      return {
        ...base,
        status: 'pass',
        details: `All ${context.resourceAccounts.length} resource account(s) follow the naming convention (prefix: "${prefix}").`,
        rawData: { prefix },
      };
    } catch (error) {
      return {
        ...base,
        status: 'warning',
        details: `Unable to check naming conventions: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};
