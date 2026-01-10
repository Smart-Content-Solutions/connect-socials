import { clerkClient } from "@clerk/clerk-sdk-node";
import { verifyToken } from "@clerk/backend";

function getBearerToken(req: any): string | null {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== "string") return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

async function requireAdmin(req: any) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("Missing CLERK_SECRET_KEY");

  const token = getBearerToken(req);
  if (!token) {
    return { ok: false as const, status: 401, error: "Missing Authorization token" };
  }

  const verified = await verifyToken(token, { secretKey });
  const userId = (verified?.sub as string) || null;
  if (!userId) {
    return { ok: false as const, status: 401, error: "Invalid token" };
  }

  const user = await clerkClient.users.getUser(userId);
  const role = (user.publicMetadata as any)?.role;

  if (role !== "admin") {
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
    if (!auth.ok) {
      return res.status(auth.status).json({ error: auth.error });
    }

    // Fetch all users from Clerk
    const users = await clerkClient.users.getUserList({ limit: 100 });

    // Filter users with role 'admin' or 'staff'
    const staff = users.data
      .map((u: any) => {
        const role = (u.publicMetadata as any)?.role || "user";
        
        // Only include admin or staff roles
        if (role !== "admin" && role !== "staff") {
          return null;
        }

        const primaryEmail =
          u.emailAddresses?.find((e: any) => e.id === u.primaryEmailAddressId)?.emailAddress ||
          u.emailAddresses?.[0]?.emailAddress ||
          null;

        const fullName =
          [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || null;

        return {
          userId: u.id,
          email: primaryEmail,
          name: fullName,
          role,
        };
      })
      .filter(Boolean);

    return res.status(200).json({ staff });
  } catch (err: any) {
    console.error("admin/staff error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
