import { clerkClient } from "@clerk/clerk-sdk-node";
import { verifyToken } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";
import { sendTicketEmailEvent } from "../utils/ticket-email.js";

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

async function requireAuth(req: any) {
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
    const auth = await requireAuth(req);
    if (!auth.ok) {
      return res.status(auth.status).json({ error: auth.error });
    }

    const { userId } = auth;
    const supabase = getSupabaseServiceRole();
    const ticketId = req.query?.ticketId || req.query?.id;

    if (!ticketId) {
      return res.status(400).json({ error: "Missing ticketId parameter" });
    }

    // Verify user owns the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("id, created_by")
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (ticket.created_by !== userId) {
      return res.status(403).json({ error: "Unauthorized: You can only comment on your own tickets" });
    }

    // GET: Fetch comments for the ticket
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("ticket_comments")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching comments:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch comments" });
      }

      return res.status(200).json({ comments: data || [] });
    }

    // POST: Create a new comment
    if (req.method === "POST") {
      const body = await readJsonBody(req);
      if (!body) {
        return res.status(400).json({ error: "Invalid JSON body" });
      }

      const { body: commentBody } = body;

      if (!commentBody || typeof commentBody !== "string" || commentBody.trim().length === 0) {
        return res.status(400).json({ error: "Comment body is required" });
      }

      // Insert comment with author_role='user'
      const { data: comment, error: commentError } = await supabase
        .from("ticket_comments")
        .insert({
          ticket_id: ticketId,
          author_user_id: userId,
          author_role: "user",
          body: commentBody.trim(),
        })
        .select()
        .single();

      if (commentError) {
        console.error("Error creating comment:", commentError);
        return res.status(500).json({ error: commentError.message || "Failed to create comment" });
      }

      // Update ticket status to 'open' if it was closed/resolved
      const { data: currentTicket, error: ticketFetchError } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", ticketId)
        .single();

      if (!currentTicket) {
        console.error("Error fetching ticket for update:", ticketFetchError);
      } else {
        if (["resolved", "closed"].includes(currentTicket.status)) {
          await supabase
            .from("tickets")
            .update({ status: "open", last_activity_at: new Date().toISOString() })
            .eq("id", ticketId);
          currentTicket.status = "open";
        } else {
          // Trigger already updates last_activity_at, but we'll update it explicitly to be safe
          await supabase
            .from("tickets")
            .update({ last_activity_at: new Date().toISOString() })
            .eq("id", ticketId);
        }
      }

      // Send email notification (Wait for n8n in serverless environment)
      if (currentTicket) {
        await sendTicketEmailEvent("user_replied", currentTicket, comment).catch((err) => {
          console.error("[Tickets/Comments] Failed to send user_replied email:", err);
        });
      }

      return res.status(201).json({ comment });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    console.error("tickets/comments API error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
