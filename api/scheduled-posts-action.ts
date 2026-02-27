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

    const fetchPost = async (table: "scheduled_posts" | "scheduled_video_posts") => {
      const { data, error } = await supabase
        .from(table)
        .select("id, status, user_id, user_email, user_timezone")
        .eq("id", id)
        .single();
      return { data, error, table };
    };

    const imageResult = await fetchPost("scheduled_posts");
    const videoResult = imageResult.data ? null : await fetchPost("scheduled_video_posts");
    const post = imageResult.data || videoResult?.data;
    const table = imageResult.data ? "scheduled_posts" : videoResult?.data ? "scheduled_video_posts" : null;

    if (!post || !table) return res.status(404).json({ error: "Scheduled post not found" });
    const ownerId = post.user_id || post.user_email;
    if (ownerId !== userId) return res.status(403).json({ error: "Forbidden" });

    // ─── CANCEL ───
    if (action === "cancel") {
      if (!["scheduled", "processing"].includes(post.status)) {
        return res.status(400).json({ error: `Cannot cancel a post with status "${post.status}"` });
      }

      const { data, error } = await supabase
        .from(table)
        .update({
          status: "cancelled",
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
        .from(table)
        .update({
          status: "scheduled",
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

      let normalizedTime = scheduled_time;
      const userTz = post.user_timezone || "UTC";

      // If the time doesn't look like an ISO string with offset/UTC, normalize it
      if (typeof scheduled_time === "string" && !scheduled_time.includes("Z") && !scheduled_time.includes("+")) {
        try {
          const timeStr = scheduled_time.replace("T", " ").replace("Z", "").trim();
          const [datePart, timePart] = timeStr.split(" ");
          const [year, month, day] = datePart.split("-").map(Number);
          const [hour, minute, second = 0] = (timePart || "00:00:00").split(":").map(Number);

          const testDate = new Date();
          const userFormatter = new Intl.DateTimeFormat("en-US", {
            timeZone: userTz,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
            timeZoneName: "longOffset",
          });

          const userDateStr = userFormatter.format(testDate);
          const offsetMatch = userDateStr.match(/GMT([+-])(\d{1,2}):(\d{2})/);
          let offsetMinutes = 0;
          if (offsetMatch) {
            const sign = offsetMatch[1] === "+" ? 1 : -1;
            const hours = parseInt(offsetMatch[2]);
            const mins = parseInt(offsetMatch[3]);
            offsetMinutes = sign * (hours * 60 + mins);
          }

          const localTimestamp = Date.UTC(year, month - 1, day, hour, minute, second);
          const utcTimestamp = localTimestamp - offsetMinutes * 60 * 1000;
          normalizedTime = new Date(utcTimestamp).toISOString();
        } catch (e) {
          console.error("Reschedule normalization failed:", e);
        }
      }

      const { data, error } = await supabase
        .from(table)
        .update({
          scheduled_time: normalizedTime,
          status: "scheduled",
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
