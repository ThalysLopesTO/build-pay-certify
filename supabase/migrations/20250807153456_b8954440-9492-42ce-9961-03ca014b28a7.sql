-- Fix material_requests RLS policies for status updates

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Admins can update material request status" ON material_requests;
DROP POLICY IF EXISTS "Admins can update material requests" ON material_requests;

-- Create proper policy for admins and managers to update material request status
CREATE POLICY "Admins and managers can update material requests"
ON material_requests
FOR UPDATE
USING (
  company_id = get_user_company_id() AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management', 'foreman')
    AND company_id = material_requests.company_id
  )
)
WITH CHECK (
  company_id = get_user_company_id() AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'management', 'foreman')
    AND company_id = material_requests.company_id
  )
);