-- Add generation_type column to ai_video_jobs table for text-to-video support

-- Add the new column if it doesn't exist
ALTER TABLE ai_video_jobs 
ADD COLUMN IF NOT EXISTS generation_type TEXT DEFAULT 'image' CHECK (generation_type IN ('image', 'text'));

-- Update comment for source_image_url since it can now be null
COMMENT ON COLUMN ai_video_jobs.source_image_url IS 'URL of the source image in Supabase storage (null for text-to-video)';

-- Ensure source_image_url is nullable (it was by default but explicit is good)
ALTER TABLE ai_video_jobs ALTER COLUMN source_image_url DROP NOT NULL;
