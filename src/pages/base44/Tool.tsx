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

  // ✅ Invalid slug → dashboard
  if (!tool) {
    return <Navigate to="/dashboard-preview" replace />;
  }

  // ✅ DO NOT redirect normal users anymore
  // ToolPageTemplate already handles:
  // - locked preview
  // - pricing CTA
  // - admin access

  return <ToolPageTemplate tool={tool} />;
}