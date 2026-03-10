import { CheckDefinition, CheckResult } from '../types';

export const emergencyCallingCheck: CheckDefinition = {
  id: 'voice-emergency-calling',
  categoryId: 'voice',
  name: 'Emergency Calling Configuration',
  description: 'Verifies that emergency calling (E911) is properly configured for Teams Rooms locations.',
  source: 'manual',
  severity: 'critical',
  docUrl: 'https://learn.microsoft.com/microsoftteams/configure-dynamic-emergency-calling',

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
        'This check requires manual verification. Confirm that emergency calling addresses are configured for each Teams Rooms location. ' +
        'Ensure dynamic emergency calling policies are assigned so that emergency calls are routed to the correct Public Safety Answering Point (PSAP) ' +
        'with accurate location information.',
      remediation:
        'Configure emergency addresses in the Teams admin center, assign emergency calling policies to room accounts, and test emergency call routing for each site.',
    };
  },
};
