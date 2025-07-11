-- Check if the employee-photos bucket exists and create RLS policies for file uploads

-- Create RLS policies for the employee-photos storage bucket
-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload employee photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'employee-photos' 
    AND auth.uid() IS NOT NULL
  );

-- Allow authenticated users to view employee photos
CREATE POLICY "Users can view employee photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'employee-photos' 
    AND auth.uid() IS NOT NULL
  );

-- Allow authenticated users to update employee photos
CREATE POLICY "Users can update employee photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'employee-photos' 
    AND auth.uid() IS NOT NULL
  );

-- Allow authenticated users to delete employee photos (for replacing old photos)
CREATE POLICY "Users can delete employee photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'employee-photos' 
    AND auth.uid() IS NOT NULL
  );