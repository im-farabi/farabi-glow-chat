-- Create table for YouTube video transcripts with auto-cleanup
CREATE TABLE public.youtube_transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT NOT NULL UNIQUE,
  title TEXT,
  transcript TEXT NOT NULL,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Enable Row Level Security
ALTER TABLE public.youtube_transcripts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (since verify_jwt will be false)
CREATE POLICY "Allow public read access" 
ON public.youtube_transcripts 
FOR SELECT 
USING (true);

-- Create policy to allow public insert access
CREATE POLICY "Allow public insert access" 
ON public.youtube_transcripts 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_youtube_transcripts_video_id ON public.youtube_transcripts(video_id);
CREATE INDEX idx_youtube_transcripts_expires_at ON public.youtube_transcripts(expires_at);

-- Create function to delete expired transcripts
CREATE OR REPLACE FUNCTION public.delete_expired_transcripts()
RETURNS void AS $$
BEGIN
  DELETE FROM public.youtube_transcripts
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run cleanup daily (using pg_cron would be better in production)
-- For now, we'll clean up on each new insert
CREATE OR REPLACE FUNCTION public.cleanup_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.delete_expired_transcripts();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_expired
BEFORE INSERT ON public.youtube_transcripts
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_on_insert();