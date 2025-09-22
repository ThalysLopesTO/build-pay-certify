-- Remove the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Company users can view profiles within their company for joins" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.user_profiles;

-- Remove the problematic function that also causes recursion
DROP FUNCTION IF EXISTS public.can_access_user_profile(uuid);

-- The existing policy "Users can view employees in their company" should remain and be sufficient
-- It uses get_user_company_id() which works correctly without recursion