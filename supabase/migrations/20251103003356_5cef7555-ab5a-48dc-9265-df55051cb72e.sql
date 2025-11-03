-- Remove unique constraint that prevents multiple assignments of same equipment
DROP INDEX IF EXISTS idx_equipment_active_usage;

-- Update RLS policy for equipment_usage_log to fix SELECT permissions
DROP POLICY IF EXISTS "Admins and foremen can manage usage logs" ON equipment_usage_log;
DROP POLICY IF EXISTS "Employees can view their own usage logs" ON equipment_usage_log;

-- Create comprehensive policy for admins/foremen/management
CREATE POLICY "Admins and foremen can manage usage logs"
ON equipment_usage_log
FOR ALL
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'management', 'foreman')
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'management', 'foreman')
  )
);

-- Recreate employee policy for viewing their own logs
CREATE POLICY "Employees can view their own usage logs"
ON equipment_usage_log
FOR SELECT
TO authenticated
USING (
  employee_id = auth.uid() AND
  company_id = (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
);

-- Ensure users can view profiles in their company for joins
DROP POLICY IF EXISTS "Users can view profiles in their company" ON user_profiles;
CREATE POLICY "Users can view profiles in their company"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM user_profiles up
    WHERE up.user_id = auth.uid()
  )
);