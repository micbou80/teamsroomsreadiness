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
  // deviceCategory is a navigation property, not filterable as a simple string.
  // Instead, fetch Windows devices and filter client-side by model keywords.
  const response = await client
    .api('/deviceManagement/managedDevices')
    .filter("operatingSystem eq 'Windows'")
    .select('id,deviceName,osVersion,complianceState,model,manufacturer,operatingSystem,deviceCategoryDisplayName')
    .top(999)
    .get();
  const all = response.value as ManagedDevice[];
  // Filter to likely Teams Rooms devices by model name
  const roomKeywords = ['teams room', 'mtr', 'collaboration bar', 'surface hub'];
  return all.filter((d) => {
    const model = (d.model ?? '').toLowerCase();
    const name = (d.deviceName ?? '').toLowerCase();
    const category = ((d as any).deviceCategoryDisplayName ?? '').toLowerCase();
    return roomKeywords.some((kw) => model.includes(kw) || name.includes(kw)) ||
           category.includes('teams') || category.includes('room');
  });
}

/**
 * Get detected Teams Rooms apps via Intune Detected Apps API.
 * Requires DeviceManagementApps.Read.All permission.
 */
export async function getDetectedTeamsRoomsApp(client: Client) {
  const response = await client
    .api('/deviceManagement/detectedApps')
    .filter("startswith(displayName,'Microsoft Teams Rooms')")
    .expand('managedDevices($select=id,deviceName)')
    .get();
  return response.value as DetectedApp[];
}

/**
 * Get all detected apps for a specific managed device.
 * Requires DeviceManagementApps.Read.All permission.
 */
export async function getDetectedAppsForDevice(client: Client, deviceId: string) {
  const response = await client
    .api(`/deviceManagement/managedDevices/${deviceId}/detectedApps`)
    .select('displayName,version')
    .top(999)
    .get();
  return response.value as DetectedApp[];
}

/**
 * Get hardware information for a managed device.
 * Requires DeviceManagementManagedDevices.Read.All permission.
 */
export async function getManagedDeviceHardwareInfo(client: Client, deviceId: string) {
  const response = await client
    .api(`/deviceManagement/managedDevices/${deviceId}`)
    .select('id,deviceName,hardwareInformation')
    .get();
  return response as ManagedDeviceHardwareInfo;
}

/**
 * Get Windows Update for Business configuration rings.
 * Requires DeviceManagementConfiguration.Read.All permission.
 */
export async function getWindowsUpdateRings(client: Client) {
  const response = await client
    .api('/deviceManagement/deviceConfigurations')
    .filter("isof('microsoft.graph.windowsUpdateForBusinessConfiguration')")
    .select('id,displayName,featureUpdatesDeferralPeriodInDays,qualityUpdatesDeferralPeriodInDays,assignments')
    .get();
  return response.value as WindowsUpdateRing[];
}

/**
 * Get device local credentials (LAPS) for a device.
 * Requires DeviceLocalCredential.ReadBasic.All permission.
 */
export async function getDeviceLocalCredentials(client: Client, deviceId: string) {
  const response = await client
    .api(`/deviceLocalCredentials/${deviceId}`)
    .select('deviceName,lastBackupDateTime')
    .get();
  return response as DeviceLocalCredential;
}

/**
 * Get Windows devices from directory (for LAPS check).
 */
export async function getDirectoryDevices(client: Client) {
  const response = await client
    .api('/devices')
    .filter("operatingSystem eq 'Windows'")
    .select('id,displayName,isManaged')
    .top(999)
    .get();
  return response.value as DirectoryDevice[];
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

export interface DetectedApp {
  id?: string;
  displayName: string;
  version?: string;
  sizeInByte?: number;
  deviceCount?: number;
  managedDevices?: { id: string; deviceName: string }[];
}

export interface ManagedDeviceHardwareInfo {
  id: string;
  deviceName: string;
  hardwareInformation?: {
    operatingSystemEdition?: string;
    [key: string]: unknown;
  };
}

export interface WindowsUpdateRing {
  id: string;
  displayName: string;
  featureUpdatesDeferralPeriodInDays?: number;
  qualityUpdatesDeferralPeriodInDays?: number;
  assignments?: { id: string; target: Record<string, unknown> }[];
}

export interface DeviceLocalCredential {
  deviceName: string;
  lastBackupDateTime?: string;
}

export interface DirectoryDevice {
  id: string;
  displayName: string;
  isManaged?: boolean;
}
