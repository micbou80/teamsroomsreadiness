import type { DeviceType } from './types';

/**
 * Maps each check ID to the device types it's relevant for.
 * If a check is not listed here, it applies to ALL device types.
 *
 * Universal checks (licensing, identity, calendar, conditional-access, network)
 * are not listed — they apply to every device type by default.
 */

const ALL_ROOM_TYPES: DeviceType[] = [
  'teams-rooms-windows',
  'teams-rooms-android',
  'teams-panels',
  'teams-phones',
  'surface-hub',
  'byod',
];

const WINDOWS_DEVICES: DeviceType[] = [
  'teams-rooms-windows',
  'surface-hub',
];

const MANAGED_DEVICES: DeviceType[] = [
  'teams-rooms-windows',
  'teams-rooms-android',
  'surface-hub',
];

const CALLING_DEVICES: DeviceType[] = [
  'teams-rooms-windows',
  'teams-rooms-android',
  'teams-phones',
  'surface-hub',
];

/**
 * Check IDs that are restricted to specific device types.
 * Checks NOT in this map are universal (apply to all device types).
 */
const CHECK_DEVICE_MAP: Record<string, DeviceType[]> = {
  // Platform — Windows only
  'platform-windows-version': WINDOWS_DEVICES,
  'platform-os-sku': WINDOWS_DEVICES,
  'platform-app-version': WINDOWS_DEVICES,
  'platform-no-ltsc': WINDOWS_DEVICES,

  // Security — Windows only
  'security-defender-active': WINDOWS_DEVICES,
  'security-admin-password-changed': WINDOWS_DEVICES,
  'security-secure-boot-tpm': WINDOWS_DEVICES,
  'security-no-unsupported-software': WINDOWS_DEVICES,

  // Management — managed devices
  'management-intune-enrollment': MANAGED_DEVICES,
  'management-pmp-connectivity': MANAGED_DEVICES,
  'management-update-rings': WINDOWS_DEVICES,

  // Voice — devices that support calling
  'voice-pstn-model': CALLING_DEVICES,
  'voice-emergency-calling': CALLING_DEVICES,
  'voice-sbc-health': CALLING_DEVICES,
};

/**
 * Returns true if the check is relevant for at least one of the selected device types.
 * If a check has no entry in the map, it's universal and always relevant.
 */
export function isCheckRelevant(checkId: string, selectedDevices: Set<DeviceType>): boolean {
  const applicableDevices = CHECK_DEVICE_MAP[checkId];
  if (!applicableDevices) return true; // universal check
  return applicableDevices.some((d) => selectedDevices.has(d));
}
