-- Drop ALL existing policies on user_profiles more forcefully
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop each policy individually
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles'
    LOOP
        EXECUTE format('DROP POLICY %I ON public.user_profiles', pol.policyname);
    END LOOP;
END$$;

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

-- Create simple non-recursive policies

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
FOR SELECT USING (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
FOR UPDATE USING (user_id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.user_profiles
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Super admins can view all profiles 
CREATE POLICY "Super admins view all" ON public.user_profiles
FOR SELECT USING (public.is_user_super_admin());

-- Super admins can update all profiles
CREATE POLICY "Super admins update all" ON public.user_profiles
FOR UPDATE USING (public.is_user_super_admin());

-- Company admins can view profiles in their company
CREATE POLICY "Company admins view company" ON public.user_profiles
FOR SELECT USING (
  public.is_user_admin() AND company_id = public.get_user_company_id()
);

-- Company admins can update profiles in their company
CREATE POLICY "Company admins update company" ON public.user_profiles
FOR UPDATE USING (
  public.is_user_admin() AND company_id = public.get_user_company_id()
);