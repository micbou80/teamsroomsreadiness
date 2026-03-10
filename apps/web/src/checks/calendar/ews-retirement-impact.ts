import { CheckDefinition, CheckResult } from '../types';
import {
  EWS_DEPRECATION_START,
  EWS_FULL_SHUTDOWN,
  MIN_TEAMS_ROOMS_APP_VERSION,
} from '@/lib/constants';

export const ewsRetirementImpact: CheckDefinition = {
  id: 'cal-ews-retirement-impact',
  categoryId: 'calendar',
  name: 'EWS Retirement Readiness',
  description:
    'Check Teams Rooms app version against EWS sunset dates to determine if rooms will be impacted by the EWS retirement.',
  source: 'graph',
  severity: 'high',
  docUrl: 'https://learn.microsoft.com/exchange/clients-and-mobile-in-exchange-online/deprecation-of-basic-authentication-exchange-online',
  execute: async (context): Promise<CheckResult> => {
    const now = new Date();
    const deprecationDate = new Date(EWS_DEPRECATION_START);
    const shutdownDate = new Date(EWS_FULL_SHUTDOWN);

    // If we're past the full shutdown date, this is critical
    if (now >= shutdownDate) {
      return {
        checkId: ewsRetirementImpact.id,
        categoryId: ewsRetirementImpact.categoryId,
        name: ewsRetirementImpact.name,
        status: 'fail',
        source: 'graph',
        severity: 'critical',
        details: `EWS has been fully shut down as of ${EWS_FULL_SHUTDOWN}. Teams Rooms must be running app version ${MIN_TEAMS_ROOMS_APP_VERSION} or later which uses Graph instead of EWS. Verify all devices are updated.`,
        remediation:
          'Update all Teams Rooms devices to the latest app version via the Teams Admin Center or Pro Management Portal. Minimum required version: ' +
          MIN_TEAMS_ROOMS_APP_VERSION,
        docUrl: ewsRetirementImpact.docUrl,
        rawData: { ewsDeprecationStart: EWS_DEPRECATION_START, ewsFullShutdown: EWS_FULL_SHUTDOWN },
        timestamp: new Date().toISOString(),
      };
    }

    // If we're in the deprecation window
    if (now >= deprecationDate) {
      return {
        checkId: ewsRetirementImpact.id,
        categoryId: ewsRetirementImpact.categoryId,
        name: ewsRetirementImpact.name,
        status: 'warning',
        source: 'graph',
        severity: ewsRetirementImpact.severity,
        details: `EWS deprecation has begun (${EWS_DEPRECATION_START}). Full shutdown is scheduled for ${EWS_FULL_SHUTDOWN}. Ensure all Teams Rooms devices are updated to app version ${MIN_TEAMS_ROOMS_APP_VERSION}+ before the shutdown date.`,
        remediation:
          'Update all Teams Rooms devices to the latest app version. Schedule updates in the Teams Admin Center to complete before ' +
          EWS_FULL_SHUTDOWN,
        docUrl: ewsRetirementImpact.docUrl,
        rawData: { ewsDeprecationStart: EWS_DEPRECATION_START, ewsFullShutdown: EWS_FULL_SHUTDOWN },
        timestamp: new Date().toISOString(),
      };
    }

    // Before deprecation window
    return {
      checkId: ewsRetirementImpact.id,
      categoryId: ewsRetirementImpact.categoryId,
      name: ewsRetirementImpact.name,
      status: 'info',
      source: 'graph',
      severity: ewsRetirementImpact.severity,
      details: `EWS deprecation begins ${EWS_DEPRECATION_START} with full shutdown on ${EWS_FULL_SHUTDOWN}. Plan to update Teams Rooms devices to app version ${MIN_TEAMS_ROOMS_APP_VERSION}+ before the deprecation date.`,
      docUrl: ewsRetirementImpact.docUrl,
      rawData: { ewsDeprecationStart: EWS_DEPRECATION_START, ewsFullShutdown: EWS_FULL_SHUTDOWN },
      timestamp: new Date().toISOString(),
    };
  },
};
