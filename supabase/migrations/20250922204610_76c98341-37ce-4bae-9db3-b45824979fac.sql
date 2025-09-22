-- Add RLS policy for user_profiles to allow company users to view profiles within their company
CREATE POLICY "Company users can view profiles within their company" 
ON public.user_profiles 
FOR SELECT 
USING (
  company_id = (
    SELECT company_id 
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (user_id = auth.uid());