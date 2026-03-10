import { CheckDefinition, CheckResult } from '../types';

export const sbcHealthCheck: CheckDefinition = {
  id: 'voice-sbc-health',
  categoryId: 'voice',
  name: 'SBC Health (Direct Routing)',
  description: 'Checks the health and connectivity status of Session Border Controllers used for Direct Routing.',
  source: 'manual',
  severity: 'high',
  docUrl: 'https://learn.microsoft.com/microsoftteams/direct-routing-monitor-and-troubleshoot',

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

    if (context.config.pstnModel && context.config.pstnModel !== 'direct-routing') {
      return {
        ...base,
        status: 'not-applicable',
        details: `PSTN model is "${context.config.pstnModel}". SBC health checks only apply to Direct Routing deployments.`,
      };
    }

    return {
      ...base,
      status: 'pending',
      details:
        'This check requires manual verification. For Direct Routing deployments, verify that all Session Border Controllers (SBCs) are online ' +
        'and healthy in the Teams admin center (Direct Routing > Health Dashboard). ' +
        'Confirm TLS certificate validity, SIP OPTIONS responses, and that media bypass is configured where appropriate.',
      remediation:
        'Review SBC health in the Teams admin center. Ensure TLS certificates are valid, SIP trunks are active, and failover routes are configured.',
    };
  },
};
