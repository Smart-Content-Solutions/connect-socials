import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useAuthenticatedSupabase } from "@/hooks/useAuthenticatedSupabase";
import type { AdminNotification, AdminNotificationsResponse } from "@/types/notifications";

async function fetchWithAuth<T>(url: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

export function useAdminNotifications(limit = 20) {
  const { getToken, userId, isSignedIn } = useAuth();
  const supabase = useAuthenticatedSupabase();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const data = await fetchWithAuth<AdminNotificationsResponse>(
        `/api/admin/notifications?limit=${limit}`,
        token,
        { method: "GET" }
      );

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [getToken, isSignedIn, limit]);

  const markAsRead = useCallback(
    async (notificationIds: string[]) => {
      if (!notificationIds.length) return;

      try {
        setUpdating(true);
        const token = await getToken();
        if (!token) throw new Error("Authentication required");

        const data = await fetchWithAuth<{ unreadCount: number }>(
          "/api/admin/notifications",
          token,
          {
            method: "PATCH",
            body: JSON.stringify({ notificationIds }),
          }
        );

        setNotifications((prev) =>
          prev.map((notification) =>
            notificationIds.includes(notification.id)
              ? { ...notification, isRead: true, readAt: new Date().toISOString() }
              : notification
          )
        );
        setUnreadCount(data.unreadCount || 0);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to update notifications");
      } finally {
        setUpdating(false);
      }
    },
    [getToken]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      setUpdating(true);
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const data = await fetchWithAuth<{ unreadCount: number }>(
        "/api/admin/notifications",
        token,
        {
          method: "PATCH",
          body: JSON.stringify({ markAll: true }),
        }
      );

      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true, readAt: now })));
      setUnreadCount(data.unreadCount || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to mark all notifications as read");
    } finally {
      setUpdating(false);
    }
  }, [getToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId || !isSignedIn) return;

    const channel = supabase
      .channel(`admin_notifications_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_notifications",
          filter: `recipient_user_id=eq.${userId}`,
        },
        (_payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, userId, isSignedIn, refresh]);

  return {
    notifications,
    unreadCount,
    loading,
    updating,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
  };
}
