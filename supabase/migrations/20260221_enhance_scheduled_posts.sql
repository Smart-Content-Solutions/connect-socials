-- Enhance the scheduled_posts table with user_id, post_type, payload, and result tracking

-- Add user_id (Clerk user ID) for ownership scoping
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Add post_type to distinguish image vs video
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'image';

-- Add payload snapshot (caption, media urls, settings, platform-specific ids)
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}';

-- Add result_metadata (posted_at, platform_post_ids, etc.)
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS result_metadata JSONB DEFAULT '{}';

-- Add started_at for when processing begins
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- Add posted_at for when post goes live
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;

-- Add cancelled status support and cancelled_at
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Index for user-scoped lookups
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id
ON public.scheduled_posts (user_id);

-- Index for user + status queries (the main tracker query)
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_status
ON public.scheduled_posts (user_id, status);
