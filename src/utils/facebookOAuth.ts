// src/utils/facebookOAuth.ts
import { Clerk } from "@clerk/clerk-js";

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
  pages?: FacebookPage[]; // pages list returned from backend (saved meta)
}

export const FACEBOOK_AUTH_STORAGE_KEY = "facebook_auth_data";

// N8N Workflow URL
const N8N_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

// Facebook App Client ID
const FACEBOOK_CLIENT_ID = import.meta.env.VITE_FACEBOOK_CLIENT_ID;

// FINAL redirect (frontend)
const REDIRECT_URI = "https://www.smartcontentsolutions.co.uk/facebook/callback";

// Generate random state
function generateState(length = 32) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return [...Array(length)]
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
}

// STEP 1 — Start Facebook OAuth
export async function initiateFacebookAuth() {
  const clerkUser = window.Clerk?.user;
  if (!clerkUser) throw new Error("Clerk user not found. Log in first.");

  const state = generateState();
  // store only state
  localStorage.setItem("facebook_oauth_state", state);

  const authUrl =
    "https://www.facebook.com/v19.0/dialog/oauth" +
    `?client_id=${encodeURIComponent(FACEBOOK_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&state=${state}` +
    `&scope=${encodeURIComponent("email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts")}`;

  window.location.href = authUrl;
}

// STEP 2 — Complete Facebook OAuth (called from callback page)
export async function completeFacebookAuth() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const returnedState = params.get("state");
  const storedState = localStorage.getItem("facebook_oauth_state");
  localStorage.removeItem("facebook_oauth_state");

  if (!code) throw new Error("No authorization code returned from Facebook");
  if (storedState !== returnedState) throw new Error("Invalid OAuth state");

  const clerkUser = window.Clerk?.user;
  if (!clerkUser) throw new Error("Clerk user missing.");

  const userId = clerkUser.id;

  // Send code to n8n backend to perform exchange & profile/pages fetch & DB upsert
  const res = await fetch(`${N8N_URL}/oauth-facebook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: "facebook",
      code,
      state: returnedState,
      user_id: userId,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("n8n facebook oauth callback error:", txt);
    throw new Error("OAuth callback failed.");
  }

  const json = await res.json();
  const authData = json.facebook_auth_data as FacebookAuthData | undefined;

  if (!authData) throw new Error("Invalid response from OAuth callback");

  saveFacebookAuthData(authData);
  return authData;
}

// Local storage helpers
export function saveFacebookAuthData(data: FacebookAuthData): void {
  localStorage.setItem(FACEBOOK_AUTH_STORAGE_KEY, JSON.stringify(data));
}

export function getFacebookAuthData(): FacebookAuthData | null {
  const stored = localStorage.getItem(FACEBOOK_AUTH_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function clearFacebookAuthData(): void {
  localStorage.removeItem(FACEBOOK_AUTH_STORAGE_KEY);
}

export function isFacebookConnected(): boolean {
  return !!localStorage.getItem(FACEBOOK_AUTH_STORAGE_KEY);
}
