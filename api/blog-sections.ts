import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { verifyToken } from "@clerk/backend";
import { clerkClient } from "@clerk/clerk-sdk-node";

const SETTINGS_KEY = "blog_section_assignments";

type SectionType = "our" | "client";
type AssignmentMap = Record<string, SectionType>;

const DEFAULT_VALUE = {
  assignments: {} as AssignmentMap,
};

function getBearerToken(req: any): string | null {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== "string") return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

async function requireAdmin(req: any) {
  const secretKey =
    process.env.CLERK_SECRET_KEY || process.env.VITE_CLERK_SECRET_KEY;
  if (!secretKey) {
    return { ok: false as const, status: 500, error: "Missing CLERK_SECRET_KEY" };
  }

  const token = getBearerToken(req);
  if (!token) {
    return {
      ok: false as const,
      status: 401,
      error: "Missing Authorization token",
    };
  }

  try {
    const verified = await verifyToken(token, { secretKey });
    const userId = (verified?.sub as string) || null;
    if (!userId) {
      return { ok: false as const, status: 401, error: "Invalid token" };
    }

    const user = await clerkClient.users.getUser(userId);
    const role = (user.publicMetadata as any)?.role;
    const baseTier = (user.publicMetadata as any)?.base_tier;

    if (role !== "admin" && baseTier !== "admin") {
      return { ok: false as const, status: 403, error: "Admins only" };
    }

    return { ok: true as const, userId };
  } catch {
    return { ok: false as const, status: 401, error: "Invalid token" };
  }
}

function readJsonBody(req: any): any {
  if (req.body && typeof req.body === "object") return req.body;
  if (req.body && typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return null;
}

function sanitizeAssignments(value: unknown): AssignmentMap {
  if (!value || typeof value !== "object") {
    return {};
  }

  const assignments = (value as any).assignments;
  if (!assignments || typeof assignments !== "object") {
    return {};
  }

  const cleaned: AssignmentMap = {};
  for (const [postId, section] of Object.entries(assignments)) {
    if ((section === "our" || section === "client") && /^\d+$/.test(postId)) {
      cleaned[postId] = section;
    }
  }
  return cleaned;
}

function getSupabaseServiceRole(): SupabaseClient {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.SUPABASE_SCS_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SCS_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Server misconfiguration: missing Supabase credentials");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  let supabase: SupabaseClient;
  try {
    supabase = getSupabaseServiceRole();
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Server misconfiguration" });
  }

  if (req.method === "GET") {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", SETTINGS_KEY)
        .maybeSingle();

      if (error) {
        return res.status(500).json({ error: "Failed to fetch blog sections" });
      }

      const assignments = sanitizeAssignments(data?.value);
      return res.status(200).json({ assignments });
    } catch {
      return res.status(200).json(DEFAULT_VALUE);
    }
  }

  if (req.method === "POST") {
    try {
      const auth = await requireAdmin(req);
      if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

      const body = readJsonBody(req);
      if (!body || typeof body !== "object") {
        return res.status(400).json({ error: "Invalid JSON body" });
      }

      const assignments = sanitizeAssignments(body);
      if (Object.keys(assignments).length > 1000) {
        return res.status(400).json({ error: "Too many assignments" });
      }

      const { error } = await supabase.from("app_settings").upsert(
        {
          key: SETTINGS_KEY,
          value: { assignments },
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "key",
        }
      );

      if (error) {
        return res
          .status(500)
          .json({ error: `Failed to save blog sections: ${error.message}` });
      }

      return res.status(200).json({ success: true, assignments });
    } catch (err: any) {
      return res
        .status(500)
        .json({ error: err?.message || "Unexpected server error while saving" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
