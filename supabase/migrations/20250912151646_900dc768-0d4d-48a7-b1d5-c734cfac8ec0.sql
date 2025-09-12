-- Fix storage policies and daily report submission issues

-- First, ensure the bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public) 
VALUES ('daily-report-photos', 'daily-report-photos', false)
ON CONFLICT (id) DO UPDATE SET 
  public = false;

-- Drop all existing conflicting storage policies for daily-report-photos
DROP POLICY IF EXISTS "Foremen can upload daily report photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view daily report photos from their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own daily report photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view daily report photos from same company" ON storage.objects;

-- Create clean, comprehensive storage policies
CREATE POLICY "Company users can upload daily report photos" 
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

CREATE POLICY "Company users can view daily report photos" 
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

-- Ensure daily_reports table has proper RLS policies
DROP POLICY IF EXISTS "Foremen can create daily reports" ON public.daily_reports;
DROP POLICY IF EXISTS "Users can view daily reports from their company" ON public.daily_reports;

CREATE POLICY "Authorized users can create daily reports" 
ON public.daily_reports 
FOR INSERT 
WITH CHECK (
  submitted_by = auth.uid() 
  AND company_id = (
    SELECT company_id 
    FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('foreman', 'admin', 'super_admin')
    AND is_active = true
  )
);

CREATE POLICY "Company users can view daily reports" 
ON public.daily_reports 
FOR SELECT 
USING (
  company_id = (
    SELECT company_id 
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- Add an index for better performance on daily_reports queries
CREATE INDEX IF NOT EXISTS idx_daily_reports_company_date 
ON public.daily_reports(company_id, report_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_reports_submitted_by 
ON public.daily_reports(submitted_by, created_at DESC);