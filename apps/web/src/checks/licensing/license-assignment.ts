import { CheckDefinition, CheckResult } from '../types';
import { getUserLicenseDetails } from '../../lib/graph-queries';
import { TEAMS_ROOMS_SKU_PART_NUMBERS } from '../../lib/constants';

export const licenseAssignment: CheckDefinition = {
  id: 'licensing-license-assignment',
  categoryId: 'licensing',
  name: 'Every Resource Account Has a Teams Rooms License',
  description: 'Checks that every resource account is assigned a Teams Rooms Basic or Pro license.',
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
      if (context.resourceAccounts.length === 0) {
        return { ...base, status: 'not-applicable', details: 'No resource accounts found to evaluate.' };
      }

      const unlicensed: string[] = [];

      for (const account of context.resourceAccounts) {
        const licenses = await getUserLicenseDetails(context.graphClient, account.id);
        const hasRoomsLicense = licenses.some((lic) =>
          TEAMS_ROOMS_SKU_PART_NUMBERS.includes(lic.skuPartNumber as typeof TEAMS_ROOMS_SKU_PART_NUMBERS[number]),
        );
        if (!hasRoomsLicense) {
          unlicensed.push(account.userPrincipalName);
        }
      }

      if (unlicensed.length > 0) {
        return {
          ...base,
          status: 'fail',
          details: `${unlicensed.length} of ${context.resourceAccounts.length} resource account(s) are missing a Teams Rooms license: ${unlicensed.join(', ')}.`,
          remediation:
            'Assign a Teams Rooms Basic or Pro license to each unlicensed resource account in the Microsoft 365 admin center.',
          rawData: { unlicensed, total: context.resourceAccounts.length },
        };
      }

      return {
        ...base,
        status: 'pass',
        details: `All ${context.resourceAccounts.length} resource account(s) have a Teams Rooms license assigned.`,
        rawData: { total: context.resourceAccounts.length },
      };
    } catch (error) {
      return {
        ...base,
        status: 'warning',
        details: `Unable to verify license assignments: ${error instanceof Error ? error.message : String(error)}`,
        remediation: 'Ensure the app has User.Read.All permission to read user license details.',
      };
    }
  },
};
