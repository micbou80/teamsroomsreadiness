export type CheckStatus = 'pass' | 'fail' | 'warning' | 'info' | 'not-applicable' | 'pending';
export type CheckSource = 'graph' | 'powershell' | 'manual';
export type CategoryId = 'licensing' | 'identity' | 'calendar' | 'conditional-access' | 'network' | 'platform' | 'security' | 'management' | 'voice';

export interface CheckResult {
  checkId: string;
  categoryId: CategoryId;
  name: string;
  status: CheckStatus;
  source: CheckSource;
  severity: 'critical' | 'high' | 'medium' | 'low';
  details: string;
  remediation?: string;
  docUrl?: string;
  rawData?: Record<string, unknown>;
  timestamp: string;
}

export interface CheckDefinition {
  id: string;
  categoryId: CategoryId;
  name: string;
  description: string;
  source: CheckSource;
  severity: 'critical' | 'high' | 'medium' | 'low';
  docUrl?: string;
  execute: (context: CheckContext) => Promise<CheckResult>;
}

export interface CheckContext {
  graphClient: GraphServiceClient;
  tenantId: string;
  resourceAccounts: ResourceAccount[];
  config: AssessmentConfig;
  powershellData?: PowerShellUpload;
  exchangeToken?: string;
  selectedDevices?: Set<DeviceType>;
}

export interface ResourceAccount {
  id: string;
  userPrincipalName: string;
  mail: string;
  displayName: string;
  passwordPolicies?: string;
  licenseDetails?: LicenseDetail[];
}

export interface LicenseDetail {
  skuId: string;
  skuPartNumber: string;
  servicePlans: ServicePlan[];
}

export interface ServicePlan {
  servicePlanId: string;
  servicePlanName: string;
  provisioningStatus: string;
}

export interface CategoryDefinition {
  id: CategoryId;
  name: string;
  description: string;
  icon: string;
}

export interface CategoryResult {
  categoryId: CategoryId;
  name: string;
  icon: string;
  checks: CheckResult[];
  score: number;
  status: CheckStatus;
}

export interface Assessment {
  id: string;
  tenantId: string;
  siteId?: string;
  createdAt: string;
  categories: CategoryResult[];
  overallScore: number;
  overallStatus: CheckStatus;
  metadata: AssessmentMetadata;
}

export type DeviceType =
  | 'teams-rooms-windows'
  | 'teams-rooms-android'
  | 'teams-panels'
  | 'teams-phones'
  | 'surface-hub'
  | 'teams-displays'
  | 'byod';

export interface AssessmentMetadata {
  webChecksRun: number;
  powershellChecksMerged: number;
  manualChecksCompleted: number;
  duration: number;
  deviceTypes?: DeviceType[];
}

export interface AssessmentConfig {
  namingConventionPrefix: string;
  expectedTimezones: Record<string, string>;
  includeVoiceChecks: boolean;
  pstnModel?: 'calling-plan' | 'direct-routing' | 'operator-connect';
}

export interface PowerShellUpload {
  version: string;
  generatedAt: string;
  hostname: string;
  checks: PowerShellCheckResult[];
}

export interface PowerShellCheckResult {
  checkId: string;
  categoryId: CategoryId;
  status: CheckStatus;
  details: string;
  rawData?: Record<string, unknown>;
}

// Graph client type (to avoid importing the full package in type files)
export type GraphServiceClient = import('@microsoft/microsoft-graph-client').Client;
