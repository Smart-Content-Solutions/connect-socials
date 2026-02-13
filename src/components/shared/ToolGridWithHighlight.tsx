/**
 * Tool Grid with Highlight - PRODUCTION READY
 * 
 * Features:
 * - Uses live role config from SubscriptionContext
 * - Proper loading state while config loads
 * - Uses userHasToolAccess for accurate permission checking
 */

import React, { useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Lock, ArrowRight, Check, Shield, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useSubscription } from "../subscription/useSubscription";
import { hasEntitlement as hasEntitlementLib, hasAccessToFeature, FEATURE_ENTITLEMENTS } from "@/lib/entitlements";
import { userHasToolAccess, getDefaultRoleConfig } from "@/lib/roleConfig";

interface ToolItem {
  id: string | number;
  name: string;
  shortDescription: string;
  icon: React.ElementType;
  slug?: string;
  planRequired: string;
  requiredEntitlement?: string;
  requiredFeature?: keyof typeof FEATURE_ENTITLEMENTS;
}

interface ToolCardProps {
  tool: ToolItem;
  tier: string;
  onUnlockClick?: (tool: ToolItem) => void;
  index: number;
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
  currentPath: string;
}

function ToolCard({
  tool,
  tier,
  onUnlockClick,
  index,
  onMouseEnter,
  onMouseLeave,
  currentPath,
}: ToolCardProps) {
  const { hasAccessToTool, user, roleConfig, isConfigLoading } = useSubscription();

  // ✅ CLERK-SAFE ADMIN CHECK
  const baseTier = (user?.base_tier || user?.publicMetadata?.base_tier) as string;
  const entitlements = (user?.entitlements || user?.publicMetadata?.entitlements || []) as string[];
  const isAdmin = baseTier === "admin";

  // Check access using centralized role config
  const hasAccess = React.useMemo(() => {
    // Admin always has access
    if (isAdmin) return true;

    // If config is still loading, use defaults
    const config = roleConfig || getDefaultRoleConfig();

    // Use centralized roleConfig tool access check
    // This checks both main roles (base_tier) and add-on roles (entitlements)
    const toolId = typeof tool.id === 'string' ? tool.id : String(tool.id);
    
    const hasToolAccess = userHasToolAccess(
      baseTier || "free", 
      entitlements, 
      toolId,
      config
    );
    
    if (hasToolAccess) return true;

    // Check if tool requires specific entitlement (legacy support)
    if (tool.requiredEntitlement) {
      return hasEntitlementLib(entitlements, baseTier || "free", tool.requiredEntitlement);
    }

    // Check if tool requires specific feature (legacy support)
    if (tool.requiredFeature) {
      return hasAccessToFeature(entitlements, baseTier || "free", tool.requiredFeature);
    }

    // Fallback to plan-based check via context
    return hasAccessToTool(toolId);
  }, [baseTier, entitlements, tool, isAdmin, hasAccessToTool, roleConfig]);

  const Icon = tool.icon;

  // ✅ ONLY NAVIGATE IF USER HAS ACCESS - Pass referrer as URL param
  const CardWrapper: any = hasAccess && tool.slug ? Link : "div";
  const targetUrl = hasAccess && tool.slug
    ? `/tool?slug=${tool.slug}&from=${encodeURIComponent(currentPath)}`
    : null;

  const cardProps = targetUrl ? { to: targetUrl } : {};


  const handleClick = () => {
    // ✅ LOCKED USERS NEVER NAVIGATE
    if (!hasAccess && onUnlockClick) {
      onUnlockClick(tool);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      viewport={{ once: true }}
      className="group relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
    >
      <CardWrapper {...cardProps} className="block">
        <div
          className={`glass-card rounded-2xl p-6 h-full transition-all duration-300 cursor-pointer relative z-10 ${hasAccess
            ? "hover:border-green-500/30"
            : "hover:border-[#E1C37A]/20"
            }`}
        >
          {/* ================= LOCK / ADMIN / UNLOCK ================= */}
          {!hasAccess ? (
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-transparent via-[#1A1A1C]/50 to-[#1A1A1C]/80 z-10 flex flex-col items-center justify-end pb-6">
              <div className="w-10 h-10 rounded-full bg-[#3B3C3E] flex items-center justify-center mb-3">
                <Lock className="w-5 h-5 text-[#E1C37A]" />
              </div>
              <span className="btn-gold px-5 py-2 rounded-full text-sm flex items-center gap-2">
                Unlock Tool
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          ) : isAdmin ? (
            <div className="absolute top-4 right-4 z-10">
              <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
            </div>
          ) : (
            <div className="absolute top-4 right-4 z-10">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>
          )}

          {/* ================= CONTENT ================= */}
          <div className={!hasAccess ? "opacity-60" : ""}>
            <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center gold-gradient">
              <Icon className="w-6 h-6 text-[#1A1A1C]" />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-white">{tool.name}</h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${tier === "Corporate"
                  ? "bg-[#E1C37A]/20 text-[#E1C37A]"
                  : "bg-[#D6D7D8]/20 text-[#D6D7D8]"
                  }`}
              >
                {tier}
              </span>
            </div>

            <p className="text-sm text-[#A9AAAC] leading-relaxed">
              {tool.shortDescription}
            </p>
          </div>
        </div>
      </CardWrapper>
    </motion.div>
  );
}

interface ToolGridWithHighlightProps {
  tools: ToolItem[];
  tier?: string;
  onUnlockClick?: (tool: ToolItem) => void;
  isLoading?: boolean;
}

export default function ToolGridWithHighlight({
  tools,
  tier = "Core",
  onUnlockClick,
  isLoading = false,
}: ToolGridWithHighlightProps) {
  const location = useLocation();
  const { isConfigLoading } = useSubscription();
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({
    opacity: 0,
  });

  const gridRef = useRef<HTMLDivElement | null>(null);

  const handleHover = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (!gridRef.current) return;

    const card = event.currentTarget;
    const gridRect = gridRef.current.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();

    const x = cardRect.left - gridRect.left;
    const y = cardRect.top - gridRect.top;

    setHighlightStyle({
      opacity: 1,
      transform: `translate(${x}px, ${y}px)`,
      width: `${cardRect.width}px`,
      height: `${cardRect.height}px`,
    });
  };

  const clearHover = () => {
    setHighlightStyle((prev) => ({ ...prev, opacity: 0 }));
  };

  // Show loading state if either the grid or config is loading
  if (isLoading || isConfigLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="glass-card rounded-2xl p-6 h-48 animate-pulse bg-gray-800/50"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative w-full" ref={gridRef}>
      {/* GOLD FLOATING HIGHLIGHT */}
      <div
        className="absolute rounded-2xl pointer-events-none transition-all duration-300 ease-out"
        style={{
          background: "rgba(212, 175, 55, 0.15)",
          boxShadow: "0 0 40px rgba(212, 175, 55, 0.25)",
          backdropFilter: "blur(8px)",
          position: "absolute",
          zIndex: 0,
          ...highlightStyle,
        }}
      />

      {/* GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {tools.map((tool, index) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            tier={tier}
            onUnlockClick={onUnlockClick}
            index={index}
            onMouseEnter={handleHover}
            onMouseLeave={clearHover}
            currentPath={location.pathname}
          />
        ))}
      </div>
    </div>
  );
}
