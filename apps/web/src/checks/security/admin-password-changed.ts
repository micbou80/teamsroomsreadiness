import { CheckDefinition, CheckResult } from '../types';
import { getDirectoryDevices, getDeviceLocalCredentials } from '../../lib/graph-queries';

// Requires: DeviceLocalCredential.ReadBasic.All delegated permission

export const adminPasswordChangedCheck: CheckDefinition = {
  id: 'security-admin-password-changed',
  categoryId: 'security',
  name: 'Local Admin Password Changed',
  description: 'Verifies that the default local admin password on each Teams Rooms console has been changed from the factory default.',
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
      const devices = await getDirectoryDevices(context.graphClient);

      if (devices.length === 0) {
        return {
          ...base,
          status: 'info',
          details:
            'No Windows devices found in the directory. Cannot verify LAPS status. ' +
            'Confirm on each Teams Rooms console that the local admin password has been changed from the factory default ("sfb").',
          remediation: 'Sign in to the admin account on each device and change the password to a strong, unique value.',
        };
      }

      const lapsManaged: { deviceName: string; lastBackup: string }[] = [];
      const noLaps: string[] = [];

      // Check LAPS credentials for each device
      const credResults = await Promise.allSettled(
        devices.map(async (device) => {
          try {
            const creds = await getDeviceLocalCredentials(context.graphClient, device.id);
            if (creds.lastBackupDateTime) {
              lapsManaged.push({
                deviceName: device.displayName,
                lastBackup: creds.lastBackupDateTime,
              });
            } else {
              noLaps.push(device.displayName);
            }
          } catch (err) {
            // 404 means no LAPS credentials for this device
            const is404 =
              err instanceof Error &&
              (err.message.includes('404') || err.message.toLowerCase().includes('not found'));
            if (is404) {
              noLaps.push(device.displayName);
            }
            // Other errors (e.g. permission) — skip silently, handled at outer level
          }
        }),
      );

      if (lapsManaged.length > 0 && noLaps.length === 0) {
        return {
          ...base,
          status: 'pass',
          details:
            `LAPS is managing local admin passwords for all ${lapsManaged.length} Windows device(s). ` +
            'The factory default password cannot still be in use.',
          rawData: { lapsManaged },
        };
      }

      if (lapsManaged.length > 0 && noLaps.length > 0) {
        return {
          ...base,
          status: 'warning',
          details:
            `LAPS is active on ${lapsManaged.length} device(s), but ${noLaps.length} device(s) have no LAPS credentials: ${noLaps.join(', ')}. ` +
            'Verify the admin password was changed manually on those devices.',
          remediation:
            'Extend LAPS coverage to all Teams Rooms devices, or manually change the local admin password on devices without LAPS.',
          rawData: { lapsManaged, noLaps },
        };
      }

      // No LAPS at all — fall back to info
      return {
        ...base,
        status: 'info',
        details:
          'LAPS is not configured for any Windows devices. Cannot automatically verify that the default local admin password has been changed. ' +
          'Confirm on each Teams Rooms console that the local admin password has been changed from the factory default ("sfb").',
        remediation:
          'Deploy Windows LAPS to automatically rotate local admin passwords, or manually change the password on each device.',
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
          details:
            'DeviceLocalCredential.ReadBasic.All permission is not granted. Cannot check LAPS status. ' +
            'Confirm on each Teams Rooms console that the local admin password has been changed from the factory default ("sfb").',
          remediation:
            'Grant the DeviceLocalCredential.ReadBasic.All delegated permission in Azure Portal, then re-run the assessment.',
        };
      }

      return {
        ...base,
        status: 'warning',
        details: `Unable to query device credentials: ${error instanceof Error ? error.message : String(error)}`,
        remediation: 'Ensure the app has DeviceLocalCredential.ReadBasic.All permission.',
      };
    }
  },
};
