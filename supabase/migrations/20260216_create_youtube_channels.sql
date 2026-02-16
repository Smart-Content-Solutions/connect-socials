-- Create youtube_channels table to store connected channel credentials
CREATE TABLE IF NOT EXISTS public.youtube_channels (
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL PRIMARY KEY,
    channel_title TEXT,
    channel_thumbnail TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_youtube_channels_user_id ON public.youtube_channels(user_id);

-- Enable RLS (Optional, but good practice)
ALTER TABLE public.youtube_channels ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own channels
CREATE POLICY "Users can view own youtube channels" 
ON public.youtube_channels FOR SELECT 
USING (auth.uid()::text = user_id);

-- Allow n8n (service_role) full access - usually bypassed by service key, but specific policy can be added if needed
-- For now, the n8n Postgres node uses a direct connection which typically bypasses RLS if using the postgres/service_role user.
