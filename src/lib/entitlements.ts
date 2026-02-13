/**
 * Entitlements System
 * 
 * PRODUCTION-READY VERSION
 * - Uses default config for synchronous operations
 * - Provides async versions for database-backed checks
 * - Backward compatible with existing code
 * 
 * This module derives access rules from the centralized roleConfig.
 * It provides backward-compatible functions used throughout the app.
 */

import { 
  loadRoleConfig, 
  userHasToolAccess, 
  getUserToolAccess, 
  getDefaultRoleConfig,
  deriveTierGrants,
  type RoleConfig 
} from './roleConfig';

// Feature flags mapped to entitlements (backward compat)
export const FEATURE_ENTITLEMENTS = {
  wordpress_tool: ["wp_ai_agent"],
  social_automation: ["social_automation"],
  ai_agent: ["ai_agent"],
  ai_video_generation: ["ai_video"],
} as const;

// Cache for base tier grants (sync version uses defaults)
let cachedBaseTierGrants: Record<string, string[]> | null = null;

/**
 * Gets base tier grants synchronously using default config
 * Use getBaseTierGrantsAsync() for database-backed grants
 */
export function getBaseTierGrants(): Record<string, string[]> {
  if (cachedBaseTierGrants) {
    return cachedBaseTierGrants;
  }
  
  // Use default config for sync operations
  const config = getDefaultRoleConfig();
  cachedBaseTierGrants = deriveTierGrants(config);
  return cachedBaseTierGrants;
}

/**
 * Gets base tier grants asynchronously from database
 * Use this for admin operations where you need the latest config
 */
export async function getBaseTierGrantsAsync(): Promise<Record<string, string[]>> {
  const config = await loadRoleConfig();
  return deriveTierGrants(config);
}

/**
 * Refreshes the cached tier grants from database
 * Call this when you know the config has been updated
 */
export async function refreshBaseTierGrants(): Promise<void> {
  const config = await loadRoleConfig();
  cachedBaseTierGrants = deriveTierGrants(config);
}

// Export as a getter property for backward compatibility
// Code that imports BASE_TIER_GRANTS will get cached/default config
export const BASE_TIER_GRANTS: Record<string, string[]> = new Proxy({} as Record<string, string[]>, {
  get(target, prop: string) {
    const grants = getBaseTierGrants();
    return grants[prop] || [];
  },
  ownKeys() {
    const grants = getBaseTierGrants();
    return Object.keys(grants);
  },
  getOwnPropertyDescriptor(target, prop: string) {
    const grants = getBaseTierGrants();
    if (prop in grants) {
      return { configurable: true, enumerable: true, value: grants[prop] };
    }
    return undefined;
  },
  has(target, prop: string) {
    const grants = getBaseTierGrants();
    return prop in grants;
  },
});

// Utility: Check if user has entitlement
export function hasEntitlement(
  userEntitlements: string[],
  baseTier: string,
  requiredEntitlement: string
): boolean {
  // Admin gets everything
  if (baseTier === "admin") return true;

  // Check if user has the specific entitlement
  if (userEntitlements.includes(requiredEntitlement)) return true;

  // Check if base tier grants the entitlement
  const grants = getBaseTierGrants();
  const baseGrants = grants[baseTier] || [];
  if (baseGrants.includes(requiredEntitlement) || baseGrants.includes("*")) {
    return true;
  }

  return false;
}

// Utility: Get all effective entitlements
export function getEffectiveEntitlements(
  userEntitlements: string[],
  baseTier: string
): string[] {
  // Admin gets everything
  if (baseTier === "admin") return ["*"];

  const grants = getBaseTierGrants();
  const baseGrants = grants[baseTier] || [];
  const allEntitlements = new Set([...userEntitlements, ...baseGrants]);

  // Remove wildcard if present
  if (allEntitlements.has("*")) {
    return ["*"];
  }

  return Array.from(allEntitlements);
}

// Utility: Get entitlements for a specific feature
export function getEntitlementsForFeature(feature: keyof typeof FEATURE_ENTITLEMENTS): string[] {
  return FEATURE_ENTITLEMENTS[feature] as unknown as string[];
}

// Utility: Check if user has access to a feature
export function hasAccessToFeature(
  userEntitlements: string[],
  baseTier: string,
  feature: keyof typeof FEATURE_ENTITLEMENTS
): boolean {
  const requiredEntitlements = getEntitlementsForFeature(feature);
  return requiredEntitlements.some(entitlement =>
    hasEntitlement(userEntitlements, baseTier, entitlement)
  );
}

// ─── Async Versions for Database-Backed Operations ───────────────────

/**
 * Async version: Check if user has entitlement
 * Uses fresh config from database
 */
export async function hasEntitlementAsync(
  userEntitlements: string[],
  baseTier: string,
  requiredEntitlement: string
): Promise<boolean> {
  // Admin gets everything
  if (baseTier === "admin") return true;

  // Check if user has the specific entitlement
  if (userEntitlements.includes(requiredEntitlement)) return true;

  // Check if base tier grants the entitlement (async)
  const grants = await getBaseTierGrantsAsync();
  const baseGrants = grants[baseTier] || [];
  if (baseGrants.includes(requiredEntitlement) || baseGrants.includes("*")) {
    return true;
  }

  return false;
}

/**
 * Async version: Get all effective entitlements
 * Uses fresh config from database
 */
export async function getEffectiveEntitlementsAsync(
  userEntitlements: string[],
  baseTier: string
): Promise<string[]> {
  // Admin gets everything
  if (baseTier === "admin") return ["*"];

  const grants = await getBaseTierGrantsAsync();
  const baseGrants = grants[baseTier] || [];
  const allEntitlements = new Set([...userEntitlements, ...baseGrants]);

  // Remove wildcard if present
  if (allEntitlements.has("*")) {
    return ["*"];
  }

  return Array.from(allEntitlements);
}

/**
 * Async version: Check if user has access to a feature
 * Uses fresh config from database
 */
export async function hasAccessToFeatureAsync(
  userEntitlements: string[],
  baseTier: string,
  feature: keyof typeof FEATURE_ENTITLEMENTS
): Promise<boolean> {
  const requiredEntitlements = getEntitlementsForFeature(feature);
  for (const entitlement of requiredEntitlements) {
    if (await hasEntitlementAsync(userEntitlements, baseTier, entitlement)) {
      return true;
    }
  }
  return false;
}

// ─── Re-exports for convenience ─────────────────────────────────────
export { userHasToolAccess, getUserToolAccess } from './roleConfig';
