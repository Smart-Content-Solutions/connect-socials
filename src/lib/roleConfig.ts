/**
 * Role Configuration — Single Source of Truth
 * 
 * PRODUCTION-READY VERSION
 * - Uses Supabase for persistence (not localStorage)
 - Real-time sync across all clients
 * - Validation to prevent corrupted configs
 * - Fallback to defaults if config is invalid
 * 
 * Inspired by Discord's role system:
 * - Main Roles (base tiers): Hierarchical roles like admin > early_access > pro > free
 * - Add-on Roles (entitlements): Independent permissions that can be toggled per user
 * 
 * Tools are assigned to roles. A user has access to a tool if:
 * 1. Their main role grants it, OR
 * 2. They have an add-on role that grants it
 */

import { supabase } from "./supabase";

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: "Core" | "Corporate";
}

export const ALL_TOOLS: ToolDefinition[] = [
  // Core tools
  { id: "social-automation", name: "Social Media Automation", description: "Auto schedule and post content across platforms", category: "Core" },
  { id: "wordpress-seo", name: "WordPress SEO & Post", description: "Optimize and publish SEO content to WordPress", category: "Core" },
  { id: "ai-agent", name: "AI Agent", description: "Train AI on your site and optimize posts", category: "Core" },
  { id: "email-engine", name: "AI Email Marketing", description: "Generate and send AI written campaigns", category: "Core" },
  { id: "content-engine", name: "Blog & SEO Content", description: "Long form SEO content that ranks", category: "Core" },
  { id: "ads-analytics", name: "AI Ads Analytics", description: "Ad performance insights across platforms", category: "Core" },
  { id: "lead-crm", name: "Lead Capture & CRM", description: "Capture leads and push to CRM automatically", category: "Core" },
  { id: "performance-reports", name: "Performance Reports", description: "Automated periodic performance reports", category: "Core" },
  { id: "backlink-automation", name: "Backlink Outreach", description: "Automate outreach campaigns for backlinks", category: "Core" },
  { id: "reviews-reputation", name: "Reviews & Reputation", description: "Generate reviews and manage reputation", category: "Core" },
  { id: "client-onboarding", name: "Client Onboarding", description: "Automate client onboarding workflows", category: "Core" },
  { id: "competitor-monitoring", name: "Competitor Monitoring", description: "Real-time competitor tracking and alerts", category: "Core" },

  // Corporate tools
  { id: "mmm-analytics-edge", name: "MMM Analytics Edge", description: "Marketing mix modeling and budget allocation", category: "Corporate" },
  { id: "crm-listrak-attentive", name: "Listrak & Attentive CRM", description: "Enterprise CRM integrations", category: "Corporate" },
  { id: "bazaarvoice", name: "Bazaarvoice Reviews", description: "Review syndication across retail channels", category: "Corporate" },
  { id: "dynamic-yield", name: "Dynamic Yield Personalisation", description: "Website personalisation engine", category: "Corporate" },
  { id: "ai-chatbot-skincare", name: "AI Chatbot & Analysis", description: "Custom AI chatbot and analysis engine", category: "Corporate" },
  { id: "ppc-suite", name: "PPC Tools Suite", description: "Paid search and shopping campaign tools", category: "Corporate" },
  { id: "translations-suite", name: "Translations & WriterAI", description: "AI-powered content translation", category: "Corporate" },
  { id: "social-screaming-frog", name: "Social & Screaming Frog", description: "Scheduling with crawling insights", category: "Corporate" },
  { id: "contentsquare", name: "ContentSquare Analytics", description: "Deep behavior analytics for UX", category: "Corporate" },
  { id: "paid-social-suite", name: "Paid Social Suite", description: "All-platform paid social management", category: "Corporate" },
];

// ─── Main Roles (base tiers) ────────────────────────────────────────
export interface MainRole {
  id: string;
  name: string;
  description: string;
  color: string;          // Tailwind color class
  bgColor: string;        // Background color class
  borderColor: string;    // Border color class
  icon: string;           // Lucide icon name
  priority: number;       // Higher = more access (for hierarchy)
  toolIds: string[];      // Tools this role grants access to
  isSystem: boolean;      // System roles can't be deleted
}

export const DEFAULT_MAIN_ROLES: MainRole[] = [
  {
    id: "admin",
    name: "Admin",
    description: "Full access to everything. System administrator role.",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
    icon: "Crown",
    priority: 100,
    toolIds: ["*"],  // Wildcard = all tools
    isSystem: true,
  },
  {
    id: "early_access",
    name: "Early Access",
    description: "Early adopter access with premium tool grants.",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    borderColor: "border-yellow-500/30",
    icon: "Star",
    priority: 30,
    toolIds: [
      "social-automation",
      "wordpress-seo",
      "ai-agent",
      "email-engine",
      "content-engine",
    ],
    isSystem: true,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Professional tier with core tool access.",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
    icon: "Shield",
    priority: 20,
    toolIds: [
      "social-automation",
      "wordpress-seo",
    ],
    isSystem: true,
  },
  {
    id: "free",
    name: "Free",
    description: "Free tier with limited access.",
    color: "text-gray-400",
    bgColor: "bg-gray-500/20",
    borderColor: "border-gray-500/30",
    icon: "User",
    priority: 0,
    toolIds: [],
    isSystem: true,
  },
];

// ─── Add-on Roles (entitlements) ─────────────────────────────────────
export interface AddOnRole {
  id: string;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  toolIds: string[];   // Tools this add-on grants access to
}

export const DEFAULT_ADDON_ROLES: AddOnRole[] = [
  {
    id: "social_automation",
    name: "Social Automation",
    description: "Grants access to social media posting and scheduling tools.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/30",
    icon: "Share2",
    toolIds: ["social-automation"],
  },
  {
    id: "wp_ai_agent",
    name: "WordPress AI Agent",
    description: "Grants access to WordPress SEO and AI optimization tools.",
    color: "text-sky-400",
    bgColor: "bg-sky-500/20",
    borderColor: "border-sky-500/30",
    icon: "Globe",
    toolIds: ["wordpress-seo"],
  },
  {
    id: "ai_agent",
    name: "AI Agent",
    description: "Grants access to the AI agent training and optimization tool.",
    color: "text-violet-400",
    bgColor: "bg-violet-500/20",
    borderColor: "border-violet-500/30",
    icon: "Brain",
    toolIds: ["ai-agent"],
  },
  {
    id: "ai_video",
    name: "AI Video Generation",
    description: "Grants access to AI-powered video generation tools.",
    color: "text-pink-400",
    bgColor: "bg-pink-500/20",
    borderColor: "border-pink-500/30",
    icon: "Video",
    toolIds: [],
  },
];

// ─── Storage key for saved config ────────────────────────────────────
const CONFIG_KEY = "role_config";

export interface RoleConfig {
  mainRoles: MainRole[];
  addOnRoles: AddOnRole[];
  version: number;
}

// Default config to use when nothing exists
const DEFAULT_CONFIG: RoleConfig = {
  mainRoles: DEFAULT_MAIN_ROLES,
  addOnRoles: DEFAULT_ADDON_ROLES,
  version: 1,
};

// ─── Validation ─────────────────────────────────────────────────────

/**
 * Validates that a role config is valid and not corrupted
 */
export function validateRoleConfig(config: unknown): config is RoleConfig {
  if (!config || typeof config !== "object") {
    console.error("Role config validation failed: config is not an object");
    return false;
  }

  const c = config as Record<string, unknown>;

  // Check version
  if (typeof c.version !== "number") {
    console.error("Role config validation failed: version is not a number");
    return false;
  }

  // Check mainRoles
  if (!Array.isArray(c.mainRoles) || c.mainRoles.length === 0) {
    console.error("Role config validation failed: mainRoles is empty or not an array");
    return false;
  }

  // Check addOnRoles
  if (!Array.isArray(c.addOnRoles)) {
    console.error("Role config validation failed: addOnRoles is not an array");
    return false;
  }

  // Validate required system roles exist
  const requiredRoles = ["admin", "early_access", "pro", "free"];
  const mainRoleIds = (c.mainRoles as MainRole[]).map(r => r.id);
  
  for (const requiredId of requiredRoles) {
    if (!mainRoleIds.includes(requiredId)) {
      console.error(`Role config validation failed: missing required role '${requiredId}'`);
      return false;
    }
  }

  // Validate admin role has wildcard
  const adminRole = (c.mainRoles as MainRole[]).find(r => r.id === "admin");
  if (!adminRole || !adminRole.toolIds.includes("*")) {
    console.error("Role config validation failed: admin role missing wildcard grant");
    return false;
  }

  return true;
}

/**
 * Sanitizes a config to ensure it has all required fields
 */
export function sanitizeRoleConfig(config: Partial<RoleConfig>): RoleConfig {
  const sanitized: RoleConfig = {
    mainRoles: [],
    addOnRoles: [],
    version: 1,
  };

  // Ensure main roles exist
  const requiredRoles = DEFAULT_MAIN_ROLES;
  const existingMainRoles = new Map(config.mainRoles?.map(r => [r.id, r]) || []);
  
  sanitized.mainRoles = requiredRoles.map(defaultRole => {
    const existing = existingMainRoles.get(defaultRole.id);
    if (existing) {
      // Merge existing with defaults to ensure all fields exist
      return {
        ...defaultRole,
        ...existing,
        // Always keep these as system-defined
        id: defaultRole.id,
        isSystem: true,
        // Admin always has wildcard
        toolIds: defaultRole.id === "admin" ? ["*"] : (existing.toolIds || defaultRole.toolIds),
      };
    }
    return defaultRole;
  });

  // Handle add-on roles - merge with defaults
  const defaultAddons = new Map(DEFAULT_ADDON_ROLES.map(r => [r.id, r]));
  const existingAddons = new Map(config.addOnRoles?.map(r => [r.id, r]) || []);
  
  // Keep all existing add-on roles plus any default ones that don't exist
  const allAddonIds = new Set([...defaultAddons.keys(), ...existingAddons.keys()]);
  sanitized.addOnRoles = Array.from(allAddonIds).map(id => {
    const existing = existingAddons.get(id);
    const defaultAddon = defaultAddons.get(id);
    
    if (existing) {
      return {
        ...(defaultAddon || {}),
        ...existing,
        id, // Ensure ID is preserved
      } as AddOnRole;
    }
    
    return defaultAddon!;
  }).filter(Boolean) as AddOnRole[];

  sanitized.version = config.version || 1;

  return sanitized;
}

// ─── Load / Save config ──────────────────────────────────────────────

/**
 * Loads role configuration from Supabase
 * Falls back to defaults if not found or invalid
 */
export async function loadRoleConfig(): Promise<RoleConfig> {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", CONFIG_KEY)
      .single();

    if (error) {
      console.warn("Failed to load role config from Supabase, using defaults:", error.message);
      return DEFAULT_CONFIG;
    }

    if (!data?.value) {
      console.log("No role config found in database, using defaults");
      return DEFAULT_CONFIG;
    }

    const config = data.value as RoleConfig;

    // Validate the config
    if (!validateRoleConfig(config)) {
      console.error("Loaded config failed validation, using sanitized version");
      return sanitizeRoleConfig(config);
    }

    return config;
  } catch (err) {
    console.error("Error loading role config:", err);
    return DEFAULT_CONFIG;
  }
}

/**
 * Loads role configuration synchronously (for non-async contexts)
 * Returns defaults - use loadRoleConfig() for actual data
 */
export function getDefaultRoleConfig(): RoleConfig {
  return DEFAULT_CONFIG;
}

/**
 * Saves role configuration via API endpoint (uses service role to bypass RLS)
 * Requires admin privileges via Clerk authentication
 * 
 * @param config - The role configuration to save
 * @param authToken - Optional Clerk JWT token (obtained from useAuth().getToken())
 */
export async function saveRoleConfig(config: RoleConfig, authToken?: string): Promise<void> {
  // Validate before saving
  if (!validateRoleConfig(config)) {
    throw new Error("Cannot save invalid role config");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add authorization header if token is provided
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch("/api/admin-role-config", {
    method: "POST",
    headers,
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    console.error("Failed to save role config:", errorData);
    throw new Error(`Failed to save role config: ${errorData.error || response.statusText}`);
  }
}

/**
 * Subscribe to role config changes in real-time
 * Returns unsubscribe function
 */
export function subscribeToRoleConfig(
  callback: (config: RoleConfig) => void
): () => void {
  const subscription = supabase
    .channel("role_config_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "app_settings",
        filter: `key=eq.${CONFIG_KEY}`,
      },
      (payload) => {
        const payloadAny = payload as { new?: { value?: RoleConfig } };
        const newConfig = payloadAny.new?.value;
        if (newConfig && validateRoleConfig(newConfig)) {
          callback(newConfig);
        }
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Check if a role (main or add-on) grants access to a specific tool
 */
export function roleGrantsTool(role: MainRole | AddOnRole, toolId: string): boolean {
  if (role.toolIds.includes("*")) return true;
  return role.toolIds.includes(toolId);
}

/**
 * Get all tool IDs a user has access to, given their base tier and add-on entitlements
 */
export function getUserToolAccess(
  baseTier: string,
  entitlements: string[],
  config?: RoleConfig
): Set<string> {
  const cfg = config || DEFAULT_CONFIG;
  const accessibleTools = new Set<string>();

  // Find the user's main role
  const mainRole = cfg.mainRoles.find(r => r.id === baseTier);
  if (mainRole) {
    if (mainRole.toolIds.includes("*")) {
      // Wildcard — all tools
      ALL_TOOLS.forEach(t => accessibleTools.add(t.id));
    } else {
      mainRole.toolIds.forEach(id => accessibleTools.add(id));
    }
  }

  // Add tools from add-on roles
  for (const entId of entitlements) {
    const addon = cfg.addOnRoles.find(r => r.id === entId);
    if (addon) {
      addon.toolIds.forEach(id => accessibleTools.add(id));
    }
  }

  return accessibleTools;
}

/**
 * Check if a user has access to a specific tool
 */
export function userHasToolAccess(
  baseTier: string,
  entitlements: string[],
  toolId: string,
  config?: RoleConfig
): boolean {
  const cfg = config || DEFAULT_CONFIG;

  // Admin always has access
  if (baseTier === "admin") return true;

  // Check main role
  const mainRole = cfg.mainRoles.find(r => r.id === baseTier);
  if (mainRole && roleGrantsTool(mainRole, toolId)) return true;

  // Check add-on roles
  for (const entId of entitlements) {
    const addon = cfg.addOnRoles.find(r => r.id === entId);
    if (addon && roleGrantsTool(addon, toolId)) return true;
  }

  return false;
}

/**
 * Derive BASE_TIER_GRANTS from config (for backward compatibility with entitlements.ts)
 */
export function deriveTierGrants(config?: RoleConfig): Record<string, string[]> {
  const cfg = config || DEFAULT_CONFIG;
  const grants: Record<string, string[]> = {};

  for (const role of cfg.mainRoles) {
    if (role.toolIds.includes("*")) {
      grants[role.id] = ["*"];
    } else {
      // Map tool IDs to entitlement IDs for backward compatibility
      const entitlementIds: string[] = [];
      for (const addon of cfg.addOnRoles) {
        // Check if any of the addon's tools overlap with this role's tools  
        const hasOverlap = addon.toolIds.some(tid => role.toolIds.includes(tid));
        if (hasOverlap) {
          entitlementIds.push(addon.id);
        }
      }
      grants[role.id] = entitlementIds;
    }
  }

  return grants;
}

// ─── Backward Compatibility ──────────────────────────────────────────

/**
 * @deprecated Use loadRoleConfig() instead. This is kept for backward compatibility.
 * Loads from Supabase asynchronously.
 */
export async function loadRoleConfigAsync(): Promise<RoleConfig> {
  return loadRoleConfig();
}

/**
 * @deprecated Config is now stored in Supabase, not localStorage.
 * This function now returns defaults for backward compatibility.
 */
export function loadRoleConfigSync(): RoleConfig {
  console.warn("loadRoleConfigSync is deprecated. Use loadRoleConfig() instead.");
  return DEFAULT_CONFIG;
}

/**
 * @deprecated Config is now stored in Supabase, not localStorage.
 * This is a no-op for backward compatibility.
 */
export function saveRoleConfigLocal(_config: RoleConfig): void {
  console.warn("saveRoleConfigLocal is deprecated. Config is now stored in Supabase.");
  // No-op - config is saved to Supabase
}
