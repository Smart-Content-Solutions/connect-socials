import React from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

import { getToolBySlug } from "@/components/tools/toolsConfig";
import ToolPageTemplate from "@/components/tools/ToolPageTemplate";
import { useSubscription } from "@/components/subscription/useSubscription";

export default function Tool() {
  const { isSignedIn, isLoaded } = useUser();
  const { isAuthenticated, hasAccessToTool } = useSubscription();

  const [searchParams] = useSearchParams();
  const slug = searchParams.get("slug");

  // ✅ LOADING
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading…
      </div>
    );
  }

  // ✅ MUST BE LOGGED IN
  if (!isSignedIn || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ✅ GET TOOL
  const tool = getToolBySlug(slug);

  // ✅ INVALID TOOL
  if (!tool || typeof tool !== "object") {
    return <Navigate to="/dashboard-preview" replace />;
  }

  // ✅ ACCESS CHECK (REAL SOURCE OF TRUTH)
  const hasAccess = hasAccessToTool(tool.planRequired);

  // ✅ NO ACCESS → PRICING (NO WHITE SCREEN)
  if (!hasAccess) {
    return <Navigate to="/pricing" replace />;
  }

  // ✅ ACCESS OK → LOAD TOOL
  return <ToolPageTemplate tool={tool} />;
}
