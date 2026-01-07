-- Create daily_summaries table
CREATE TABLE public.daily_summaries (
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

-- Create policies for public access (matching existing pattern)
CREATE POLICY "Allow public read access to daily_summaries"
ON public.daily_summaries
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert access to daily_summaries"
ON public.daily_summaries
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update access to daily_summaries"
ON public.daily_summaries
FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete access to daily_summaries"
ON public.daily_summaries
FOR DELETE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_summaries_updated_at
BEFORE UPDATE ON public.daily_summaries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();