import { clerkClient } from "@clerk/clerk-sdk-node";
import { verifyToken } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";
import { sendFeedbackNotification } from "./utils/feedback-notifications.js";

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
  // Set CORS headers for production
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization");
  res.setHeader("Content-Type", "application/json");

  // Handle OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    console.log("[Feedback API] Request received:", req.method);

    if (req.method !== "POST") {
      console.log("[Feedback API] Method not allowed:", req.method);
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Check environment variables
    console.log("[Feedback API] Checking environment variables...");
    const hasClerkKey = !!(process.env.CLERK_SECRET_KEY || process.env.VITE_CLERK_SECRET_KEY);
    const hasSupabaseUrl = !!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
    const hasSupabaseKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

    console.log("[Feedback API] Environment check:", { hasClerkKey, hasSupabaseUrl, hasSupabaseKey });

    if (!hasClerkKey) {
      console.error("[Feedback API] Missing Clerk secret key");
      return res.status(500).json({ error: "Server configuration error: Missing authentication key" });
    }

    if (!hasSupabaseUrl || !hasSupabaseKey) {
      console.error("[Feedback API] Missing Supabase credentials");
      return res.status(500).json({ error: "Server configuration error: Missing database credentials" });
    }

    console.log("[Feedback API] Authenticating user...");
    const auth = await requireAuth(req);
    if (!auth.ok) {
      console.log("[Feedback API] Authentication failed:", auth.error);
      return res.status(auth.status).json({ error: auth.error });
    }

    const { userId, email, name } = auth;
    console.log("[Feedback API] User authenticated:", { userId, email, name });

    console.log("[Feedback API] Initializing Supabase client...");
    const supabase = getSupabaseServiceRole();

    console.log("[Feedback API] Reading request body...");
    const body = await readJsonBody(req);
    if (!body) {
      console.log("[Feedback API] Invalid JSON body");
      return res.status(400).json({ error: "Invalid JSON body", details: "Request body must be valid JSON" });
    }

    const { rating, category, message, pageUrl } = body;
    console.log("[Feedback API] Request data:", { rating, category, messageLength: message?.length, pageUrl });

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      console.log("[Feedback API] Invalid rating:", rating);
      return res.status(400).json({
        error: "Invalid or missing rating",
        details: "Rating must be a number between 1 and 5"
      });
    }

    if (!category || !["General", "Bug", "Feature", "Billing"].includes(category)) {
      console.log("[Feedback API] Invalid category:", category);
      return res.status(400).json({
        error: "Invalid or missing category",
        details: "Category must be one of: General, Bug, Feature, Billing"
      });
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      console.log("[Feedback API] Invalid message");
      return res.status(400).json({
        error: "Message is required",
        details: "Message cannot be empty"
      });
    }

    // pageUrl is optional, but if provided should be a valid string
    if (pageUrl !== undefined && (typeof pageUrl !== "string" || pageUrl.trim().length === 0)) {
      console.log("[Feedback API] Invalid pageUrl:", pageUrl);
      return res.status(400).json({
        error: "Invalid pageUrl",
        details: "pageUrl must be a non-empty string if provided"
      });
    }

    // Insert feedback into Supabase
    console.log("[Feedback API] Inserting feedback into database...");
    const { data, error } = await supabase
      .from("feedback")
      .insert({
        rating,
        category,
        message: message.trim(),
        page_url: pageUrl ? pageUrl.trim() : null,
        user_id: userId,
        user_email: email || null,
        user_name: name || null,
        status: "new",
      })
      .select()
      .single();

    if (error) {
      console.error("[Feedback API] Database error:", error);
      return res.status(500).json({
        error: error.message || "Failed to create feedback",
        details: "Database error occurred",
        code: error.code
      });
    }

    console.log("[Feedback API] Feedback created successfully:", data?.id);

    // Send notification (await to ensure execution in serverless environment)
    try {
      await sendFeedbackNotification(data);
    } catch (err) {
      console.error("[Feedback] Failed to send notification:", err);
    }

    return res.status(201).json({ feedback: data });
  } catch (err: any) {
    console.error("[Feedback API] Unexpected error:", err);
    console.error("[Feedback API] Error stack:", err?.stack);
    return res.status(500).json({
      error: err?.message || "Internal server error",
      details: "An unexpected error occurred",
      stack: process.env.NODE_ENV === "development" ? err?.stack : undefined
    });
  }
}
