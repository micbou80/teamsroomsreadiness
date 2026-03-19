import { CheckDefinition, CheckResult } from '../types';
import { getManagedDevices, getManagedDeviceHardwareInfo } from '../../lib/graph-queries';

export const osSkuCheck: CheckDefinition = {
  id: 'platform-os-sku',
  categoryId: 'platform',
  name: 'OS SKU (IoT Enterprise)',
  description: 'Checks that devices are running Windows IoT Enterprise or Enterprise GA channel.',
  source: 'graph',
  severity: 'medium',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/rooms-lifecycle-support',

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

      const compliantDevices: { deviceName: string; edition: string }[] = [];
      const nonCompliantDevices: { deviceName: string; edition: string }[] = [];
      const unknownDevices: string[] = [];

      // Check hardware info for each device to determine OS edition
      const hwResults = await Promise.allSettled(
        devices.map(async (device) => {
          try {
            const hwInfo = await getManagedDeviceHardwareInfo(context.graphClient, device.id);
            const edition = hwInfo.hardwareInformation?.operatingSystemEdition ?? '';
            return { deviceName: device.deviceName, edition };
          } catch {
            return { deviceName: device.deviceName, edition: '' };
          }
        }),
      );

      for (const result of hwResults) {
        if (result.status !== 'fulfilled') continue;
        const { deviceName, edition } = result.value;
        const editionLower = edition.toLowerCase();

        if (!edition) {
          unknownDevices.push(deviceName);
        } else if (editionLower.includes('iot') || editionLower.includes('enterprise')) {
          compliantDevices.push({ deviceName, edition });
        } else {
          nonCompliantDevices.push({ deviceName, edition });
        }
      }

      if (nonCompliantDevices.length === 0 && unknownDevices.length === 0) {
        return {
          ...base,
          status: 'pass',
          details:
            `All ${compliantDevices.length} device(s) are running a supported Windows edition (IoT Enterprise or Enterprise).`,
          rawData: { compliantDevices },
        };
      }

      if (nonCompliantDevices.length > 0) {
        return {
          ...base,
          status: 'fail',
          details:
            `${nonCompliantDevices.length} device(s) are not running a supported Windows edition: ` +
            nonCompliantDevices.map((d) => `${d.deviceName} (${d.edition})`).join(', ') + '.',
          remediation:
            'Teams Rooms devices should run Windows IoT Enterprise or Windows Enterprise (GA channel). Re-image non-compliant devices.',
          rawData: { compliantDevices, nonCompliantDevices, unknownDevices },
        };
      }

      // Only unknown devices — report as info
      return {
        ...base,
        status: 'info',
        details:
          `Could not determine OS edition for ${unknownDevices.length} device(s): ${unknownDevices.join(', ')}. ` +
          'Hardware information may not be available for these devices. Verify on-device.',
        rawData: { compliantDevices, unknownDevices },
      };
    } catch (error) {
      const isPermissionError =
        error instanceof Error &&
        (error.message.includes('403') ||
          error.message.toLowerCase().includes('forbidden') ||
          error.message.toLowerCase().includes('permission') ||
          error.message.toLowerCase().includes('authorization'));

      if (isPermissionError) {
        return {
          ...base,
          status: 'warning',
          details: 'DeviceManagementManagedDevices.Read.All permission is not granted.',
          remediation:
            'Grant the DeviceManagementManagedDevices.Read.All delegated permission in Azure Portal, then re-run the assessment.',
        };
      }

      return {
        ...base,
        status: 'warning',
        details: `Unable to query managed devices: ${error instanceof Error ? error.message : String(error)}`,
        remediation: 'Ensure the app has DeviceManagementManagedDevices.Read.All permission.',
      };
    }
  },
};
