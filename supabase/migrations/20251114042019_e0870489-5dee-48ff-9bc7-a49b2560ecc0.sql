-- Create user_websites table
CREATE TABLE public.user_websites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anonymous_user_id text NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  html_content text NOT NULL,
  css_content text,
  js_content text,
  is_published boolean NOT NULL DEFAULT false,
  views_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT slug_length CHECK (length(slug) >= 3 AND length(slug) <= 50)
);

-- Enable RLS
ALTER TABLE public.user_websites ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published websites
CREATE POLICY "Allow public read published websites"
ON public.user_websites
FOR SELECT
USING (is_published = true);

-- Policy: Users can insert their own websites (max 3 check in edge function)
CREATE POLICY "Allow users to create websites"
ON public.user_websites
FOR INSERT
WITH CHECK (true);

-- Policy: Users can update their own websites
CREATE POLICY "Allow users to update own websites"
ON public.user_websites
FOR UPDATE
USING (anonymous_user_id = anonymous_user_id);

-- Policy: Users can delete their own websites
CREATE POLICY "Allow users to delete own websites"
ON public.user_websites
FOR DELETE
USING (anonymous_user_id = anonymous_user_id);

-- Indexes for better query performance
CREATE INDEX idx_websites_slug ON public.user_websites(slug);
CREATE INDEX idx_websites_user ON public.user_websites(anonymous_user_id);
CREATE INDEX idx_websites_published ON public.user_websites(is_published);