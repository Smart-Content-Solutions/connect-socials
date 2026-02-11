-- AI Video Jobs Table
-- This table logs all AI video generation jobs for tracking, debugging, and cost monitoring

CREATE TABLE IF NOT EXISTS ai_video_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    prompt TEXT,
    source_image_url TEXT,
    generation_type TEXT DEFAULT 'image' CHECK (generation_type IN ('image', 'text')),
    output_url TEXT,
    duration INTEGER NOT NULL DEFAULT 5 CHECK (duration IN (5, 10, 15)),
    aspect_ratio TEXT DEFAULT '9:16',
    provider TEXT DEFAULT 'higgsfield',
    higgsfield_job_id TEXT UNIQUE,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    metadata JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_video_jobs_user ON ai_video_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_video_jobs_status ON ai_video_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_video_jobs_created ON ai_video_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_video_jobs_higgsfield_id ON ai_video_jobs(higgsfield_job_id);

-- Comments for documentation
COMMENT ON TABLE ai_video_jobs IS 'Logs all AI video generation jobs from Higgsfield API';
COMMENT ON COLUMN ai_video_jobs.user_id IS 'Clerk user ID who requested the video';
COMMENT ON COLUMN ai_video_jobs.status IS 'Current status of the job: pending, processing, completed, or failed';
COMMENT ON COLUMN ai_video_jobs.prompt IS 'Motion description provided by the user';
COMMENT ON COLUMN ai_video_jobs.source_image_url IS 'URL of the source image in Supabase storage (null for text-to-video)';
COMMENT ON COLUMN ai_video_jobs.output_url IS 'URL of the generated video in Supabase storage';
COMMENT ON COLUMN ai_video_jobs.duration IS 'Video duration in seconds (5, 10, or 15)';
COMMENT ON COLUMN ai_video_jobs.aspect_ratio IS 'Video aspect ratio (default 9:16 for shorts)';
COMMENT ON COLUMN ai_video_jobs.provider IS 'AI provider name (currently only higgsfield)';
COMMENT ON COLUMN ai_video_jobs.higgsfield_job_id IS 'Job ID from Higgsfield API for tracking';
COMMENT ON COLUMN ai_video_jobs.error_message IS 'Error message if job failed';
COMMENT ON COLUMN ai_video_jobs.metadata IS 'Additional metadata from Higgsfield API response';
