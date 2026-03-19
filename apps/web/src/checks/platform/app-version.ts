import { CheckDefinition, CheckResult } from '../types';
import { getDetectedTeamsRoomsApp } from '../../lib/graph-queries';
import { MIN_TEAMS_ROOMS_APP_VERSION } from '../../lib/constants';

// Requires: DeviceManagementApps.Read.All delegated permission

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
      const detectedApps = await getDetectedTeamsRoomsApp(context.graphClient);

      if (detectedApps.length === 0) {
        return {
          ...base,
          status: 'info',
          details:
            'No "Microsoft Teams Rooms" detected app found in Intune. Devices may not be Intune-enrolled, or the DeviceManagementApps.Read.All permission may be missing.',
          remediation:
            'Ensure devices are enrolled in Intune and the app registration has DeviceManagementApps.Read.All permission.',
        };
      }

      const outdatedDevices: { deviceName: string; appVersion: string }[] = [];
      const compliantDevices: string[] = [];

      for (const app of detectedApps) {
        const version = app.version ?? '0.0.0.0';
        const devices = app.managedDevices ?? [];

        if (compareVersions(version, MIN_TEAMS_ROOMS_APP_VERSION) < 0) {
          for (const device of devices) {
            outdatedDevices.push({ deviceName: device.deviceName, appVersion: version });
          }
        } else {
          for (const device of devices) {
            compliantDevices.push(device.deviceName);
          }
        }
      }

      if (outdatedDevices.length === 0) {
        return {
          ...base,
          status: 'pass',
          details:
            `All ${compliantDevices.length} device(s) are running Teams Rooms app version >= ${MIN_TEAMS_ROOMS_APP_VERSION}.`,
          rawData: { compliantDevices, minVersion: MIN_TEAMS_ROOMS_APP_VERSION },
        };
      }

      return {
        ...base,
        status: 'fail',
        details:
          `${outdatedDevices.length} device(s) are running a Teams Rooms app version below ${MIN_TEAMS_ROOMS_APP_VERSION}: ` +
          outdatedDevices.map((d) => `${d.deviceName} (${d.appVersion})`).join(', ') + '.',
        remediation:
          'Update the Teams Rooms app on affected devices via the Pro Management Portal or Windows Update.',
        rawData: { outdatedDevices, compliantDevices, minVersion: MIN_TEAMS_ROOMS_APP_VERSION },
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
          details: 'DeviceManagementApps.Read.All permission is not granted.',
          remediation:
            'Grant the DeviceManagementApps.Read.All delegated permission in Azure Portal, then re-run the assessment.',
        };
      }

      return {
        ...base,
        status: 'warning',
        details: `Unable to query detected apps: ${error instanceof Error ? error.message : String(error)}`,
        remediation: 'Ensure the app has DeviceManagementApps.Read.All permission.',
      };
    }
  },
};
