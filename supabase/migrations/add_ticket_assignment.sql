-- ==============================================================================
-- ADD TICKET ASSIGNMENT FIELDS
-- Support ticket assignment to staff/admin
-- ==============================================================================

-- 1. Add assignment columns to tickets table
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS assigned_to_user_id TEXT,
ADD COLUMN IF NOT EXISTS assigned_to_email TEXT,
ADD COLUMN IF NOT EXISTS assigned_to_name TEXT,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to_user_id ON public.tickets(assigned_to_user_id);

-- Note: The existing trigger update_tickets_updated_at() will automatically update
-- updated_at when any column changes, including assignment fields.
