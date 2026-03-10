import { CheckDefinition, CheckResult } from '../types';
import { getManagedDevices } from '../../lib/graph-queries';
import { MIN_TEAMS_ROOMS_APP_VERSION } from '../../lib/constants';

/**
 * Compare two dotted version strings (e.g. "5.0.0.0").
 * Returns negative if a < b, 0 if equal, positive if a > b.
 */
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export const appVersionCheck: CheckDefinition = {
  id: 'platform-app-version',
  categoryId: 'platform',
  name: 'Teams Rooms App Version',
  description: `Checks that the Teams Rooms app version is at least ${MIN_TEAMS_ROOMS_APP_VERSION}.`,
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

      // The Teams Rooms app version is not directly exposed in the managedDevice resource.
      // If detected apps data is available in rawData we would check it here.
      // For now, we report info and recommend verifying via Pro Management Portal.
      return {
        ...base,
        status: 'info',
        details:
          `Found ${devices.length} managed device(s). The Teams Rooms app version (minimum ${MIN_TEAMS_ROOMS_APP_VERSION}) ` +
          'should be verified via the Teams Rooms Pro Management Portal or on-device. ' +
          'Intune managed device properties do not expose the Teams Rooms application version directly.',
        remediation: 'Use the Pro Management Portal or check Settings > About on each device to confirm the app version.',
        rawData: { devices: devices.map((d) => ({ deviceName: d.deviceName, model: d.model })), minVersion: MIN_TEAMS_ROOMS_APP_VERSION },
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
