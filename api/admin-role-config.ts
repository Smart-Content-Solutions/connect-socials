/**
 * Admin Role Config API - PRODUCTION READY
 * 
 * This endpoint uses Supabase for persistence.
 * File system storage has been deprecated.
 * 
 * GET /api/admin-role-config - Get current config (public)
 * POST /api/admin-role-config - Update config (admin only)
 */

import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "@clerk/backend";
import { clerkClient } from "@clerk/clerk-sdk-node";

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
}

const supabase = createClient(
  supabaseUrl || "",
  supabaseServiceKey || ""
);

const CONFIG_KEY = "role_config";

// Helper to get bearer token
function getBearerToken(req: any): string | null {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== "string") return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

// Helper to verify admin access
async function requireAdmin(req: any) {
  const secretKey = process.env.CLERK_SECRET_KEY || process.env.VITE_CLERK_SECRET_KEY;
  if (!secretKey) return { ok: false, status: 500, error: "Missing CLERK_SECRET_KEY" };

  const token = getBearerToken(req);
  if (!token) return { ok: false, status: 401, error: "Missing Authorization token" };

  try {
    const verified = await verifyToken(token, { secretKey });
    const userId = (verified?.sub as string) || null;
    if (!userId) return { ok: false, status: 401, error: "Invalid token" };

    const user = await clerkClient.users.getUser(userId);
    const role = (user.publicMetadata as any)?.role;
    const baseTier = (user.publicMetadata as any)?.base_tier;

    if (role !== "admin" && baseTier !== "admin") {
      return { ok: false, status: 403, error: "Admins only" };
    }

    return { ok: true, userId };
  } catch (err) {
    return { ok: false, status: 401, error: "Invalid token" };
  }
}

// Helper to read JSON body
async function readJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === "object") return req.body;
  if (req.body && typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  return null;
}

// Default role config
const DEFAULT_CONFIG = {
  mainRoles: [
    {
      id: "admin",
      name: "Admin",
      description: "Full access to everything. System administrator role.",
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      borderColor: "border-purple-500/30",
      icon: "Crown",
      priority: 100,
      toolIds: ["*"],
      isSystem: true,
    },
    {
      id: "early_access",
      name: "Early Access",
      description: "Early adopter access with premium tool grants.",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-500/30",
      icon: "Star",
      priority: 30,
      toolIds: [
        "social-automation",
        "wordpress-seo",
        "ai-agent",
        "email-engine",
        "content-engine",
      ],
      isSystem: true,
    },
    {
      id: "pro",
      name: "Pro",
      description: "Professional tier with core tool access.",
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-500/30",
      icon: "Shield",
      priority: 20,
      toolIds: ["social-automation", "wordpress-seo"],
      isSystem: true,
    },
    {
      id: "free",
      name: "Free",
      description: "Free tier with limited access.",
      color: "text-gray-400",
      bgColor: "bg-gray-500/20",
      borderColor: "border-gray-500/30",
      icon: "User",
      priority: 0,
      toolIds: [],
      isSystem: true,
    },
  ],
  addOnRoles: [
    {
      id: "social_automation",
      name: "Social Automation",
      description: "Grants access to social media posting and scheduling tools.",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20",
      borderColor: "border-emerald-500/30",
      icon: "Share2",
      toolIds: ["social-automation"],
    },
    {
      id: "wp_ai_agent",
      name: "WordPress AI Agent",
      description: "Grants access to WordPress SEO and AI optimization tools.",
      color: "text-sky-400",
      bgColor: "bg-sky-500/20",
      borderColor: "border-sky-500/30",
      icon: "Globe",
      toolIds: ["wordpress-seo"],
    },
    {
      id: "ai_agent",
      name: "AI Agent",
      description: "Grants access to the AI agent training and optimization tool.",
      color: "text-violet-400",
      bgColor: "bg-violet-500/20",
      borderColor: "border-violet-500/30",
      icon: "Brain",
      toolIds: ["ai-agent"],
    },
    {
      id: "ai_video",
      name: "AI Video Generation",
      description: "Grants access to AI-powered video generation tools.",
      color: "text-pink-400",
      bgColor: "bg-pink-500/20",
      borderColor: "border-pink-500/30",
      icon: "Video",
      toolIds: [],
    },
  ],
  version: 1,
};

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  // GET: Fetch config (publicly accessible)
  if (req.method === "GET") {
    try {
      // Try to fetch from Supabase
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", CONFIG_KEY)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error("Error fetching role config from Supabase:", error);
        // Return default config on error
        return res.status(200).json(DEFAULT_CONFIG);
      }

      if (data?.value) {
        return res.status(200).json(data.value);
      }

      // If no config exists, return defaults
      return res.status(200).json(DEFAULT_CONFIG);
    } catch (err) {
      console.error("Error in GET /api/admin-role-config:", err);
      return res.status(200).json(DEFAULT_CONFIG);
    }
  }

  // POST: Update config (Admin only)
  if (req.method === "POST") {
    const auth = await requireAdmin(req);
    if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

    const body = await readJsonBody(req);
    if (!body) return res.status(400).json({ error: "Invalid JSON body" });

    // Basic validation
    if (!body.mainRoles || !Array.isArray(body.mainRoles)) {
      return res.status(400).json({ error: "Invalid config: mainRoles must be an array" });
    }

    if (!body.addOnRoles || !Array.isArray(body.addOnRoles)) {
      return res.status(400).json({ error: "Invalid config: addOnRoles must be an array" });
    }

    try {
      // Save to Supabase
      const { error } = await supabase
        .from("app_settings")
        .upsert(
          {
            key: CONFIG_KEY,
            value: body,
            updated_at: new Date().toISOString(),
            updated_by: auth.userId,
          },
          {
            onConflict: "key",
          }
        );

      if (error) {
        console.error("Error saving role config to Supabase:", error);
        return res.status(500).json({ error: "Failed to save config: " + error.message });
      }

      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.error("Error saving role config:", err);
      return res.status(500).json({ error: "Failed to save config: " + err?.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
