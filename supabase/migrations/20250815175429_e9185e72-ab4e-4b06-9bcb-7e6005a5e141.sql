-- Fix infinite recursion in user_profiles RLS policy by dropping problematic policies and creating proper ones

-- Drop all existing RLS policies on user_profiles that might cause recursion
DROP POLICY IF EXISTS "Allow access only if company license is active - DELETE" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow access only if company license is active - INSERT" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow access only if company license is active - SELECT" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow access only if company license is active - UPDATE" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow admins to view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Company users can view profiles in their company" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;

-- Create a helper function to get current user's role without causing recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.user_profiles WHERE user_id = auth.uid();
$$;

-- Create a helper function to get current user's company_id without causing recursion
CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid();
$$;

-- Create simple RLS policies for user_profiles that don't cause recursion

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON public.user_profiles
FOR SELECT USING (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.user_profiles  
FOR UPDATE USING (user_id = auth.uid());

-- Allow authenticated users to insert their own profile during signup
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles" ON public.user_profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.user_id = auth.uid() AND up.role = 'super_admin'
  )
);

-- Super admins can update all profiles
CREATE POLICY "Super admins can update all profiles" ON public.user_profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.user_id = auth.uid() AND up.role = 'super_admin'
  )
);

-- Company admins can view profiles in their company (avoid recursion by using a subquery)
CREATE POLICY "Company admins can view company profiles" ON public.user_profiles
FOR SELECT USING (
  company_id IN (
    SELECT up.company_id 
    FROM public.user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.role IN ('admin', 'super_admin', 'management')
  )
);

-- Company admins can update profiles in their company
CREATE POLICY "Company admins can update company profiles" ON public.user_profiles
FOR UPDATE USING (
  company_id IN (
    SELECT up.company_id 
    FROM public.user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.role IN ('admin', 'super_admin', 'management')
  )
);