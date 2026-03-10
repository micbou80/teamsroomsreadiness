import { CheckDefinition, CheckResult } from '../types';
import { getManagedDevices } from '../../lib/graph-queries';

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

      // OS SKU information is not reliably available from the Intune managed device API.
      // We report this as info so an admin can verify on-device.
      return {
        ...base,
        status: 'info',
        details:
          `Found ${devices.length} managed device(s). OS SKU (IoT Enterprise vs. Enterprise) cannot be reliably determined from Intune device properties alone. ` +
          'Please verify on-device that each console is running Windows IoT Enterprise or Enterprise (GA channel).',
        rawData: { devices: devices.map((d) => ({ deviceName: d.deviceName, operatingSystem: d.operatingSystem, model: d.model })) },
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
