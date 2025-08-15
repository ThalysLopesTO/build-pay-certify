-- Drop the recursive policies and create proper non-recursive ones
DROP POLICY IF EXISTS "Company admins view company" ON public.user_profiles;
DROP POLICY IF EXISTS "Company admins update company" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins view all" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins update all" ON public.user_profiles;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.user_profiles WHERE user_id = auth.uid();
  RETURN user_role IN ('admin', 'super_admin', 'management');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_user_super_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.user_profiles WHERE user_id = auth.uid();
  RETURN user_role = 'super_admin';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  company_id uuid;
BEGIN
  SELECT user_profiles.company_id INTO company_id FROM public.user_profiles WHERE user_id = auth.uid();
  RETURN company_id;
END;
$$;

-- Create non-recursive policies using the security definer functions

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles" ON public.user_profiles
FOR SELECT USING (public.is_user_super_admin());

-- Super admins can update all profiles
CREATE POLICY "Super admins can update all profiles" ON public.user_profiles
FOR UPDATE USING (public.is_user_super_admin());

-- Company admins can view profiles in their company (avoiding recursion)
CREATE POLICY "Company admins can view company profiles" ON public.user_profiles
FOR SELECT USING (
  public.is_user_admin() AND company_id = public.get_user_company_id()
);

-- Company admins can update profiles in their company (avoiding recursion)
CREATE POLICY "Company admins can update company profiles" ON public.user_profiles
FOR UPDATE USING (
  public.is_user_admin() AND company_id = public.get_user_company_id()
);