/**
 * Subscription Provider - PRODUCTION READY
 * 
 * Features:
 * - Loads role config from Supabase with real-time updates
 * - Proper loading states for config
 * - Subscribes to config changes
 * - Tool access checking uses live config
 */

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useRef
} from "react";
import { useUser } from "@clerk/clerk-react";
import {
  hasPlan as baseHasPlan,
  hasAccessToTool as baseHasAccessToTool,
  isSubscriptionActive as baseIsSubscriptionActive,
  getUserPlanDetails,
  UserSubscription as AccessControlUserSubscription
} from "./accessControl";
import {
  hasEntitlement as hasEntitlementLib,
  getEffectiveEntitlements as getEffectiveEntitlementsLib,
  hasAccessToFeature,
  FEATURE_ENTITLEMENTS,
  BASE_TIER_GRANTS,
  refreshBaseTierGrants
} from "@/lib/entitlements";
import { 
  userHasToolAccess, 
  loadRoleConfig, 
  subscribeToRoleConfig,
  getDefaultRoleConfig,
  type RoleConfig
} from "@/lib/roleConfig";

/* ============================
   ✅ Types (extended with role)
============================ */

export interface UserSubscription extends AccessControlUserSubscription {
  base_tier?: "admin" | "pro" | "early_access" | "free";
  entitlements?: string[];
  publicMetadata?: any;
}

interface SubscriptionContextType {
  user: UserSubscription | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;

  // Config state
  roleConfig: RoleConfig | null;
  isConfigLoading: boolean;

  // Access checks
  hasPlan: (requiredPlan: string) => boolean;
  hasAccessToTool: (toolId: string) => boolean;
  hasEntitlement: (entitlement: string) => boolean;
  hasFeatureAccess: (feature: keyof typeof FEATURE_ENTITLEMENTS) => boolean;
  getEffectiveEntitlements: () => string[];
  isSubscriptionActive: () => boolean;
  getPlanDetails: () => any;

  login: (nextUrl?: string) => void;
  logout: (redirectUrl?: string) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

/* ============================
   ✅ Provider
============================ */

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();

  const [user, setUser] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Role config state
  const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  
  // Refs for managing subscriptions
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // ✅ Load Role Config from Supabase with Real-time Updates
  useEffect(() => {
    let isMounted = true;

    async function initializeConfig() {
      setIsConfigLoading(true);
      
      try {
        // Load initial config
        const config = await loadRoleConfig();
        
        if (isMounted) {
          setRoleConfig(config);
          setIsConfigLoading(false);
          
          // Subscribe to real-time updates
          const unsubscribe = subscribeToRoleConfig((newConfig) => {
            if (isMounted) {
              setRoleConfig(newConfig);
              // Also refresh entitlement cache
              refreshBaseTierGrants();
            }
          });
          
          unsubscribeRef.current = unsubscribe;
        }
      } catch (err) {
        console.error("Failed to load role config:", err);
        if (isMounted) {
          // Fallback to defaults
          setRoleConfig(getDefaultRoleConfig());
          setIsConfigLoading(false);
        }
      }
    }

    initializeConfig();

    // Cleanup subscription on unmount
    return () => {
      isMounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  /* ============================
     ✅ Sync Clerk → Subscription User
  ============================ */

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && clerkUser) {
      const subscriptionUser: UserSubscription = {
        base_tier:
          (clerkUser.publicMetadata?.base_tier as "admin" | "pro" | "early_access" | "free") ||
          (clerkUser.publicMetadata?.role as "admin" | "pro" | "early_access" | "free") ||
          "free",
        entitlements:
          (clerkUser.publicMetadata?.entitlements as string[]) || [],
        subscription_plan:
          (clerkUser.publicMetadata?.subscription_plan as string) || "none",
        subscription_status:
          (clerkUser.publicMetadata?.subscription_status as
            | "active"
            | "past_due"
            | "canceled"
            | "trialing"
            | "none") || "none",
        publicMetadata: clerkUser.publicMetadata
      };

      setUser(subscriptionUser);
    } else {
      setUser(null);
    }

    setLoading(false);
  }, [isLoaded, isSignedIn, clerkUser]);

  /* ============================
     ✅ Refresh User (Clerk Metadata)
  ============================ */

  const refreshUser = useCallback(async () => {
    if (!clerkUser) return;

    // Force Clerk to refetch user data from server
    await clerkUser.reload();

    const subscriptionUser: UserSubscription = {
      base_tier:
        (clerkUser.publicMetadata?.base_tier as "admin" | "pro" | "early_access" | "free") ||
        (clerkUser.publicMetadata?.role as "admin" | "pro" | "early_access" | "free") ||
        "free",
      entitlements:
        (clerkUser.publicMetadata?.entitlements as string[]) || [],
      subscription_plan:
        (clerkUser.publicMetadata?.subscription_plan as string) || "none",
      subscription_status:
        (clerkUser.publicMetadata?.subscription_status as
          | "active"
          | "past_due"
          | "canceled"
          | "trialing"
          | "none") || "none",
      publicMetadata: clerkUser.publicMetadata
    };

    setUser(subscriptionUser);
  }, [clerkUser]);

  /* ============================
     ✅ Context Value
  ============================ */

  const value: SubscriptionContextType = {
    user,
    loading,
    isAuthenticated: isSignedIn,
    refreshUser,

    // Config state
    roleConfig,
    isConfigLoading,

    // Admin always "has" any plan
    hasPlan: (requiredPlan: string) => {
      if (user?.base_tier === "admin") return true;
      if (user?.base_tier === "early_access" || user?.base_tier === "pro") {
        return true;
      }
      return baseHasPlan(user, requiredPlan);
    },

    // Tool access - uses live config
    hasAccessToTool: (toolId: string) => {
      if (!user) return false;
      if (user.base_tier === "admin") return true;

      // Use roleConfig if loaded, otherwise fall back to defaults
      const config = roleConfig || getDefaultRoleConfig();
      
      // Check specific tool access using role config
      const hasAccess = userHasToolAccess(
        user.base_tier || "free",
        user.entitlements || [],
        toolId,
        config
      );

      if (hasAccess) return true;

      // Fallback to legacy plan-based check
      // Map tool IDs to plan requirements (simplified)
      const planRequired = getPlanForTool(toolId);
      if (planRequired) {
        return baseHasAccessToTool(user, planRequired);
      }

      return false;
    },

    // Admin subscription is always treated as active
    isSubscriptionActive: () => {
      if (user?.base_tier === "admin") return true;
      if (user?.base_tier === "early_access" || user?.base_tier === "pro") return true;
      return baseIsSubscriptionActive(user);
    },

    hasEntitlement: (entitlement: string) => {
      if (!user) return false;
      return hasEntitlementLib(user.entitlements || [], user.base_tier || "free", entitlement);
    },

    hasFeatureAccess: (feature: keyof typeof FEATURE_ENTITLEMENTS) => {
      if (!user) return false;
      return hasAccessToFeature(user.entitlements || [], user.base_tier || "free", feature);
    },

    getEffectiveEntitlements: () => {
      if (!user) return [];
      return getEffectiveEntitlementsLib(user.entitlements || [], user.base_tier || "free");
    },

    getPlanDetails: () => getUserPlanDetails(user),

    // ✅ Clerk-based auth actions
    login: (nextUrl?: string) => {
      if (nextUrl) {
        window.location.href = `/login?redirect_url=${encodeURIComponent(
          nextUrl
        )}`;
      } else {
        window.location.href = "/login";
      }
    },

    logout: (redirectUrl?: string) => {
      if (redirectUrl) {
        window.location.href = `/logout?redirect_url=${encodeURIComponent(
          redirectUrl
        )}`;
      } else {
        window.location.href = "/logout";
      }
    }
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

/* ============================
   ✅ Helper: Get plan for tool
============================ */

function getPlanForTool(toolId: string): string | null {
  // Map tool IDs to their plan requirements
  const toolPlanMap: Record<string, string> = {
    "social-automation": "Starter",
    "wordpress-seo": "Starter",
    "email-engine": "Starter",
    "content-engine": "Starter",
    "ai-agent": "Starter",
    "ads-analytics": "Growth",
    "lead-crm": "Growth",
    "performance-reports": "Growth",
    "backlink-automation": "Growth",
    "reviews-reputation": "Growth",
    "client-onboarding": "Growth",
    "competitor-monitoring": "Growth",
  };
  
  return toolPlanMap[toolId] || null;
}

/* ============================
   ✅ Hook
============================ */

export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);

  if (!context) {
    return {
      user: null,
      loading: true,
      isAuthenticated: false,
      isConfigLoading: true,
      roleConfig: null,

      hasPlan: () => false,
      hasAccessToTool: () => false,
      hasEntitlement: () => false,
      hasFeatureAccess: () => false,
      getEffectiveEntitlements: () => [],
      isSubscriptionActive: () => false,
      getPlanDetails: () => null,

      login: () => { },
      logout: () => { },
      refreshUser: async () => { }
    };
  }

  return context;
}
