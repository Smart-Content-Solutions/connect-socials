import { clerkClient } from "@clerk/clerk-sdk-node";
import { verifyToken } from "@clerk/backend";

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
        return {
            ok: false as const,
            status: 401,
            error: "Missing Authorization token",
        };

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

    return { ok: true as const, userId };
}

export default async function handler(req: any, res: any) {
    res.setHeader("Content-Type", "application/json");

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const auth = await requireAdmin(req);
        if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

        // Fetch all users (paginated)
        const limit = 100;
        let offset = 0;
        let allUsers: any[] = [];
        let hasMore = true;

        while (hasMore) {
            const response = await clerkClient.users.getUserList({
                limit,
                offset,
            });

            // Response can be either an array or paginated object
            const users = Array.isArray(response) ? response : (response as any).data || [];
            allUsers = allUsers.concat(users);
            hasMore = users.length === limit;
            offset += limit;

            // Safety limit to prevent infinite loops
            if (offset > 1000) break;
        }

        // Format user data
        const users = allUsers.map((user) => ({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            emailAddresses: user.emailAddresses,
            publicMetadata: user.publicMetadata,
            createdAt: user.createdAt,
        }));

        return res.status(200).json({
            ok: true,
            users,
            total: users.length,
        });
    } catch (err: any) {
        console.error("admin-list-users error:", err);
        return res.status(500).json({
            error: err?.message || "Failed to list users",
        });
    }
}
