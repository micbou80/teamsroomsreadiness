import { CheckDefinition, CheckResult } from '../types';
import { getRoomResources } from '@/lib/graph-queries';

export const roomMailboxExists: CheckDefinition = {
  id: 'cal-room-mailbox-exists',
  categoryId: 'calendar',
  name: 'Room Mailbox Exists',
  description:
    'Verify that room mailboxes exist for resource accounts via the Microsoft Graph places API.',
  source: 'graph',
  severity: 'critical',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/create-resource-account',
  execute: async (context): Promise<CheckResult> => {
    const rooms = await getRoomResources(context.graphClient);
    const roomEmails = rooms.map((r) => r.emailAddress.toLowerCase());

    const accountsWithMailbox: string[] = [];
    const accountsMissing: string[] = [];

    for (const account of context.resourceAccounts) {
      const email = (account.mail ?? account.userPrincipalName).toLowerCase();
      if (roomEmails.includes(email)) {
        accountsWithMailbox.push(account.displayName);
      } else {
        accountsMissing.push(account.displayName);
      }
    }

    if (accountsMissing.length === 0) {
      return {
        checkId: roomMailboxExists.id,
        categoryId: roomMailboxExists.categoryId,
        name: roomMailboxExists.name,
        status: 'pass',
        source: 'graph',
        severity: roomMailboxExists.severity,
        details: `All ${accountsWithMailbox.length} resource account(s) have a corresponding room mailbox.`,
        rawData: { accountsWithMailbox },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      checkId: roomMailboxExists.id,
      categoryId: roomMailboxExists.categoryId,
      name: roomMailboxExists.name,
      status: 'fail',
      source: 'graph',
      severity: roomMailboxExists.severity,
      details: `${accountsMissing.length} resource account(s) are missing a room mailbox: ${accountsMissing.join(', ')}`,
      remediation:
        'Create a room mailbox for each resource account using Exchange Admin Center or New-Mailbox -Room in PowerShell.',
      docUrl: roomMailboxExists.docUrl,
      rawData: { accountsMissing, accountsWithMailbox },
      timestamp: new Date().toISOString(),
    };
  },
};
