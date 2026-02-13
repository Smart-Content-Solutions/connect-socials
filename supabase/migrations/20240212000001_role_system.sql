-- Role System Database Migration
-- Run this in your Supabase SQL Editor

-- Create app_settings table for storing role configuration
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policy: Everyone can read role config
CREATE POLICY "Allow public read access to role config"
ON app_settings FOR SELECT
TO public
USING (key = 'role_config');

-- Create policy: Only admins can modify role config
CREATE POLICY "Only admins can modify role config"
ON app_settings FOR ALL
TO authenticated
USING (
    key = 'role_config' 
    AND EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND (
            raw_user_meta_data->>'base_tier' = 'admin' 
            OR raw_user_meta_data->>'role' = 'admin'
        )
    )
)
WITH CHECK (
    key = 'role_config' 
    AND EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND (
            raw_user_meta_data->>'base_tier' = 'admin' 
            OR raw_user_meta_data->>'role' = 'admin'
        )
    )
);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at 
    BEFORE UPDATE ON app_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default role config (will be used if none exists)
INSERT INTO app_settings (key, value)
VALUES ('role_config', '{
    "mainRoles": [
        {
            "id": "admin",
            "name": "Admin",
            "description": "Full access to everything. System administrator role.",
            "color": "text-purple-400",
            "bgColor": "bg-purple-500/20",
            "borderColor": "border-purple-500/30",
            "icon": "Crown",
            "priority": 100,
            "toolIds": ["*"],
            "isSystem": true
        },
        {
            "id": "early_access",
            "name": "Early Access",
            "description": "Early adopter access with premium tool grants.",
            "color": "text-yellow-400",
            "bgColor": "bg-yellow-500/20",
            "borderColor": "border-yellow-500/30",
            "icon": "Star",
            "priority": 30,
            "toolIds": [
                "social-automation",
                "wordpress-seo",
                "ai-agent",
                "email-engine",
                "content-engine"
            ],
            "isSystem": true
        },
        {
            "id": "pro",
            "name": "Pro",
            "description": "Professional tier with core tool access.",
            "color": "text-blue-400",
            "bgColor": "bg-blue-500/20",
            "borderColor": "border-blue-500/30",
            "icon": "Shield",
            "priority": 20,
            "toolIds": [
                "social-automation",
                "wordpress-seo"
            ],
            "isSystem": true
        },
        {
            "id": "free",
            "name": "Free",
            "description": "Free tier with limited access.",
            "color": "text-gray-400",
            "bgColor": "bg-gray-500/20",
            "borderColor": "border-gray-500/30",
            "icon": "User",
            "priority": 0,
            "toolIds": [],
            "isSystem": true
        }
    ],
    "addOnRoles": [
        {
            "id": "social_automation",
            "name": "Social Automation",
            "description": "Grants access to social media posting and scheduling tools.",
            "color": "text-emerald-400",
            "bgColor": "bg-emerald-500/20",
            "borderColor": "border-emerald-500/30",
            "icon": "Share2",
            "toolIds": ["social-automation"]
        },
        {
            "id": "wp_ai_agent",
            "name": "WordPress AI Agent",
            "description": "Grants access to WordPress SEO and AI optimization tools.",
            "color": "text-sky-400",
            "bgColor": "bg-sky-500/20",
            "borderColor": "border-sky-500/30",
            "icon": "Globe",
            "toolIds": ["wordpress-seo"]
        },
        {
            "id": "ai_agent",
            "name": "AI Agent",
            "description": "Grants access to the AI agent training and optimization tool.",
            "color": "text-violet-400",
            "bgColor": "bg-violet-500/20",
            "borderColor": "border-violet-500/30",
            "icon": "Brain",
            "toolIds": ["ai-agent"]
        },
        {
            "id": "ai_video",
            "name": "AI Video Generation",
            "description": "Grants access to AI-powered video generation tools.",
            "color": "text-pink-400",
            "bgColor": "bg-pink-500/20",
            "borderColor": "border-pink-500/30",
            "icon": "Video",
            "toolIds": []
        }
    ],
    "version": 1
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
