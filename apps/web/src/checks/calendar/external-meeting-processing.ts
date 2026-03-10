import { CheckDefinition, CheckResult } from '../types';

export const externalMeetingProcessing: CheckDefinition = {
  id: 'cal-external-meeting-processing',
  categoryId: 'calendar',
  name: 'External Meeting Processing',
  description:
    'Verify that external meeting invitations are processed correctly by room mailboxes (ProcessExternalMeetingMessages). Requires PowerShell.',
  source: 'powershell',
  severity: 'medium',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/create-resource-account#configure-mailbox-properties',
  execute: async (): Promise<CheckResult> => {
    return {
      checkId: externalMeetingProcessing.id,
      categoryId: externalMeetingProcessing.categoryId,
      name: externalMeetingProcessing.name,
      status: 'pending',
      source: 'powershell',
      severity: externalMeetingProcessing.severity,
      details: 'Requires PowerShell companion module. Run Invoke-MTRReadinessCheck and upload results.',
      remediation:
        'Install-Module MTRReadiness\nInvoke-MTRReadinessCheck -RoomMailbox "room@contoso.com" -IncludeCalendar -Format Json',
      docUrl: externalMeetingProcessing.docUrl,
      timestamp: new Date().toISOString(),
    };
  },
};
