// Feature flags mapped to entitlements
export const FEATURE_ENTITLEMENTS = {
  wordpress_tool: ["wp_ai_agent"],
  social_automation: ["social_automation"],
  ai_agent: ["ai_agent"],
  ai_video_generation: ["ai_video"],
} as const;

// Base tier grants
export const BASE_TIER_GRANTS: Record<string, string[]> = {
  admin: ["*"],  // Admin gets everything
  pro: ["social_automation", "wordpress_tool"],
  early_access: ["social_automation", "wordpress_tool", "ai_agent"],
  free: [],
};

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
  const baseGrants = BASE_TIER_GRANTS[baseTier] || [];
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

  const baseGrants = BASE_TIER_GRANTS[baseTier] || [];
  const allEntitlements = new Set([...userEntitlements, ...baseGrants]);
  
  // Remove wildcard if present
  if (allEntitlements.has("*")) {
    return ["*"];
  }
  
  return Array.from(allEntitlements);
}

// Utility: Get entitlements for a specific feature
export function getEntitlementsForFeature(feature: keyof typeof FEATURE_ENTITLEMENTS): string[] {
  return FEATURE_ENTITLEMENTS[feature];
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