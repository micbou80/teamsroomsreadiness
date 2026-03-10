import { CheckDefinition, CheckResult } from '../types';

export const noProxyAuth: CheckDefinition = {
  id: 'net-no-proxy-auth',
  categoryId: 'network',
  name: 'No Proxy Authentication Required',
  description:
    'Verify that no proxy requiring authentication is configured, as Teams Rooms does not support authenticated proxies.',
  source: 'powershell',
  severity: 'high',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/rooms-prep#check-network-availability',
  execute: async (): Promise<CheckResult> => {
    return {
      checkId: noProxyAuth.id,
      categoryId: noProxyAuth.categoryId,
      name: noProxyAuth.name,
      status: 'pending',
      source: 'powershell',
      severity: noProxyAuth.severity,
      details: 'Requires PowerShell companion module. Run Invoke-MTRReadinessCheck and upload results.',
      remediation:
        'Install-Module MTRReadiness\nInvoke-MTRReadinessCheck -RoomMailbox "room@contoso.com" -IncludeNetwork -Format Json',
      docUrl: noProxyAuth.docUrl,
      timestamp: new Date().toISOString(),
    };
  },
};
