-- Add UPDATE policy for companies table so admins can update logo_url
CREATE POLICY "Company admins can update their company"
ON companies
FOR UPDATE
USING (
  id = get_user_company_id() 
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
    AND company_id = companies.id
  )
)
WITH CHECK (
  id = get_user_company_id() 
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
    AND company_id = companies.id
  )
);