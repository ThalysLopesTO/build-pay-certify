CREATE POLICY "Admins can create timesheets for company employees"
ON public.timesheets
FOR INSERT
WITH CHECK (
  company_id = (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = ANY (ARRAY['admin','super_admin','management'])
  )
);