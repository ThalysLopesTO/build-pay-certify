-- Fix recursive RLS policy by dropping the problematic one
DROP POLICY IF EXISTS "Users can view employees in their company" ON public.user_profiles;

-- Create a security definer function to get user's company_id without recursion
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid();
$$;

-- Add policy to allow users to view their own profile (needed for login)
CREATE POLICY "Users can view their own profile" ON public.user_profiles
FOR SELECT USING (user_id = auth.uid());

-- Add policy to allow users to view all employees in their company (without recursion)
CREATE POLICY "Users can view employees in their company" ON public.user_profiles
FOR SELECT USING (
  company_id = public.get_user_company_id()
);