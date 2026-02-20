import { clerkClient } from "@clerk/clerk-sdk-node";
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

async function requireAdmin(req: any) {
    const secretKey = process.env.CLERK_SECRET_KEY || process.env.VITE_CLERK_SECRET_KEY;
    if (!secretKey) throw new Error("Missing CLERK_SECRET_KEY or VITE_CLERK_SECRET_KEY");

    const token = getBearerToken(req);
    if (!token)
        return { ok: false as const, status: 401, error: "Missing Authorization token" };

    const verified = await verifyToken(token, { secretKey });
    const userId = (verified?.sub as string) || null;
    if (!userId)
        return { ok: false as const, status: 401, error: "Invalid token" };

    const user = await clerkClient.users.getUser(userId);
    const role = (user.publicMetadata as any)?.role;
    const baseTier = (user.publicMetadata as any)?.base_tier;

    if (role !== "admin" && baseTier !== "admin") {
        return { ok: false as const, status: 403, error: "Admins only" };
    }

    return { ok: true as const, adminUserId: userId, adminEmail: user.emailAddresses?.[0]?.emailAddress || userId };
}

export default async function handler(req: any, res: any) {
    res.setHeader("Content-Type", "application/json");

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const auth = await requireAdmin(req);
        if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

        const targetUserId = typeof req.query?.userId === "string" ? req.query.userId : null;
        if (!targetUserId) {
            return res.status(400).json({ error: "Missing userId query parameter" });
        }

        if (!supabaseServiceKey) {
            return res.status(500).json({ error: "Missing SUPABASE_SCS_SERVICE_ROLE_KEY" });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: creditData } = await supabase
            .from("user_credits")
            .select("balance")
            .eq("user_id", targetUserId)
            .single();

        const balance = creditData?.balance ?? 0;

        const page = parseInt(req.query?.page || "1", 10);
        const pageSize = parseInt(req.query?.pageSize || "20", 10);
        const offset = (page - 1) * pageSize;

        const { data: transactions, count } = await supabase
            .from("credit_transactions")
            .select("*", { count: "exact" })
            .eq("user_id", targetUserId)
            .order("created_at", { ascending: false })
            .range(offset, offset + pageSize - 1);

        return res.status(200).json({
            ok: true,
            balance,
            transactions: transactions || [],
            total: count || 0,
            page,
            pageSize,
        });
    } catch (err: any) {
        console.error("admin-get-user-credits error:", err);
        return res.status(500).json({ error: err?.message || "Failed to fetch user credits" });
    }
}
