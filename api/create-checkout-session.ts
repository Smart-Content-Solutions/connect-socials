import Stripe from "stripe";
import { verifyToken, createClerkClient } from "@clerk/backend";

function getBearerToken(req: any): string | null {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== "string") return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

// Clerk session cookie fallback (common in some deployments)
function getClerkSessionCookie(req: any): string | null {
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader || typeof cookieHeader !== "string") return null;

  // Typical Clerk cookie name
  const match = cookieHeader.match(/(?:^|;\s*)__session=([^;]+)/);
  if (!match) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function getOrigin(req: any): string {
  return (
    req.headers?.origin ||
    req.headers?.Origin ||
    (req.headers?.host ? `https://${req.headers.host}` : "") ||
    ""
  );
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_EARLY_ACCESS_PRICE_ID;
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;

    if (!stripeSecretKey) {
      return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY" });
    }
    if (!priceId) {
      return res.status(500).json({ error: "Missing STRIPE_EARLY_ACCESS_PRICE_ID" });
    }
    if (!clerkSecretKey) {
      return res.status(500).json({ error: "Missing CLERK_SECRET_KEY" });
    }

    // Accept either Bearer token or Clerk __session cookie
    const token = getBearerToken(req) || getClerkSessionCookie(req);

    if (!token) {
      return res.status(401).json({
        error: "Missing Authorization token",
        debug: {
          hasAuthHeader: Boolean(req.headers?.authorization || req.headers?.Authorization),
          hasCookieHeader: Boolean(req.headers?.cookie),
        },
      });
    }

    const verified = await verifyToken(token, { secretKey: clerkSecretKey });
    const clerkUserId = (verified?.sub as string) || null;

    if (!clerkUserId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const clerkClient = createClerkClient({ secretKey: clerkSecretKey });

    // Check if user has already used their trial
    let hasUsedTrial = false;
    try {
      const user = await clerkClient.users.getUser(clerkUserId);
      hasUsedTrial = (user.publicMetadata as any)?.hasUsedTrial === true;
      console.log(`User ${clerkUserId} trial status: used=${hasUsedTrial}`);
    } catch (err) {
      console.error("Failed to fetch user metadata for trial check:", err);
      // Fallback: If we can't check, we default to whatever is safer. 
      // safer = no trial? or safer = trial? 
      // Let's assume false to not block legitimate users if clerk fails, 
      // but log it.
    }

    console.log("Creating checkout session for Clerk user:", clerkUserId, "price:", priceId);

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    const origin = getOrigin(req);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: clerkUserId,
      line_items: [{ price: priceId, quantity: 1 }],

      subscription_data: {
        // Only give trial if they haven't used it
        trial_period_days: hasUsedTrial ? undefined : 3,
        metadata: {
          clerkUserId,
          plan: "early_access",
        },
      },

      metadata: {
        clerkUserId,
        plan: "early_access",
      },

      success_url: `${origin}/success`,
      cancel_url: `${origin}/cancel`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe error:", error);
    return res.status(400).json({ error: error.message });
  }
}
