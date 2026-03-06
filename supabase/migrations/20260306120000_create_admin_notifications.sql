-- Admin Notifications (Persistent + Realtime)

CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('ticket', 'feedback')),
    entity_id UUID NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_recipient_read_created
    ON admin_notifications (recipient_user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_recipient_created
    ON admin_notifications (recipient_user_id, created_at DESC);

ALTER TABLE admin_notifications REPLICA IDENTITY FULL;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE ON admin_notifications TO authenticated;

DROP POLICY IF EXISTS "Users can view own notifications" ON admin_notifications;
CREATE POLICY "Users can view own notifications"
    ON admin_notifications FOR SELECT
    TO authenticated
    USING (recipient_user_id = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "Users can update own notifications" ON admin_notifications;
CREATE POLICY "Users can update own notifications"
    ON admin_notifications FOR UPDATE
    TO authenticated
    USING (recipient_user_id = (auth.jwt() ->> 'sub'))
    WITH CHECK (recipient_user_id = (auth.jwt() ->> 'sub'));
