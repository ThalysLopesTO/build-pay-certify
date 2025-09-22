-- Add RLS policy for user_profiles to allow company users to view profiles within their company for joins
CREATE POLICY "Company users can view profiles within their company for joins" 
ON public.user_profiles 
FOR SELECT 
USING (
  company_id = (
    SELECT company_id 
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
  )
);