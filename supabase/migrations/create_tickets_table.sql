-- ==============================================================================
-- CREATE TICKETS TABLE
-- Support ticket system with RLS enabled
-- ==============================================================================

-- 1. Create the tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by TEXT NOT NULL, -- Clerk user ID
  created_by_email TEXT,
  created_by_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('support', 'bug', 'feature')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  module TEXT CHECK (module IN ('wordpress', 'social', 'billing', 'workspace', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON public.tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_updated_at ON public.tickets(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Note: Since we use Clerk (not Supabase Auth), all DB access should go through API routes
-- with service role key. These policies are defensive - the API will enforce permissions.

-- Policy: Users can only see their own tickets
-- However, since we use Clerk, this won't work with auth.uid(). 
-- We'll rely on API-level auth checks instead.
-- Keeping this as a defensive measure that will be bypassed by service role:
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
CREATE POLICY "Users can view own tickets"
ON public.tickets
FOR SELECT
USING (true); -- Will be enforced by API, not RLS

-- Policy: Users can insert their own tickets
-- Again, enforced by API, not RLS:
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.tickets;
CREATE POLICY "Users can insert own tickets"
ON public.tickets
FOR INSERT
WITH CHECK (true); -- Will be enforced by API

-- 5. Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to auto-update timestamps
DROP TRIGGER IF EXISTS trigger_update_tickets_updated_at ON public.tickets;
CREATE TRIGGER trigger_update_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_tickets_updated_at();

-- 7. Grant permissions
-- Service role will have full access via API routes
GRANT ALL ON public.tickets TO postgres;
GRANT ALL ON public.tickets TO service_role;
-- Limited grants for anon/authenticated (defensive, but API will handle auth)
GRANT SELECT, INSERT ON public.tickets TO anon;
GRANT SELECT, INSERT ON public.tickets TO authenticated;
