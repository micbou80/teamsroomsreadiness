import { CheckDefinition, CheckResult } from '../types';
import { getManagedDevices } from '../../lib/graph-queries';
import { WINDOWS_11_MIN_BUILD } from '../../lib/constants';

export const windowsVersionCheck: CheckDefinition = {
  id: 'platform-windows-version',
  categoryId: 'platform',
  name: 'Windows 11 Version',
  description: 'Verifies that all managed Teams Rooms devices are running Windows 11 (build >= 22000).',
  source: 'graph',
  severity: 'critical',
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

      const failing = devices.filter((d) => {
        const buildMatch = d.osVersion?.match(/(\d+)\.\d+\.(\d+)/);
        if (!buildMatch) return true;
        const buildNumber = parseInt(buildMatch[2], 10);
        return buildNumber < WINDOWS_11_MIN_BUILD;
      });

      if (failing.length > 0) {
        const names = failing.map((d) => `${d.deviceName} (${d.osVersion})`).join(', ');
        return {
          ...base,
          status: 'fail',
          details: `${failing.length} device(s) running a Windows version below build ${WINDOWS_11_MIN_BUILD}: ${names}.`,
          remediation: 'Upgrade these devices to Windows 11 (build 22000 or later). Windows 10 support ended October 2025.',
          rawData: { failing, total: devices.length },
        };
      }

      return {
        ...base,
        status: 'pass',
        details: `All ${devices.length} managed device(s) are running Windows 11 or later.`,
        rawData: { devices: devices.map((d) => ({ deviceName: d.deviceName, osVersion: d.osVersion })) },
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
