import { CheckDefinition, CheckResult } from '../types';

export const udpPortsReachable: CheckDefinition = {
  id: 'net-udp-ports-reachable',
  categoryId: 'network',
  name: 'UDP Media Ports Reachable',
  description:
    'Verify UDP ports 3478-3481 are reachable for Teams media traffic (audio, video, screen sharing).',
  source: 'powershell',
  severity: 'critical',
  docUrl: 'https://learn.microsoft.com/microsoftteams/get-clients#get-teams-for-android',
  execute: async (): Promise<CheckResult> => {
    return {
      checkId: udpPortsReachable.id,
      categoryId: udpPortsReachable.categoryId,
      name: udpPortsReachable.name,
      status: 'pending',
      source: 'powershell',
      severity: udpPortsReachable.severity,
      details: 'Requires PowerShell companion module. Run Invoke-MTRReadinessCheck and upload results.',
      remediation:
        'Install-Module MTRReadiness\nInvoke-MTRReadinessCheck -RoomMailbox "room@contoso.com" -IncludeNetwork -Format Json',
      docUrl: udpPortsReachable.docUrl,
      timestamp: new Date().toISOString(),
    };
  },
};
