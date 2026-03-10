import { CheckDefinition, CheckResult } from '../types';
import { getManagedDevices } from '../../lib/graph-queries';

export const intuneEnrollmentCheck: CheckDefinition = {
  id: 'management-intune-enrollment',
  categoryId: 'management',
  name: 'Intune Enrollment',
  description: 'Checks that Teams Rooms devices are enrolled and managed in Microsoft Intune.',
  source: 'graph',
  severity: 'high',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/enroll-a-device',

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
          status: 'fail',
          details: 'No managed Teams Rooms devices found in Intune. Devices may not be enrolled.',
          remediation:
            'Enroll your Teams Rooms devices in Microsoft Intune for centralized management, compliance reporting, and configuration.',
        };
      }

      return {
        ...base,
        status: 'pass',
        details: `${devices.length} Teams Rooms device(s) found enrolled in Intune.`,
        rawData: { devices: devices.map((d) => ({ deviceName: d.deviceName, complianceState: d.complianceState, model: d.model })) },
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
