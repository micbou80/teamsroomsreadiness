import { CheckDefinition, CheckResult } from '../types';

export const upnSmtpMatch: CheckDefinition = {
  id: 'identity-upn-smtp-match',
  categoryId: 'identity',
  name: 'UPN Matches SMTP Address',
  description: 'Checks that each resource account UPN matches its primary SMTP (mail) address to avoid sign-in and calendar delivery issues.',
  source: 'graph',
  severity: 'medium',
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

      const mismatched: { upn: string; mail: string }[] = [];

      for (const account of context.resourceAccounts) {
        const upn = (account.userPrincipalName ?? '').toLowerCase();
        const mail = (account.mail ?? '').toLowerCase();

        if (!mail) {
          mismatched.push({ upn: account.userPrincipalName, mail: '(not set)' });
        } else if (upn !== mail) {
          mismatched.push({ upn: account.userPrincipalName, mail: account.mail });
        }
      }

      if (mismatched.length > 0) {
        const list = mismatched.map((m) => `${m.upn} / ${m.mail}`).join('; ');
        return {
          ...base,
          status: 'fail',
          details: `${mismatched.length} resource account(s) have a UPN that does not match the mail property: ${list}.`,
          remediation:
            'Align the UPN and primary SMTP address. A mismatch can cause calendar processing failures and sign-in issues on Teams Rooms devices.',
          rawData: { mismatched },
        };
      }

      return {
        ...base,
        status: 'pass',
        details: `All ${context.resourceAccounts.length} resource account(s) have matching UPN and mail addresses.`,
      };
    } catch (error) {
      return {
        ...base,
        status: 'warning',
        details: `Unable to compare UPN and SMTP addresses: ${error instanceof Error ? error.message : String(error)}`,
        remediation: 'Ensure the app has User.Read.All permission to read user properties.',
      };
    }
  },
};
