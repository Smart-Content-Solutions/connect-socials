import Stripe from "stripe";
import { verifyToken, createClerkClient } from "@clerk/backend";

function getBearerToken(req: any): string | null {
    const header = req.headers?.authorization || req.headers?.Authorization;
    if (!header || typeof header !== "string") return null;
    const match = header.match(/^Bearer\s+(.+)$/i);
    return match ? match[1] : null;
}

function getClerkSessionCookie(req: any): string | null {
    const cookieHeader = req.headers?.cookie;
    if (!cookieHeader || typeof cookieHeader !== "string") return null;
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
        const tokenPriceId = process.env.STRIPE_TOKEN_PRICE_ID;
        const clerkSecretKey = process.env.CLERK_SECRET_KEY;

        if (!stripeSecretKey) {
            return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY" });
        }
        if (!tokenPriceId) {
            return res.status(500).json({ error: "Missing STRIPE_TOKEN_PRICE_ID — Stripe token product not configured yet" });
        }
        if (!clerkSecretKey) {
            return res.status(500).json({ error: "Missing CLERK_SECRET_KEY" });
        }

        // Authenticate user via Clerk
        const token = getBearerToken(req) || getClerkSessionCookie(req);
        if (!token) {
            return res.status(401).json({ error: "Missing Authorization token" });
        }

        const verified = await verifyToken(token, { secretKey: clerkSecretKey });
        const clerkUserId = (verified?.sub as string) || null;
        if (!clerkUserId) {
            return res.status(401).json({ error: "Invalid token" });
        }

        let body: any = {};
        try {
            if (req.body && typeof req.body === "object") {
                body = req.body;
            } else if (req.body && typeof req.body === "string") {
                body = JSON.parse(req.body);
            } else {
                const chunks: Buffer[] = [];
                for await (const chunk of req) {
                    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                }
                const rawBody = Buffer.concat(chunks).toString("utf8");
                if (rawBody && rawBody.trim()) {
                    body = JSON.parse(rawBody);
                }
            }
        } catch (parseError) {
            return res.status(400).json({ error: "Invalid JSON body" });
        }

        let tokenAmount = body?.tokenAmount;
        if (typeof tokenAmount === "string") {
            tokenAmount = parseInt(tokenAmount, 10);
        }

        if (!tokenAmount || typeof tokenAmount !== "number" || isNaN(tokenAmount) || tokenAmount < 10 || tokenAmount > 500) {
            return res.status(400).json({ error: "tokenAmount must be a number between 10 and 500" });
        }

        const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
        const origin = getOrigin(req);

        // Create one-time payment checkout session
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            client_reference_id: clerkUserId,
            line_items: [
                {
                    price: tokenPriceId,
                    quantity: tokenAmount,
                },
            ],
            metadata: {
                clerkUserId,
                type: "token_purchase",
                tokenAmount: String(tokenAmount),
            },
            success_url: `${origin}/account?tokens=success`,
            cancel_url: `${origin}/account?tokens=cancelled`,
        });

        return res.status(200).json({ url: session.url });
    } catch (error: any) {
        console.error("Token checkout error:", error);
        return res.status(400).json({ error: error.message });
    }
}
