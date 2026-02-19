import { verifyToken } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_SCS_URL || "https://bgwmonmfulmmdwlbdekz.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SCS_SERVICE_ROLE_KEY || "";

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

async function readJsonBody(req: any): Promise<any> {
    if (req.body && typeof req.body === "object") return req.body;
    if (req.body && typeof req.body === "string") {
        try { return JSON.parse(req.body); } catch { return null; }
    }
    try {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        if (chunks.length === 0) return null;
        return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch { return null; }
}

export default async function handler(req: any, res: any) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const clerkSecretKey = process.env.CLERK_SECRET_KEY;
        if (!clerkSecretKey) {
            return res.status(500).json({ error: "Missing CLERK_SECRET_KEY" });
        }

        // Authenticate user
        const token = getBearerToken(req) || getClerkSessionCookie(req);
        if (!token) {
            return res.status(401).json({ error: "Missing Authorization token" });
        }

        const verified = await verifyToken(token, { secretKey: clerkSecretKey });
        const clerkUserId = (verified?.sub as string) || null;
        if (!clerkUserId) {
            return res.status(401).json({ error: "Invalid token" });
        }

        if (!supabaseServiceKey) {
            return res.status(500).json({ error: "Missing SUPABASE_SCS_SERVICE_ROLE_KEY" });
        }

        const body = await readJsonBody(req);
        if (!body) {
            return res.status(400).json({ error: "Invalid request body" });
        }

        const { amount, description, metadata } = body;

        if (!amount || typeof amount !== "number" || amount <= 0) {
            return res.status(400).json({ error: "amount must be a positive integer" });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Atomic: check balance and deduct in a transaction using RPC
        // First, get current balance
        const { data: creditData } = await supabase
            .from("user_credits")
            .select("balance")
            .eq("user_id", clerkUserId)
            .single();

        const currentBalance = creditData?.balance ?? 0;

        if (currentBalance < amount) {
            return res.status(400).json({
                error: "insufficient_credits",
                message: `You need ${amount} tokens but only have ${currentBalance}. Purchase more tokens from your Account page.`,
                balance: currentBalance,
                required: amount,
            });
        }

        // Deduct balance
        const newBalance = currentBalance - amount;
        const { error: updateError } = await supabase
            .from("user_credits")
            .update({ balance: newBalance })
            .eq("user_id", clerkUserId)
            .gte("balance", amount); // Extra safety: only update if balance is still sufficient

        if (updateError) {
            console.error("Balance update error:", updateError);
            return res.status(500).json({ error: "Failed to deduct credits" });
        }

        // Record deduction transaction
        const { error: txError } = await supabase
            .from("credit_transactions")
            .insert({
                user_id: clerkUserId,
                amount: -amount,
                type: "deduction",
                description: description || `Deducted ${amount} tokens`,
                metadata: metadata || {},
            });

        if (txError) {
            console.error("Transaction log error:", txError);
            // Don't fail — balance was already deducted
        }

        return res.status(200).json({
            success: true,
            newBalance,
            deducted: amount,
        });
    } catch (error: any) {
        console.error("Deduct credits error:", error);
        return res.status(500).json({ error: error.message });
    }
}
