-- Create table for tracking AI Agent activities
CREATE TABLE IF NOT EXISTS ai_agent_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('training', 'editing')),
    
    -- Training-specific fields
    site_name TEXT,
    site_url TEXT,
    training_data JSONB,
    
    -- Editing-specific fields
    post_id TEXT,
    post_title TEXT,
    post_url TEXT,
    original_score INTEGER,
    improved_score INTEGER,
    improvements JSONB,
    
    -- Common fields
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_agent_activities_user_id ON ai_agent_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_activities_type ON ai_agent_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_ai_agent_activities_created_at ON ai_agent_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_agent_activities_status ON ai_agent_activities(status);

-- Create composite index for user queries
CREATE INDEX IF NOT EXISTS idx_ai_agent_activities_user_type_date 
    ON ai_agent_activities(user_id, activity_type, created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE ai_agent_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own activities via the frontend
-- Backend (n8n) uses service_role key which bypasses all RLS
CREATE POLICY "Users can view own activities"
    ON ai_agent_activities
    FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Note: INSERT and UPDATE policies are not needed because:
-- 1. Frontend never inserts/updates (only n8n does)
-- 2. n8n uses service_role key which bypasses all RLS policies

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_agent_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_agent_activities_updated_at
    BEFORE UPDATE ON ai_agent_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_agent_activities_updated_at();

-- Add comment for documentation
COMMENT ON TABLE ai_agent_activities IS 'Tracks all AI Agent activities including training sessions and post editing for monitoring and analytics';
