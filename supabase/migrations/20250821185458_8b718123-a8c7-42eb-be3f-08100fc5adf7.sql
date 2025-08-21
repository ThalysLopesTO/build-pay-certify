-- Fix Security Definer View Issue by restructuring company_registration_summary view
-- The issue is that the view contains auth.uid() calls which creates security definer behavior

-- First, drop the existing view
DROP VIEW IF EXISTS public.company_registration_summary;

-- Create a security definer function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_user_super_admin_for_view()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  );
$$;

-- Create a security definer function to check if user is admin or super admin
CREATE OR REPLACE FUNCTION public.is_user_admin_or_super_admin_for_view()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  );
$$;

-- Recreate the view without direct auth.uid() calls
CREATE VIEW public.company_registration_summary AS
SELECT 
  id,
  company_name,
  status,
  created_at,
  updated_at,
  CASE
    WHEN public.is_user_super_admin_for_view() THEN admin_email
    ELSE (left(admin_email, 2) || '***@' || split_part(admin_email, '@', 2))
  END AS admin_email_display,
  CASE
    WHEN public.is_user_super_admin_for_view() THEN company_email
    ELSE (left(company_email, 2) || '***@' || split_part(company_email, '@', 2))
  END AS company_email_display,
  CASE
    WHEN public.is_user_super_admin_for_view() THEN admin_first_name
    ELSE (left(admin_first_name, 1) || '***')
  END AS admin_first_name_display,
  CASE
    WHEN public.is_user_super_admin_for_view() THEN admin_last_name
    ELSE (left(admin_last_name, 1) || '***')
  END AS admin_last_name_display
FROM public.company_registration_requests
WHERE public.is_user_admin_or_super_admin_for_view();

-- Set up RLS policy for the view (views inherit RLS from underlying tables)
-- The view will only show data if the user passes the WHERE clause condition