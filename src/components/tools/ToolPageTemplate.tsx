// src/components/tools/ToolPageTemplate.tsx
import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Lock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Play,
  Zap,
  LogIn,
} from "lucide-react";
import { PLAN_HIERARCHY } from "./toolsConfig";
import SectionHeading from "../shared/SectionHeading";
import { useSubscription } from "../subscription/useSubscription";

/* ============================
   ✅ Types
============================ */

export interface ToolType {
  id: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  category: "Core" | "Corporate";
  planRequired: "Starter" | "Growth" | "Enterprise";
  color: string;
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  mainBenefits: string[];
  howItWorks: { step: string; desc: string }[];
  /** Optional route to the live in-app tool (e.g. /apps/social-automation) */
  appRoute?: string;
}

interface ToolPageTemplateProps {
  tool: ToolType;
}

/* ============================
   ✅ Component
============================ */

export default function ToolPageTemplate({ tool }: ToolPageTemplateProps) {
  const { user, isAuthenticated, hasAccessToTool, login } = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const userPlan = (user?.subscription_plan as string) || "none";

  // ✅ CLERK-SAFE ADMIN CHECK & EARLY ACCESS CHECK
  const isAdmin = user?.base_tier === "admin";
  const isEarlyAccess = user?.base_tier === "early_access";

  // ✅ Special case: early_access users can access Social Media, WordPress, and AI Agent tools
  const isAllowedForEarlyAccess = [
    "social-automation",
    "wordpress-seo",
    "ai-agent"
  ].includes(tool.id) || [
    "social-automation",
    "wordpress-seo",
    "ai-agent"
  ].includes(tool.name.toLowerCase().includes("social") ? "social-automation" : ""); // fallback for name checks

  const hasEarlyAccessToThisTool = isEarlyAccess && (
    isAllowedForEarlyAccess ||
    tool.name.includes("WordPress") ||
    tool.id === "wordpress-seo" ||
    tool.id === "ai-agent"
  );

  const hasAccess = isAdmin || hasEarlyAccessToThisTool || hasAccessToTool(tool.planRequired);

  // Get the referrer from URL parameter, fallback to dashboard-preview
  const referrerPath = searchParams.get("from") || "/dashboard-preview";

  const categoryColors = {
    Core: {
      bg: "bg-[#D6D7D8]/10",
      text: "text-[#D6D7D8]",
      border: "border-[#D6D7D8]/20",
    },
    Corporate: {
      bg: "bg-[#E1C37A]/10",
      text: "text-[#E1C37A]",
      border: "border-[#E1C37A]/20",
    },
  } as const;

  const planColors: Record<string, string> = {
    Starter: "#4ADE80",
    Growth: "#60A5FA",
    Enterprise: "#E1C37A",
  };

  const planColor = planColors[tool.planRequired] || "#E1C37A";

  // You can open the live app only if:
  // - you have access AND
  // - the tool actually has an appRoute defined
  const canOpenApp = hasAccess && !!tool.appRoute;

  /* ----------------------------
     CTA block, kept very defensive
  ---------------------------- */
  const renderPrimaryCta = () => {
    if (canOpenApp) {
      // ✅ Has access AND real app route → go to app
      return (
        <Link
          to={tool.appRoute as string}
          className="btn-gold px-8 py-4 rounded-full text-base font-semibold inline-flex items-center gap-2"
        >
          <Play className="w-5 h-5" />
          Open Tool
          <ArrowRight className="w-5 h-5" />
        </Link>
      );
    }

    if (!isAuthenticated) {
      // ✅ Not signed in → send to login, then back here
      return (
        <button
          onClick={() => login(window.location.href)}
          className="btn-gold px-8 py-4 rounded-full text-base font-semibold inline-flex items-center gap-2"
        >
          <LogIn className="w-5 h-5" />
          Sign In to Unlock
          <ArrowRight className="w-5 h-5" />
        </button>
      );
    }

    if (!hasAccess) {
      // ✅ Signed in but plan too low → go to Pricing
      return (
        <Link
          to="/pricing"
          className="btn-gold px-8 py-4 rounded-full text-base font-semibold inline-flex items-center gap-2"
        >
          <Lock className="w-5 h-5" />
          Unlock With {tool.planRequired}
          <ArrowRight className="w-5 h-5" />
        </Link>
      );
    }

    // ✅ Has access but no appRoute yet → just show disabled button
    return (
      <button
        className="btn-gold px-8 py-4 rounded-full text-base font-semibold inline-flex items-center gap-2 opacity-60 cursor-not-allowed"
        disabled
      >
        <Play className="w-5 h-5" />
        App Coming Soon
      </button>
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* ================= HERO ================= */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[200px]"
            style={{ backgroundColor: `${tool.color}15` }}
          />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#D6D7D8]/5 rounded-full blur-[150px]" />
        </div>

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(referrerPath)}
            className="flex items-center gap-2 text-[#A9AAAC] hover:text-[#E1C37A] transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Back</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* Category */}
            <span
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6 ${categoryColors[tool.category].bg
                } ${categoryColors[tool.category].text} ${categoryColors[tool.category].border
                } border`}
            >
              {tool.category === "Corporate" ? (
                <Sparkles className="w-3 h-3" />
              ) : (
                <Zap className="w-3 h-3" />
              )}
              {tool.category} Tool
            </span>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-8"
              style={{
                background: `linear-gradient(135deg, ${tool.color}30, ${tool.color}10)`,
                border: `1px solid ${tool.color}40`,
              }}
            >
              <tool.icon className="w-10 h-10" style={{ color: tool.color }} />
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              {tool.name}
            </h1>

            <p className="text-xl text-[#A9AAAC] mb-6 max-w-2xl mx-auto">
              {tool.shortDescription}
            </p>

            <div className="flex items-center justify-center gap-3 mb-8">
              <span
                className="px-4 py-2 rounded-full text-sm font-medium border"
                style={{
                  backgroundColor: `${planColor}15`,
                  borderColor: `${planColor}30`,
                  color: planColor,
                }}
              >
                Requires: {tool.planRequired} Plan
              </span>

              {!hasAccess && (
                <span className="flex items-center gap-1.5 text-sm text-[#5B5C60]">
                  <Lock className="w-4 h-4" />
                  Locked
                </span>
              )}
            </div>

            {/* CTA block */}
            {renderPrimaryCta()}
          </motion.div>
        </div>
      </section>

      {/* ================= DESCRIPTION ================= */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg text-[#A9AAAC] leading-relaxed"
          >
            {tool.longDescription}
          </motion.p>
        </div>
      </section>

      {/* ================= BENEFITS ================= */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <SectionHeading
            badge="Benefits"
            title="What you get."
            subtitle="Key features and advantages of this tool."
          />

          <div className="grid md:grid-cols-2 gap-4 mt-12">
            {tool.mainBenefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 p-4 glass-card rounded-xl"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${tool.color}, ${tool.color}80)`,
                  }}
                >
                  <Check className="w-4 h-4 text-[#1A1A1C]" />
                </div>
                <span className="text-[#D6D7D8]">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card-gold rounded-3xl p-8 text-center glow-gold"
          >
            <h3 className="text-2xl font-bold text-white mb-4">
              {hasAccess
                ? "You have access!"
                : `Unlock with ${tool.planRequired}`}
            </h3>

            {!hasAccess ? (
              <Link
                to="/pricing"
                className="btn-gold px-8 py-4 rounded-full font-semibold inline-flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Upgrade Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : canOpenApp ? (
              <Link
                to={tool.appRoute as string}
                className="btn-gold px-8 py-4 rounded-full font-semibold inline-flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Launch Tool
              </Link>
            ) : (
              <button
                className="btn-gold px-8 py-4 rounded-full font-semibold inline-flex items-center gap-2 opacity-60 cursor-not-allowed"
                disabled
              >
                <Play className="w-5 h-5" />
                App Coming Soon
              </button>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
