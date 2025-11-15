-- Create shared_notes table
CREATE TABLE public.shared_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  short_description TEXT,
  description TEXT NOT NULL,
  password TEXT,
  color_theme TEXT NOT NULL DEFAULT 'black-purple',
  anonymous_user_id TEXT NOT NULL,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.shared_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read published notes" 
ON public.shared_notes 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public note insert" 
ON public.shared_notes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public note update" 
ON public.shared_notes 
FOR UPDATE 
USING (true);

-- Create index for faster slug lookups
CREATE INDEX idx_shared_notes_slug ON public.shared_notes(slug);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_shared_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_shared_notes_updated_at
BEFORE UPDATE ON public.shared_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_shared_notes_updated_at();