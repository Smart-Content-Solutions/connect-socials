import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession, useUser } from "@clerk/clerk-react";

export const MAX_ALLOWED_SESSIONS = 3;

export type AccountSession = {
  id: string;
  status: string;
  createdAt: string | null;
  lastActiveAt: string | null;
  isCurrent: boolean;
  isActive: boolean;
  deviceLabel: string;
  ipAddress: string | null;
  userAgent: string | null;
};

type SessionsResponse = {
  sessions?: AccountSession[];
  activeCount?: number;
  maxAllowed?: number;
  error?: string;
};

export function useAccountSessions(enabled = true) {
  const { isLoaded, isSignedIn } = useUser();
  const { session } = useSession();

  const [sessions, setSessions] = useState<AccountSession[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [maxAllowed, setMaxAllowed] = useState(MAX_ALLOWED_SESSIONS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !isLoaded || !isSignedIn || !session) return;

    try {
      setLoading(true);
      setError(null);
      const token = await session.getToken();
      const response = await fetch("/api/account-sessions", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data: SessionsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load account sessions");
      }

      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      setActiveCount(typeof data.activeCount === "number" ? data.activeCount : 0);
      setMaxAllowed(typeof data.maxAllowed === "number" ? data.maxAllowed : MAX_ALLOWED_SESSIONS);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load account sessions");
    } finally {
      setLoading(false);
    }
  }, [enabled, isLoaded, isSignedIn, session]);

  const revokeSession = useCallback(async (sessionId: string) => {
    if (!session) throw new Error("No active session");

    const token = await session.getToken();
    const response = await fetch("/api/account-sessions/revoke", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to revoke session");
    }

    await refresh();
  }, [session, refresh]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
  }, [enabled, refresh]);

  const isOverLimit = useMemo(
    () => activeCount > maxAllowed,
    [activeCount, maxAllowed],
  );

  return {
    sessions,
    activeCount,
    maxAllowed,
    loading,
    error,
    isOverLimit,
    refresh,
    revokeSession,
  };
}
