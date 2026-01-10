import { clerkClient } from "@clerk/clerk-sdk-node";
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
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("Missing CLERK_SECRET_KEY");

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
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)");
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
    const feedbackId = req.query?.id;

    // GET: Fetch all feedback or single feedback by ID (admin only)
    if (req.method === "GET") {
      // If feedbackId provided, return single feedback
      if (feedbackId) {
        const { data, error } = await supabase
          .from("feedback")
          .select("*")
          .eq("id", feedbackId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return res.status(404).json({ error: "Feedback not found" });
          }
          console.error("Error fetching feedback:", error);
          return res.status(500).json({ 
            error: error.message || "Failed to fetch feedback", 
            details: "Database error occurred" 
          });
        }

        return res.status(200).json({ feedback: data });
      }

      // Otherwise return all feedback with optional filtering
      const status = req.query?.status;
      const searchQuery = req.query?.q;
      const limit = parseInt(req.query?.limit || "50", 10);

      // Validate limit
      if (isNaN(limit) || limit < 1 || limit > 500) {
        return res.status(400).json({ 
          error: "Invalid limit", 
          details: "Limit must be a number between 1 and 500" 
        });
      }

      // Validate status if provided
      if (status && !["new", "reviewed", "actioned"].includes(status)) {
        return res.status(400).json({ 
          error: "Invalid status", 
          details: "Status must be one of: new, reviewed, actioned" 
        });
      }

      // Build query
      let query = supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      // Apply status filter if provided
      if (status) {
        query = query.eq("status", status);
      }

      // Apply search filter if provided (search over message, user_name, user_email, page_url)
      if (searchQuery && typeof searchQuery === "string" && searchQuery.trim().length > 0) {
        const search = `%${searchQuery.trim()}%`;
        // Supabase PostgREST OR syntax for case-insensitive search across multiple columns
        query = query.or(
          `message.ilike.${search},user_name.ilike.${search},user_email.ilike.${search},page_url.ilike.${search}`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching feedback:", error);
        return res.status(500).json({ 
          error: error.message || "Failed to fetch feedback", 
          details: "Database error occurred" 
        });
      }

      return res.status(200).json({ feedback: data || [] });
    }

    // PATCH: Update feedback (admin only)
    if (req.method === "PATCH") {
      if (!feedbackId) {
        return res.status(400).json({ error: "Missing feedback ID", details: "ID query parameter is required" });
      }

      const body = await readJsonBody(req);
      if (!body) {
        return res.status(400).json({ error: "Invalid JSON body", details: "Request body must be valid JSON" });
      }

      const { status, adminNotes } = body;
      const updates: any = {};

      // Validate and set status if provided
      if (status !== undefined) {
        if (!["new", "reviewed", "actioned"].includes(status)) {
          return res.status(400).json({ 
            error: "Invalid status", 
            details: "Status must be one of: new, reviewed, actioned" 
          });
        }
        updates.status = status;
      }

      // Validate and set admin_notes if provided
      if (adminNotes !== undefined) {
        if (typeof adminNotes !== "string") {
          return res.status(400).json({ 
            error: "Invalid adminNotes", 
            details: "adminNotes must be a string" 
          });
        }
        // Allow null/empty string to clear notes
        updates.admin_notes = adminNotes.trim() || null;
      }

      // Check if there are any valid updates
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ 
          error: "No valid fields to update", 
          details: "Must provide at least one of: status, adminNotes" 
        });
      }

      // Update feedback
      const { data, error } = await supabase
        .from("feedback")
        .update(updates)
        .eq("id", feedbackId)
        .select()
        .single();

      if (error) {
        console.error("Error updating feedback:", error);
        if (error.code === "PGRST116") {
          return res.status(404).json({ error: "Feedback not found" });
        }
        return res.status(500).json({ 
          error: error.message || "Failed to update feedback", 
          details: "Database error occurred" 
        });
      }

      return res.status(200).json({ feedback: data });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    console.error("admin/feedback API error:", err);
    return res.status(500).json({ 
      error: err?.message || "Internal server error", 
      details: "An unexpected error occurred" 
    });
  }
}
