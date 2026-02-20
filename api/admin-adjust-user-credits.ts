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

    return {
        ok: true as const,
        adminUserId: userId,
        adminEmail: user.emailAddresses?.[0]?.emailAddress || userId,
    };
}

export default async function handler(req: any, res: any) {
    res.setHeader("Content-Type", "application/json");

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const auth = await requireAdmin(req);
        if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

        const body = await readJsonBody(req);
        if (!body) {
            return res.status(400).json({ error: "Invalid JSON body" });
        }

        const { userId, newBalance, reason } = body;

        if (!userId || typeof userId !== "string") {
            return res.status(400).json({ error: "Missing or invalid userId" });
        }

        if (typeof newBalance !== "number" || newBalance < 0 || !Number.isFinite(newBalance)) {
            return res.status(400).json({ error: "newBalance must be a non-negative number" });
        }

        const roundedBalance = Math.round(newBalance);

        if (!supabaseServiceKey) {
            return res.status(500).json({ error: "Missing SUPABASE_SCS_SERVICE_ROLE_KEY" });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Read current balance
        const { data: creditData } = await supabase
            .from("user_credits")
            .select("balance")
            .eq("user_id", userId)
            .single();

        const oldBalance = creditData?.balance ?? 0;
        const delta = roundedBalance - oldBalance;

        if (delta === 0) {
            return res.status(200).json({
                ok: true,
                oldBalance,
                newBalance: roundedBalance,
                delta: 0,
                message: "No change needed",
            });
        }

        // Upsert the new balance atomically
        const { error: upsertError } = await supabase
            .from("user_credits")
            .upsert(
                { user_id: userId, balance: roundedBalance },
                { onConflict: "user_id" }
            );

        if (upsertError) {
            console.error("Balance upsert error:", upsertError);
            return res.status(500).json({ error: "Failed to update balance" });
        }

        // Record the admin adjustment transaction
        const { error: txError } = await supabase
            .from("credit_transactions")
            .insert({
                user_id: userId,
                amount: delta,
                type: "admin_adjust",
                description: reason
                    ? `Admin adjustment: ${reason}`
                    : `Admin adjusted balance from ${oldBalance} to ${roundedBalance}`,
                metadata: {
                    admin_user_id: auth.adminUserId,
                    admin_email: auth.adminEmail,
                    old_balance: oldBalance,
                    new_balance: roundedBalance,
                    reason: reason || null,
                },
            });

        if (txError) {
            console.error("Transaction log error:", txError);
        }

        return res.status(200).json({
            ok: true,
            oldBalance,
            newBalance: roundedBalance,
            delta,
        });
    } catch (err: any) {
        console.error("admin-adjust-user-credits error:", err);
        return res.status(500).json({ error: err?.message || "Failed to adjust credits" });
    }
}
