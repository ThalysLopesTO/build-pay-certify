-- Drop existing restrictive policies and create more appropriate ones for employee_certificates
DROP POLICY IF EXISTS "Company admins can insert certificates" ON employee_certificates;
DROP POLICY IF EXISTS "Company admins can view certificates" ON employee_certificates;
DROP POLICY IF EXISTS "Company admins can update certificates" ON employee_certificates;
DROP POLICY IF EXISTS "Company admins can delete certificates" ON employee_certificates;

-- Create new policies that work with the current authentication setup
-- Allow authenticated users to insert certificates for employees in their company
CREATE POLICY "Users can insert certificates for their company employees" ON employee_certificates
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'management')
    )
  );

-- Allow authenticated users to view certificates for employees in their company
CREATE POLICY "Users can view certificates for their company employees" ON employee_certificates
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Allow admins to update certificates in their company
CREATE POLICY "Users can update certificates for their company employees" ON employee_certificates
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'management')
    )
  );

-- Allow admins to delete certificates in their company
CREATE POLICY "Users can delete certificates for their company employees" ON employee_certificates
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'management')
    )
  );