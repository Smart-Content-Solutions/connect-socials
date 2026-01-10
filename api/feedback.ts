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

async function requireAuth(req: any) {
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

  // Get user info for feedback creation
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
    // Only POST method supported
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const auth = await requireAuth(req);
    if (!auth.ok) {
      return res.status(auth.status).json({ error: auth.error });
    }

    const { userId, email, name } = auth;
    const supabase = getSupabaseServiceRole();

    const body = await readJsonBody(req);
    if (!body) {
      return res.status(400).json({ error: "Invalid JSON body", details: "Request body must be valid JSON" });
    }

    const { rating, category, message, pageUrl } = body;

    // Validation
    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: "Invalid or missing rating", 
        details: "Rating must be a number between 1 and 5" 
      });
    }

    if (!category || !["General", "Bug", "Feature", "Billing"].includes(category)) {
      return res.status(400).json({ 
        error: "Invalid or missing category", 
        details: "Category must be one of: General, Bug, Feature, Billing" 
      });
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ 
        error: "Message is required", 
        details: "Message cannot be empty" 
      });
    }

    // pageUrl is optional, but if provided should be a valid string
    if (pageUrl !== undefined && (typeof pageUrl !== "string" || pageUrl.trim().length === 0)) {
      return res.status(400).json({ 
        error: "Invalid pageUrl", 
        details: "pageUrl must be a non-empty string if provided" 
      });
    }

    // Insert feedback into Supabase
    const { data, error } = await supabase
      .from("feedback")
      .insert({
        rating,
        category,
        message: message.trim(),
        page_url: pageUrl ? pageUrl.trim() : null,
        user_id: userId,
        user_email: email || null, // Handle missing email gracefully
        user_name: name || null, // Handle missing name gracefully
        status: "new",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating feedback:", error);
      return res.status(500).json({ 
        error: error.message || "Failed to create feedback", 
        details: "Database error occurred" 
      });
    }

    return res.status(201).json({ feedback: data });
  } catch (err: any) {
    console.error("feedback API error:", err);
    return res.status(500).json({ 
      error: err?.message || "Internal server error", 
      details: "An unexpected error occurred" 
    });
  }
}
