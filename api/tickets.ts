import { clerkClient } from "@clerk/clerk-sdk-node";
import { verifyToken } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";
import { sendTicketEmailEvent } from "./utils/ticket-email";

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

  // Get user info for ticket creation
  const user = await clerkClient.users.getUser(userId);
  const primaryEmail =
    user.emailAddresses?.find((e: any) => e.id === user.primaryEmailAddressId)?.emailAddress ||
    user.emailAddresses?.[0]?.emailAddress ||
    null;
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || null;

  return { ok: true as const, userId, email: primaryEmail, name: fullName };
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

    const { userId, email, name } = auth;
    const supabase = getSupabaseServiceRole();

    // POST: Create a new ticket
    if (req.method === "POST") {
      const body = await readJsonBody(req);
      if (!body) {
        return res.status(400).json({ error: "Invalid JSON body" });
      }

      const { type, subject, description, priority = "medium", module = null } = body;

      // Validation
      if (!type || !["support", "bug", "feature"].includes(type)) {
        return res.status(400).json({ error: "Invalid or missing type (must be: support, bug, feature)" });
      }
      if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
        return res.status(400).json({ error: "Subject is required" });
      }
      if (!description || typeof description !== "string" || description.trim().length === 0) {
        return res.status(400).json({ error: "Description is required" });
      }
      if (!["low", "medium", "high", "urgent"].includes(priority)) {
        return res.status(400).json({ error: "Invalid priority" });
      }
      if (module && !["wordpress", "social", "billing", "workspace", "other"].includes(module)) {
        return res.status(400).json({ error: "Invalid module" });
      }

      const { data, error } = await supabase
        .from("tickets")
        .insert({
          created_by: userId,
          created_by_email: email,
          created_by_name: name,
          type,
          subject: subject.trim(),
          description: description.trim(),
          priority,
          module,
          status: "open",
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating ticket:", error);
        return res.status(500).json({ error: error.message || "Failed to create ticket" });
      }

      // Send email notification (fire and forget - don't block response)
      sendTicketEmailEvent("ticket_created", data).catch((err) => {
        console.error("[Tickets] Failed to send ticket_created email:", err);
      });

      return res.status(201).json({ ticket: data });
    }

    // GET: Fetch user's own tickets or single ticket by ID
    if (req.method === "GET") {
      const ticketId = req.query?.id;

      // If ticketId provided, return single ticket (only if user owns it)
      if (ticketId) {
        const { data, error } = await supabase
          .from("tickets")
          .select("*")
          .eq("id", ticketId)
          .eq("created_by", userId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return res.status(404).json({ error: "Ticket not found or unauthorized" });
          }
          console.error("Error fetching ticket:", error);
          return res.status(500).json({ error: error.message || "Failed to fetch ticket" });
        }

        return res.status(200).json({ ticket: data });
      }

      // Otherwise return all tickets
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("created_by", userId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching tickets:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch tickets" });
      }

      return res.status(200).json({ tickets: data || [] });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    console.error("tickets API error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
