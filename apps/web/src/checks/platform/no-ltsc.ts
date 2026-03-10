import { CheckDefinition, CheckResult } from '../types';
import { getManagedDevices } from '../../lib/graph-queries';

export const noLtscCheck: CheckDefinition = {
  id: 'platform-no-ltsc',
  categoryId: 'platform',
  name: 'No LTSC/LTSB Builds',
  description: 'Verifies no managed Teams Rooms devices are running Windows LTSC or LTSB builds.',
  source: 'graph',
  severity: 'high',
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

      // LTSC/LTSB builds use specific build numbers that don't receive feature updates.
      // Known LTSC build numbers: 17763 (1809 LTSC), 19044 (21H2 LTSC).
      const ltscBuilds = [17763, 19044, 20348];

      const ltscDevices = devices.filter((d) => {
        const buildMatch = d.osVersion?.match(/(\d+)\.\d+\.(\d+)/);
        if (!buildMatch) return false;
        const buildNumber = parseInt(buildMatch[2], 10);
        return ltscBuilds.includes(buildNumber);
      });

      if (ltscDevices.length > 0) {
        const names = ltscDevices.map((d) => `${d.deviceName} (${d.osVersion})`).join(', ');
        return {
          ...base,
          status: 'fail',
          details: `${ltscDevices.length} device(s) appear to be running LTSC/LTSB Windows builds: ${names}.`,
          remediation:
            'Migrate these devices to the Windows IoT Enterprise GA channel. LTSC/LTSB builds do not receive Teams Rooms feature updates.',
          rawData: { ltscDevices, total: devices.length },
        };
      }

      return {
        ...base,
        status: 'pass',
        details: `No LTSC/LTSB builds detected among ${devices.length} managed device(s).`,
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
