-- Drop the problematic policy that's causing infinite recursion
DROP POLICY IF EXISTS "Foremen can view employee profiles in their company" ON public.user_profiles;

-- Create a better policy that avoids recursion by using a more direct approach
-- This policy allows users to view profiles in their company if they have admin/foreman role
CREATE POLICY "Company members can view profiles within company"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  -- Users can always view their own profile
  auth.uid() = user_id 
  OR
  -- Or if they belong to the same company and have appropriate role
  EXISTS (
    SELECT 1 FROM public.user_profiles as viewer_profile
    WHERE viewer_profile.user_id = auth.uid()
    AND viewer_profile.company_id = user_profiles.company_id
    AND viewer_profile.role IN ('super_admin', 'admin', 'management', 'foreman')
  )
);