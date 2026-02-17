-- Migration: Create post_drafts table
-- Description: Stores draft post data for users to prevent data loss when navigating away
-- Created: 2026-02-17

-- Create the post_drafts table
CREATE TABLE IF NOT EXISTS post_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,  -- Clerk user ID
    tool_type TEXT NOT NULL,  -- 'social-automation', 'wordpress-create', 'ai-editor'
    draft_data JSONB NOT NULL,  -- Flexible storage for all form fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one draft per user per tool
    CONSTRAINT unique_user_tool_draft UNIQUE(user_id, tool_type)
);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_post_drafts_user_id ON post_drafts(user_id);

-- Create index for faster lookups by user_id and tool_type
CREATE INDEX IF NOT EXISTS idx_post_drafts_user_tool ON post_drafts(user_id, tool_type);

-- Enable Row Level Security
ALTER TABLE post_drafts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own drafts
CREATE POLICY "Users can view own drafts" ON post_drafts
    FOR SELECT USING (user_id = auth.uid()::text);

-- Policy: Users can only insert their own drafts
CREATE POLICY "Users can insert own drafts" ON post_drafts
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Policy: Users can only update their own drafts
CREATE POLICY "Users can update own drafts" ON post_drafts
    FOR UPDATE USING (user_id = auth.uid()::text);

-- Policy: Users can only delete their own drafts
CREATE POLICY "Users can delete own drafts" ON post_drafts
    FOR DELETE USING (user_id = auth.uid()::text);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at on row modification
DROP TRIGGER IF EXISTS update_post_drafts_updated_at ON post_drafts;
CREATE TRIGGER update_post_drafts_updated_at
    BEFORE UPDATE ON post_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE post_drafts IS 'Stores draft post data for users to prevent data loss when navigating away from post creation tools';
COMMENT ON COLUMN post_drafts.user_id IS 'Clerk authentication user ID';
COMMENT ON COLUMN post_drafts.tool_type IS 'Identifier for the tool: social-automation, wordpress-create, ai-editor';
COMMENT ON COLUMN post_drafts.draft_data IS 'JSON object containing all form field data for the draft';
