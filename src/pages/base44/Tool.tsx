import React from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

import { getToolBySlug } from "@/components/tools/toolsConfig";
import ToolPageTemplate from "@/components/tools/ToolPageTemplate";

export default function Tool() {
  const { isSignedIn, isLoaded } = useUser();
  const [searchParams] = useSearchParams();
  const slug = searchParams.get("slug");

  // ✅ Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }

  // ✅ Must be logged in to even preview tools
  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  const tool = getToolBySlug(slug);

  // Debug logging
  console.log("🛠️ Tool.tsx Debug:");
  console.log("  - slug:", slug);
  console.log("  - tool found:", !!tool);
  console.log("  - current path:", window.location.pathname);

  // ✅ No slug at all → don't render (user is navigating away)
  if (!slug) {
    console.log("  ℹ️ No slug parameter, not rendering");
    return null;
  }

  // ✅ Invalid slug → dashboard (only redirect if there IS a slug but tool not found)
  if (!tool) {
    console.log("  ⚠️ REDIRECTING to dashboard-preview (invalid slug)");
    return <Navigate to="/dashboard-preview" replace />;
  }

  // ✅ DO NOT redirect normal users anymore
  // ToolPageTemplate already handles:
  // - locked preview
  // - pricing CTA
  // - admin access

  return <ToolPageTemplate tool={tool} />;
}