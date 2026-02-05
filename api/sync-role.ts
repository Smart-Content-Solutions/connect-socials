import Stripe from "stripe";
import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

/**
 * API Endpoint to manually sync role after successful payment.
 * This includes enhanced logging to diagnose localhost issues.
 */

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

export default async function handler(req: any, res: any) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const body = await readJsonBody(req);
        const { sessionId, userId } = body;

        console.log(`[Sync] Request received for Session: ${sessionId}, User: ${userId}`);

        if (!sessionId || !userId) {
            return res.status(400).json({ error: "Missing sessionId or userId" });
        }

        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            console.error("[Sync] Stripe not configured");
            return res.status(500).json({ error: "Stripe not configured" });
        }

        const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

        // Retrieve the session
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        console.log(`[Sync] Stripe Session Status: payment_status=${session.payment_status}, mode=${session.mode}`);

        // Verify payment
        const isValidPayment = session.payment_status === "paid" || session.payment_status === "no_payment_required";

        if (!isValidPayment) {
            console.warn(`[Sync] Payment incomplete. Status: ${session.payment_status}`);
            return res.status(400).json({ error: `Payment incomplete: ${session.payment_status}` });
        }

        // Verify user ownership
        // Check metadata first, then client_reference_id
        const attachedUserId = session.metadata?.clerkUserId || session.client_reference_id;
        console.log(`[Sync] Attached User ID: ${attachedUserId}`);

        if (attachedUserId !== userId) {
            console.error(`[Sync] ID Mismatch. Expected ${userId}, got ${attachedUserId}`);
            return res.status(403).json({ error: "Session does not match logged in user" });
        }

        // Update Clerk
        const user = await clerkClient.users.getUser(userId);
        const currentRole = (user.publicMetadata?.role as string);
        const currentBaseTier = (user.publicMetadata?.base_tier as string);

        console.log(`[Sync] Valid payment verified. Updating user role. Current: ${currentRole || currentBaseTier}`);

        if (currentRole !== "admin" && currentBaseTier !== "admin") {
            await clerkClient.users.updateUser(userId, {
                publicMetadata: {
                    ...(user.publicMetadata || {}),
                    base_tier: "early_access",
                    entitlements: user.publicMetadata?.entitlements || [],
                    role: "early_access", // Backward compatibility
                    stripeCustomerId: session.customer as string,
                    subscriptionId: session.subscription as string,
                    planName: session.metadata?.planName || "Early Access",
                    // If it was no_payment_required, it's likely a trial
                    subscriptionStatus: session.payment_status === "no_payment_required" ? "trialing" : "active"
                }
            });
            console.log(`[Sync] SUCCESS: User ${userId} upgraded to early_access`);
        } else {
            console.log(`[Sync] SKIPPED: User is admin`);
        }

        return res.status(200).json({ success: true });

    } catch (err: any) {
        console.error("[Sync] CRITICAL ERROR:", err);
        return res.status(500).json({ error: err.message || "Internal server error during sync" });
    }
}
