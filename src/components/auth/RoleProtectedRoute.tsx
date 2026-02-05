import React from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Lock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasEntitlement, hasAccessToFeature, FEATURE_ENTITLEMENTS } from "@/lib/entitlements";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "early_access" | "user";
  allowedRoles?: Array<"admin" | "early_access" | "user">;
  requiredEntitlement?: string;
  requiredFeature?: keyof typeof FEATURE_ENTITLEMENTS;
}

/**
 * RoleProtectedRoute - Protects routes based on user roles
 * 
 * Usage:
 * - requiredRole: User must have exactly this role
 * - allowedRoles: User must have one of these roles
 * 
 * If user doesn't have required role, shows upgrade prompt
 */
export default function RoleProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
}: RoleProtectedRouteProps) {
  const { user, isLoaded, isSignedIn } = useUser();

  // Wait for auth to load
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not signed in
  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  // Get user's role and entitlements from public metadata
  const userRole = (user?.publicMetadata?.role as string) || "user";
  const baseTier = (user?.publicMetadata?.base_tier as string) || userRole || "free";
  const entitlements = (user?.publicMetadata?.entitlements as string[]) || [];

  // Check if user has required access
  let hasAccess = false;

  if (requiredEntitlement) {
    // New entitlement-based check
    hasAccess = hasEntitlement(entitlements, baseTier, requiredEntitlement);
  } else if (requiredFeature) {
    // Feature-based check
    hasAccess = hasAccessToFeature(entitlements, baseTier, requiredFeature);
  } else if (requiredRole) {
    // Backward compatible role check
    hasAccess = baseTier === requiredRole || userRole === requiredRole;
  } else if (allowedRoles && allowedRoles.length > 0) {
    hasAccess = allowedRoles.includes(baseTier as any) || allowedRoles.includes(userRole as any);
  } else {
    // No role requirement specified, allow access
    hasAccess = true;
  }

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have access - show upgrade prompt
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-yellow-500/20 bg-gray-900/50 backdrop-blur">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Early Access Required
          </h1>
          <p className="text-gray-400 text-lg">
            This tool is available exclusively to Early Access subscribers
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-yellow-500" />
              WordPress SEO Tool Features
            </h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-yellow-500 mt-1">✓</span>
                <span>AI-powered SEO optimization for WordPress posts</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-500 mt-1">✓</span>
                <span>Automatic meta title and description generation</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-500 mt-1">✓</span>
                <span>Direct WordPress site integration</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-500 mt-1">✓</span>
                <span>One-click publishing to your WordPress site</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-500 mt-1">✓</span>
                <span>SEO scoring and optimization suggestions</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-6 border border-yellow-500/20">
            <h3 className="text-lg font-semibold text-white mb-2">
              Your Current Access
            </h3>
            <p className="text-gray-400 mb-4">
              Role: <span className="text-white font-medium capitalize">{userRole}</span>
            </p>
            <p className="text-gray-300 text-sm">
              Upgrade to <strong className="text-yellow-500">Early Access</strong> to unlock the WordPress SEO tool and other premium features.
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={() => window.location.href = "/pricing"}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-6 text-lg"
            >
              Upgrade to Early Access
            </Button>
            <Button
              onClick={() => window.location.href = "/dashboard-preview"}
              variant="outline"
              className="flex-1 border-gray-600 hover:bg-gray-800 py-6"
            >
              Back to Dashboard
            </Button>
          </div>

          <p className="text-center text-sm text-gray-500">
            Questions? <a href="/contact" className="text-yellow-500 hover:underline">Contact our team</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
