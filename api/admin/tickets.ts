import { clerkClient } from "@clerk/clerk-sdk-node";
import { verifyToken } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";
import { sendTicketEmailEvent } from "../utils/ticket-email";

function getBearerToken(req: any): string | null {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== "string") return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

async function readJsonBody(req: any): Promise<any> {
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
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    if (chunks.length === 0) return null;
    const text = Buffer.concat(chunks).toString("utf8");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function requireAdmin(req: any) {
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
  const role = (user.publicMetadata as any)?.role;

  if (role !== "admin") {
    return { ok: false as const, status: 403, error: "Admins only" };
  }

  return { ok: true as const, userId };
}

function getSupabaseServiceRole() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

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

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return res.status(auth.status).json({ error: auth.error });
    }

    const supabase = getSupabaseServiceRole();
    // Get ticket ID from query parameter
    const ticketId = req.query?.id;

    // GET: Fetch all tickets or single ticket with comments (admin only)
    if (req.method === "GET") {
      // If ticketId provided, return single ticket with comments
      if (ticketId) {
        const { data: ticket, error: ticketError } = await supabase
          .from("tickets")
          .select("*")
          .eq("id", ticketId)
          .single();

        if (ticketError) {
          if (ticketError.code === "PGRST116") {
            return res.status(404).json({ error: "Ticket not found" });
          }
          console.error("Error fetching ticket:", ticketError);
          return res.status(500).json({ error: ticketError.message || "Failed to fetch ticket" });
        }

        // Fetch comments for this ticket
        const { data: comments, error: commentsError } = await supabase
          .from("ticket_comments")
          .select("*")
          .eq("ticket_id", ticketId)
          .order("created_at", { ascending: true });

        if (commentsError) {
          console.error("Error fetching comments:", commentsError);
          // Continue even if comments fail to fetch
        }

        return res.status(200).json({
          ticket,
          comments: comments || [],
        });
      }

      // Otherwise return all tickets
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching tickets:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch tickets" });
      }

      return res.status(200).json({ tickets: data || [] });
    }

    // PATCH: Update ticket (admin only)
    if (req.method === "PATCH") {
      if (!ticketId) {
        return res.status(400).json({ error: "Missing ticket ID" });
      }

      const body = await readJsonBody(req);
      if (!body) {
        return res.status(400).json({ error: "Invalid JSON body" });
      }

      const { status, priority, module, assignedToUserId, assignedToEmail, assignedToName } = body;
      const updates: any = {};

      if (status) {
        if (!["open", "in_progress", "waiting_on_customer", "resolved", "closed"].includes(status)) {
          return res.status(400).json({ error: "Invalid status" });
        }
        updates.status = status;
      }

      if (priority) {
        if (!["low", "medium", "high", "urgent"].includes(priority)) {
          return res.status(400).json({ error: "Invalid priority" });
        }
        updates.priority = priority;
      }

      if (module !== undefined) {
        if (module === null) {
          updates.module = null;
        } else if (!["wordpress", "social", "billing", "workspace", "other"].includes(module)) {
          return res.status(400).json({ error: "Invalid module" });
        } else {
          updates.module = module;
        }
      }

      // Handle assignment - if null/empty string, unassign; otherwise assign
      const isAssignmentUpdate = assignedToUserId !== undefined;
      if (isAssignmentUpdate) {
        if (assignedToUserId === null || assignedToUserId === "") {
          // Unassign
          updates.assigned_to_user_id = null;
          updates.assigned_to_email = null;
          updates.assigned_to_name = null;
          updates.assigned_at = null;
        } else {
          // Assign
          if (!assignedToEmail || !assignedToName) {
            return res.status(400).json({ error: "assignedToEmail and assignedToName are required when assigning" });
          }
          updates.assigned_to_user_id = assignedToUserId;
          updates.assigned_to_email = assignedToEmail;
          updates.assigned_to_name = assignedToName;
          updates.assigned_at = new Date().toISOString();
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      // Update will trigger the trigger to update updated_at and last_activity_at
      const { data, error } = await supabase
        .from("tickets")
        .update(updates)
        .eq("id", ticketId)
        .select()
        .single();

      if (error) {
        console.error("Error updating ticket:", error);
        if (error.code === "PGRST116") {
          return res.status(404).json({ error: "Ticket not found" });
        }
        return res.status(500).json({ error: error.message || "Failed to update ticket" });
      }

      // Send email notification for assignment changes (only when assigning, not unassigning)
      if (isAssignmentUpdate && data.assigned_to_user_id && data.assigned_to_email) {
        // Fire and forget - don't wait for email
        sendTicketEmailEvent("ticket_assigned", data).catch((err) => {
          console.error("[Admin Tickets] Failed to send assignment email:", err);
        });
      }

      return res.status(200).json({ ticket: data });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    console.error("admin/tickets API error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
