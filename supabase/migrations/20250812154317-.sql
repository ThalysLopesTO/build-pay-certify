BEGIN;

-- Enable RLS on weekly_timesheets to prevent public reads
ALTER TABLE public.weekly_timesheets ENABLE ROW LEVEL SECURITY;

-- Clean up prior policies if they exist (idempotent)
DROP POLICY IF EXISTS "Employees can view their own weekly timesheets" ON public.weekly_timesheets;
DROP POLICY IF EXISTS "Company staff can view weekly timesheets" ON public.weekly_timesheets;
DROP POLICY IF EXISTS "Employees can insert their own weekly timesheets" ON public.weekly_timesheets;
DROP POLICY IF EXISTS "Company staff can insert weekly timesheets" ON public.weekly_timesheets;
DROP POLICY IF EXISTS "Employees can update their own weekly timesheets" ON public.weekly_timesheets;
DROP POLICY IF EXISTS "Company staff can update weekly timesheets" ON public.weekly_timesheets;
DROP POLICY IF EXISTS "Company staff can delete weekly timesheets" ON public.weekly_timesheets;

-- SELECT policies
CREATE POLICY "Employees can view their own weekly timesheets"
ON public.weekly_timesheets
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() AND company_id = public.get_user_company_id()
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

-- INSERT policies
CREATE POLICY "Employees can insert their own weekly timesheets"
ON public.weekly_timesheets
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND company_id = public.get_user_company_id()
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
);

-- UPDATE policies
CREATE POLICY "Employees can update their own weekly timesheets"
ON public.weekly_timesheets
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() AND company_id = public.get_user_company_id()
)
WITH CHECK (
  user_id = auth.uid() AND company_id = public.get_user_company_id()
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
  AND EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.company_id = public.get_user_company_id()
      AND up.role IN ('admin','super_admin','management')
  )
);

COMMIT;