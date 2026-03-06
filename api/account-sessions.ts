/* eslint-disable @typescript-eslint/no-explicit-any */
import { verifyToken, createClerkClient } from "@clerk/backend";

const MAX_ALLOWED_SESSIONS = 3;

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

function asIso(value: unknown): string | null {
  if (!value) return null;

  if (typeof value === "number") {
    const ms = value > 10_000_000_000 ? value : value * 1000;
    return new Date(ms).toISOString();
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return null;
}

function getSessionStatus(session: any): string {
  return (
    session?.status ||
    session?.state ||
    session?.lastActiveOrganizationMembership?.status ||
    "unknown"
  );
}

function isSessionActive(status: string): boolean {
  const lowered = String(status || "").toLowerCase();
  return lowered === "active" || lowered === "abandoned";
}

function getDeviceLabel(session: any): string {
  const latestActivity = session?.latestActivity || session?.lastActiveToken || {};
  const browser = latestActivity?.browserName || session?.browserName || "";
  const os = latestActivity?.osName || session?.osName || "";
  const deviceType = latestActivity?.deviceType || session?.deviceType || "";

  const parts = [browser, os].filter(Boolean);
  if (parts.length > 0) return parts.join(" on ");
  if (deviceType) return `${deviceType} session`;
  return "Browser session";
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

function normalizeSession(session: any, currentSessionId: string | null) {
  const status = getSessionStatus(session);
  const lastActiveAt = asIso(session?.lastActiveAt || session?.updatedAt || session?.lastActiveToken?.updatedAt);

  return {
    id: session?.id || "",
    status,
    createdAt: asIso(session?.createdAt),
    lastActiveAt,
    isCurrent: Boolean(currentSessionId && session?.id === currentSessionId),
    isActive: isSessionActive(status),
    deviceLabel: getDeviceLabel(session),
    ipAddress: session?.lastActiveToken?.lastActiveAt ? (session?.lastActiveToken?.ipAddress || null) : (session?.ipAddress || null),
    userAgent: session?.lastActiveToken?.userAgent || null,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
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
    const currentSessionId = (verified?.sid as string) || null;
    if (!userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const clerkClient = createClerkClient({ secretKey }) as any;
    const rawSessions = await getUserSessions(clerkClient, userId);

    const sessions = rawSessions
      .map((session) => normalizeSession(session, currentSessionId))
      .filter((session) => session.id)
      .filter((session) => session.isActive)
      .sort((a, b) => {
        const aTime = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
        const bTime = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
        return bTime - aTime;
      });

    const activeCount = sessions.length;

    return res.status(200).json({
      sessions,
      activeCount,
      maxAllowed: MAX_ALLOWED_SESSIONS,
    });
  } catch (error: any) {
    console.error("account-sessions API error:", error);
    return res.status(500).json({ error: error?.message || "Internal server error" });
  }
}
