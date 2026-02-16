// src/utils/youtubeOAuth.ts

export interface YouTubeAuthData {
  access_token: string;
  refresh_token?: string; // Google refresh tokens are long-lived
  expires_in?: number;
  channel_id: string;
  channel_title: string;
  channel_thumbnail: string;
  token_expires_at?: number; // timestamp when token expires
}

export const YOUTUBE_AUTH_STORAGE_KEY = "youtube_auth_data";
export const YOUTUBE_CONNECTED_ACCOUNTS_KEY = "youtube_connected_accounts";
const OAUTH_STATE_KEY = "youtube_oauth_state";
const OAUTH_INITIATOR_USER_KEY = "youtube_oauth_user_id";

const N8N_URL = import.meta.env.VITE_N8N_WEBHOOK_URL ?? "";
const YOUTUBE_CLIENT_ID = import.meta.env.VITE_YOUTUBE_CLIENT_ID ?? "";

// Must match Google Cloud Console configuration
export const REDIRECT_URI = import.meta.env.VITE_YOUTUBE_REDIRECT_URI || `${window.location.origin}/youtube/callback`;

// helper
function generateState(length = 32) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
}

export function saveYouTubeAuthData(data: YouTubeAuthData): void {
  // Save as the "active" or "last used" account
  localStorage.setItem(YOUTUBE_AUTH_STORAGE_KEY, JSON.stringify(data));

  // Also add to the list of connected accounts
  const connected = getConnectedYouTubeAccounts();
  const exists = connected.findIndex(acc => acc.channel_id === data.channel_id);

  if (exists > -1) {
    connected[exists] = data;
  } else {
    connected.push(data);
  }

  localStorage.setItem(YOUTUBE_CONNECTED_ACCOUNTS_KEY, JSON.stringify(connected));
}

export function getYouTubeAuthData(): YouTubeAuthData | null {
  const stored = localStorage.getItem(YOUTUBE_AUTH_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function getConnectedYouTubeAccounts(): YouTubeAuthData[] {
  const stored = localStorage.getItem(YOUTUBE_CONNECTED_ACCOUNTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function clearYouTubeAuthData(): void {
  localStorage.removeItem(YOUTUBE_AUTH_STORAGE_KEY);
  localStorage.removeItem(YOUTUBE_CONNECTED_ACCOUNTS_KEY);
}

export function removeYouTubeAccount(channelId: string): void {
  const connected = getConnectedYouTubeAccounts();
  const updated = connected.filter(acc => acc.channel_id !== channelId);
  localStorage.setItem(YOUTUBE_CONNECTED_ACCOUNTS_KEY, JSON.stringify(updated));

  // If we removed the currently active one, clear it or pick another
  const current = getYouTubeAuthData();
  if (current?.channel_id === channelId) {
    if (updated.length > 0) {
      localStorage.setItem(YOUTUBE_AUTH_STORAGE_KEY, JSON.stringify(updated[0]));
    } else {
      localStorage.removeItem(YOUTUBE_AUTH_STORAGE_KEY);
    }
  }
}

// STEP 1 → Start OAuth
export async function initiateYouTubeAuth(): Promise<void> {
  const clerkUserId = (window as any).Clerk?.user?.id ?? null;

  if (!clerkUserId) {
    throw new Error("User must be logged in before starting YouTube OAuth.");
  }

  const state = generateState();

  localStorage.setItem(OAUTH_STATE_KEY, state);
  localStorage.setItem(OAUTH_INITIATOR_USER_KEY, clerkUserId);

  // Scopes for YouTube upload and channel info
  const scope = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/userinfo.profile"
  ].join(" ");

  if (!YOUTUBE_CLIENT_ID) {
    console.error("Missing VITE_YOUTUBE_CLIENT_ID in .env");
    throw new Error("YouTube Client ID is not configured.");
  }

  const authUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    `client_id=${encodeURIComponent(YOUTUBE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&access_type=offline` + // Required to get a refresh token
    `&prompt=consent` + // Force consent screen to ensure we get a refresh token
    `&state=${encodeURIComponent(state)}`;

  // Redirect to Google OAuth
  window.location.href = authUrl;
}

// STEP 2 → Complete OAuth callback
export async function completeYouTubeAuth(query: { code?: string; state?: string }) {
  console.log("YouTube OAuth: Starting callback with", { code: query.code, state: query.state });
  
  if (!N8N_URL) throw new Error("N8N webhook URL missing (VITE_N8N_WEBHOOK_URL)");

  const storedState = localStorage.getItem(OAUTH_STATE_KEY);
  console.log("YouTube OAuth: Stored state:", storedState, "Query state:", query.state);
  
  if (query.state !== storedState) {
    throw new Error("Invalid OAuth state. Please try again.");
  }

  const body = {
    code: query.code,
    state: query.state,
    user_id: localStorage.getItem(OAUTH_INITIATOR_USER_KEY) ?? null,
    redirect_uri: REDIRECT_URI
  };

  console.log("YouTube OAuth: Sending to n8n:", `${N8N_URL}oauth-youtube`);
  console.log("YouTube OAuth: Request body:", body);

  const res = await fetch(`${N8N_URL}oauth-youtube`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  console.log("YouTube OAuth: Response status:", res.status);
  console.log("YouTube OAuth: Response headers:", Object.fromEntries(res.headers.entries()));

  if (!res.ok) {
    const errorText = await res.text();
    console.error("YouTube OAuth error response:", errorText);
    throw new Error(`YouTube OAuth callback failed: ${res.status} - ${errorText}`);
  }

  const json = await res.json();
  console.log("YouTube OAuth: Success response:", json);
  
  // Expecting the n8n workflow to return key "youtube_auth_data"
  const data = json.youtube_auth_data as YouTubeAuthData | undefined;

  if (!data) throw new Error("Invalid YouTube auth response from server.");

  saveYouTubeAuthData(data);

  localStorage.removeItem(OAUTH_INITIATOR_USER_KEY);
  localStorage.removeItem(OAUTH_STATE_KEY);

  return data;
}

export function isYouTubeConnected(): boolean {
  return getConnectedYouTubeAccounts().length > 0;
}
