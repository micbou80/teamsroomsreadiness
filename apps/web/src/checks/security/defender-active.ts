import { CheckDefinition, CheckResult } from '../types';
import { getManagedDevices } from '../../lib/graph-queries';

export const defenderActiveCheck: CheckDefinition = {
  id: 'security-defender-active',
  categoryId: 'security',
  name: 'Defender Antivirus Active',
  description: 'Checks Intune compliance state to verify that antivirus protection is active on managed Teams Rooms devices.',
  source: 'graph',
  severity: 'critical',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/security',

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

    try {
      const devices = await getManagedDevices(context.graphClient);

      if (devices.length === 0) {
        return {
          ...base,
          status: 'not-applicable',
          details: 'No managed Teams Rooms devices found in Intune.',
        };
      }

      const nonCompliant = devices.filter(
        (d) => d.complianceState !== 'compliant' && d.complianceState !== 'unknown',
      );

      if (nonCompliant.length > 0) {
        const names = nonCompliant.map((d) => `${d.deviceName} (${d.complianceState})`).join(', ');
        return {
          ...base,
          status: 'fail',
          details: `${nonCompliant.length} device(s) report non-compliant status which may indicate Defender issues: ${names}.`,
          remediation: 'Review Intune compliance policies and ensure Defender antivirus is enabled and reporting on all devices.',
          rawData: { nonCompliant, total: devices.length },
        };
      }

      return {
        ...base,
        status: 'pass',
        details: `All ${devices.length} managed device(s) report compliant or unknown compliance state.`,
        rawData: { devices: devices.map((d) => ({ deviceName: d.deviceName, complianceState: d.complianceState })) },
      };
    } catch (error) {
      return {
        ...base,
        status: 'warning',
        details: `Unable to query managed devices: ${error instanceof Error ? error.message : String(error)}`,
        remediation: 'Ensure the app has DeviceManagementManagedDevices.Read.All permission.',
      };
    }
  },
};
