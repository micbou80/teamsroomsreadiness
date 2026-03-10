import { CheckDefinition, CheckResult } from '../types';

export const tlsInspectionBypass: CheckDefinition = {
  id: 'net-tls-inspection-bypass',
  categoryId: 'network',
  name: 'TLS Inspection Bypass',
  description:
    'Verify that TLS/SSL inspection is bypassed for Teams media and signaling traffic to avoid certificate pinning failures.',
  source: 'powershell',
  severity: 'high',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/rooms-prep#check-network-availability',
  execute: async (): Promise<CheckResult> => {
    return {
      checkId: tlsInspectionBypass.id,
      categoryId: tlsInspectionBypass.categoryId,
      name: tlsInspectionBypass.name,
      status: 'pending',
      source: 'powershell',
      severity: tlsInspectionBypass.severity,
      details: 'Requires PowerShell companion module. Run Invoke-MTRReadinessCheck and upload results.',
      remediation:
        'Install-Module MTRReadiness\nInvoke-MTRReadinessCheck -RoomMailbox "room@contoso.com" -IncludeNetwork -Format Json',
      docUrl: tlsInspectionBypass.docUrl,
      timestamp: new Date().toISOString(),
    };
  },
};
