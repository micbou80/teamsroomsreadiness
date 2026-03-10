import { CheckDefinition, CheckResult } from '../types';

export const websocketPermitted: CheckDefinition = {
  id: 'net-websocket-permitted',
  categoryId: 'network',
  name: 'WebSocket Connections Permitted',
  description:
    'Verify that WebSocket connections are permitted through the network for real-time Teams communication.',
  source: 'powershell',
  severity: 'high',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/rooms-prep#check-network-availability',
  execute: async (): Promise<CheckResult> => {
    return {
      checkId: websocketPermitted.id,
      categoryId: websocketPermitted.categoryId,
      name: websocketPermitted.name,
      status: 'pending',
      source: 'powershell',
      severity: websocketPermitted.severity,
      details: 'Requires PowerShell companion module. Run Invoke-MTRReadinessCheck and upload results.',
      remediation:
        'Install-Module MTRReadiness\nInvoke-MTRReadinessCheck -RoomMailbox "room@contoso.com" -IncludeNetwork -Format Json',
      docUrl: websocketPermitted.docUrl,
      timestamp: new Date().toISOString(),
    };
  },
};
