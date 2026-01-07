-- ==========================================
-- FULL DATABASE SETUP (Consolidated - SAFE VERSION)
-- ==========================================

-- 1. CREATE TABLES (Using IF NOT EXISTS to prevent data loss)
CREATE TABLE IF NOT EXISTS public.docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Untitled page',
  content TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL DEFAULT 'Dominik',
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Blocked', 'Done')),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  assignee TEXT NOT NULL DEFAULT 'Dominik',
  due_date DATE,
  completed_date DATE,
  sort_order INTEGER DEFAULT 0,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.doc_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID REFERENCES public.docs(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. AUTOMATION
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'docs' THEN
    NEW.last_updated = now();
  ELSE
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Dropping triggers before re-creating to avoid errors if they already exist
DROP TRIGGER IF EXISTS tr_update_tasks_time ON public.tasks;
DROP TRIGGER IF EXISTS tr_update_docs_time ON public.docs;

CREATE TRIGGER tr_update_tasks_time BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER tr_update_docs_time BEFORE UPDATE ON public.docs FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 3. SECURITY (Table RLS)
ALTER TABLE public.docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Public Admin Access for Docs" ON public.docs;
DROP POLICY IF EXISTS "Public Admin Access for Tasks" ON public.tasks;
DROP POLICY IF EXISTS "Public Admin Access for Task Attachments" ON public.task_attachments;
DROP POLICY IF EXISTS "Public Admin Access for Doc Attachments" ON public.doc_attachments;

CREATE POLICY "Public Admin Access for Docs" ON public.docs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Admin Access for Tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Admin Access for Task Attachments" ON public.task_attachments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Admin Access for Doc Attachments" ON public.doc_attachments FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- 4. STORAGE BUCKETS & POLICIES
INSERT INTO storage.buckets (id, name, public) 
VALUES ('task-attachments', 'task-attachments', true),
       ('doc-attachments', 'doc-attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id IN ('task-attachments', 'doc-attachments'));
CREATE POLICY "Allow public downloads" ON storage.objects FOR SELECT TO public USING (bucket_id IN ('task-attachments', 'doc-attachments'));
CREATE POLICY "Allow public deletes" ON storage.objects FOR DELETE TO public USING (bucket_id IN ('task-attachments', 'doc-attachments'));
