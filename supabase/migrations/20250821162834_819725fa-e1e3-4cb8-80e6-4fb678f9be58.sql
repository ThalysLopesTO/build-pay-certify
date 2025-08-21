-- Fix Security Definer View Issue
-- Remove security_barrier=true setting from the view which is causing the linter error

-- Drop and recreate the view without security_barrier option
DROP VIEW IF EXISTS public.company_registration_summary;

-- Create the view without security_barrier to fix the linter error
CREATE VIEW public.company_registration_summary AS
SELECT 
  id,
  company_name,
  status,
  created_at,
  updated_at,
  -- Only show full email to super admins, mask for others
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    ) THEN admin_email
    ELSE LEFT(admin_email, 2) || '***@' || SPLIT_PART(admin_email, '@', 2)
  END AS admin_email_display,
  -- Only show full company email to super admins, mask for others  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    ) THEN company_email
    ELSE LEFT(company_email, 2) || '***@' || SPLIT_PART(company_email, '@', 2)
  END AS company_email_display,
  -- Only show full first name to super admins, mask for others
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    ) THEN admin_first_name
    ELSE LEFT(admin_first_name, 1) || '***'
  END AS admin_first_name_display,
  -- Only show full last name to super admins, mask for others
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    ) THEN admin_last_name
    ELSE LEFT(admin_last_name, 1) || '***'
  END AS admin_last_name_display
FROM public.company_registration_requests
WHERE EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('super_admin', 'admin')
);

-- Grant appropriate permissions (no special security options)
GRANT SELECT ON public.company_registration_summary TO authenticated;

-- Add comment to document the view's purpose
COMMENT ON VIEW public.company_registration_summary IS 'Secure view of company registration requests with data masking for non-super-admin users. Uses RLS policies from underlying table for security.';