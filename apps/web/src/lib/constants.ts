// Teams Rooms license SKU Part Numbers
export const TEAMS_ROOMS_PRO_SKU = 'Microsoft_Teams_Rooms_Pro';
export const TEAMS_ROOMS_BASIC_SKU = 'Microsoft_Teams_Rooms_Basic';
export const TEAMS_SHARED_DEVICES_SKU = 'MCOCAP';

// Known SKU IDs (GUIDs)
export const TEAMS_ROOMS_PRO_SKU_ID = '4cde982a-ede4-4409-9ae6-b003453c8ea6';
export const TEAMS_ROOMS_BASIC_SKU_ID = '6af4b3d6-14bb-4a2a-960c-6c902aad34f3';

// All Teams Rooms license identifiers (for matching)
export const TEAMS_ROOMS_SKU_PART_NUMBERS = [
  TEAMS_ROOMS_PRO_SKU,
  TEAMS_ROOMS_BASIC_SKU,
] as const;

// Service plan IDs expected in Teams Rooms Pro
export const EXPECTED_PRO_SERVICE_PLANS = {
  TEAMS_PHONE: { id: '4828c8ec-dc2e-4e55-86ab-effae8e55a5b', name: 'Teams Phone Standard' },
  INTUNE: { id: 'c1ec4a95-1f05-45b3-a911-aa3fa01094f5', name: 'Intune' },
  ENTRA_P1: { id: '41781fb2-bc02-4b7c-bd55-b576c07bb09d', name: 'Entra ID P1' },
} as const;

// Basic license tenant cap
export const TEAMS_ROOMS_BASIC_MAX = 25;

// Unsupported CA session controls for Teams Rooms
export const UNSUPPORTED_SESSION_CONTROLS = [
  'signInFrequency',
  'persistentBrowser',
  'cloudAppSecurity',
  'applicationEnforcedRestrictions',
] as const;

// Unsupported CA grant controls for Teams Rooms on Windows (interactive prompts)
export const UNSUPPORTED_GRANT_CONTROLS = [
  'mfa',
  'authenticationStrength',
  'passwordChange',
] as const;

// Minimum supported Teams Rooms app versions
export const CURRENT_TEAMS_ROOMS_APP_VERSION = '5.5.129.0';
export const MIN_TEAMS_ROOMS_APP_VERSION = '5.0.0.0';

// Windows 11 minimum build number
export const WINDOWS_11_MIN_BUILD = 22000;

// Network thresholds
export const MIN_BANDWIDTH_MBPS = 10;
export const TEAMS_MEDIA_UDP_PORTS = [3478, 3479, 3480, 3481] as const;
export const TEAMS_SIGNALING_TCP_PORT = 443;

// QoS DSCP values
export const QOS_DSCP = {
  AUDIO: 46,
  VIDEO: 34,
  SHARING: 18,
} as const;

// Direct Routing
export const DIRECT_ROUTING_SIP_PORT = 5061;
export const DIRECT_ROUTING_MEDIA_PORTS = { start: 49152, end: 53247 } as const;

// EWS retirement dates
export const EWS_DEPRECATION_START = '2026-10-01';
export const EWS_FULL_SHUTDOWN = '2027-04-01';

// Windows 10 support end
export const WINDOWS_10_SUPPORT_END = '2025-10-14';

// Allowed software prefixes for Teams Rooms devices (security-no-unsupported-software check)
export const MTR_ALLOWED_SOFTWARE_PREFIXES = [
  'Microsoft Teams Rooms',
  'Microsoft Teams',
  'Windows',
  'Microsoft Visual C++',
  'Microsoft Edge',
  'Microsoft .NET',
  'Microsoft Update',
  'Skype',
  'Intel',
  'NVIDIA',
  'Logitech',
  'Yealink',
  'Poly',
  'Crestron',
  'Lenovo',
  'Dell',
  'HP ',
  'Hewlett',
];
