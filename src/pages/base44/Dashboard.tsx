import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Bot,
  Clock,
  Loader2,
  Lock,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Zap,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";

import { useSubscription } from "@/components/subscription/useSubscription";
import { coreTools } from "@/components/tools/toolsConfig";
import ToolGridWithHighlight from "@/components/shared/ToolGridWithHighlight";
import SubscribeModal from "@/components/shared/SubscribeModal";
import { useDashboardInsights } from "@/hooks/useDashboardInsights";

export default function Dashboard() {
  const { user, hasAccessToTool, isConfigLoading } = useSubscription();
  const [showModal, setShowModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState("");

  const baseTier = user?.base_tier || "free";
  const isPaidUser = baseTier === "early_access" || baseTier === "admin";

  const unlockedCoreCount = useMemo(() => {
    return coreTools.filter((tool) => hasAccessToTool(tool.id)).length;
  }, [hasAccessToTool]);

  const recommendedActions = [
    {
      title: "Launch Social Media Automation",
      description: "Create and schedule this week's posts in one run.",
      to: "/apps/social-automation",
      requiredToolId: "social-automation"
    },
    {
      title: "Run WordPress SEO Optimizer",
      description: "Refresh key pages and push optimized content live.",
      to: "/apps/wordpress-seo",
      requiredToolId: "wordpress-seo"
    },
    {
      title: "Open AI Agent",
      description: "Train and optimize content from your brand data.",
      to: "/apps/ai-agent",
      requiredToolId: "ai-agent"
    }
  ];

  const insightsContext = useMemo(
    () => ({
      baseTier,
      unlockedCoreCount,
      totalCoreTools: coreTools.length,
      metrics: {
        automationsRunning: "3",
        contentGenerated7d: "42",
        workflowCompletion: "81%"
      },
      recommendedActions: recommendedActions.map((action) => ({
        title: action.title,
        unlocked: hasAccessToTool(action.requiredToolId)
      }))
    }),
    [baseTier, unlockedCoreCount, hasAccessToTool]
  );

  const {
    insights,
    loading: insightsLoading,
    error: insightsError,
    lastUpdated,
    refreshInsights
  } = useDashboardInsights(isPaidUser, insightsContext);

  const handleUnlockTool = (tool: { name: string }) => {
    setSelectedTool(tool.name);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-[#E1C37A]/10 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-[#D6D7D8]/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#E1C37A] mb-3">
                Main Dashboard
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                {isPaidUser ? "Performance and workflow command center" : "Your dashboard is ready"}
              </h1>
              <p className="text-[#A9AAAC] max-w-2xl">
                {isPaidUser
                  ? "Track outcomes, run your core automations, and follow AI recommendations from one place."
                  : "Explore your automation workspace, unlock core tools, and activate paid access when you're ready."}
              </p>
            </div>

            <div className="glass-card rounded-2xl p-4 min-w-[260px]">
              <p className="text-xs text-[#5B5C60] mb-1">Current access</p>
              <p className="text-lg font-semibold capitalize text-white mb-2">{baseTier.replace("_", " ")}</p>
              <p className="text-sm text-[#A9AAAC]">
                {unlockedCoreCount} of {coreTools.length} core tools unlocked
              </p>
            </div>
          </div>
        </div>
      </section>

      {isPaidUser ? (
        <>
          <section className="py-8">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {[
                { label: "Core Tools Unlocked", value: `${unlockedCoreCount}/${coreTools.length}`, icon: Zap },
                { label: "Automations Running", value: "3", icon: Sparkles },
                { label: "Content Generated (7d)", value: "42", icon: BarChart3 },
                { label: "Workflow Completion", value: "81%", icon: TrendingUp }
              ].map((stat) => (
                <div key={stat.label} className="glass-card rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-[#5B5C60]">{stat.label}</p>
                    <stat.icon className="w-4 h-4 text-[#E1C37A]" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="py-6">
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-6">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-[#E1C37A]" />
                    <h2 className="text-xl font-semibold">Workflow Hub</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => refreshInsights(true)}
                    disabled={insightsLoading}
                    className="btn-outline px-3 py-1.5 rounded-full inline-flex items-center gap-2 text-xs disabled:opacity-60"
                  >
                    {insightsLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    Refresh Insights
                  </button>
                </div>
                <div className="space-y-3 mb-5">
                  {insightsLoading && insights.length === 0 && (
                    <>
                      <div className="p-3 rounded-xl bg-[#1A1A1C]/70 border border-[#3B3C3E]/40 text-sm text-[#A9AAAC]">
                        Generating AI insights...
                      </div>
                      <div className="p-3 rounded-xl bg-[#1A1A1C]/70 border border-[#3B3C3E]/40 text-sm text-[#A9AAAC]">
                        Pulling your latest dashboard context.
                      </div>
                    </>
                  )}
                  {insights.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#1A1A1C]/70 border border-[#3B3C3E]/40 text-sm text-[#D6D7D8]">
                      {item}
                    </div>
                  ))}
                </div>
                {insightsError && (
                  <p className="text-xs text-[#A9AAAC] mb-3">
                    AI insights temporarily unavailable. Showing fallback recommendations.
                  </p>
                )}
                {lastUpdated && (
                  <p className="text-xs text-[#5B5C60] mb-3">
                    Last updated: {new Date(lastUpdated).toLocaleString()}
                  </p>
                )}
                <Link to="/core-tools" className="btn-outline px-5 py-2.5 rounded-full inline-flex items-center gap-2 text-sm">
                  Open Core Tools
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-[#E1C37A]" />
                  <h2 className="text-xl font-semibold">Recommended Next Actions</h2>
                </div>
                <div className="space-y-3">
                  {recommendedActions.map((action) => {
                    const unlocked = hasAccessToTool(action.requiredToolId);
                    return unlocked ? (
                      <Link
                        key={action.title}
                        to={action.to}
                        className="block p-3 rounded-xl border border-[#3B3C3E]/50 hover:border-[#E1C37A]/30 transition-colors"
                      >
                        <p className="text-sm font-medium text-white">{action.title}</p>
                        <p className="text-xs text-[#A9AAAC] mt-1">{action.description}</p>
                      </Link>
                    ) : (
                      <button
                        key={action.title}
                        type="button"
                        onClick={() => {
                          setSelectedTool(action.title);
                          setShowModal(true);
                        }}
                        className="w-full text-left p-3 rounded-xl border border-[#3B3C3E]/50 hover:border-[#E1C37A]/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">{action.title}</p>
                          <Lock className="w-4 h-4 text-[#E1C37A]" />
                        </div>
                        <p className="text-xs text-[#A9AAAC] mt-1">{action.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="glass-card rounded-3xl p-8 border border-[#E1C37A]/20">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-5 h-5 text-[#E1C37A]" />
                <h2 className="text-xl font-semibold">Upgrade to unlock the full dashboard</h2>
              </div>
              <p className="text-[#A9AAAC] mb-6 max-w-3xl">
                Paid users get performance tracking, workflow recommendations, and direct access to core automation tools from this dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/pricing" className="btn-gold px-6 py-3 rounded-full inline-flex items-center justify-center gap-2">
                  View Pricing
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/dashboard-preview" className="btn-outline px-6 py-3 rounded-full inline-flex items-center justify-center gap-2">
                  See Full Preview
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold text-white">Core Tools</h2>
              <p className="text-sm text-[#A9AAAC] mt-1">
                Access here uses the same source-of-truth as the Core Tools page.
              </p>
            </div>
          </div>

          <ToolGridWithHighlight
            tools={coreTools}
            tier="Core"
            onUnlockClick={handleUnlockTool}
            isLoading={isConfigLoading}
          />
        </div>
      </section>

      <SubscribeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        toolName={selectedTool}
      />
    </div>
  );
}
