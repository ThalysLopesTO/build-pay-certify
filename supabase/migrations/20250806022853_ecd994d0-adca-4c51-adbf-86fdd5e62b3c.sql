-- First, let's clean up the conflicting RLS policies for material_requests
-- Drop the old conflicting policies
DROP POLICY IF EXISTS "Foremen can create material requests" ON material_requests;
DROP POLICY IF EXISTS "Users can create material requests" ON material_requests;
DROP POLICY IF EXISTS "Users can insert their own material requests" ON material_requests;

-- Create a single, clear INSERT policy that works for all users in the company
CREATE POLICY "Users can create material requests for their company"
ON material_requests
FOR INSERT
WITH CHECK (
  submitted_by = auth.uid() 
  AND company_id = get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND company_id = material_requests.company_id
    AND role IN ('foreman', 'admin', 'super_admin', 'employee')
  )
);