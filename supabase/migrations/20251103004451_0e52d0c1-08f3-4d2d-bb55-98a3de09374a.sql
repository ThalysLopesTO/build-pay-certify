-- Fix infinite recursion in RLS policies that's blocking dashboard access

-- Step 1: Create safe helper functions with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.get_user_company_id_safe()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id 
  FROM public.user_profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_has_admin_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'management', 'foreman')
  );
$$;

-- Step 2: Drop problematic recursive policy on user_profiles
DROP POLICY IF EXISTS "Users can view profiles in their company" ON user_profiles;

-- Step 3: Fix equipment_usage_log policies to use safe functions instead of recursive queries
DROP POLICY IF EXISTS "Admins and foremen can manage usage logs" ON equipment_usage_log;
DROP POLICY IF EXISTS "Employees can view their own usage logs" ON equipment_usage_log;

CREATE POLICY "Admins and foremen can manage usage logs"
ON equipment_usage_log
FOR ALL
TO authenticated
USING (
  user_has_admin_role() AND 
  company_id = get_user_company_id_safe()
)
WITH CHECK (
  user_has_admin_role() AND 
  company_id = get_user_company_id_safe()
);

CREATE POLICY "Employees can view their own usage logs"
ON equipment_usage_log
FOR SELECT
TO authenticated
USING (
  employee_id = auth.uid() AND
  company_id = get_user_company_id_safe()
);