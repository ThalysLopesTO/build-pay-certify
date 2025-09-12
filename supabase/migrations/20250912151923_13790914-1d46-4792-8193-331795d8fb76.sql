-- Clean up and fix storage policies for daily report photos

-- Drop ALL existing storage policies that might conflict
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    -- Find and drop all policies on storage.objects for daily-report-photos bucket
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname LIKE '%daily%report%' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Ensure the bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public) 
VALUES ('daily-report-photos', 'daily-report-photos', false)
ON CONFLICT (id) DO UPDATE SET 
  public = false;

-- Create clean storage policies with unique names
CREATE POLICY "daily_report_photo_upload_policy" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'daily-report-photos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT company_id::text 
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
    AND role IN ('foreman', 'admin', 'super_admin')
    AND is_active = true
  )
);

CREATE POLICY "daily_report_photo_view_policy" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'daily-report-photos' 
  AND (storage.foldername(name))[1] = (
    SELECT company_id::text 
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);