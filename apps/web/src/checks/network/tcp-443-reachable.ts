import { CheckDefinition, CheckResult } from '../types';

export const tcp443Reachable: CheckDefinition = {
  id: 'net-tcp-443-reachable',
  categoryId: 'network',
  name: 'TCP 443 Signaling Reachable',
  description:
    'Verify TCP port 443 is reachable for Teams signaling and HTTPS connectivity.',
  source: 'powershell',
  severity: 'critical',
  docUrl: 'https://learn.microsoft.com/microsoftteams/get-clients#get-teams-for-android',
  execute: async (): Promise<CheckResult> => {
    return {
      checkId: tcp443Reachable.id,
      categoryId: tcp443Reachable.categoryId,
      name: tcp443Reachable.name,
      status: 'pending',
      source: 'powershell',
      severity: tcp443Reachable.severity,
      details: 'Requires PowerShell companion module. Run Invoke-MTRReadinessCheck and upload results.',
      remediation:
        'Install-Module MTRReadiness\nInvoke-MTRReadinessCheck -RoomMailbox "room@contoso.com" -IncludeNetwork -Format Json',
      docUrl: tcp443Reachable.docUrl,
      timestamp: new Date().toISOString(),
    };
  },
};
