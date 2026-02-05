import { useUser } from "@clerk/clerk-react";

/**
 * Backward compatibility hook for role-based access
 * Maps new base_tier/entitlements to old role format
 */
export function useLegacyRoleCompat() {
    const { user } = useUser();

    const publicMetadata = user?.publicMetadata || {};

    // Prefer new format, fall back to old
    const baseTier = (publicMetadata.base_tier as string) || (publicMetadata.role as string) || "free";
    const entitlements = (publicMetadata.entitlements as string[]) || [];

    // Map base_tier to legacy role for components still using it
    const legacyRole = baseTier;

    return {
        role: legacyRole,
        baseTier,
        entitlements,
        isAdmin: baseTier === "admin",
        isEarlyAccess: baseTier === "early_access",
        isPro: baseTier === "pro",
        isFree: baseTier === "free",
    };
}
