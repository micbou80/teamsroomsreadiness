import { CheckDefinition, CheckResult } from '../types';

export const noUnsupportedSoftwareCheck: CheckDefinition = {
  id: 'security-no-unsupported-software',
  categoryId: 'security',
  name: 'No Unsupported Software Installed',
  description: 'Verifies that no unauthorized or unsupported software is installed on Teams Rooms consoles.',
  source: 'manual',
  severity: 'medium',
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
        'This check cannot be verified via API. Review each Teams Rooms console to ensure no unsupported third-party software ' +
        '(browsers, VPN clients, unapproved agents) is installed. Only Microsoft-approved software should be present.',
      remediation:
        'Remove any unauthorized software from the device. Teams Rooms consoles should only run the Teams Rooms app and OEM-approved components.',
    };
  },
};
