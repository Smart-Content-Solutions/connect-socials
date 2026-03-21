import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";

const WEBHOOK_URL = "https://n8n.smartcontentsolutions.co.uk/webhook/scs-support-chat";
const CACHE_PREFIX = "scs:dashboard-insights:v1:";
const DAY_MS = 24 * 60 * 60 * 1000;

export interface DashboardInsightsContext {
  baseTier: string;
  unlockedCoreCount: number;
  totalCoreTools: number;
  metrics: {
    automationsRunning: string;
    contentGenerated7d: string;
    workflowCompletion: string;
  };
  recommendedActions: Array<{
    title: string;
    unlocked: boolean;
  }>;
}

interface DashboardInsightsCacheRecord {
  insights: string[];
  createdAt: number;
  expiresAt: number;
  contextHash: string;
}

interface UseDashboardInsightsResult {
  insights: string[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refreshInsights: (force?: boolean) => Promise<void>;
}

function parseInsightsText(aiText: string): string[] {
  const normalized = aiText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•\d\)\.\s]+/, "").trim())
    .filter(Boolean);

  if (normalized.length >= 2) {
    return normalized.slice(0, 5);
  }

  const sentenceChunks = aiText
    .split(/[.!?]\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return sentenceChunks.slice(0, 5);
}

function getDefaultInsights(): string[] {
  return [
    "Focus on consistency this week by running your core tools at least three times.",
    "Prioritize WordPress SEO and social automation first to maintain steady output.",
    "Review your latest content performance, then run AI agent optimization on top pages."
  ];
}

export function useDashboardInsights(
  enabled: boolean,
  context: DashboardInsightsContext
): UseDashboardInsightsResult {
  const { user } = useUser();
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const userId = user?.id || "anonymous";
  const contextHash = useMemo(() => JSON.stringify(context), [context]);
  const cacheKey = `${CACHE_PREFIX}${userId}`;

  const refreshInsights = useCallback(
    async (force = false) => {
      if (!enabled) {
        setInsights([]);
        setError(null);
        setLastUpdated(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const now = Date.now();
        const cachedRaw = localStorage.getItem(cacheKey);

        if (!force && cachedRaw) {
          const cached = JSON.parse(cachedRaw) as DashboardInsightsCacheRecord;
          const cacheValid =
            Array.isArray(cached.insights) &&
            cached.insights.length > 0 &&
            cached.expiresAt > now &&
            cached.contextHash === contextHash;

          if (cacheValid) {
            setInsights(cached.insights);
            setLastUpdated(cached.createdAt);
            setLoading(false);
            return;
          }
        }

        const payload = {
          mode: "dashboard_insights",
          message:
            "Generate concise workflow insights and recommendations for this dashboard user based on the provided context.",
          user_id: user?.id || "anonymous",
          user_name: user?.fullName || "Guest",
          email: user?.emailAddresses?.[0]?.emailAddress || "",
          history: [],
          context
        };

        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Insights service unavailable (${response.status})`);
        }

        const rawText = await response.text();
        const parsed = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {};
        const aiResponseValue = parsed.response ?? parsed.output ?? parsed.text;
        const aiText = typeof aiResponseValue === "string" ? aiResponseValue.trim() : "";

        const nextInsights = aiText ? parseInsightsText(aiText) : [];
        const finalInsights = nextInsights.length > 0 ? nextInsights : getDefaultInsights();

        const record: DashboardInsightsCacheRecord = {
          insights: finalInsights,
          createdAt: now,
          expiresAt: now + DAY_MS,
          contextHash
        };

        localStorage.setItem(cacheKey, JSON.stringify(record));
        setInsights(finalInsights);
        setLastUpdated(now);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to generate AI insights.";
        setError(message);

        // Fallback: keep UX useful without triggering additional calls.
        if (insights.length === 0) {
          setInsights(getDefaultInsights());
        }
      } finally {
        setLoading(false);
      }
    },
    [enabled, cacheKey, contextHash, context, user, insights.length]
  );

  useEffect(() => {
    if (!enabled) return;
    refreshInsights(false);
  }, [enabled, refreshInsights]);

  return {
    insights,
    loading,
    error,
    lastUpdated,
    refreshInsights
  };
}

