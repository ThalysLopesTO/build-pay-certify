-- Update daily_reports SELECT policy to include management
DROP POLICY IF EXISTS "Company users can view daily reports" ON daily_reports;
CREATE POLICY "Company users can view daily reports"
ON daily_reports
FOR SELECT
USING (
  company_id = (
    SELECT user_profiles.company_id
    FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_active = true
      AND user_profiles.role IN ('foreman', 'admin', 'super_admin', 'management')
  )
);

-- Update daily_reports UPDATE policy to include management
DROP POLICY IF EXISTS "Admins can update daily reports for their company" ON daily_reports;
CREATE POLICY "Admins and management can update daily reports for their company"
ON daily_reports
FOR UPDATE
USING (
  company_id = get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin', 'management')
  )
);

-- Update daily_reports DELETE policy to include management
DROP POLICY IF EXISTS "Admins can delete daily reports for their company" ON daily_reports;
CREATE POLICY "Admins and management can delete daily reports for their company"
ON daily_reports
FOR DELETE
USING (
  company_id = get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin', 'management')
  )
);

-- Update daily_report_comments policies to include management
DROP POLICY IF EXISTS "Authorized users can create comments" ON daily_report_comments;
CREATE POLICY "Authorized users can create comments"
ON daily_report_comments
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND company_id = get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin', 'management', 'foreman')
      AND user_profiles.is_active = true
      AND user_profiles.company_id = daily_report_comments.company_id
  )
);