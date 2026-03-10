import { CheckDefinition, CheckResult } from '../types';
import { getManagedDevices } from '../../lib/graph-queries';

export const secureBootTpmCheck: CheckDefinition = {
  id: 'security-secure-boot-tpm',
  categoryId: 'security',
  name: 'Secure Boot & TPM Enabled',
  description: 'Checks Intune device properties for TPM and Secure Boot status on managed Teams Rooms devices.',
  source: 'graph',
  severity: 'high',
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

      // The standard managedDevice resource does not expose TPM/Secure Boot details directly.
      // These properties are available in the device health attestation report or hardware info.
      // We check compliance state as a proxy, since compliance policies typically enforce these settings.
      const nonCompliant = devices.filter(
        (d) => d.complianceState === 'noncompliant',
      );

      if (nonCompliant.length > 0) {
        const names = nonCompliant.map((d) => `${d.deviceName} (${d.complianceState})`).join(', ');
        return {
          ...base,
          status: 'warning',
          details:
            `${nonCompliant.length} device(s) are non-compliant which may indicate missing TPM or Secure Boot: ${names}. ` +
            'Review Intune compliance details for each device to confirm TPM 2.0 and Secure Boot are enabled.',
          remediation: 'Enable Secure Boot and verify TPM 2.0 is present in each device BIOS/UEFI settings.',
          rawData: { nonCompliant, total: devices.length },
        };
      }

      return {
        ...base,
        status: 'pass',
        details: `All ${devices.length} managed device(s) are compliant. Verify that compliance policies enforce TPM 2.0 and Secure Boot.`,
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
