BEGIN;

-- Secure weekly_timesheets by tightening RLS and removing public access
ALTER TABLE public.weekly_timesheets ENABLE ROW LEVEL SECURITY;

-- Remove insecure or conflicting existing policies
DROP POLICY IF EXISTS "All user can read the data" ON public.weekly_timesheets;
DROP POLICY IF EXISTS "Employees can insert their own timesheets" ON public.weekly_timesheets;
DROP POLICY IF EXISTS "Users can create their own timesheets" ON public.weekly_timesheets;
DROP POLICY IF EXISTS "Employees can update their own timesheets" ON public.weekly_timesheets;
DROP POLICY IF EXISTS "Employees can view their own weekly timesheets" ON public.weekly_timesheets;
DROP POLICY IF EXISTS "Company staff can view weekly timesheets" ON public.weekly_timesheets;
DROP POLICY IF EXISTS "Company staff can insert weekly timesheets" ON public.weekly_timesheets;
DROP POLICY IF EXISTS "Company staff can update weekly timesheets" ON public.weekly_timesheets;
DROP POLICY IF EXISTS "Company staff can delete weekly timesheets" ON public.weekly_timesheets;
DROP POLICY IF EXISTS "Super admins can view all weekly timesheets" ON public.weekly_timesheets;

-- SELECT policies
CREATE POLICY "Employees can view their own weekly timesheets"
ON public.weekly_timesheets
FOR SELECT
TO authenticated
USING (
  submitted_by = auth.uid() AND company_id = public.get_user_company_id()
);

CREATE POLICY "Company staff can view weekly timesheets"
ON public.weekly_timesheets
FOR SELECT
TO authenticated
USING (
  company_id = public.get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.company_id = public.get_user_company_id()
      AND up.role IN ('admin','super_admin','management','foreman')
  )
);

CREATE POLICY "Super admins can view all weekly timesheets"
ON public.weekly_timesheets
FOR SELECT
TO authenticated
USING (public.is_super_admin());

-- INSERT policies
CREATE POLICY "Employees can insert their own weekly timesheets"
ON public.weekly_timesheets
FOR INSERT
TO authenticated
WITH CHECK (
  submitted_by = auth.uid()
  AND company_id = public.get_user_company_id()
);

CREATE POLICY "Company staff can insert weekly timesheets"
ON public.weekly_timesheets
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = public.get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.company_id = public.get_user_company_id()
      AND up.role IN ('admin','super_admin','management','foreman')
  )
  AND (submitted_by IS NULL OR submitted_by IN (
    SELECT up2.user_id FROM public.user_profiles up2
    WHERE up2.company_id = public.get_user_company_id()
  ))
);

-- UPDATE policies
CREATE POLICY "Employees can update their own weekly timesheets"
ON public.weekly_timesheets
FOR UPDATE
TO authenticated
USING (
  submitted_by = auth.uid() AND company_id = public.get_user_company_id()
)
WITH CHECK (
  submitted_by = auth.uid() AND company_id = public.get_user_company_id()
);

CREATE POLICY "Company staff can update weekly timesheets"
ON public.weekly_timesheets
FOR UPDATE
TO authenticated
USING (
  company_id = public.get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.company_id = public.get_user_company_id()
      AND up.role IN ('admin','super_admin','management','foreman')
  )
)
WITH CHECK (
  company_id = public.get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.company_id = public.get_user_company_id()
      AND up.role IN ('admin','super_admin','management','foreman')
  )
);

-- DELETE policy
CREATE POLICY "Company staff can delete weekly timesheets"
ON public.weekly_timesheets
FOR DELETE
TO authenticated
USING (
  company_id = public.get_user_company_id()
  AND (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.company_id = public.get_user_company_id()
        AND up.role IN ('admin','management')
    )
  )
);

COMMIT;