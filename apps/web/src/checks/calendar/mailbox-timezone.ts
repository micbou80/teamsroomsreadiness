import { CheckDefinition, CheckResult } from '../types';
import { getMailboxSettings } from '@/lib/graph-queries';

export const mailboxTimezone: CheckDefinition = {
  id: 'cal-mailbox-timezone',
  categoryId: 'calendar',
  name: 'Mailbox Timezone Configured',
  description:
    'Check that mailbox settings have a valid timezone configured for each room resource account.',
  source: 'graph',
  severity: 'medium',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/create-resource-account',
  execute: async (context): Promise<CheckResult> => {
    const issues: { account: string; timezone: string | null }[] = [];
    const passing: { account: string; timezone: string }[] = [];

    for (const account of context.resourceAccounts) {
      try {
        const settings = await getMailboxSettings(context.graphClient, account.id);
        const tz = settings?.timeZone;

        const expectedTz = context.config.expectedTimezones?.[account.userPrincipalName];

        if (!tz || tz === 'tzone://Microsoft/Utc' || tz === '') {
          issues.push({ account: account.displayName, timezone: tz ?? null });
        } else if (expectedTz && tz !== expectedTz) {
          issues.push({ account: account.displayName, timezone: tz });
        } else {
          passing.push({ account: account.displayName, timezone: tz });
        }
      } catch {
        issues.push({ account: account.displayName, timezone: null });
      }
    }

    if (issues.length === 0) {
      return {
        checkId: mailboxTimezone.id,
        categoryId: mailboxTimezone.categoryId,
        name: mailboxTimezone.name,
        status: 'pass',
        source: 'graph',
        severity: mailboxTimezone.severity,
        details: `All ${passing.length} resource account(s) have a valid mailbox timezone configured.`,
        rawData: { passing },
        timestamp: new Date().toISOString(),
      };
    }

    const issueList = issues
      .map((i) => `${i.account} (${i.timezone ?? 'not set'})`)
      .join(', ');

    return {
      checkId: mailboxTimezone.id,
      categoryId: mailboxTimezone.categoryId,
      name: mailboxTimezone.name,
      status: 'warning',
      source: 'graph',
      severity: mailboxTimezone.severity,
      details: `${issues.length} resource account(s) have missing or unexpected timezone settings: ${issueList}`,
      remediation:
        'Set the correct timezone via Exchange Admin Center or Set-MailboxRegionalConfiguration -Identity "room@contoso.com" -TimeZone "Pacific Standard Time".',
      docUrl: mailboxTimezone.docUrl,
      rawData: { issues, passing },
      timestamp: new Date().toISOString(),
    };
  },
};
