-- Remove the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Allow joins with user_profiles for change orders" ON public.user_profiles;

-- Create a proper security definer function to check if user can access profile
CREATE OR REPLACE FUNCTION public.can_access_user_profile(profile_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  requesting_user_company_id UUID;
  profile_company_id UUID;
BEGIN
  -- Get the company ID of the requesting user
  SELECT company_id INTO requesting_user_company_id
  FROM public.user_profiles
  WHERE user_id = auth.uid();
  
  -- Get the company ID of the profile being accessed
  SELECT company_id INTO profile_company_id
  FROM public.user_profiles
  WHERE user_id = profile_user_id;
  
  -- Allow access if both users are in the same company
  RETURN requesting_user_company_id IS NOT NULL 
    AND profile_company_id IS NOT NULL 
    AND requesting_user_company_id = profile_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Add a proper RLS policy that uses the security definer function
CREATE POLICY "Users can view profiles in their company" 
ON public.user_profiles 
FOR SELECT 
USING (public.can_access_user_profile(user_id));