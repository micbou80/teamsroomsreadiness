import { CheckDefinition, CheckResult } from '../types';

export const pstnModelCheck: CheckDefinition = {
  id: 'voice-pstn-model',
  categoryId: 'voice',
  name: 'PSTN Connectivity Model',
  description: 'Confirms which PSTN connectivity model (Calling Plan, Direct Routing, or Operator Connect) is selected for Teams Rooms.',
  source: 'manual',
  severity: 'medium',
  docUrl: 'https://learn.microsoft.com/microsoftteams/pstn-connectivity',

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

    if (context.config.pstnModel) {
      return {
        ...base,
        status: 'info',
        details: `PSTN model configured as "${context.config.pstnModel}". Verify that the corresponding setup (number assignment, voice routing policies, etc.) is complete for all Teams Rooms resource accounts.`,
        rawData: { pstnModel: context.config.pstnModel },
      };
    }

    return {
      ...base,
      status: 'pending',
      details:
        'PSTN connectivity model has not been specified in the assessment configuration. ' +
        'Select the model in use (Calling Plan, Direct Routing, or Operator Connect) and verify that phone numbers are assigned to room resource accounts if PSTN calling is required.',
      remediation: 'Set the pstnModel in the assessment configuration and ensure voice routing policies are applied to room accounts.',
    };
  },
};
