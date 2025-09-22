-- Create a security definer function for user profile access
CREATE OR REPLACE FUNCTION public.get_user_profile_for_join(user_id_param UUID)
RETURNS TABLE(
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT up.first_name, up.last_name, up.photo_url
  FROM public.user_profiles up
  WHERE up.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Add RLS policy to allow joins with user_profiles for change orders
CREATE POLICY "Allow joins with user_profiles for change orders" 
ON public.user_profiles 
FOR SELECT 
USING (
  -- Allow access if the requesting user belongs to the same company as the profile being accessed
  EXISTS (
    SELECT 1 
    FROM public.user_profiles requester 
    WHERE requester.user_id = auth.uid() 
    AND requester.company_id = user_profiles.company_id
  )
);