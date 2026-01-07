-- Create tasks table
CREATE TABLE public.tasks (
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

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Public read policy for tasks (demo app without auth)
CREATE POLICY "Allow public read access to tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to tasks" ON public.tasks FOR DELETE USING (true);

-- Create daily_task_notes table
CREATE TABLE public.daily_task_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  user_id TEXT,
  notes_text TEXT DEFAULT '',
  time_spent_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, date)
);

-- Enable RLS
ALTER TABLE public.daily_task_notes ENABLE ROW LEVEL SECURITY;

-- Public access policies for daily_task_notes
CREATE POLICY "Allow public read access to daily_task_notes" ON public.daily_task_notes FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to daily_task_notes" ON public.daily_task_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to daily_task_notes" ON public.daily_task_notes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to daily_task_notes" ON public.daily_task_notes FOR DELETE USING (true);

-- Create daily_task_note_attachments table
CREATE TABLE public.daily_task_note_attachments (
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

-- Public access policies for attachments
CREATE POLICY "Allow public read access to daily_task_note_attachments" ON public.daily_task_note_attachments FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to daily_task_note_attachments" ON public.daily_task_note_attachments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access to daily_task_note_attachments" ON public.daily_task_note_attachments FOR DELETE USING (true);

-- Create storage bucket for daily note attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('daily-note-attachments', 'daily-note-attachments', true);

-- Storage policies
CREATE POLICY "Allow public read access to daily note attachments" ON storage.objects FOR SELECT USING (bucket_id = 'daily-note-attachments');
CREATE POLICY "Allow public upload to daily note attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'daily-note-attachments');
CREATE POLICY "Allow public delete from daily note attachments" ON storage.objects FOR DELETE USING (bucket_id = 'daily-note-attachments');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_task_notes_updated_at
  BEFORE UPDATE ON public.daily_task_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();