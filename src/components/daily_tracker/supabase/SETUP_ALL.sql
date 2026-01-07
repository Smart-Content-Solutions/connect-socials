-- 1. Ensure tasks table exists and has required columns
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'To Do',
  priority TEXT NOT NULL DEFAULT 'Medium',
  assignee TEXT NOT NULL DEFAULT 'Unassigned',
  due_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add completed_date column if it doesn't exist (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'completed_date') THEN
        ALTER TABLE public.tasks ADD COLUMN completed_date TIMESTAMPTZ;
    END IF;
END $$;

-- Enable RLS on tasks if not enabled
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 2. Create daily_task_notes table
CREATE TABLE IF NOT EXISTS public.daily_task_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  user_id TEXT,
  notes_text TEXT DEFAULT '',
  time_spent_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  links text[] DEFAULT '{}'::text[],
  UNIQUE(task_id, date)
);

-- Enable RLS
ALTER TABLE public.daily_task_notes ENABLE ROW LEVEL SECURITY;

-- 3. Create daily_task_note_attachments table
CREATE TABLE IF NOT EXISTS public.daily_task_note_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_task_note_id UUID NOT NULL REFERENCES public.daily_task_notes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_task_note_attachments ENABLE ROW LEVEL SECURITY;

-- 4. Create daily_summaries table
CREATE TABLE IF NOT EXISTS public.daily_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  user_id TEXT DEFAULT NULL,
  summary_text TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, user_id)
);

-- Enable RLS
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies (Drop first to avoid duplicates if re-running)
DROP POLICY IF EXISTS "Allow public read access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public insert access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public update access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public delete access to tasks" ON public.tasks;

CREATE POLICY "Allow public read access to tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to tasks" ON public.tasks FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access to daily_task_notes" ON public.daily_task_notes;
DROP POLICY IF EXISTS "Allow public insert access to daily_task_notes" ON public.daily_task_notes;
DROP POLICY IF EXISTS "Allow public update access to daily_task_notes" ON public.daily_task_notes;
DROP POLICY IF EXISTS "Allow public delete access to daily_task_notes" ON public.daily_task_notes;

CREATE POLICY "Allow public read access to daily_task_notes" ON public.daily_task_notes FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to daily_task_notes" ON public.daily_task_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to daily_task_notes" ON public.daily_task_notes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to daily_task_notes" ON public.daily_task_notes FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access to daily_task_note_attachments" ON public.daily_task_note_attachments;
DROP POLICY IF EXISTS "Allow public insert access to daily_task_note_attachments" ON public.daily_task_note_attachments;
DROP POLICY IF EXISTS "Allow public delete access to daily_task_note_attachments" ON public.daily_task_note_attachments;

CREATE POLICY "Allow public read access to daily_task_note_attachments" ON public.daily_task_note_attachments FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to daily_task_note_attachments" ON public.daily_task_note_attachments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access to daily_task_note_attachments" ON public.daily_task_note_attachments FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access to daily_summaries" ON public.daily_summaries;
DROP POLICY IF EXISTS "Allow public insert access to daily_summaries" ON public.daily_summaries;
DROP POLICY IF EXISTS "Allow public update access to daily_summaries" ON public.daily_summaries;
DROP POLICY IF EXISTS "Allow public delete access to daily_summaries" ON public.daily_summaries;

CREATE POLICY "Allow public read access to daily_summaries" ON public.daily_summaries FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to daily_summaries" ON public.daily_summaries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to daily_summaries" ON public.daily_summaries FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to daily_summaries" ON public.daily_summaries FOR DELETE USING (true);

-- 6. Storage Bucket setup (Idempotent)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('daily-note-attachments', 'daily-note-attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public read access to daily note attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload to daily note attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from daily note attachments" ON storage.objects;

CREATE POLICY "Allow public read access to daily note attachments" ON storage.objects FOR SELECT USING (bucket_id = 'daily-note-attachments');
CREATE POLICY "Allow public upload to daily note attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'daily-note-attachments');
CREATE POLICY "Allow public delete from daily note attachments" ON storage.objects FOR DELETE USING (bucket_id = 'daily-note-attachments');

-- 7. Functions and Triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_task_notes_updated_at ON public.daily_task_notes;
CREATE TRIGGER update_daily_task_notes_updated_at BEFORE UPDATE ON public.daily_task_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_summaries_updated_at ON public.daily_summaries;
CREATE TRIGGER update_daily_summaries_updated_at BEFORE UPDATE ON public.daily_summaries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
