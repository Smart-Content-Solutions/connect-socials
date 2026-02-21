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
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
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

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

    const { userId } = auth;
    const supabase = getSupabase();

    const body = await readJsonBody(req);
    if (!body) return res.status(400).json({ error: "Invalid JSON body" });

    const { id, action, scheduled_time } = body;
    if (!id) return res.status(400).json({ error: "id is required" });
    if (!action) return res.status(400).json({ error: "action is required" });

    // Verify ownership
    const { data: post, error: fetchError } = await supabase
      .from("scheduled_posts")
      .select("id, status, user_id")
      .eq("id", id)
      .single();

    if (fetchError || !post) return res.status(404).json({ error: "Scheduled post not found" });
    if (post.user_id !== userId) return res.status(403).json({ error: "Forbidden" });

    // ─── CANCEL ───
    if (action === "cancel") {
      if (!["scheduled", "processing"].includes(post.status)) {
        return res.status(400).json({ error: `Cannot cancel a post with status "${post.status}"` });
      }

      const { data, error } = await supabase
        .from("scheduled_posts")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ post: data });
    }

    // ─── RETRY ───
    if (action === "retry") {
      if (post.status !== "failed") {
        return res.status(400).json({ error: `Cannot retry a post with status "${post.status}"` });
      }

      const { data, error } = await supabase
        .from("scheduled_posts")
        .update({
          status: "scheduled",
          failure_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ post: data });
    }

    // ─── RESCHEDULE ───
    if (action === "reschedule") {
      if (!scheduled_time) return res.status(400).json({ error: "scheduled_time is required for reschedule" });
      if (!["scheduled", "failed"].includes(post.status)) {
        return res.status(400).json({ error: `Cannot reschedule a post with status "${post.status}"` });
      }

      const { data, error } = await supabase
        .from("scheduled_posts")
        .update({
          scheduled_time,
          status: "scheduled",
          failure_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ post: data });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err: any) {
    console.error("[scheduled-posts-action] Error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
