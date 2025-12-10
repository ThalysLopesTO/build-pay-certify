-- Add RLS policies to allow employees to manage their own certificates

-- Policy 1: Allow employees to SELECT their own certificates
CREATE POLICY "Employees can view their own certificates"
ON employee_certificates
FOR SELECT
TO authenticated
USING (employee_id = auth.uid());

-- Policy 2: Allow employees to INSERT their own certificates
CREATE POLICY "Employees can upload their own certificates"
ON employee_certificates
FOR INSERT
TO authenticated
WITH CHECK (
  employee_id = auth.uid() 
  AND company_id = (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
);

-- Policy 3: Allow employees to DELETE their own certificates
CREATE POLICY "Employees can delete their own certificates"
ON employee_certificates
FOR DELETE
TO authenticated
USING (employee_id = auth.uid());