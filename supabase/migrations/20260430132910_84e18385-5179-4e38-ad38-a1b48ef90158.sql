CREATE OR REPLACE FUNCTION public.can_manage_manual_timesheets()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role IN ('super_admin','admin','management','foreman')
  FROM public.user_profiles
  WHERE user_id = auth.uid();
$$;

DROP POLICY IF EXISTS "Admin/Manager can view manual timesheets in their company"   ON public.manual_timesheets;
DROP POLICY IF EXISTS "Admin/Manager can insert manual timesheets in their company" ON public.manual_timesheets;
DROP POLICY IF EXISTS "Admin/Manager can update manual timesheets in their company" ON public.manual_timesheets;
DROP POLICY IF EXISTS "Admin/Manager can delete manual timesheets in their company" ON public.manual_timesheets;

CREATE POLICY "Staff can view manual timesheets in their company"
ON public.manual_timesheets FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id() AND public.can_manage_manual_timesheets());

CREATE POLICY "Staff can insert manual timesheets in their company"
ON public.manual_timesheets FOR INSERT TO authenticated
WITH CHECK (company_id = public.get_user_company_id()
            AND public.can_manage_manual_timesheets()
            AND created_by = auth.uid());

CREATE POLICY "Staff can update manual timesheets in their company"
ON public.manual_timesheets FOR UPDATE TO authenticated
USING (company_id = public.get_user_company_id() AND public.can_manage_manual_timesheets())
WITH CHECK (company_id = public.get_user_company_id() AND public.can_manage_manual_timesheets());

CREATE POLICY "Staff can delete manual timesheets in their company"
ON public.manual_timesheets FOR DELETE TO authenticated
USING (company_id = public.get_user_company_id() AND public.can_manage_manual_timesheets());