-- 1. Ensure the table exists with the correct schema
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  caption TEXT,
  platforms JSONB,     -- Stores array like ["twitter", "linkedin"]
  media_url TEXT,
  scheduled_time TIMESTAMPTZ NOT NULL, -- MUST be TIMESTAMPTZ for global support
  user_timezone TEXT,  -- Optional: Store the original timezone for reference
  status TEXT DEFAULT 'scheduled', -- scheduled, processing, posted, failed
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  failure_reason TEXT
);

-- 2. Create an index for the scheduler to allow fast finding of due posts
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduler 
ON public.scheduled_posts (status, scheduled_time);
