import { useState, useEffect, useCallback } from "react";
import { useSession } from "@clerk/clerk-react";
import type { ScheduledPost } from "@/types/scheduled-post";

const API_BASE = "/api";

async function fetchWithAuth(url: string, token: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function useScheduledPosts() {
  const { session } = useSession();
  const [pending, setPending] = useState<ScheduledPost[]>([]);
  const [history, setHistory] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    if (!session) throw new Error("No session");
    return session.getToken();
  }, [session]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();

      const [pendingRes, historyRes] = await Promise.all([
        fetchWithAuth(`${API_BASE}/scheduled-posts?status=pending&limit=50`, token!),
        fetchWithAuth(`${API_BASE}/scheduled-posts?status=history&limit=20`, token!),
      ]);

      setPending(pendingRes.posts || []);
      setHistory(historyRes.posts || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (session) fetchPosts();
  }, [session, fetchPosts]);

  const createScheduledPost = useCallback(
    async (data: {
      caption: string;
      platforms: string[];
      media_url?: string;
      scheduled_time: string;
      user_timezone: string;
      post_type: "image" | "video";
      user_email?: string;
      payload?: Record<string, any>;
    }) => {
      const token = await getToken();
      const result = await fetchWithAuth(`${API_BASE}/scheduled-posts`, token!, {
        method: "POST",
        body: JSON.stringify(data),
      });
      await fetchPosts();
      return result.post as ScheduledPost;
    },
    [getToken, fetchPosts]
  );

  const cancelPost = useCallback(
    async (id: string) => {
      const token = await getToken();
      await fetchWithAuth(`${API_BASE}/scheduled-posts-action`, token!, {
        method: "POST",
        body: JSON.stringify({ id, action: "cancel" }),
      });
      await fetchPosts();
    },
    [getToken, fetchPosts]
  );

  const retryPost = useCallback(
    async (id: string) => {
      const token = await getToken();
      await fetchWithAuth(`${API_BASE}/scheduled-posts-action`, token!, {
        method: "POST",
        body: JSON.stringify({ id, action: "retry" }),
      });
      await fetchPosts();
    },
    [getToken, fetchPosts]
  );

  const reschedulePost = useCallback(
    async (id: string, scheduled_time: string) => {
      const token = await getToken();
      await fetchWithAuth(`${API_BASE}/scheduled-posts-action`, token!, {
        method: "POST",
        body: JSON.stringify({ id, action: "reschedule", scheduled_time }),
      });
      await fetchPosts();
    },
    [getToken, fetchPosts]
  );

  return {
    pending,
    history,
    loading,
    error,
    refresh: fetchPosts,
    createScheduledPost,
    cancelPost,
    retryPost,
    reschedulePost,
  };
}
