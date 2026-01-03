import Stripe from "stripe";
import { clerkClient } from "@clerk/backend";

/**
 * API endpoint to create Stripe checkout sessions
 * This handles subscription purchases and assigns the early_access role via webhook
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
        if (!body) {
            return res.status(400).json({ error: "Invalid request body" });
        }

        const { planName, billingPeriod, userId } = body;

        if (!planName || !billingPeriod || !userId) {
            return res.status(400).json({
                error: "Missing required fields: planName, billingPeriod, userId"
            });
        }

        // Initialize Stripe
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            return res.status(500).json({ error: "Stripe not configured" });
        }

        const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

        // Get user info from Clerk
        const user = await clerkClient.users.getUser(userId);
        const userEmail = user.emailAddresses.find(
            (e) => e.id === user.primaryEmailAddressId
        )?.emailAddress || user.emailAddresses[0]?.emailAddress;

        if (!userEmail) {
            return res.status(400).json({ error: "User email not found" });
        }

        // Map plan names to Stripe Price IDs
        // You need to create these products and prices in your Stripe Dashboard
        // and add the price IDs to your .env file
        const priceIds: Record<string, { monthly: string; annual: string }> = {
            Starter: {
                monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || "",
                annual: process.env.STRIPE_PRICE_STARTER_ANNUAL || "",
            },
            Growth: {
                monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY || "",
                annual: process.env.STRIPE_PRICE_GROWTH_ANNUAL || "",
            },
        };

        const priceId = priceIds[planName]?.[billingPeriod];

        if (!priceId) {
            return res.status(400).json({
                error: `No Stripe price configured for ${planName} (${billingPeriod})`
            });
        }

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            customer_email: userEmail,
            client_reference_id: userId, // This will be used in the webhook
            metadata: {
                clerkUserId: userId,
                planName: planName,
                billingPeriod: billingPeriod,
            },
            subscription_data: {
                metadata: {
                    clerkUserId: userId,
                    planName: planName,
                },
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173"}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173"}/pricing?checkout=cancelled`,
        });

        return res.status(200).json({ url: session.url });
    } catch (err: any) {
        console.error("Checkout error:", err);
        return res.status(500).json({
            error: err?.message || "Failed to create checkout session"
        });
    }
}
