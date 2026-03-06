import { clerkClient } from "@clerk/clerk-sdk-node";
import { verifyToken } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";

interface RequestLike {
  method?: string;
  headers?: Record<string, string | undefined>;
  body?: unknown;
  query?: Record<string, string | undefined>;
}

interface ResponseLike {
  setHeader(name: string, value: string): void;
  status(code: number): { json: (body: unknown) => void; end?: () => void };
}

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  entity_type: "ticket" | "feedback";
  entity_id: string;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

function getBearerToken(req: RequestLike): string | null {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== "string") return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

async function readJsonBody(req: RequestLike): Promise<unknown> {
  if (req.body && typeof req.body === "object") return req.body;
  if (req.body && typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req as AsyncIterable<Buffer | Uint8Array | string>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    if (chunks.length === 0) return null;
    const text = Buffer.concat(chunks).toString("utf8");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function requireAdmin(req: RequestLike) {
  const secretKey = process.env.CLERK_SECRET_KEY || process.env.VITE_CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("Missing CLERK_SECRET_KEY or VITE_CLERK_SECRET_KEY");

  const token = getBearerToken(req);
  if (!token) {
    return { ok: false as const, status: 401, error: "Missing Authorization token" };
  }

  const verified = await verifyToken(token, { secretKey });
  const userId = (verified?.sub as string) || null;
  if (!userId) {
    return { ok: false as const, status: 401, error: "Invalid token" };
  }

  const user = await clerkClient.users.getUser(userId);
  const metadata = (user.publicMetadata || {}) as { role?: string; base_tier?: string };
  const role = metadata.role;
  const baseTier = metadata.base_tier;

  if (role !== "admin" && role !== "staff" && baseTier !== "admin" && baseTier !== "staff") {
    return { ok: false as const, status: 403, error: "Admins or staff only" };
  }

  return { ok: true as const, userId };
}

function getSupabaseServiceRole() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables (URL or KEY)");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function mapNotificationRow(row: NotificationRow) {
  const targetPath = row.entity_type === "ticket" ? `/admin/tickets/${row.entity_id}` : "/admin/feedback";
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: row.metadata || {},
    isRead: row.is_read,
    readAt: row.read_at,
    createdAt: row.created_at,
    targetPath,
  };
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  res.setHeader("Content-Type", "application/json");

  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return res.status(auth.status).json({ error: auth.error });
    }

    const supabase = getSupabaseServiceRole();
    const { userId } = auth;

    if (req.method === "GET") {
      const limit = Math.min(Math.max(parseInt(req.query?.limit || "20", 10) || 20, 1), 100);

      const [{ data: rows, error: listError }, { count: unreadCount, error: unreadError }] = await Promise.all([
        supabase
          .from("admin_notifications")
          .select("*")
          .eq("recipient_user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("admin_notifications")
          .select("id", { count: "exact", head: true })
          .eq("recipient_user_id", userId)
          .eq("is_read", false),
      ]);

      if (listError) {
        return res.status(500).json({ error: listError.message || "Failed to fetch notifications" });
      }
      if (unreadError) {
        return res.status(500).json({ error: unreadError.message || "Failed to fetch unread count" });
      }

      return res.status(200).json({
        notifications: (rows || []).map(mapNotificationRow),
        unreadCount: unreadCount || 0,
      });
    }

    if (req.method === "PATCH") {
      const body = await readJsonBody(req);
      if (!body) {
        return res.status(400).json({ error: "Invalid JSON body" });
      }

      const markAll = typeof (body as { markAll?: unknown }).markAll === "boolean"
        ? Boolean((body as { markAll?: unknown }).markAll)
        : false;
      const notificationIds = Array.isArray((body as { notificationIds?: unknown }).notificationIds)
        ? ((body as { notificationIds?: string[] }).notificationIds as string[])
        : undefined;

      let updateQuery = supabase
        .from("admin_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("recipient_user_id", userId)
        .eq("is_read", false);

      if (!markAll) {
        if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
          return res.status(400).json({ error: "notificationIds is required when markAll is false" });
        }
        updateQuery = updateQuery.in("id", notificationIds);
      }

      const { error: updateError } = await updateQuery;
      if (updateError) {
        return res.status(500).json({ error: updateError.message || "Failed to update notifications" });
      }

      const { count: unreadCount, error: unreadError } = await supabase
        .from("admin_notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_user_id", userId)
        .eq("is_read", false);

      if (unreadError) {
        return res.status(500).json({ error: unreadError.message || "Failed to fetch unread count" });
      }

      return res.status(200).json({ success: true, unreadCount: unreadCount || 0 });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: unknown) {
    console.error("admin/notifications API error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}
