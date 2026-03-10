import { CheckDefinition, CheckResult } from '../types';
import { getSubscribedSkus } from '../../lib/graph-queries';
import { TEAMS_ROOMS_PRO_SKU, EXPECTED_PRO_SERVICE_PLANS } from '../../lib/constants';

export const proServicePlans: CheckDefinition = {
  id: 'licensing-pro-service-plans',
  categoryId: 'licensing',
  name: 'Pro License Includes Required Service Plans',
  description: 'Verifies that the Teams Rooms Pro SKU includes the expected service plans: Teams Phone, Intune, and Entra ID P1.',
  source: 'graph',
  severity: 'medium',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/rooms-licensing#teams-rooms-pro',

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
      const proSku = skus.find(
        (sku) => sku.skuPartNumber === TEAMS_ROOMS_PRO_SKU && sku.capabilityStatus === 'Enabled',
      );

      if (!proSku) {
        return {
          ...base,
          status: 'not-applicable',
          details: 'No active Teams Rooms Pro SKU found in the tenant.',
        };
      }

      const expectedPlans = Object.values(EXPECTED_PRO_SERVICE_PLANS);
      const missing: string[] = [];

      for (const expected of expectedPlans) {
        const found = proSku.servicePlans.find(
          (sp) => sp.servicePlanId === expected.id && sp.provisioningStatus === 'Success',
        );
        if (!found) {
          missing.push(expected.name);
        }
      }

      if (missing.length > 0) {
        return {
          ...base,
          status: 'fail',
          details: `Teams Rooms Pro is missing or has disabled service plans: ${missing.join(', ')}.`,
          remediation:
            'Check the Microsoft 365 admin center to ensure these service plans are enabled within the Teams Rooms Pro license. If disabled at the tenant level, re-enable them.',
          rawData: { missingPlans: missing, skuServicePlans: proSku.servicePlans },
        };
      }

      return {
        ...base,
        status: 'pass',
        details: 'Teams Rooms Pro includes all expected service plans: Teams Phone, Intune, and Entra ID P1.',
        rawData: { servicePlans: proSku.servicePlans },
      };
    } catch (error) {
      return {
        ...base,
        status: 'warning',
        details: `Unable to verify Pro service plans: ${error instanceof Error ? error.message : String(error)}`,
        remediation: 'Ensure the app has Organization.Read.All permission to read tenant SKUs.',
      };
    }
  },
};
