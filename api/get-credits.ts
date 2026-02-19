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

export default async function handler(req: any, res: any) {
    if (req.method !== "GET") {
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

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get balance
        const { data: creditData } = await supabase
            .from("user_credits")
            .select("balance")
            .eq("user_id", clerkUserId)
            .single();

        const balance = creditData?.balance ?? 0;

        // Get recent transactions (last 50)
        const { data: transactions } = await supabase
            .from("credit_transactions")
            .select("*")
            .eq("user_id", clerkUserId)
            .order("created_at", { ascending: false })
            .limit(50);

        return res.status(200).json({
            balance,
            transactions: transactions || [],
        });
    } catch (error: any) {
        console.error("Get credits error:", error);
        return res.status(500).json({ error: error.message });
    }
}
