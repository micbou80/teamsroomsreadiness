import { CheckDefinition, CheckResult } from '../types';
import { getSubscribedSkus } from '../../lib/graph-queries';
import { TEAMS_ROOMS_BASIC_SKU, TEAMS_ROOMS_BASIC_MAX } from '../../lib/constants';

export const basicLicenseCap: CheckDefinition = {
  id: 'licensing-basic-license-cap',
  categoryId: 'licensing',
  name: 'Basic License Within 25-Unit Cap',
  description: 'Validates that the Teams Rooms Basic SKU consumed units do not exceed the 25-device tenant cap.',
  source: 'graph',
  severity: 'high',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/rooms-licensing#teams-rooms-basic',

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
      const skus = await getSubscribedSkus(context.graphClient);
      const basicSku = skus.find(
        (sku) => sku.skuPartNumber === TEAMS_ROOMS_BASIC_SKU && sku.capabilityStatus === 'Enabled',
      );

      if (!basicSku) {
        return {
          ...base,
          status: 'not-applicable',
          details: 'No active Teams Rooms Basic SKU found in the tenant. This check only applies to the Basic license.',
        };
      }

      const { consumedUnits } = basicSku;

      if (consumedUnits > TEAMS_ROOMS_BASIC_MAX) {
        return {
          ...base,
          status: 'fail',
          details: `Teams Rooms Basic has ${consumedUnits} consumed units, which exceeds the ${TEAMS_ROOMS_BASIC_MAX}-device cap.`,
          remediation:
            `Upgrade excess devices to Teams Rooms Pro licenses. The Basic license is limited to ${TEAMS_ROOMS_BASIC_MAX} devices per tenant.`,
          rawData: { consumedUnits, cap: TEAMS_ROOMS_BASIC_MAX },
        };
      }

      if (consumedUnits === TEAMS_ROOMS_BASIC_MAX) {
        return {
          ...base,
          status: 'warning',
          details: `Teams Rooms Basic is at the ${TEAMS_ROOMS_BASIC_MAX}-device cap (${consumedUnits}/${TEAMS_ROOMS_BASIC_MAX}). No additional Basic licenses can be assigned.`,
          remediation: 'Consider upgrading to Teams Rooms Pro if more rooms will be added.',
          rawData: { consumedUnits, cap: TEAMS_ROOMS_BASIC_MAX },
        };
      }

      return {
        ...base,
        status: 'pass',
        details: `Teams Rooms Basic has ${consumedUnits}/${TEAMS_ROOMS_BASIC_MAX} units consumed.`,
        rawData: { consumedUnits, cap: TEAMS_ROOMS_BASIC_MAX },
      };
    } catch (error) {
      return {
        ...base,
        status: 'warning',
        details: `Unable to check Basic license cap: ${error instanceof Error ? error.message : String(error)}`,
        remediation: 'Ensure the app has Organization.Read.All permission to read tenant SKUs.',
      };
    }
  },
};
