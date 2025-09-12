-- Enhanced RLS policies for foremen daily report submission

-- First, check current policies
DO $$
BEGIN
  -- Drop existing policies that might be too restrictive
  DROP POLICY IF EXISTS "Foremen can create daily reports for their company" ON public.daily_reports;
  
  -- Create optimized policy for foremen to submit reports
  CREATE POLICY "Foremen can create daily reports" 
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

  -- Ensure foremen can update their own reports within 24 hours
  DROP POLICY IF EXISTS "Users can update their own daily reports within 24 hours" ON public.daily_reports;
  
  CREATE POLICY "Users can update their own daily reports within 24 hours" 
  ON public.daily_reports 
  FOR UPDATE 
  USING (
    submitted_by = auth.uid() 
    AND created_at > NOW() - INTERVAL '24 hours'
    AND company_id = (
      SELECT company_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
  );

  -- Ensure storage policies allow foremen to upload photos
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('daily-report-photos', 'daily-report-photos', false)
  ON CONFLICT (id) DO NOTHING;

  -- Create storage policies for daily report photos
  DROP POLICY IF EXISTS "Foremen can upload daily report photos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view daily report photos from their company" ON storage.objects;
  
  CREATE POLICY "Foremen can upload daily report photos" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'daily-report-photos' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (
      SELECT company_id::text 
      FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
  );

  CREATE POLICY "Users can view daily report photos from their company" 
  ON storage.objects 
  FOR SELECT 
  USING (
    bucket_id = 'daily-report-photos' 
    AND (storage.foldername(name))[1] = (
      SELECT company_id::text 
      FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
  );

END $$;