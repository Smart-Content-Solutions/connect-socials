// Feature flags for gradual rollout
export const FEATURE_FLAGS = {
    USE_ENTITLEMENTS: process.env.NEXT_PUBLIC_USE_ENTITLEMENTS === "true" || true,
    LEGACY_ROLE_FALLBACK: true,  // Enable during migration
} as const;
