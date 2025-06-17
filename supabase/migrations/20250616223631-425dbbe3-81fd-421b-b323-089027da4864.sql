
-- Add logo_url column to companies table
ALTER TABLE public.companies 
ADD COLUMN logo_url TEXT NULL;

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true);

-- Create policy to allow authenticated users to view company logos
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'company-logos' );

-- Create policy to allow company admins to upload their company logo
CREATE POLICY "Company admins can upload logos"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'company-logos' AND auth.role() = 'authenticated' );

-- Create policy to allow company admins to update their company logo
CREATE POLICY "Company admins can update logos"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'company-logos' AND auth.role() = 'authenticated' );

-- Create policy to allow company admins to delete their company logo
CREATE POLICY "Company admins can delete logos"
ON storage.objects FOR DELETE
USING ( bucket_id = 'company-logos' AND auth.role() = 'authenticated' );
