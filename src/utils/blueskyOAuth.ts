// Bluesky OAuth utilities
const BLUESKY_STORAGE_KEY = "bluesky_credentials";

export interface BlueskyCredentials {
  username: string;
  password: string;
  connected: boolean;
}

export const saveBlueskyCredentials = (username: string, password: string): void => {
  const credentials: BlueskyCredentials = {
    username,
    password,
    connected: true,
  };
  localStorage.setItem(BLUESKY_STORAGE_KEY, JSON.stringify(credentials));
};

export const initiateBlueskyAuth = async (username: string, password: string, userId: string): Promise<void> => {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL + "oauth-callback";
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider: 'bluesky',
      user_id: userId,
      username: username,
      password: password,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to sync Bluesky account: ${error}`);
  }

  // Also save locally for UI convenience
  saveBlueskyCredentials(username, password);
};

export const getBlueskyCredentials = (): BlueskyCredentials | null => {
  const stored = localStorage.getItem(BLUESKY_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const clearBlueskyCredentials = (): void => {
  localStorage.removeItem(BLUESKY_STORAGE_KEY);
};

export const isBlueskyConnected = (): boolean => {
  const credentials = getBlueskyCredentials();
  return credentials?.connected === true;
};