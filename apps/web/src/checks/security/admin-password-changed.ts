import { CheckDefinition, CheckResult } from '../types';

export const adminPasswordChangedCheck: CheckDefinition = {
  id: 'security-admin-password-changed',
  categoryId: 'security',
  name: 'Local Admin Password Changed',
  description: 'Verifies that the default local admin password on each Teams Rooms console has been changed from the factory default.',
  source: 'manual',
  severity: 'critical',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/security',

  async execute(): Promise<CheckResult> {
    return {
      checkId: this.id,
      categoryId: this.categoryId,
      name: this.name,
      source: this.source,
      severity: this.severity,
      docUrl: this.docUrl,
      timestamp: new Date().toISOString(),
      status: 'info',
      details:
        'This check cannot be verified via API. Confirm on each Teams Rooms console that the local admin password has been changed from the factory default ("sfb").',
      remediation: 'Sign in to the admin account on each device and change the password to a strong, unique value.',
    };
  },
};
