import { Client } from '@microsoft/microsoft-graph-client';
import { TEAMS_ROOMS_SKU_PART_NUMBERS } from './constants';

/**
 * Get all subscribed SKUs for the tenant.
 */
export async function getSubscribedSkus(client: Client) {
  const response = await client.api('/subscribedSkus').get();
  return response.value as SubscribedSku[];
}

/**
 * Get license details for a specific user/resource account.
 */
export async function getUserLicenseDetails(client: Client, userId: string) {
  const response = await client.api(`/users/${userId}/licenseDetails`).get();
  return response.value as GraphLicenseDetail[];
}

/**
 * Get all room resource accounts.
 * Uses the places API to find rooms, then fetches user details.
 */
export async function getRoomResources(client: Client) {
  const response = await client
    .api('/places/microsoft.graph.room')
    .header('ConsistencyLevel', 'eventual')
    .top(999)
    .get();
  return response.value as GraphRoom[];
}

/**
 * Get user properties for a resource account.
 */
export async function getUserProperties(client: Client, userId: string) {
  return client
    .api(`/users/${userId}`)
    .select('id,userPrincipalName,mail,displayName,passwordPolicies,passwordProfile,accountEnabled')
    .get();
}

/**
 * Get all Conditional Access policies.
 */
export async function getConditionalAccessPolicies(client: Client) {
  const response = await client.api('/identity/conditionalAccess/policies').get();
  return response.value as ConditionalAccessPolicy[];
}

/**
 * Get authentication methods for a user.
 */
export async function getUserAuthMethods(client: Client, userId: string) {
  const response = await client.api(`/users/${userId}/authentication/methods`).get();
  return response.value as AuthMethod[];
}

/**
 * Get mailbox settings for a user.
 */
export async function getMailboxSettings(client: Client, userId: string) {
  return client.api(`/users/${userId}/mailboxSettings`).get();
}

/**
 * Get Intune managed devices filtered to Teams Rooms.
 */
export async function getManagedDevices(client: Client) {
  const response = await client
    .api('/deviceManagement/managedDevices')
    .filter("deviceCategory eq 'TeamsRoom' or contains(model,'Teams Room')")
    .select('id,deviceName,osVersion,complianceState,model,manufacturer,operatingSystem')
    .top(999)
    .get();
  return response.value as ManagedDevice[];
}

// Type definitions for Graph responses
export interface SubscribedSku {
  skuId: string;
  skuPartNumber: string;
  capabilityStatus: string;
  consumedUnits: number;
  prepaidUnits: { enabled: number; suspended: number; warning: number };
  servicePlans: { servicePlanId: string; servicePlanName: string; provisioningStatus: string }[];
}

export interface GraphLicenseDetail {
  skuId: string;
  skuPartNumber: string;
  servicePlans: { servicePlanId: string; servicePlanName: string; provisioningStatus: string }[];
}

export interface GraphRoom {
  id: string;
  displayName: string;
  emailAddress: string;
  capacity?: number;
  building?: string;
  floorNumber?: number;
}

export interface ConditionalAccessPolicy {
  id: string;
  displayName: string;
  state: 'enabled' | 'disabled' | 'enabledForReportingButNotEnforced';
  conditions: {
    users?: {
      includeUsers?: string[];
      excludeUsers?: string[];
      includeGroups?: string[];
      excludeGroups?: string[];
    };
    applications?: {
      includeApplications?: string[];
    };
  };
  grantControls?: {
    builtInControls?: string[];
    operator?: string;
  };
  sessionControls?: {
    signInFrequency?: { isEnabled: boolean; value: number; type: string };
    persistentBrowser?: { isEnabled: boolean; mode: string };
    cloudAppSecurity?: { isEnabled: boolean };
    applicationEnforcedRestrictions?: { isEnabled: boolean };
  };
}

export interface AuthMethod {
  '@odata.type': string;
  id: string;
}

export interface ManagedDevice {
  id: string;
  deviceName: string;
  osVersion: string;
  complianceState: string;
  model: string;
  manufacturer: string;
  operatingSystem: string;
}
