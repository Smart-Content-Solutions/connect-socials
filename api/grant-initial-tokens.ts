import { verifyToken, createClerkClient } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_SCS_URL || "https://bgwmonmfulmmdwlbdekz.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SCS_SERVICE_ROLE_KEY || "";

const EARLY_ACCESS_GRANT = 30;

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

        // Verify user has early_access or admin role
        const clerkClient = createClerkClient({ secretKey: clerkSecretKey });
        const user = await clerkClient.users.getUser(clerkUserId);
        const role = (user.publicMetadata as any)?.role;

        if (role !== "early_access" && role !== "admin") {
            return res.status(403).json({ error: "Only early_access and admin users receive free tokens" });
        }

        if (!supabaseServiceKey) {
            return res.status(500).json({ error: "Missing SUPABASE_SCS_SERVICE_ROLE_KEY" });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Check if already granted
        const { data: existingGrant } = await supabase
            .from("credit_transactions")
            .select("id")
            .eq("user_id", clerkUserId)
            .eq("type", "initial_grant")
            .limit(1);

        if (existingGrant && existingGrant.length > 0) {
            return res.status(200).json({
                success: true,
                message: "Initial tokens already granted",
                alreadyGranted: true
            });
        }

        // Grant tokens
        const { data: existing, error: existingError } = await supabase
            .from("user_credits")
            .select("balance")
            .eq("user_id", clerkUserId)
            .single();

        if (existingError && existingError.code !== 'PGRST116') {
            console.error("DB SELECT Error:", existingError);
        }

        if (existing) {
            const { error: updateError } = await supabase
                .from("user_credits")
                .update({ balance: existing.balance + EARLY_ACCESS_GRANT })
                .eq("user_id", clerkUserId);
            if (updateError) throw updateError;
        } else {
            const { error: insertError } = await supabase
                .from("user_credits")
                .insert({ user_id: clerkUserId, balance: EARLY_ACCESS_GRANT });
            if (insertError) throw insertError;
        }

        // Record transaction
        const { error: txError } = await supabase
            .from("credit_transactions")
            .insert({
                user_id: clerkUserId,
                amount: EARLY_ACCESS_GRANT,
                type: "initial_grant",
                description: `Welcome bonus: ${EARLY_ACCESS_GRANT} free tokens with Early Access`,
                metadata: { role, grant_type: "early_access_welcome" },
            });

        if (txError) throw txError;

        console.log(`✅ Granted ${EARLY_ACCESS_GRANT} initial tokens to user ${clerkUserId}`);

        return res.status(200).json({
            success: true,
            granted: EARLY_ACCESS_GRANT,
        });
    } catch (error: any) {
        console.error("Grant initial tokens error:", error);
        return res.status(500).json({ error: error.message });
    }
}
