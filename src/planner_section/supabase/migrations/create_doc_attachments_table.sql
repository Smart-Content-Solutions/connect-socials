-- ==============================================================================
-- CREATE DOCUMENT ATTACHMENTS TABLE
-- Run this if you see "Could not find the table 'public.doc_attachments'"
-- ==============================================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.doc_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID NOT NULL REFERENCES public.docs(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_doc_attachments_doc_id ON public.doc_attachments(doc_id);

-- 3. Enable Security (RLS)
ALTER TABLE public.doc_attachments ENABLE ROW LEVEL SECURITY;

-- 4. Create Public Access Policy (Matching your other public setup)
-- Drop existing policy to avoid conflict
DROP POLICY IF EXISTS "Enable all access" ON public.doc_attachments;

CREATE POLICY "Enable all access" 
ON public.doc_attachments 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 5. Grant permissions to anon/public roles (Critical for 'schema cache' errors)
GRANT ALL ON public.doc_attachments TO postgres;
GRANT ALL ON public.doc_attachments TO anon;
GRANT ALL ON public.doc_attachments TO authenticated;
GRANT ALL ON public.doc_attachments TO service_role;
