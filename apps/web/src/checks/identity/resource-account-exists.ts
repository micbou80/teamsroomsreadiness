import { CheckDefinition, CheckResult } from '../types';
import { getRoomResources } from '../../lib/graph-queries';

export const resourceAccountExists: CheckDefinition = {
  id: 'identity-resource-account-exists',
  categoryId: 'identity',
  name: 'Resource Accounts Found',
  description: 'Checks that room resource accounts exist in the tenant via the Places API.',
  source: 'graph',
  severity: 'critical',
  docUrl: 'https://learn.microsoft.com/microsoftteams/rooms/create-resource-account',

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
      const rooms = await getRoomResources(context.graphClient);

      if (rooms.length === 0) {
        return {
          ...base,
          status: 'fail',
          details: 'No room resource accounts were found via the Places API.',
          remediation:
            'Create room resource accounts using the Microsoft 365 admin center or New-Mailbox -Room PowerShell cmdlet, then ensure they appear in the Places directory.',
        };
      }

      return {
        ...base,
        status: 'pass',
        details: `Found ${rooms.length} room resource account(s) via the Places API.`,
        rawData: { roomCount: rooms.length, rooms: rooms.map((r) => ({ displayName: r.displayName, emailAddress: r.emailAddress })) },
      };
    } catch (error) {
      return {
        ...base,
        status: 'warning',
        details: `Unable to query room resources: ${error instanceof Error ? error.message : String(error)}`,
        remediation: 'Ensure the app has Place.Read.All permission to read room resources.',
      };
    }
  },
};
