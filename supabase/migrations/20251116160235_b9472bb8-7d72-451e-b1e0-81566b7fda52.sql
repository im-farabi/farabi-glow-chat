-- Fix security issue: Add INSERT policy for note_views
-- The get-note edge function needs to insert view records

CREATE POLICY "Allow public insert note views"
  ON public.note_views
  FOR INSERT
  WITH CHECK (true);