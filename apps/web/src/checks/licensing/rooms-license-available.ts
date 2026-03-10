import { CheckDefinition, CheckResult } from '../types';
import { getSubscribedSkus } from '../../lib/graph-queries';
import { TEAMS_ROOMS_SKU_PART_NUMBERS } from '../../lib/constants';

export const roomsLicenseAvailable: CheckDefinition = {
  id: 'licensing-rooms-license-available',
  categoryId: 'licensing',
  name: 'Teams Rooms License Available',
  description: 'Checks that the tenant has at least one Teams Rooms Basic or Pro SKU subscribed and active.',
  source: 'graph',
  severity: 'critical',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/rooms-licensing',

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

      const roomsSkus = skus.filter(
        (sku) =>
          TEAMS_ROOMS_SKU_PART_NUMBERS.includes(sku.skuPartNumber as typeof TEAMS_ROOMS_SKU_PART_NUMBERS[number]) &&
          sku.capabilityStatus === 'Enabled',
      );

      if (roomsSkus.length === 0) {
        return {
          ...base,
          status: 'fail',
          details: 'No active Teams Rooms Basic or Pro license SKU found in the tenant.',
          remediation: 'Purchase a Teams Rooms Basic or Teams Rooms Pro license from the Microsoft 365 admin center.',
          rawData: { subscribedSkus: skus.map((s) => ({ skuPartNumber: s.skuPartNumber, capabilityStatus: s.capabilityStatus })) },
        };
      }

      const summary = roomsSkus
        .map((s) => `${s.skuPartNumber}: ${s.consumedUnits}/${s.prepaidUnits.enabled} used`)
        .join('; ');

      return {
        ...base,
        status: 'pass',
        details: `Teams Rooms license SKU(s) available: ${summary}.`,
        rawData: { roomsSkus },
      };
    } catch (error) {
      return {
        ...base,
        status: 'warning',
        details: `Unable to query subscribed SKUs: ${error instanceof Error ? error.message : String(error)}`,
        remediation: 'Ensure the app has Organization.Read.All permission to read tenant SKUs.',
      };
    }
  },
};
