-- Create note_views table to track device breakdown per note
CREATE TABLE IF NOT EXISTS public.note_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.shared_notes(id) ON DELETE CASCADE,
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'desktop', 'ios', 'unknown')),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_note_views_note_id ON public.note_views(note_id);
CREATE INDEX IF NOT EXISTS idx_note_views_device_type ON public.note_views(device_type);

-- Enable RLS (optional, accessed via service role)
ALTER TABLE public.note_views ENABLE ROW LEVEL SECURITY;

-- Allow public read access for dashboard
CREATE POLICY "Allow public read note views"
  ON public.note_views
  FOR SELECT
  USING (true);