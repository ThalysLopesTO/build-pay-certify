-- Check if company-logos bucket exists and create it if not
DO $$
BEGIN
  -- Create company-logos bucket if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'company-logos') THEN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('company-logos', 'company-logos', true);
  END IF;
END $$;

-- Create storage policies for company logo uploads
CREATE POLICY "Allow authenticated users to upload company logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'company-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow public access to company logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'company-logos');

CREATE POLICY "Allow authenticated users to update company logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'company-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete company logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'company-logos' AND auth.role() = 'authenticated');