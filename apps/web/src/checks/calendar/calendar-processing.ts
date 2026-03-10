import { CheckDefinition, CheckResult } from '../types';

export const calendarProcessing: CheckDefinition = {
  id: 'cal-calendar-processing',
  categoryId: 'calendar',
  name: 'Calendar Processing Settings',
  description:
    'Verify calendar processing settings (AutomateProcessing, AddOrganizerToSubject, DeleteSubject, etc.) are correctly configured for room mailboxes. Requires PowerShell.',
  source: 'powershell',
  severity: 'high',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/create-resource-account#configure-mailbox-properties',
  execute: async (): Promise<CheckResult> => {
    return {
      checkId: calendarProcessing.id,
      categoryId: calendarProcessing.categoryId,
      name: calendarProcessing.name,
      status: 'pending',
      source: 'powershell',
      severity: calendarProcessing.severity,
      details: 'Requires PowerShell companion module. Run Invoke-MTRReadinessCheck and upload results.',
      remediation:
        'Install-Module MTRReadiness\nInvoke-MTRReadinessCheck -RoomMailbox "room@contoso.com" -IncludeCalendar -Format Json',
      docUrl: calendarProcessing.docUrl,
      timestamp: new Date().toISOString(),
    };
  },
};
