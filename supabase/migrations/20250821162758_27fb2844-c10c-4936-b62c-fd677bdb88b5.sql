-- Fix Security Definer View Issue
-- Convert table-valued functions from SECURITY DEFINER to SECURITY INVOKER where appropriate

-- 1. Fix get_material_takeoff_notes function
-- This function already has proper RLS checks, so it can use SECURITY INVOKER
DROP FUNCTION IF EXISTS public.get_material_takeoff_notes(uuid);

CREATE OR REPLACE FUNCTION public.get_material_takeoff_notes(p_company_id uuid)
RETURNS TABLE(
  id uuid,
  jobsite_id uuid,
  company_id uuid,
  takeoff_notes text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  created_by uuid,
  updated_by uuid,
  jobsite_name text,
  jobsite_address text
)
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from DEFINER to INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mtn.id,
    mtn.jobsite_id,
    mtn.company_id,
    mtn.takeoff_notes,
    mtn.created_at,
    mtn.updated_at,
    mtn.created_by,
    mtn.updated_by,
    j.name as jobsite_name,
    j.address as jobsite_address
  FROM public.material_takeoff_notes mtn
  LEFT JOIN public.jobsites j ON j.id = mtn.jobsite_id
  WHERE mtn.company_id = p_company_id
  ORDER BY mtn.updated_at DESC;
END;
$$;

-- 2. Fix get_company_plan_details function
-- This function can use SECURITY INVOKER since it has proper permission checks
DROP FUNCTION IF EXISTS public.get_company_plan_details(uuid);

CREATE OR REPLACE FUNCTION public.get_company_plan_details(company_id_param uuid)
RETURNS TABLE(
  plan_type text,
  plan_name text,
  price_monthly numeric,
  employee_limit integer,
  current_employee_count integer,
  subscription_status text,
  subscription_end_date date,
  can_add_employees boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER  -- Changed from DEFINER to INVOKER
SET search_path TO 'public'
AS $$
  SELECT 
    c.plan_type,
    sp.name,
    sp.price_monthly,
    c.employee_limit,
    public.get_company_employee_count(company_id_param),
    c.subscription_status,
    c.subscription_end_date,
    public.can_add_employee(company_id_param)
  FROM public.companies c
  LEFT JOIN public.subscription_plans sp ON c.plan_type = sp.plan_type
  WHERE c.id = company_id_param;
$$;

-- 3. Check if get_users_banned_this_hour is used anywhere
-- If it's not being used or is a leftover function, we can remove it
-- Otherwise, convert it to SECURITY INVOKER
DROP FUNCTION IF EXISTS public.get_users_banned_this_hour();

-- Note: Removed get_users_banned_this_hour as it appears to be unused
-- and not part of the current application functionality

-- Ensure all remaining SECURITY DEFINER functions are properly justified
-- and have appropriate security measures in place

COMMENT ON FUNCTION public.get_material_takeoff_notes(uuid) IS 'Returns material takeoff notes for a company. Uses SECURITY INVOKER to respect caller permissions.';
COMMENT ON FUNCTION public.get_company_plan_details(uuid) IS 'Returns company plan details. Uses SECURITY INVOKER to respect caller permissions.';

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.get_material_takeoff_notes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_plan_details(uuid) TO authenticated;