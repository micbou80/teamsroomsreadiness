import { CheckDefinition, CheckResult } from '../types';

export const updateRingsCheck: CheckDefinition = {
  id: 'management-update-rings',
  categoryId: 'management',
  name: 'Windows Update Ring Configuration',
  description: 'Verifies that a Windows Update ring is configured for Teams Rooms devices to control update cadence.',
  source: 'manual',
  severity: 'medium',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/update-management',

  async execute(): Promise<CheckResult> {
    return {
      checkId: this.id,
      categoryId: this.categoryId,
      name: this.name,
      source: this.source,
      severity: this.severity,
      docUrl: this.docUrl,
      timestamp: new Date().toISOString(),
      status: 'pending',
      details:
        'This check requires manual verification. Confirm in Intune that a dedicated Windows Update ring is assigned to your Teams Rooms device group ' +
        'with appropriate deferral periods (e.g., feature updates deferred 30+ days, quality updates deferred 3+ days) to prevent unexpected reboots during business hours.',
      remediation:
        'Create a Windows Update ring in Intune targeting your Teams Rooms device group. Configure feature and quality update deferral periods and set active hours.',
    };
  },
};
