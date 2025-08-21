-- Fix Security Definer View Issue
-- The linter detected a Security Definer View. Let's ensure all views are properly secured.

-- First, let's check if there are any functions being used as table-valued functions with SECURITY DEFINER
-- that might be flagged as views by the linter

-- Drop and recreate the company_registration_summary view to ensure it's properly defined
-- without any SECURITY DEFINER issues
DROP VIEW IF EXISTS public.company_registration_summary;

-- Create the view without SECURITY DEFINER (views should use SECURITY INVOKER by default)
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

-- Add RLS policy for the view
ALTER VIEW public.company_registration_summary SET (security_barrier = true);

-- Grant appropriate permissions
GRANT SELECT ON public.company_registration_summary TO authenticated;

-- Add comment to document the view's purpose
COMMENT ON VIEW public.company_registration_summary IS 'Secure view of company registration requests with data masking for non-super-admin users';

-- Review any SECURITY DEFINER functions that might be acting as views
-- Let's check if any functions need to be converted to SECURITY INVOKER where appropriate

-- The get_companies_with_status function should be SECURITY INVOKER since it already checks permissions
DROP FUNCTION IF EXISTS public.get_companies_with_status();

CREATE OR REPLACE FUNCTION public.get_companies_with_status()
RETURNS TABLE(
  id uuid,
  name text,
  status text,
  registration_date date,
  expiration_date date,
  created_at timestamp with time zone,
  is_expired boolean,
  days_until_expiry integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER  -- Changed from DEFINER to INVOKER
SET search_path TO 'public'
AS $$
  SELECT 
    c.id,
    c.name,
    c.status,
    c.registration_date,
    c.expiration_date,
    c.created_at,
    CASE 
      WHEN c.expiration_date IS NULL THEN false
      WHEN c.expiration_date < CURRENT_DATE THEN true
      ELSE false
    END as is_expired,
    CASE 
      WHEN c.expiration_date IS NULL THEN NULL
      ELSE (c.expiration_date - CURRENT_DATE)::integer
    END as days_until_expiry
  FROM public.companies c
  WHERE public.is_super_admin()
  ORDER BY c.created_at DESC;
$$;