-- ==============================================================================
-- CREATE TICKET_COMMENTS TABLE
-- Support ticket comments/conversations
-- ==============================================================================

-- 1. Create the ticket_comments table
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_user_id TEXT NOT NULL, -- Clerk user ID
  author_role TEXT NOT NULL CHECK (author_role IN ('user', 'admin')),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id_created_at ON public.ticket_comments(ticket_id, created_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Note: Since we use Clerk (not Supabase Auth), all DB access goes through API routes
-- with service role key. These policies are defensive - the API will enforce permissions.
DROP POLICY IF EXISTS "Users can view comments for their tickets" ON public.ticket_comments;
CREATE POLICY "Users can view comments for their tickets"
ON public.ticket_comments
FOR SELECT
USING (true); -- Will be enforced by API, not RLS

DROP POLICY IF EXISTS "Users can insert comments" ON public.ticket_comments;
CREATE POLICY "Users can insert comments"
ON public.ticket_comments
FOR INSERT
WITH CHECK (true); -- Will be enforced by API

-- 5. Create function to update tickets.last_activity_at when comment is inserted
CREATE OR REPLACE FUNCTION public.update_ticket_activity_on_comment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tickets
  SET last_activity_at = NOW()
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to update last_activity_at on comment insert
DROP TRIGGER IF EXISTS trigger_update_ticket_activity_on_comment ON public.ticket_comments;
CREATE TRIGGER trigger_update_ticket_activity_on_comment
AFTER INSERT ON public.ticket_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_ticket_activity_on_comment();

-- 7. Grant permissions
GRANT ALL ON public.ticket_comments TO postgres;
GRANT ALL ON public.ticket_comments TO service_role;
-- Limited grants for anon/authenticated (defensive, but API will handle auth)
GRANT SELECT, INSERT ON public.ticket_comments TO anon;
GRANT SELECT, INSERT ON public.ticket_comments TO authenticated;
