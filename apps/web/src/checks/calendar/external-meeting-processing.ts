import { CheckDefinition, CheckResult } from '../types';
import { getCalendarProcessing } from '@/lib/exchange-client';

export const externalMeetingProcessing: CheckDefinition = {
  id: 'cal-external-meeting-processing',
  categoryId: 'calendar',
  name: 'External Meeting Processing',
  description:
    'Verify that external meeting invitations are processed correctly by room mailboxes (ProcessExternalMeetingMessages).',
  source: 'powershell',
  severity: 'medium',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/create-resource-account#configure-mailbox-properties',

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

    if (!context.exchangeToken) {
      return {
        ...base,
        status: 'pending',
        details:
          'Requires Exchange Online permissions or PowerShell companion module. Run Invoke-MTRReadinessCheck and upload results.',
      };
    }

    if (context.resourceAccounts.length === 0) {
      return {
        ...base,
        status: 'warning',
        details: 'No resource accounts found to check external meeting processing.',
      };
    }

    const disabledRooms: string[] = [];
    const enabledRooms: string[] = [];
    let anyApiError = false;

    for (const account of context.resourceAccounts) {
      const upn = account.mail ?? account.userPrincipalName;
      const calProc = await getCalendarProcessing(
        context.exchangeToken,
        context.tenantId,
        upn,
      );

      if (!calProc) {
        anyApiError = true;
        continue;
      }

      if (calProc.processExternalMeetingMessages) {
        enabledRooms.push(upn);
      } else {
        disabledRooms.push(upn);
      }
    }

    if (enabledRooms.length === 0 && disabledRooms.length === 0 && anyApiError) {
      return {
        ...base,
        status: 'pending',
        details:
          'Could not retrieve calendar processing settings via Exchange API. Use PowerShell module as a fallback.',
      };
    }

    if (disabledRooms.length > 0) {
      return {
        ...base,
        status: 'fail',
        details: `${disabledRooms.length} room(s) have ProcessExternalMeetingMessages disabled — external meeting invitations will be ignored: ${disabledRooms.join(', ')}`,
        remediation:
          'Run: Set-CalendarProcessing -Identity <room> -ProcessExternalMeetingMessages $true',
        rawData: { enabledRooms, disabledRooms },
      };
    }

    return {
      ...base,
      status: 'pass',
      details: `All ${enabledRooms.length} room(s) have ProcessExternalMeetingMessages enabled.`,
      rawData: { enabledRooms, disabledRooms },
    };
  },
};
