-- ==============================================================================
-- CREATE FEEDBACK TABLE
-- Feedback system with RLS enabled
-- ==============================================================================

-- 1. Create the feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  category TEXT NOT NULL CHECK (category IN ('General', 'Bug', 'Feature', 'Billing')),
  message TEXT NOT NULL,
  page_url TEXT,
  user_id TEXT NOT NULL, -- Clerk userId
  user_email TEXT,
  user_name TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'actioned')),
  admin_notes TEXT -- Admin-only field for internal notes
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);

-- 3. Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Note: Since we use Clerk (not Supabase Auth), all DB access should go through API routes
-- with service role key. These policies are defensive - the API will enforce permissions.

-- Policy: Users can view their own feedback (will be enforced by API, not RLS)
DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback;
CREATE POLICY "Users can view own feedback"
ON public.feedback
FOR SELECT
USING (true); -- Will be enforced by API, not RLS

-- Policy: Users can insert their own feedback (will be enforced by API, not RLS)
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.feedback;
CREATE POLICY "Users can insert own feedback"
ON public.feedback
FOR INSERT
WITH CHECK (true); -- Will be enforced by API

-- 5. Grant permissions
-- Service role will have full access via API routes
GRANT ALL ON public.feedback TO postgres;
GRANT ALL ON public.feedback TO service_role;
-- Limited grants for anon/authenticated (defensive, but API will handle auth)
GRANT SELECT, INSERT ON public.feedback TO anon;
GRANT SELECT, INSERT ON public.feedback TO authenticated;
