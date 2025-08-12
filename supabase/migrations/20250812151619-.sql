-- Harden companies table RLS and restrict super-admin RPC exposure
BEGIN;

-- Ensure RLS is enabled
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Remove overly permissive policy and recreate with proper check
DROP POLICY IF EXISTS "Super admins can manage all companies" ON public.companies;
CREATE POLICY "Super admins can manage all companies"
ON public.companies
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Recreate a SELECT policy limited to authenticated users viewing only their company
DROP POLICY IF EXISTS "Users can view their company" ON public.companies;
CREATE POLICY "Users can view their company"
ON public.companies
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT up.company_id FROM public.user_profiles up WHERE up.user_id = auth.uid()
  )
);

-- Keep existing service_role policy (full access) and any admin update policies intact

-- Restrict the super-admin companies RPC to super admins only and fix search_path
CREATE OR REPLACE FUNCTION public.get_companies_with_status()
RETURNS TABLE(
  id uuid,
  name text,
  status text,
  registration_date date,
  expiration_date date,
  created_at timestamptz,
  is_expired boolean,
  days_until_expiry integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Limit who can execute the function via PostgREST
REVOKE EXECUTE ON FUNCTION public.get_companies_with_status() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_companies_with_status() TO authenticated;

COMMIT;