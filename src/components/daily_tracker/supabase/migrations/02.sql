-- Add links column to daily_task_notes table
ALTER TABLE public.daily_task_notes
ADD COLUMN links text[] DEFAULT '{}'::text[];