// src/utils/facebookOAuth.ts
// Production-ready Facebook OAuth helpers for frontend.
// Does NOT import `getAuth` from clerk-react (avoids build issues).
// Uses window.Clerk at runtime when available, and stores initiating user id in localStorage
// so the callback can complete even if Clerk hasn't rehydrated immediately.

export interface FacebookPage {
  id: string;
  name: string;
  access_token?: string | null;
}

export interface FacebookAuthData {
  access_token: string;
  expires_in: number;
  refresh_token?: string | null;
  facebook_user_id: string;
  name?: string;
  email?: string | null;
  picture?: string | null;
  pages?: FacebookPage[];
}

export const FACEBOOK_AUTH_STORAGE_KEY = "facebook_auth_data";
const OAUTH_STATE_KEY = "facebook_oauth_state";
const OAUTH_INITIATOR_USER_KEY = "facebook_oauth_user_id";

// N8N Workflow URL - ensure this is set in your environment variables
const N8N_URL = import.meta.env.VITE_N8N_WEBHOOK_URL ?? "";

// Facebook App Client ID - set in env
const FACEBOOK_CLIENT_ID = import.meta.env.VITE_FACEBOOK_CLIENT_ID ?? "";

// FINAL redirect (frontend) — make sure this EXACT value is added to your Facebook App Valid Redirect URIs
export const REDIRECT_URI = "https://www.smartcontentsolutions.co.uk/facebook/callback";

// helper: generate state
function generateState(length = 32) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
}

// Save/restore helpers
export function saveFacebookAuthData(data: FacebookAuthData): void {
  localStorage.setItem(FACEBOOK_AUTH_STORAGE_KEY, JSON.stringify(data));
}

export function getFacebookAuthData(): FacebookAuthData | null {
  const stored = localStorage.getItem(FACEBOOK_AUTH_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function clearFacebookAuthData(): void {
  localStorage.removeItem(FACEBOOK_AUTH_STORAGE_KEY);
  localStorage.removeItem("facebook_selected_page");
}

// STEP 1 — Start Facebook OAuth
export async function initiateFacebookAuth(): Promise<void> {
  // Try to get the current clerk user id now and save it so callback can pick it up
  const clerkUserId = (window as any).Clerk?.user?.id ?? null;

  if (!clerkUserId) {
    // If user is not available from Clerk, fail early - require user logged in
    throw new Error("User must be logged in before starting Facebook OAuth.");
  }

  const state = generateState();
  localStorage.setItem(OAUTH_STATE_KEY, state);
  localStorage.setItem(OAUTH_INITIATOR_USER_KEY, clerkUserId);

  const scope = "business_management,email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,pages_read_user_content,instagram_basic,instagram_content_publish";

  const authUrl =
    "https://www.facebook.com/v19.0/dialog/oauth" +
    `?client_id=${encodeURIComponent(FACEBOOK_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&state=${encodeURIComponent(state)}` +
    `&scope=${encodeURIComponent(scope)}`;

  // redirect the browser to Facebook login
  window.location.href = authUrl;
}

// STEP 2 — Complete Facebook OAuth (called from callback page)
export async function completeFacebookAuth(): Promise<FacebookAuthData> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const returnedState = params.get("state");

  const storedState = localStorage.getItem(OAUTH_STATE_KEY);
  const storedInitiatorUserId = localStorage.getItem(OAUTH_INITIATOR_USER_KEY);

  // clear stored state immediately (one-time use)
  localStorage.removeItem(OAUTH_STATE_KEY);
  // keep the initiator user id for a short while until confirmation or failure
  // but remove after successful flow below

  if (!code) {
    throw new Error("No authorization code returned from Facebook");
  }

  if (!storedState || storedState !== returnedState) {
    throw new Error("Invalid OAuth state");
  }

  // try to read Clerk user now; if not present, fall back to stored initiator id
  const clerkUser = (window as any).Clerk?.user;
  const userId = clerkUser?.id ?? storedInitiatorUserId;

  if (!userId) {
    throw new Error(
      "Clerk user id missing. Make sure the initiating user was logged in when starting OAuth."
    );
  }

  // POST the code to the backend (n8n webhook) to do the server-side token exchange & DB work.
  const body = {
    provider: "facebook",
    code,
    state: returnedState,
    user_id: userId,
    redirect_uri: REDIRECT_URI,
  };

  if (!N8N_URL) {
    throw new Error("N8N webhook URL not configured (VITE_N8N_WEBHOOK_URL).");
  }

  const res = await fetch(`${N8N_URL}/oauth-facebook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("n8n facebook oauth callback error:", txt);
    throw new Error("OAuth callback failed.");
  }

  const json = await res.json();
  const authData = json.facebook_auth_data as FacebookAuthData | undefined;

  if (!authData) {
    throw new Error("Invalid response from OAuth callback");
  }

  // Success: save auth data locally for UI quick access (encrypted storage recommended in prod)
  saveFacebookAuthData(authData);

  // Clean up initiator id
  localStorage.removeItem(OAUTH_INITIATOR_USER_KEY);

  return authData;
}

export function isFacebookConnected(): boolean {
  return !!localStorage.getItem(FACEBOOK_AUTH_STORAGE_KEY);
}
