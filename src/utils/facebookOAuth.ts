// src/utils/facebookOAuth.ts
import { getAuth } from "@clerk/clerk-react";

export interface FacebookPage {
  id: string;
  name: string;
  access_token?: string | null;
}

export interface FacebookAuthData {
  access_token: string;
  expires_in: number;
  facebook_user_id: string;
  name?: string;
  email?: string;
  picture?: string;
  pages?: FacebookPage[];
}

export const FACEBOOK_AUTH_STORAGE_KEY = "facebook_auth_data";

const N8N_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;
const FACEBOOK_CLIENT_ID = import.meta.env.VITE_FACEBOOK_CLIENT_ID;
const REDIRECT_URI = "https://www.smartcontentsolutions.co.uk/facebook/callback";

function generateState(length = 32) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return [...Array(length)]
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
}

// STEP 1 — Redirect user to Facebook OAuth
export async function initiateFacebookAuth() {
  const auth = getAuth();

  if (!auth.userId) throw new Error("User must be logged in to begin Facebook OAuth.");

  const state = generateState();
  localStorage.setItem("facebook_oauth_state", state);

  const authURL =
    "https://www.facebook.com/v19.0/dialog/oauth" +
    `?client_id=${FACEBOOK_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&state=${state}` +
    `&scope=${encodeURIComponent(
      "email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts"
    )}`;

  window.location.href = authURL;
}

// STEP 2 — Callback handler
export async function completeFacebookAuth() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const returnedState = params.get("state");
  const storedState = localStorage.getItem("facebook_oauth_state");

  localStorage.removeItem("facebook_oauth_state");

  if (!code) throw new Error("Missing authorization code.");
  if (storedState !== returnedState) throw new Error("Invalid OAuth state.");

  const auth = getAuth();
  if (!auth.userId) throw new Error("Clerk user missing. Must be logged in when starting OAuth.");

  const response = await fetch(`${N8N_URL}/oauth-facebook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: "facebook",
      code,
      state: returnedState,
      user_id: auth.userId,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("n8n facebook oauth callback error:", errorText);
    throw new Error("OAuth callback failed.");
  }

  const json = await response.json();
  const authData = json.facebook_auth_data as FacebookAuthData;

  if (!authData) throw new Error("Invalid response from OAuth callback");

  localStorage.setItem(FACEBOOK_AUTH_STORAGE_KEY, JSON.stringify(authData));

  return authData;
}

export function getFacebookAuthData(): FacebookAuthData | null {
  const stored = localStorage.getItem(FACEBOOK_AUTH_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function clearFacebookAuthData() {
  localStorage.removeItem(FACEBOOK_AUTH_STORAGE_KEY);
}

export function isFacebookConnected(): boolean {
  return !!localStorage.getItem(FACEBOOK_AUTH_STORAGE_KEY);
}
