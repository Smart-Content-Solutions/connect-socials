// src/utils/instagramOAuth.ts
export interface InstagramAuthData {
  access_token: string;
  expires_in: number;
  instagram_user_id?: string; // numeric IG business id
  name?: string;
  username?: string | null;
  picture?: string | null;
  pages?: Array<{ id: string; name: string; access_token?: string }>;
}

export const INSTAGRAM_AUTH_STORAGE_KEY = "instagram_auth_data";
const OAUTH_STATE_KEY = "instagram_oauth_state";
const OAUTH_INITIATOR_USER_KEY = "instagram_oauth_user_id";

const N8N_URL = import.meta.env.VITE_N8N_WEBHOOK_URL ?? "";
const FACEBOOK_CLIENT_ID = import.meta.env.VITE_FACEBOOK_CLIENT_ID ?? "";

// Frontend redirect for completing flow - ensure this exact URL is registered in FB App redirect URIs
export const REDIRECT_URI = "https://www.smartcontentsolutions.co.uk/instagram/callback";

function generateState(length = 32) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
}

export function saveInstagramAuthData(data: InstagramAuthData): void {
  localStorage.setItem(INSTAGRAM_AUTH_STORAGE_KEY, JSON.stringify(data));
}

export function getInstagramAuthData(): InstagramAuthData | null {
  const raw = localStorage.getItem(INSTAGRAM_AUTH_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearInstagramAuthData(): void {
  localStorage.removeItem(INSTAGRAM_AUTH_STORAGE_KEY);
}

export function isInstagramConnected(): boolean {
  return !!localStorage.getItem(INSTAGRAM_AUTH_STORAGE_KEY);
}

// Initiate OAuth: Facebook OAuth dialog with Instagram-related scopes (Graph API publishing)
export async function initiateInstagramAuth(): Promise<void> {
  const clerkUserId = (window as any).Clerk?.user?.id ?? null;
  if (!clerkUserId) throw new Error("User must be logged in before starting Instagram OAuth.");

  const state = generateState();
  localStorage.setItem(OAUTH_STATE_KEY, state);
  localStorage.setItem(OAUTH_INITIATOR_USER_KEY, clerkUserId);

  // For Instagram Graph we need Facebook login with these permissions:
  // pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish, public_profile, email
  const scope = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
    "public_profile",
    "email"
  ].join(",");

  const authUrl =
    "https://www.facebook.com/v19.0/dialog/oauth" +
    `?client_id=${encodeURIComponent(FACEBOOK_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&state=${encodeURIComponent(state)}` +
    `&scope=${encodeURIComponent(scope)}`;

  window.location.href = authUrl;
}

// Complete OAuth: called from frontend callback; POSTs code to n8n for token exchange & DB work
export async function completeInstagramAuth(): Promise<InstagramAuthData> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const returnedState = params.get("state");

  const storedState = localStorage.getItem(OAUTH_STATE_KEY);
  const storedInitiatorUserId = localStorage.getItem(OAUTH_INITIATOR_USER_KEY);

  localStorage.removeItem(OAUTH_STATE_KEY);

  if (!code) throw new Error("No authorization code returned from Instagram/Facebook");

  if (!storedState || storedState !== returnedState) throw new Error("Invalid OAuth state");

  const clerkUser = (window as any).Clerk?.user;
  const userId = clerkUser?.id ?? storedInitiatorUserId;
  if (!userId) throw new Error("Clerk user id missing. Make sure initiating user was logged in.");

  if (!N8N_URL) throw new Error("N8N webhook URL not configured (VITE_N8N_WEBHOOK_URL).");

  const body = {
    provider: "instagram",
    code,
    state: returnedState,
    user_id: userId,
    redirect_uri: REDIRECT_URI,
  };

  const res = await fetch(`${N8N_URL}/oauth-instagram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("n8n instagram oauth callback error:", txt);
    throw new Error("OAuth callback failed.");
  }

  const json = await res.json();
  const authData = json.instagram_auth_data as InstagramAuthData | undefined;
  if (!authData) throw new Error("Invalid response from OAuth callback");

  saveInstagramAuthData(authData);
  localStorage.removeItem(OAUTH_INITIATOR_USER_KEY);

  return authData;
}
