-- ============================================================
-- SCS Personal Agent Bot — Database Schema
-- ============================================================

-- Table 1: Chat Messages
-- Stores every message in every conversation
CREATE TABLE IF NOT EXISTS personal_agent_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    tool_calls JSONB DEFAULT NULL,
    tool_results JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS personal_agent_chats_user_idx 
    ON personal_agent_chats (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS personal_agent_chats_session_idx 
    ON personal_agent_chats (session_id, created_at ASC);

-- Table 2: Chat Sessions
-- Tracks active conversations
CREATE TABLE IF NOT EXISTS personal_agent_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL UNIQUE,
    title TEXT DEFAULT 'New Chat',
    context JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    message_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS personal_agent_sessions_user_idx 
    ON personal_agent_sessions (user_id, is_active);

-- Table 3: Long-term User Memory
-- Stores preferences, platform info, past interactions
CREATE TABLE IF NOT EXISTS personal_agent_user_memory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    memory_type TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT DEFAULT 'chat',
    importance INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS personal_agent_user_memory_user_idx 
    ON personal_agent_user_memory (user_id, memory_type);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE personal_agent_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_agent_user_memory ENABLE ROW LEVEL SECURITY;

-- personal_agent_chats policies
CREATE POLICY "users_read_own_chats" ON personal_agent_chats
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "users_insert_own_chats" ON personal_agent_chats
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "users_delete_own_chats" ON personal_agent_chats
    FOR DELETE USING (auth.uid()::text = user_id);

-- personal_agent_sessions policies
CREATE POLICY "users_read_own_sessions" ON personal_agent_sessions
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "users_insert_own_sessions" ON personal_agent_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "users_update_own_sessions" ON personal_agent_sessions
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "users_delete_own_sessions" ON personal_agent_sessions
    FOR DELETE USING (auth.uid()::text = user_id);

-- personal_agent_user_memory policies
CREATE POLICY "users_read_own_memory" ON personal_agent_user_memory
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "users_insert_own_memory" ON personal_agent_user_memory
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "users_update_own_memory" ON personal_agent_user_memory
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "users_delete_own_memory" ON personal_agent_user_memory
    FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================
-- Comments for documentation
-- ============================================================

COMMENT ON TABLE personal_agent_chats IS 'Stores all chat messages for the personal AI agent per user';
COMMENT ON TABLE personal_agent_sessions IS 'Tracks active chat sessions per user';
COMMENT ON TABLE personal_agent_user_memory IS 'Long-term memory for personalization (preferences, platforms, etc.)';
