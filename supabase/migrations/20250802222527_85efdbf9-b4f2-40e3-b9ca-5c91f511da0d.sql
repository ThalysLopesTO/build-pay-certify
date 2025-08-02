-- Create storage bucket for daily report photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('daily-report-photos', 'daily-report-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Create policies for daily report photos
CREATE POLICY "Users can view daily report photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'daily-report-photos');

CREATE POLICY "Authenticated users can upload daily report photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'daily-report-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their company's daily report photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'daily-report-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their company's daily report photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'daily-report-photos' AND auth.role() = 'authenticated');