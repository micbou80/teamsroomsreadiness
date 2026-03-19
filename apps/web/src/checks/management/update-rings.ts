import { CheckDefinition, CheckResult } from '../types';
import { getWindowsUpdateRings } from '../../lib/graph-queries';

// Requires: DeviceManagementConfiguration.Read.All delegated permission

export const updateRingsCheck: CheckDefinition = {
  id: 'management-update-rings',
  categoryId: 'management',
  name: 'Windows Update Ring Configuration',
  description: 'Verifies that a Windows Update ring is configured for Teams Rooms devices to control update cadence.',
  source: 'graph',
  severity: 'medium',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/update-management',

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
      const rings = await getWindowsUpdateRings(context.graphClient);

      if (rings.length === 0) {
        return {
          ...base,
          status: 'info',
          details:
            'No Windows Update for Business configuration rings found in Intune. ' +
            'Create a dedicated update ring for Teams Rooms devices to control update cadence.',
          remediation:
            'Create a Windows Update ring in Intune targeting your Teams Rooms device group. ' +
            'Configure feature and quality update deferral periods and set active hours.',
        };
      }

      // Check for rings that have assignments and proper deferral
      const issues: string[] = [];
      const assignedRings = rings.filter(
        (r) => r.assignments && r.assignments.length > 0,
      );

      if (assignedRings.length === 0) {
        return {
          ...base,
          status: 'fail',
          details:
            `Found ${rings.length} update ring(s) but none have assignments. ` +
            'At least one ring must be assigned to a device group.',
          remediation:
            'Assign an update ring to your Teams Rooms device group in Intune.',
          rawData: { rings: rings.map((r) => ({ displayName: r.displayName, id: r.id })) },
        };
      }

      for (const ring of assignedRings) {
        const featureDeferral = ring.featureUpdatesDeferralPeriodInDays ?? 0;
        const qualityDeferral = ring.qualityUpdatesDeferralPeriodInDays ?? 0;

        if (qualityDeferral <= 0) {
          issues.push(
            `"${ring.displayName}" has no quality update deferral (current: ${qualityDeferral} days)`,
          );
        }
        if (featureDeferral <= 0) {
          issues.push(
            `"${ring.displayName}" has no feature update deferral (current: ${featureDeferral} days)`,
          );
        }
      }

      if (issues.length === 0) {
        return {
          ...base,
          status: 'pass',
          details:
            `${assignedRings.length} assigned update ring(s) found with appropriate deferral periods configured.`,
          rawData: {
            rings: assignedRings.map((r) => ({
              displayName: r.displayName,
              featureDeferral: r.featureUpdatesDeferralPeriodInDays,
              qualityDeferral: r.qualityUpdatesDeferralPeriodInDays,
              assignmentCount: r.assignments?.length ?? 0,
            })),
          },
        };
      }

      return {
        ...base,
        status: 'fail',
        details:
          `Update ring configuration issues found: ${issues.join('; ')}.`,
        remediation:
          'Configure deferral periods for both feature and quality updates to prevent unexpected reboots during business hours.',
        rawData: {
          rings: assignedRings.map((r) => ({
            displayName: r.displayName,
            featureDeferral: r.featureUpdatesDeferralPeriodInDays,
            qualityDeferral: r.qualityUpdatesDeferralPeriodInDays,
            assignmentCount: r.assignments?.length ?? 0,
          })),
          issues,
        },
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
          details: 'DeviceManagementConfiguration.Read.All permission is not granted.',
          remediation:
            'Grant the DeviceManagementConfiguration.Read.All delegated permission in Azure Portal, then re-run the assessment.',
        };
      }

      return {
        ...base,
        status: 'warning',
        details: `Unable to query update rings: ${error instanceof Error ? error.message : String(error)}`,
        remediation: 'Ensure the app has DeviceManagementConfiguration.Read.All permission.',
      };
    }
  },
};
