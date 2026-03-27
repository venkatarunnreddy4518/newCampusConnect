
-- Add trailer_url to events and clubs
ALTER TABLE public.events ADD COLUMN trailer_url TEXT DEFAULT NULL;
ALTER TABLE public.clubs ADD COLUMN trailer_url TEXT DEFAULT NULL;

-- Create storage bucket for trailer videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('trailer-videos', 'trailer-videos', true);

-- Allow authenticated users to upload trailers (admins/sub-admins handle via app logic)
CREATE POLICY "Authenticated users can upload trailers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'trailer-videos');

CREATE POLICY "Anyone can view trailers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'trailer-videos');

CREATE POLICY "Authenticated users can update trailers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'trailer-videos');

CREATE POLICY "Authenticated users can delete trailers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'trailer-videos');
