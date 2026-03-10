import { CheckDefinition, CheckResult } from '../types';
import { getUserLicenseDetails } from '../../lib/graph-queries';
import { TEAMS_SHARED_DEVICES_SKU } from '../../lib/constants';

export const noSharedDeviceLicense: CheckDefinition = {
  id: 'licensing-no-shared-device-license',
  categoryId: 'licensing',
  name: 'No Shared Device License on Resource Accounts',
  description: 'Ensures no resource accounts are assigned the Teams Shared Devices (MCOCAP) SKU, which is not supported for Teams Rooms.',
  source: 'graph',
  severity: 'high',
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
      if (context.resourceAccounts.length === 0) {
        return { ...base, status: 'not-applicable', details: 'No resource accounts found to evaluate.' };
      }

      const accountsWithSharedDevice: string[] = [];

      for (const account of context.resourceAccounts) {
        const licenses = await getUserLicenseDetails(context.graphClient, account.id);
        const hasShared = licenses.some((lic) => lic.skuPartNumber === TEAMS_SHARED_DEVICES_SKU);
        if (hasShared) {
          accountsWithSharedDevice.push(account.userPrincipalName);
        }
      }

      if (accountsWithSharedDevice.length > 0) {
        return {
          ...base,
          status: 'fail',
          details: `${accountsWithSharedDevice.length} resource account(s) have the Teams Shared Devices (MCOCAP) license: ${accountsWithSharedDevice.join(', ')}.`,
          remediation:
            'Remove the MCOCAP license and assign a Teams Rooms Basic or Pro license instead. The Shared Devices license is intended for common-area phones, not Teams Rooms.',
          rawData: { accountsWithSharedDevice },
        };
      }

      return {
        ...base,
        status: 'pass',
        details: 'No resource accounts have the Teams Shared Devices (MCOCAP) license.',
      };
    } catch (error) {
      return {
        ...base,
        status: 'warning',
        details: `Unable to check shared device licenses: ${error instanceof Error ? error.message : String(error)}`,
        remediation: 'Ensure the app has User.Read.All permission to read license details.',
      };
    }
  },
};
