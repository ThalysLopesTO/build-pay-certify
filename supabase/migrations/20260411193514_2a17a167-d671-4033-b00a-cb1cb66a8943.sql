CREATE POLICY "Admins can delete timesheets"
ON public.timesheets
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin', 'management')
      AND user_profiles.company_id = timesheets.company_id
  )
);