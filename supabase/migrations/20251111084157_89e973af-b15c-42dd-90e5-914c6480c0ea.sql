-- Fix security warnings: Add search_path to functions
DROP FUNCTION IF EXISTS public.delete_expired_transcripts();
DROP FUNCTION IF EXISTS public.cleanup_on_insert() CASCADE;

-- Recreate function to delete expired transcripts with proper search_path
CREATE OR REPLACE FUNCTION public.delete_expired_transcripts()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.youtube_transcripts
  WHERE expires_at < now();
END;
$$;

-- Recreate cleanup trigger function with proper search_path
CREATE OR REPLACE FUNCTION public.cleanup_on_insert()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.delete_expired_transcripts();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_cleanup_expired
BEFORE INSERT ON public.youtube_transcripts
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_on_insert();