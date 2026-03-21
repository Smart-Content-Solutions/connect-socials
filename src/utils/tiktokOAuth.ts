// src/utils/tiktokOAuth.ts
import { supabase } from "@/lib/supabase";

export interface TikTokAuthData {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  open_id?: string;
  union_id?: string;
  display_name?: string;
  avatar_url?: string | null;
}

export const TIKTOK_AUTH_STORAGE_KEY = "tiktok_auth_data";
export const TIKTOK_CONNECTED_ACCOUNTS_KEY = "tiktok_connected_accounts";
const OAUTH_STATE_KEY = "tiktok_oauth_state";
const OAUTH_INITIATOR_USER_KEY = "tiktok_oauth_user_id";

const N8N_URL = import.meta.env.VITE_N8N_WEBHOOK_URL ?? "";
const TIKTOK_CLIENT_KEY = import.meta.env.VITE_TIKTOK_CLIENT_KEY ?? "";

// Must match TikTok developer configuration
export const REDIRECT_URI = "https://www.smartcontentsolutions.co.uk/tiktok/callback";

// helper
function generateState(length = 32) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
}

export function saveTikTokAuthData(data: TikTokAuthData): void {
  localStorage.setItem(TIKTOK_AUTH_STORAGE_KEY, JSON.stringify(data));

  // Also add to the list of connected accounts
  const connected = getConnectedTikTokAccounts();
  const exists = connected.findIndex(acc => acc.open_id === data.open_id);

  if (exists > -1) {
    connected[exists] = data;
  } else {
    connected.push(data);
  }

  localStorage.setItem(TIKTOK_CONNECTED_ACCOUNTS_KEY, JSON.stringify(connected));

  // Save to Supabase for OpenCLAW access (async, don't wait)
  const clerkUserId = (window as any).Clerk?.user?.id;
  if (clerkUserId && data.open_id) {
    saveCredentialsToSupabase(clerkUserId, data);
  }
}

// Save credentials to Supabase for OpenCLAW access
async function saveCredentialsToSupabase(userId: string, data: TikTokAuthData): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_social_credentials')
      .upsert({
        user_id: userId,
        platform: 'tiktok',
        credentials: data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform'
      });

    if (error) {
      console.error('Error saving TikTok credentials to Supabase:', error);
    } else {
      console.log('TikTok credentials saved to Supabase for user', userId);
    }
  } catch (err) {
    console.error('Failed to save TikTok credentials:', err);
  }
}

// Check if TikTok is connected via Supabase (for OpenCLAW)
export async function isPlatformConnectedInSupabase(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_social_credentials')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', 'tiktok')
      .single();

    return !!data && !error;
  } catch {
    return false;
  }
}

// Get TikTok credentials from Supabase (for OpenCLAW)
export async function getCredentialsFromSupabase(userId: string): Promise<TikTokAuthData | null> {
  try {
    const { data, error } = await supabase
      .from('user_social_credentials')
      .select('credentials')
      .eq('user_id', userId)
      .eq('platform', 'tiktok')
      .single();

    return error ? null : data?.credentials;
  } catch {
    return null;
  }
}

export function getTikTokAuthData(): TikTokAuthData | null {
  const stored = localStorage.getItem(TIKTOK_AUTH_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function getConnectedTikTokAccounts(): TikTokAuthData[] {
  const stored = localStorage.getItem(TIKTOK_CONNECTED_ACCOUNTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function clearTikTokAuthData(): Promise<void> {
  localStorage.removeItem(TIKTOK_AUTH_STORAGE_KEY);
  localStorage.removeItem(TIKTOK_CONNECTED_ACCOUNTS_KEY);

  // Also remove from Supabase so OpenCLAW sees "disconnected"
  const clerkUserId = (window as any).Clerk?.user?.id;
  if (clerkUserId) {
    await supabase
      .from('user_social_credentials')
      .delete()
      .eq('user_id', clerkUserId)
      .eq('platform', 'tiktok');
  }
}

export async function removeTikTokAccount(openId: string): Promise<void> {
  const connected = getConnectedTikTokAccounts();
  const updated = connected.filter(acc => acc.open_id !== openId);
  localStorage.setItem(TIKTOK_CONNECTED_ACCOUNTS_KEY, JSON.stringify(updated));

  // If we removed the currently active one, clear it or pick another
  const current = getTikTokAuthData();
  if (current?.open_id === openId) {
    if (updated.length > 0) {
      localStorage.setItem(TIKTOK_AUTH_STORAGE_KEY, JSON.stringify(updated[0]));
    } else {
      localStorage.removeItem(TIKTOK_AUTH_STORAGE_KEY);
      // Also remove from Supabase if no accounts left
      const clerkUserId = (window as any).Clerk?.user?.id;
      if (clerkUserId) {
        await supabase
          .from('user_social_credentials')
          .delete()
          .eq('user_id', clerkUserId)
          .eq('platform', 'tiktok');
      }
    }
  }
}

// STEP 1 → Start OAuth
export async function initiateTikTokAuth(): Promise<void> {
  const clerkUserId = (window as any).Clerk?.user?.id ?? null;

  if (!clerkUserId) {
    throw new Error("User must be logged in before starting TikTok OAuth.");
  }

  const state = generateState();

  localStorage.setItem(OAUTH_STATE_KEY, state);
  localStorage.setItem(OAUTH_INITIATOR_USER_KEY, clerkUserId);

  const scope = "user.info.basic,user.info.profile,user.info.stats,video.list,video.upload,video.publish";

  // Use the client key provided by the user
  const CLIENT_KEY = "awnmeaaxhw1uhtjy";

  const authUrl =
    "https://www.tiktok.com/v2/auth/authorize/?" +
    `client_key=${encodeURIComponent(CLIENT_KEY)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${encodeURIComponent(state)}`;

  const w = window.open(authUrl, "_blank", "width=600,height=800");
  if (!w) throw new Error("Failed to open TikTok authorization window.");
}

// STEP 2 → Complete OAuth callback
export async function completeTikTokAuth(query: { code?: string; state?: string }) {
  if (!N8N_URL) throw new Error("N8N webhook URL missing (VITE_N8N_WEBHOOK_URL)");

  const body = {
    code: query.code,
    state: query.state,
    initiator_user_id: localStorage.getItem(OAUTH_INITIATOR_USER_KEY) ?? null,
  };

  const res = await fetch(`${N8N_URL}/oauth-tiktok`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error("tiktok oauth error:", await res.text());
    throw new Error("TikTok OAuth callback failed.");
  }

  const json = await res.json();
  const data = json.tiktok_auth_data as TikTokAuthData | undefined;

  if (!data) throw new Error("Invalid TikTok auth response.");

  saveTikTokAuthData(data);

  localStorage.removeItem(OAUTH_INITIATOR_USER_KEY);
  localStorage.removeItem(OAUTH_STATE_KEY);

  return data;
}

export function isTikTokConnected(): boolean {
  return getConnectedTikTokAccounts().length > 0;
}
