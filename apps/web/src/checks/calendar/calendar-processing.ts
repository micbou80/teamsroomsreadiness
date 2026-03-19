import { CheckDefinition, CheckResult } from '../types';
import { getCalendarProcessing } from '@/lib/exchange-client';

export const calendarProcessing: CheckDefinition = {
  id: 'cal-calendar-processing',
  categoryId: 'calendar',
  name: 'Calendar Processing Settings',
  description:
    'Verify calendar processing settings (AutomateProcessing, AddOrganizerToSubject, DeleteSubject, etc.) are correctly configured for room mailboxes.',
  source: 'powershell',
  severity: 'high',
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

    // Fall back to pending if Exchange token is not available
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
        details: 'No resource accounts found to check calendar processing settings.',
      };
    }

    // Check calendar processing for each room (sequentially to respect throttling)
    const roomResults: {
      room: string;
      issues: string[];
      warnings: string[];
    }[] = [];
    let anyFailed = false;
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

      const issues: string[] = [];
      const warnings: string[] = [];

      if (calProc.automateProcessing !== 'AutoAccept') {
        issues.push(`AutomateProcessing is '${calProc.automateProcessing}' (should be AutoAccept)`);
      }
      if (calProc.deleteComments) {
        issues.push('DeleteComments is true (meeting body with Teams join link will be removed)');
      }
      if (calProc.deleteSubject) {
        issues.push('DeleteSubject is true (subject will be removed from device display)');
      }
      if (calProc.addOrganizerToSubject) {
        warnings.push('AddOrganizerToSubject is true (overwrites subject with organizer name)');
      }
      if (calProc.removePrivateProperty) {
        warnings.push('RemovePrivateProperty is true (private flag stripped from meetings)');
      }

      if (issues.length > 0) anyFailed = true;

      roomResults.push({ room: upn, issues, warnings });
    }

    // If all API calls failed, fall back to pending
    if (roomResults.length === 0 && anyApiError) {
      return {
        ...base,
        status: 'pending',
        details:
          'Could not retrieve calendar processing settings via Exchange API. Use PowerShell module as a fallback.',
      };
    }

    const failedRooms = roomResults.filter((r) => r.issues.length > 0);
    const warnRooms = roomResults.filter((r) => r.warnings.length > 0 && r.issues.length === 0);

    if (anyFailed) {
      const details = failedRooms
        .map((r) => `${r.room}: ${r.issues.join('; ')}`)
        .join('\n');
      return {
        ...base,
        status: 'fail',
        details: `${failedRooms.length} room(s) have misconfigured calendar processing:\n${details}`,
        remediation:
          'Run Set-CalendarProcessing to fix: -AutomateProcessing AutoAccept -DeleteComments $false -DeleteSubject $false -AddOrganizerToSubject $false -RemovePrivateProperty $false',
        rawData: { rooms: roomResults },
      };
    }

    if (warnRooms.length > 0) {
      const details = warnRooms
        .map((r) => `${r.room}: ${r.warnings.join('; ')}`)
        .join('\n');
      return {
        ...base,
        status: 'warning',
        details: `${warnRooms.length} room(s) have non-optimal calendar processing settings:\n${details}`,
        remediation:
          'Consider setting -AddOrganizerToSubject $false -RemovePrivateProperty $false for a better room experience.',
        rawData: { rooms: roomResults },
      };
    }

    return {
      ...base,
      status: 'pass',
      details: `All ${roomResults.length} room(s) have correctly configured calendar processing settings.`,
      rawData: { rooms: roomResults },
    };
  },
};
