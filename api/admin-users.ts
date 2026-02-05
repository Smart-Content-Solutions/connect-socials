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
  if (!token) return { ok: false as const, status: 401, error: "Missing Authorization token" };

  // Verify Clerk session token
  const verified = await verifyToken(token, { secretKey });

  const userId = (verified?.sub as string) || null;
  if (!userId) return { ok: false as const, status: 401, error: "Invalid token" };

  const user = await clerkClient.users.getUser(userId);
  const role = (user.publicMetadata as any)?.role;
  const baseTier = (user.publicMetadata as any)?.base_tier;

  if (role !== "admin" && baseTier !== "admin") {
    return { ok: false as const, status: 403, error: "Admins only" };
  }

  return { ok: true as const, userId };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

    const users = await clerkClient.users.getUserList({ limit: 100 });

    const mapped = users.map((u: any) => {
      const primaryEmail =
        u.emailAddresses?.find((e: any) => e.id === u.primaryEmailAddressId)?.emailAddress ||
        u.emailAddresses?.[0]?.emailAddress ||
        null;

      const fullName =
        [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || null;

      const role = u.publicMetadata?.role ?? "user";

      return {
        id: u.id,
        name: fullName,
        email: primaryEmail,
        role,
        createdAt: u.createdAt,
      };
    });

    return res.status(200).json({ users: mapped });
  } catch (err: any) {
    console.error("admin-users error:", err);
    return res.status(500).json({ error: err?.message || "Failed to load users" });
  }
}
