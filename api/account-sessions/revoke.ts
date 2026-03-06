/* eslint-disable @typescript-eslint/no-explicit-any */
import { verifyToken, createClerkClient } from "@clerk/backend";

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

async function readJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === "object") return req.body;
  if (req.body && typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    if (chunks.length === 0) return null;
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return null;
  }
}

async function getUserSessions(clerkClient: any, userId: string): Promise<any[]> {
  const sessionsApi = clerkClient?.sessions;
  if (!sessionsApi) throw new Error("Clerk sessions API is not available");

  if (typeof sessionsApi.getSessionList === "function") {
    const result = await sessionsApi.getSessionList({ userId, limit: 50 });
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
  }

  if (typeof sessionsApi.getSessionListByUserId === "function") {
    const result = await sessionsApi.getSessionListByUserId(userId, { limit: 50 });
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
  }

  throw new Error("Unable to list sessions from Clerk API");
}

async function revokeSessionById(clerkClient: any, sessionId: string) {
  const sessionsApi = clerkClient?.sessions;
  if (!sessionsApi) throw new Error("Clerk sessions API is not available");

  if (typeof sessionsApi.revokeSession === "function") {
    return sessionsApi.revokeSession(sessionId);
  }

  if (typeof sessionsApi.revokeSessionById === "function") {
    return sessionsApi.revokeSessionById(sessionId);
  }

  if (typeof sessionsApi.updateSession === "function") {
    return sessionsApi.updateSession(sessionId, { status: "revoked" });
  }

  throw new Error("Unable to revoke session with Clerk API");
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const secretKey = process.env.CLERK_SECRET_KEY || process.env.VITE_CLERK_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ error: "Missing CLERK_SECRET_KEY or VITE_CLERK_SECRET_KEY" });
    }

    const token = getBearerToken(req) || getClerkSessionCookie(req);
    if (!token) {
      return res.status(401).json({ error: "Missing Authorization token" });
    }

    const verified = await verifyToken(token, { secretKey });
    const userId = (verified?.sub as string) || null;
    if (!userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const body = await readJsonBody(req);
    const sessionId = body?.sessionId;
    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const clerkClient = createClerkClient({ secretKey }) as any;
    const sessions = await getUserSessions(clerkClient, userId);
    const targetSession = sessions.find((session) => session?.id === sessionId);

    if (!targetSession) {
      return res.status(403).json({ error: "Session does not belong to current user" });
    }

    await revokeSessionById(clerkClient, sessionId);
    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error("account-sessions/revoke API error:", error);
    return res.status(500).json({ error: error?.message || "Internal server error" });
  }
}
