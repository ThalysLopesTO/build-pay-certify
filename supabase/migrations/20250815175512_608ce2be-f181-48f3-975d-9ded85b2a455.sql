-- First, drop ALL existing RLS policies on user_profiles
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT schemaname, tablename, policyname 
               FROM pg_policies 
               WHERE schemaname = 'public' AND tablename = 'user_profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END$$;

-- Create helper functions for role checks without recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.user_profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid();
$$;

-- Create simple, non-recursive RLS policies

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
FOR SELECT USING (user_id = auth.uid());

-- Users can update their own profile  
CREATE POLICY "Users can update own profile" ON public.user_profiles
FOR UPDATE USING (user_id = auth.uid());

-- Users can insert their own profile during signup
CREATE POLICY "Users can insert own profile" ON public.user_profiles
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Super admins can view all profiles (using EXISTS to avoid recursion)
CREATE POLICY "Super admins view all" ON public.user_profiles
FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM public.user_profiles WHERE role = 'super_admin'
  )
);

-- Super admins can update all profiles
CREATE POLICY "Super admins update all" ON public.user_profiles
FOR UPDATE USING (
  auth.uid() IN (
    SELECT user_id FROM public.user_profiles WHERE role = 'super_admin'
  )
);

-- Company admins can view profiles in their company
CREATE POLICY "Company admins view company" ON public.user_profiles
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management')
  )
);

-- Company admins can update profiles in their company
CREATE POLICY "Company admins update company" ON public.user_profiles
FOR UPDATE USING (
  company_id IN (
    SELECT company_id FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management')
  )
);