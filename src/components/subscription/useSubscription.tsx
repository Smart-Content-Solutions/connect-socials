import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode
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
  FEATURE_ENTITLEMENTS
} from "@/lib/entitlements";

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

  hasPlan: (requiredPlan: string) => boolean;
  hasAccessToTool: (toolPlanRequired: string) => boolean;
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

  /* ============================
     ✅ Sync Clerk → Subscription User
  ============================ */

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && clerkUser) {
      const subscriptionUser: UserSubscription = {
        base_tier:
          (clerkUser.publicMetadata?.base_tier as "admin" | "pro" | "early_access" | "free") || "free",
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
     CRITICAL: Must call clerkUser.reload() to get fresh data from server
  ============================ */

  const refreshUser = async () => {
    if (!clerkUser) return;

    // CRITICAL: Force Clerk to refetch user data from server
    // Without this, publicMetadata changes won't be reflected
    await clerkUser.reload();

    const subscriptionUser: UserSubscription = {
      base_tier:
        (clerkUser.publicMetadata?.base_tier as "admin" | "pro" | "early_access" | "free") || "free",
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
  };

  /* ============================
     ✅ Context Value (ADMIN BYPASS)
  ============================ */

  const value: SubscriptionContextType = {
    user,
    loading,
    isAuthenticated: isSignedIn,

    refreshUser,

    // Admin always "has" any plan
    hasPlan: (requiredPlan: string) => {
      if (user?.base_tier === "admin") return true;
      return baseHasPlan(user, requiredPlan);
    },

    // Admin always has access to any tool
    hasAccessToTool: (toolPlanRequired: string) => {
      if (user?.base_tier === "admin") return true;
      return baseHasAccessToTool(user, toolPlanRequired);
    },

    // Admin subscription is always treated as active
    isSubscriptionActive: () => {
      if (user?.base_tier === "admin") return true;
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
   ✅ Hook
============================ */

export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);

  if (!context) {
    return {
      user: null,
      loading: true,
      isAuthenticated: false,

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
