import { clerkClient } from "@clerk/clerk-sdk-node";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const secret = process.env.CLERK_SECRET_KEY;
    if (!secret) {
      return res.status(500).json({ error: "Missing CLERK_SECRET_KEY" });
    }

    // Fetch up to 100 users (we can add pagination later)
    const users = await clerkClient.users.getUserList({ limit: 100 });

    const mapped = users.map((u: any) => {
      const primaryEmail =
        u.emailAddresses?.find((e: any) => e.id === u.primaryEmailAddressId)
          ?.emailAddress || u.emailAddresses?.[0]?.emailAddress || null;

      const fullName =
        [u.firstName, u.lastName].filter(Boolean).join(" ") ||
        u.username ||
        null;

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
