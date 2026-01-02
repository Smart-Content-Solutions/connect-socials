import { clerkClient } from "@clerk/clerk-sdk-node";
import { verifyToken } from "@clerk/backend";

function getBearerToken(req: any): string | null {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== "string") return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

async function readJsonBody(req: any): Promise<any> {
  // Vercel sometimes gives req.body as string, object, or undefined.
  if (req.body && typeof req.body === "object") return req.body;
  if (req.body && typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }

  // If body is not parsed, read raw stream
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    if (chunks.length === 0) return null;
    const text = Buffer.concat(chunks).toString("utf8");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function requireAdmin(req: any) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("Missing CLERK_SECRET_KEY");

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

  if (role !== "admin") {
    return { ok: false as const, status: 403, error: "Admins only" };
  }

  return { ok: true as const, userId };
}

export default async function handler(req: any, res: any) {
  // Always return JSON
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

    const { userId, role } = body;
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
    // Ensure JSON even on crash
    return res.status(500).json({
      error: err?.message || "Failed to update role",
    });
  }
}
