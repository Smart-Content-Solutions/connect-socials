import { verifyToken } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";

function getBearerToken(req: any): string | null {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== "string") return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

async function readJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === "object") return req.body;
  if (req.body && typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    if (chunks.length === 0) return null;
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch { return null; }
}

async function requireAuth(req: any) {
  const secretKey = process.env.CLERK_SECRET_KEY || process.env.VITE_CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("Missing CLERK_SECRET_KEY");

  const token = getBearerToken(req);
  if (!token) return { ok: false as const, status: 401, error: "Missing Authorization token" };

  const verified = await verifyToken(token, { secretKey });
  const userId = (verified?.sub as string) || null;
  if (!userId) return { ok: false as const, status: 401, error: "Invalid token" };

  return { ok: true as const, userId };
}

function getSupabase() {
  const url = process.env.VITE_SCHEDULER_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SCHEDULER_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function setCors(res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST,PUT,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization");
  res.setHeader("Content-Type", "application/json");
}

export default async function handler(req: any, res: any) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

    const { userId } = auth;
    const supabase = getSupabase();

    // ─── GET: List scheduled posts ───
    if (req.method === "GET") {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const status = url.searchParams.get("status") || "all";
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 50);

      let query = supabase
        .from("scheduled_posts")
        .select("*")
        .eq("user_id", userId)
        .order("scheduled_time", { ascending: true })
        .limit(limit);

      if (status === "pending") {
        query = query.in("status", ["scheduled", "processing"]);
      } else if (status === "history") {
        query = query
          .in("status", ["posted", "failed", "cancelled"])
          .order("updated_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ posts: data || [] });
    }

    // ─── POST: Create a scheduled post record ───
    if (req.method === "POST") {
      const body = await readJsonBody(req);
      if (!body) return res.status(400).json({ error: "Invalid JSON body" });

      const {
        caption,
        platforms,
        media_url,
        scheduled_time,
        user_timezone,
        post_type,
        payload,
      } = body;

      if (!scheduled_time) return res.status(400).json({ error: "scheduled_time is required" });
      if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
        return res.status(400).json({ error: "platforms array is required" });
      }

      const { data, error } = await supabase
        .from("scheduled_posts")
        .insert({
          user_id: userId,
          user_email: body.user_email || null,
          caption: caption || null,
          platforms,
          media_url: media_url || null,
          scheduled_time,
          user_timezone: user_timezone || null,
          post_type: post_type || "image",
          payload: payload || {},
          status: "scheduled",
        })
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({ post: data });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    console.error("[scheduled-posts] Error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
