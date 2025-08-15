-- Fix infinite recursion in user_profiles RLS policies by using security definer functions

-- First, drop all the problematic policies that cause recursion
DROP POLICY IF EXISTS "Admins can insert users for their company" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile during registration" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can select users in their company" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update users in their company" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete users in their company" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can manage all user profiles" ON public.user_profiles;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE sql 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.user_profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS UUID 
LANGUAGE sql 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_user_admin_for_company(target_company_id UUID)
RETURNS BOOLEAN 
LANGUAGE sql 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND company_id = target_company_id
    AND role IN ('admin', 'super_admin', 'management')
  );
$$;

-- Now create non-recursive policies using the security definer functions
CREATE POLICY "Users can view their own profile"
ON public.user_profiles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view company profiles"
ON public.user_profiles
FOR SELECT
USING (
  public.is_user_admin_for_company(company_id) OR user_id = auth.uid()
);

CREATE POLICY "Admins can insert company profiles"
ON public.user_profiles
FOR INSERT
WITH CHECK (
  public.is_user_admin_for_company(company_id)
);

CREATE POLICY "Admins can update company profiles"
ON public.user_profiles
FOR UPDATE
USING (
  public.is_user_admin_for_company(company_id) OR user_id = auth.uid()
)
WITH CHECK (
  public.is_user_admin_for_company(company_id) OR user_id = auth.uid()
);

CREATE POLICY "Admins can delete company profiles"
ON public.user_profiles
FOR DELETE
USING (
  public.is_user_admin_for_company(company_id)
);

-- Service role should always have full access
CREATE POLICY "Service role has full access"
ON public.user_profiles
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');