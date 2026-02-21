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

    const normalizePost = (row: any, postType: "image" | "video") => ({
      id: row.id,
      user_id: row.user_id ?? row.user_email ?? null,
      user_email: row.user_email ?? null,
      caption: row.caption ?? null,
      platforms: row.platforms ?? [],
      media_url: row.media_url ?? null,
      scheduled_time: row.scheduled_time,
      user_timezone: row.user_timezone ?? null,
      post_type: postType,
      status: row.status ?? "scheduled",
      payload: row.payload ?? row.metadata ?? {},
      result_metadata: row.result_metadata ?? {},
      failure_reason: row.failure_reason ?? null,
      created_at: row.created_at ?? null,
      updated_at: row.updated_at ?? row.created_at ?? null,
      started_at: row.started_at ?? null,
      posted_at: row.posted_at ?? null,
      cancelled_at: row.cancelled_at ?? null,
    });

    // ─── GET: List scheduled posts ───
    if (req.method === "GET") {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const status = url.searchParams.get("status") || "all";
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 50);

      const buildQuery = (table: "scheduled_posts" | "scheduled_video_posts") => {
        let query = supabase
          .from(table)
          .select("*")
          .or(`user_id.eq.${userId},user_email.eq.${userId}`)
          .limit(limit);

        if (status === "pending") {
          query = query
            .in("status", ["scheduled", "processing"])
            .order("scheduled_time", { ascending: true });
        } else if (status === "history") {
          query = query
            .in("status", ["posted", "failed", "cancelled"])
            .order("updated_at", { ascending: false });
        } else {
          query = query.order("scheduled_time", { ascending: true });
        }

        return query;
      };

      const [images, videos] = await Promise.all([
        buildQuery("scheduled_posts"),
        buildQuery("scheduled_video_posts"),
      ]);

      if (images.error) return res.status(500).json({ error: images.error.message });
      if (videos.error) return res.status(500).json({ error: videos.error.message });

      const isVideoRow = (row: any) =>
        row?.post_type === "video" ||
        row?.media_type === "video" ||
        row?.payload?.media_type === "video" ||
        row?.metadata?.media_type === "video";

      const imagePosts = (images.data || [])
        .filter((row: any) => !isVideoRow(row))
        .map((row: any) => normalizePost(row, "image"));
      const videoPosts = (videos.data || []).map((row: any) => normalizePost(row, "video"));
      const combined = [...imagePosts, ...videoPosts];

      combined.sort((a, b) => {
        const field = status === "history" ? "updated_at" : "scheduled_time";
        const aTime = new Date(a[field] || 0).getTime();
        const bTime = new Date(b[field] || 0).getTime();
        return status === "history" ? bTime - aTime : aTime - bTime;
      });

      const buildSignature = (post: any) => {
        const platforms = Array.isArray(post.platforms)
          ? [...post.platforms].map((p: string) => p.toLowerCase()).sort().join("|")
          : "";
        return [
          post.user_id || "",
          post.caption || "",
          post.media_url || "",
          post.post_type || "",
          platforms,
        ].join("::");
      };

      const dedupeWindowMs = 2 * 60 * 1000;
      const deduped: any[] = [];
      const seen = new Map<string, number>();

      for (const post of combined) {
        const signature = buildSignature(post);
        const createdAt = new Date(post.created_at || 0).getTime();
        const existingIndex = seen.get(signature);

        if (existingIndex === undefined) {
          seen.set(signature, deduped.length);
          deduped.push(post);
          continue;
        }

        const existing = deduped[existingIndex];
        const existingCreatedAt = new Date(existing.created_at || 0).getTime();

        if (Math.abs(createdAt - existingCreatedAt) <= dedupeWindowMs) {
          const existingScheduled = new Date(existing.scheduled_time || 0).getTime();
          const incomingScheduled = new Date(post.scheduled_time || 0).getTime();
          if (incomingScheduled > existingScheduled) {
            deduped[existingIndex] = post;
          }
        } else {
          seen.set(signature, deduped.length);
          deduped.push(post);
        }
      }

      return res.status(200).json({ posts: deduped.slice(0, limit) });
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

      const targetTable = post_type === "video" ? "scheduled_video_posts" : "scheduled_posts";

      const insertPayload =
        post_type === "video"
          ? {
              user_id: userId,
              user_email: body.user_email || null,
              caption: caption || null,
              platforms,
              media_url: media_url || null,
              scheduled_time,
              user_timezone: user_timezone || null,
              status: "scheduled",
              media_type: "video",
              metadata: payload || {},
            }
          : {
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
            };

      const { data, error } = await supabase
        .from(targetTable)
        .insert(insertPayload as any)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({ post: normalizePost(data, post_type === "video" ? "video" : "image") });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    console.error("[scheduled-posts] Error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
