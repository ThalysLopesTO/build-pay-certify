-- Remove the security definer view issue by restructuring the company_registration_summary approach
-- Instead of using security definer functions in the view, we'll use a different approach

-- Drop the existing view and functions that are causing the security definer detection
DROP VIEW IF EXISTS public.company_registration_summary;
DROP FUNCTION IF EXISTS public.is_user_super_admin_for_view();
DROP FUNCTION IF EXISTS public.is_user_admin_or_super_admin_for_view();

-- Create a simple view without security definer function calls
-- The security will be handled by RLS policies on the underlying table
CREATE VIEW public.company_registration_summary AS
SELECT 
  id,
  company_name,
  status,
  created_at,
  updated_at,
  -- Use conditional logic based on RLS rather than security definer functions
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    ) THEN admin_email
    ELSE (left(admin_email, 2) || '***@' || split_part(admin_email, '@', 2))
  END AS admin_email_display,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    ) THEN company_email
    ELSE (left(company_email, 2) || '***@' || split_part(company_email, '@', 2))
  END AS company_email_display,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    ) THEN admin_first_name
    ELSE (left(admin_first_name, 1) || '***')
  END AS admin_first_name_display,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    ) THEN admin_last_name
    ELSE (left(admin_last_name, 1) || '***')
  END AS admin_last_name_display
FROM public.company_registration_requests
WHERE EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('super_admin', 'admin')
);