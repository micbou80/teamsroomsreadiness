import { CheckDefinition, CheckResult } from '../types';

export const bandwidthAdequate: CheckDefinition = {
  id: 'net-bandwidth-adequate',
  categoryId: 'network',
  name: 'Bandwidth Adequate',
  description:
    'Verify that available network bandwidth meets the minimum requirements for Teams Rooms audio, video, and content sharing.',
  source: 'powershell',
  severity: 'medium',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/rooms-prep#check-network-availability',
  execute: async (): Promise<CheckResult> => {
    return {
      checkId: bandwidthAdequate.id,
      categoryId: bandwidthAdequate.categoryId,
      name: bandwidthAdequate.name,
      status: 'pending',
      source: 'powershell',
      severity: bandwidthAdequate.severity,
      details: 'Requires PowerShell companion module. Run Invoke-MTRReadinessCheck and upload results.',
      remediation:
        'Install-Module MTRReadiness\nInvoke-MTRReadinessCheck -RoomMailbox "room@contoso.com" -IncludeNetwork -Format Json',
      docUrl: bandwidthAdequate.docUrl,
      timestamp: new Date().toISOString(),
    };
  },
};
