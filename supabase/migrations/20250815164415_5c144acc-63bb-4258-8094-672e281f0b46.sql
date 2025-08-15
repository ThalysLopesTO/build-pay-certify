-- Fix RLS policies for employee registration to work properly

-- First, ensure we have proper INSERT policies for user_profiles
-- that allow admins to create employees for their company

-- Drop and recreate the INSERT policy for user_profiles to be more specific
DROP POLICY IF EXISTS "Company admins can manage users in their company" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

-- Create specific policies for different operations
CREATE POLICY "Admins can insert users for their company"
ON public.user_profiles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.company_id = user_profiles.company_id
      AND up.role IN ('admin', 'super_admin', 'management')
  )
);

CREATE POLICY "Users can insert their own profile during registration"
ON public.user_profiles
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can select users in their company"
ON public.user_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.company_id = user_profiles.company_id
      AND up.role IN ('admin', 'super_admin', 'management', 'foreman')
  ) OR user_id = auth.uid()
);

CREATE POLICY "Admins can update users in their company"
ON public.user_profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.company_id = user_profiles.company_id
      AND up.role IN ('admin', 'super_admin', 'management')
  ) OR (user_id = auth.uid())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.company_id = user_profiles.company_id
      AND up.role IN ('admin', 'super_admin', 'management')
  ) OR (user_id = auth.uid())
);

CREATE POLICY "Admins can delete users in their company"
ON public.user_profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.company_id = user_profiles.company_id
      AND up.role IN ('admin', 'super_admin', 'management')
  )
);

-- Ensure employee_certificates has proper policies for admin management
DROP POLICY IF EXISTS "Users can insert certificates for their company employees" ON public.employee_certificates;
DROP POLICY IF EXISTS "Users can update certificates for their company employees" ON public.employee_certificates;
DROP POLICY IF EXISTS "Users can delete certificates for their company employees" ON public.employee_certificates;
DROP POLICY IF EXISTS "Users can view certificates for their company employees" ON public.employee_certificates;

CREATE POLICY "Admins can manage certificates for company employees"
ON public.employee_certificates
FOR ALL
USING (
  company_id IN (
    SELECT up.company_id
    FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.role IN ('admin', 'super_admin', 'management')
  )
)
WITH CHECK (
  company_id IN (
    SELECT up.company_id
    FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.role IN ('admin', 'super_admin', 'management')
  )
);

-- Service role should always have full access
CREATE POLICY "Service role can manage all user profiles"
ON public.user_profiles
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all certificates"
ON public.employee_certificates
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');