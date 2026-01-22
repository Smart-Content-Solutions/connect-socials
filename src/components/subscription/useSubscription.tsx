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

/* ============================
   ✅ Types (extended with role)
============================ */

export interface UserSubscription extends AccessControlUserSubscription {
  role?: "admin" | "early_access" | "user";
  publicMetadata?: any;
}

interface SubscriptionContextType {
  user: UserSubscription | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;

  hasPlan: (requiredPlan: string) => boolean;
  hasAccessToTool: (toolPlanRequired: string) => boolean;
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
        subscription_plan:
          (clerkUser.publicMetadata?.subscription_plan as string) || "none",
        subscription_status:
          (clerkUser.publicMetadata?.subscription_status as
            | "active"
            | "past_due"
            | "canceled"
            | "trialing"
            | "none") || "none",
        role:
          (clerkUser.publicMetadata?.role as "admin" | "early_access" | "user") || "user",
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
      subscription_plan:
        (clerkUser.publicMetadata?.subscription_plan as string) || "none",
      subscription_status:
        (clerkUser.publicMetadata?.subscription_status as
          | "active"
          | "past_due"
          | "canceled"
          | "trialing"
          | "none") || "none",
      role:
        (clerkUser.publicMetadata?.role as "admin" | "early_access" | "user") || "user",
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

    // Admin always “has” any plan
    hasPlan: (requiredPlan: string) => {
      if (user?.role === "admin") return true;
      return baseHasPlan(user, requiredPlan);
    },

    // Admin always has access to any tool
    // Early access users have access to Social Media, WordPress, and AI Agent tools
    hasAccessToTool: (toolPlanRequired: string) => {
      if (user?.role === "admin") return true;
      // For early_access role, we DON'T grant blanket access here
      // Access control is handled by RoleProtectedRoute on specific routes
      // and by custom checks in tool grid components.
      // This keeps other tools locked in the UI unless they have a real subscription
      return baseHasAccessToTool(user, toolPlanRequired);
    },

    // Admin subscription is always treated as active
    isSubscriptionActive: () => {
      if (user?.role === "admin") return true;
      return baseIsSubscriptionActive(user);
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
      isSubscriptionActive: () => false,
      getPlanDetails: () => null,

      login: () => { },
      logout: () => { },
      refreshUser: async () => { }
    };
  }

  return context;
}
