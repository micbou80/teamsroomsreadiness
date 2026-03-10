import { CheckDefinition, CheckResult } from '../types';

export const pmpConnectivityCheck: CheckDefinition = {
  id: 'management-pmp-connectivity',
  categoryId: 'management',
  name: 'Pro Management Portal Connectivity',
  description: 'Checks whether the Teams Rooms device can reach the Pro Management Portal URLs. Requires PowerShell data upload.',
  source: 'powershell',
  severity: 'high',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/enroll-a-device',

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

    if (!context.powershellData) {
      return {
        ...base,
        status: 'pending',
        details:
          'PowerShell data has not been uploaded. Run the companion PowerShell script on the Teams Rooms device to test ' +
          'reachability of the Pro Management Portal URLs (e.g., *.rooms.teams.microsoft.com) and upload the results.',
        remediation: 'Run the PowerShell collection script on each Teams Rooms device and upload the JSON results.',
      };
    }

    const psCheck = context.powershellData.checks.find((c) => c.checkId === 'management-pmp-connectivity');

    if (!psCheck) {
      return {
        ...base,
        status: 'warning',
        details: 'PowerShell data was uploaded but does not contain the PMP connectivity check result.',
        remediation: 'Re-run the PowerShell collection script with the latest version to include PMP connectivity checks.',
      };
    }

    return {
      ...base,
      status: psCheck.status,
      details: psCheck.details,
      rawData: psCheck.rawData,
    };
  },
};
