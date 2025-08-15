-- Create missing storage buckets for employee functionality
DO $$
BEGIN
  -- Create employee-photos bucket if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'employee-photos') THEN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('employee-photos', 'employee-photos', true);
  END IF;
  
  -- Create certificates bucket if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'certificates') THEN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('certificates', 'certificates', false);
  END IF;
END $$;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop and recreate employee-photos policies
  DROP POLICY IF EXISTS "Allow authenticated users to upload employee photos" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public access to employee photos" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to update employee photos" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to delete employee photos" ON storage.objects;

  -- Drop and recreate certificates policies
  DROP POLICY IF EXISTS "Allow authenticated users to upload certificates" ON storage.objects;
  DROP POLICY IF EXISTS "Allow company users to view their certificates" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to update certificates" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to delete certificates" ON storage.objects;
END $$;

-- Create storage policies for employee-photos bucket
CREATE POLICY "Allow authenticated users to upload employee photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'employee-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow public access to employee photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'employee-photos');

CREATE POLICY "Allow authenticated users to update employee photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'employee-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete employee photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'employee-photos' AND auth.role() = 'authenticated');

-- Create storage policies for certificates bucket
CREATE POLICY "Allow authenticated users to upload certificates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'certificates' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow company users to view their certificates" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'certificates' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update certificates" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'certificates' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete certificates" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'certificates' AND auth.role() = 'authenticated');

-- Fix company license issues by updating expired licenses to active
UPDATE companies 
SET 
  license_expires_at = '2025-12-31 23:59:59'::timestamp with time zone,
  status = 'active',
  subscription_status = 'active'
WHERE status = 'revoked' OR license_expires_at < NOW() OR subscription_status = 'inactive';