import { clerkClient } from "@clerk/clerk-sdk-node";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.CLERK_SECRET_KEY) {
      return res.status(500).json({ error: "Missing CLERK_SECRET_KEY" });
    }

    const { userId, role } = req.body || {};

    const allowedRoles = ["admin", "early_access", "user"];

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Missing or invalid userId" });
    }

    if (!role || typeof role !== "string" || !allowedRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const updated = await clerkClient.users.updateUser(userId, {
      publicMetadata: { role },
    });

    return res.status(200).json({
      ok: true,
      user: {
        id: updated.id,
        role: updated.publicMetadata?.role ?? "user",
      },
    });
  } catch (err: any) {
    console.error("admin-update-user-role error:", err);
    return res.status(500).json({ error: err?.message || "Failed to update role" });
  }
}
