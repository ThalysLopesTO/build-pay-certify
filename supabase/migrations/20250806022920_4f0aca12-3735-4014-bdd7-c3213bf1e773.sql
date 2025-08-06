-- Drop the existing duplicate policy first
DROP POLICY IF EXISTS "Users can create material requests for their company" ON material_requests;

-- Drop other potentially conflicting policies
DROP POLICY IF EXISTS "Foremen can create material requests" ON material_requests;
DROP POLICY IF EXISTS "Users can create material requests" ON material_requests;
DROP POLICY IF EXISTS "Users can insert their own material requests" ON material_requests;

-- Create a single, clear INSERT policy
CREATE POLICY "Allow users to create material requests for their company"
ON material_requests
FOR INSERT
WITH CHECK (
  submitted_by = auth.uid() 
  AND company_id = get_user_company_id()
);