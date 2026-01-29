-- Create storage bucket for temporary video reference images
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-temp-images', 'video-temp-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to this bucket (for anonymous users)
CREATE POLICY "Allow public upload to video-temp-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'video-temp-images');

-- Allow public read access
CREATE POLICY "Allow public read from video-temp-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'video-temp-images');

-- Allow deletion (for cleanup)
CREATE POLICY "Allow public delete from video-temp-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'video-temp-images');