import { CategoryDefinition, CategoryId, CheckDefinition } from './types';

// Category definitions with metadata
export const categories: CategoryDefinition[] = [
  { id: 'licensing', name: 'Licensing', description: 'Teams Rooms license assignment and SKU validation', icon: 'Certificate' },
  { id: 'identity', name: 'Identity & Auth', description: 'Resource accounts, passwords, and authentication', icon: 'Person' },
  { id: 'calendar', name: 'Calendar', description: 'Mailbox configuration, calendar processing, and EWS readiness', icon: 'Calendar' },
  { id: 'conditional-access', name: 'Conditional Access', description: 'CA policy exclusions and supported controls', icon: 'Shield' },
  { id: 'network', name: 'Network', description: 'Connectivity, ports, proxy, TLS, QoS, and bandwidth', icon: 'Globe' },
  { id: 'platform', name: 'Platform', description: 'Windows version, OS SKU, and app version baselines', icon: 'Desktop' },
  { id: 'security', name: 'Security', description: 'Defender, secure boot, admin credentials, and software posture', icon: 'LockClosed' },
  { id: 'management', name: 'Management', description: 'Pro Management Portal, Intune, and update rings', icon: 'Settings' },
];

// Mutable check registry — categories register their checks at import time
const checkRegistry: CheckDefinition[] = [];

export function registerChecks(checks: CheckDefinition[]): void {
  checkRegistry.push(...checks);
}

export function getAllChecks(): CheckDefinition[] {
  return [...checkRegistry];
}

export function getChecksByCategory(categoryId: CategoryId): CheckDefinition[] {
  return checkRegistry.filter((c) => c.categoryId === categoryId);
}

export function getCategoryDefinition(categoryId: CategoryId): CategoryDefinition | undefined {
  return categories.find((c) => c.id === categoryId);
}
