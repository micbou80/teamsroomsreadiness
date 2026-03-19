import { CheckDefinition, CheckResult } from '../types';
import { getManagedDevices, getDetectedAppsForDevice } from '../../lib/graph-queries';
import { MTR_ALLOWED_SOFTWARE_PREFIXES } from '../../lib/constants';

// Requires: DeviceManagementApps.Read.All delegated permission

export const noUnsupportedSoftwareCheck: CheckDefinition = {
  id: 'security-no-unsupported-software',
  categoryId: 'security',
  name: 'No Unsupported Software Installed',
  description: 'Verifies that no unauthorized or unsupported software is installed on Teams Rooms consoles.',
  source: 'graph',
  severity: 'medium',
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
          status: 'info',
          details: 'No managed Teams Rooms devices found in Intune. Cannot check installed software.',
        };
      }

      const unexpectedByDevice: Record<string, string[]> = {};

      // Check detected apps for each device
      const appResults = await Promise.allSettled(
        devices.map(async (device) => {
          try {
            const apps = await getDetectedAppsForDevice(context.graphClient, device.id);
            const unexpected = apps.filter((app) => {
              const name = app.displayName ?? '';
              return !MTR_ALLOWED_SOFTWARE_PREFIXES.some((prefix) =>
                name.startsWith(prefix),
              );
            });
            if (unexpected.length > 0) {
              unexpectedByDevice[device.deviceName] = unexpected.map(
                (a) => a.displayName,
              );
            }
          } catch {
            // Skip devices where we can't read detected apps
          }
        }),
      );

      const deviceCount = Object.keys(unexpectedByDevice).length;

      if (deviceCount === 0) {
        return {
          ...base,
          status: 'pass',
          details: `No unexpected software found on ${devices.length} managed device(s).`,
        };
      }

      // Build a summary of unexpected apps
      const summaryParts: string[] = [];
      for (const [deviceName, apps] of Object.entries(unexpectedByDevice)) {
        summaryParts.push(`${deviceName}: ${apps.join(', ')}`);
      }

      return {
        ...base,
        status: 'warning',
        details:
          `Unexpected software found on ${deviceCount} device(s). ` +
          summaryParts.join(' | '),
        remediation:
          'Remove any unauthorized software from the device. Teams Rooms consoles should only run the Teams Rooms app and OEM-approved components.',
        rawData: { unexpectedByDevice },
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
          details: 'DeviceManagementApps.Read.All permission is not granted. Cannot verify installed software.',
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
