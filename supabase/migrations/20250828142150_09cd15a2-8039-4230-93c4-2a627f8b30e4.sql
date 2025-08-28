-- Add RLS policy to allow admins to edit any material request regardless of time restrictions

CREATE POLICY "Admin can edit any material request" 
ON public.material_requests 
FOR UPDATE 
USING (
  (company_id = get_user_company_id()) AND 
  (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin') 
    AND company_id = material_requests.company_id
  ))
)
WITH CHECK (
  (company_id = get_user_company_id()) AND 
  (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin') 
    AND company_id = material_requests.company_id
  ))
);