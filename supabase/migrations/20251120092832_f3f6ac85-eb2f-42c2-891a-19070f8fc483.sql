-- Create custom_ais table for AI Maker feature
CREATE TABLE IF NOT EXISTS public.custom_ais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  random_id text UNIQUE NOT NULL,
  name text NOT NULL,
  short_description text NOT NULL,
  full_instructions text NOT NULL,
  anonymous_user_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  views_count integer DEFAULT 0,
  is_published boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE public.custom_ais ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read published AIs"
  ON public.custom_ais FOR SELECT
  USING (is_published = true);

CREATE POLICY "Allow public AI insert"
  ON public.custom_ais FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public AI update"
  ON public.custom_ais FOR UPDATE
  USING (true);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_custom_ais_random_id ON public.custom_ais(random_id);
CREATE INDEX IF NOT EXISTS idx_custom_ais_anonymous_user_id ON public.custom_ais(anonymous_user_id);

-- Trigger for updated_at (reuse existing function)
CREATE TRIGGER update_custom_ais_updated_at
  BEFORE UPDATE ON public.custom_ais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_shared_notes_updated_at();

-- Create ai_usages table for analytics
CREATE TABLE IF NOT EXISTS public.ai_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_id uuid REFERENCES public.custom_ais(id),
  prompt text NOT NULL,
  response_length integer,
  viewed_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public AI usage insert"
  ON public.ai_usages FOR INSERT
  WITH CHECK (true);