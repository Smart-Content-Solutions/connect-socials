// src/utils/facebookOAuth.ts
/* eslint-disable no-console */
import type { FacebookAuthData, FacebookPage } from "./types-if-any"; // optional placeholder - remove if not using

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

const STORAGE_KEYS = {
  STATE: "facebook_oauth_state",
  USER_ID: "facebook_oauth_user_id",
  TIMESTAMP: "facebook_oauth_ts",
  AUTH_DATA: "facebook_auth_data",
};

// n8n webhook endpoint (backend)
const N8N_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

// Facebook App client id (frontend)
const FACEBOOK_CLIENT_ID = import.meta.env.VITE_FACEBOOK_CLIENT_ID;

// FINAL redirect (frontend). Put this in env if you prefer.
const REDIRECT_URI = import.meta.env.VITE_FACEBOOK_REDIRECT_URI || "https://www.smartcontentsolutions.co.uk/facebook/callback";

// Generate a cryptographically-strong random string for state
export function generateState(length = 32) {
  const array = new Uint8Array(length);
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    // fallback insecure (very unlikely in modern browsers)
    for (let i = 0; i < length; i++) array[i] = Math.floor(Math.random() * 256);
  }
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(array)
    .map((n) => chars[n % chars.length])
    .join("")
    .slice(0, length);
}

/**
 * STEP 1 — Start Facebook OAuth
 * stores `state` and `userId` in localStorage so callback can operate without Clerk being immediately available.
 */
export async function initiateFacebookAuth(userId?: string) {
  // userId optional — if you have Clerk you can pass window.Clerk?.user?.id from your component
  const state = generateState(32);
  const ts = Date.now();

  // store state + user id for callback (they will be removed only after validation)
  try {
    localStorage.setItem(STORAGE_KEYS.STATE, state);
    if (userId) localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    localStorage.setItem(STORAGE_KEYS.TIMESTAMP, ts.toString());
  } catch (err) {
    console.warn("Could not write OAuth state to localStorage", err);
  }

  const scope = ["email", "public_profile", "pages_show_list", "pages_read_engagement", "pages_manage_posts"].join(",");
  const authUrl =
    "https://www.facebook.com/v19.0/dialog/oauth" +
    `?client_id=${encodeURIComponent(FACEBOOK_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&state=${encodeURIComponent(state)}` +
    `&scope=${encodeURIComponent(scope)}`;

  // navigate
  window.location.href = authUrl;
}

/**
 * STEP 2 — Complete Facebook OAuth (called from callback page)
 *
 * This function:
 *  - validates returned state with stored state (only removes stored values after success)
 *  - falls back to stored userId if Clerk isn't immediately available on the callback page
 *  - sends the code to the backend (n8n) to exchange, fetch profile/pages, and persist
 */
export async function completeFacebookAuth(opts?: { forceSkipStateCheck?: boolean }) {
  // Read params
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const returnedState = params.get("state");

  if (!code) {
    throw new Error("No authorization code returned from Facebook.");
  }

  // Read stored values
  const storedState = safeLocalStorageGet(STORAGE_KEYS.STATE);
  let storedUserId = safeLocalStorageGet(STORAGE_KEYS.USER_ID);

  // If userId not stored, try to read Clerk if it's available (best-effort)
  if (!storedUserId && typeof (window as any).Clerk !== "undefined") {
    try {
      storedUserId = (window as any).Clerk?.user?.id || null;
    } catch {
      // ignore
    }
  }

  // Validate state
  if (!opts?.forceSkipStateCheck) {
    if (!storedState) {
      // Could be expired/cleared. Fail explicitly with guidance.
      throw new Error("OAuth state missing from storage. Start auth again.");
    }
    if (storedState !== returnedState) {
      throw new Error("Invalid OAuth state");
    }
  } else {
    console.warn("State check skipped by caller (forceSkipStateCheck=true)");
  }

  // Only remove state AFTER it matches (prevents race / double render issues)
  try {
    localStorage.removeItem(STORAGE_KEYS.STATE);
    localStorage.removeItem(STORAGE_KEYS.TIMESTAMP);
  } catch (err) {
    console.warn("Could not remove OAuth state from localStorage", err);
  }

  if (!storedUserId) {
    // This is not fatal necessarily, but backend expects user id to associate token with local user.
    // If your backend does not require user_id, you can omit it. Here we throw to keep behaviour explicit.
    throw new Error("Clerk user id missing. Make sure the initiating user was logged in when starting OAuth.");
  }

  // Send code to backend (n8n) for exchange + profile/pages fetch.
  if (!N8N_URL) {
    throw new Error("N8N webhook URL is not configured (VITE_N8N_WEBHOOK_URL).");
  }

  const payload = {
    provider: "facebook",
    code,
    state: returnedState,
    user_id: storedUserId,
    redirect_uri: REDIRECT_URI,
  };

  const res = await fetch(`${N8N_URL.replace(/\/$/, "")}/oauth-facebook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // bubble up textual error from n8n for debugging
    const text = await res.text().catch(() => "");
    console.error("n8n facebook oauth callback error:", text || res.statusText);
    throw new Error("OAuth callback failed: " + (text || res.statusText));
  }

  const json = await res.json();
  const authData = json.facebook_auth_data as FacebookAuthData | undefined;

  if (!authData) {
    console.error("Invalid response from OAuth callback:", json);
    throw new Error("Invalid response from OAuth callback");
  }

  // Persist locally for quick UI access (you still should persist in backend DB)
  saveFacebookAuthData(authData);

  return authData;
}

/* ---------- localStorage helpers ---------- */

export function saveFacebookAuthData(data: FacebookAuthData): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTH_DATA, JSON.stringify(data));
  } catch (err) {
    console.warn("Could not persist facebook auth data to localStorage", err);
  }
}

export function getFacebookAuthData(): FacebookAuthData | null {
  const raw = safeLocalStorageGet(STORAGE_KEYS.AUTH_DATA);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FacebookAuthData;
  } catch {
    return null;
  }
}

export function clearFacebookAuthData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_DATA);
  } catch {
    // ignore
  }
}

export function isFacebookConnected(): boolean {
  return !!safeLocalStorageGet(STORAGE_KEYS.AUTH_DATA);
}

/* ---------- small helpers ---------- */

function safeLocalStorageGet(key: string) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn("localStorage access failed for key", key, err);
    return null;
  }
}
