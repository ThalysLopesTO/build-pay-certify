## Goal

The Manual "Time Sheet" page (under Management Operations) is currently admin/management only. Make it accessible to **foremen** as well, so managers and foremen can also create/edit/delete manual timesheets.

Note: Management already has the menu entry and DB access (manager role is included in `is_company_admin()`). The work is therefore focused on adding **Foreman** access — UI + database — while keeping admin/manager behavior unchanged.

## Changes

### 1. Foreman sidebar — add "Time Sheet" entry
File: `src/components/foreman/sidebar/foremanMenuData.ts`
- Add a new item `{ id: 'manual-timesheets', title: 'Time Sheet', icon: ClipboardList }` inside the existing `timesheet` group (next to "Timesheet" / "Missed Punch Requests"), so it shows under "Time Management".

### 2. Foreman dashboard route
File: `src/pages/ForemanDashboard.tsx`
- Import `ManualTimesheetsPage` from `@/pages/admin/ManualTimesheetsPage`.
- Add `case 'manual-timesheets': return <ManualTimesheetsPage />;` to the `renderContent()` switch.

The same `ManualTimesheetsPage` / `ManualTimesheetForm` is reused — no new UI needed.

### 3. Database — allow foreman role on `manual_timesheets`
New migration adding RLS policies that grant foremen the same SELECT/INSERT/UPDATE/DELETE access admins/managers already have, scoped to their company.

```sql
-- Helper: include foreman alongside admin/management for manual timesheets
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

-- Replace the 4 existing policies on public.manual_timesheets to use the new helper
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
```

This keeps admin/manager behavior identical and adds foreman access without touching the broader `is_company_admin()` function (which is used in many other policies and should not be widened).

## Out of scope

- No changes to admin or management menus — they already have "Time Sheet".
- No changes to the form, list, view modal, or PDF generator — they already work for any authorized user.
- Role-permission overrides (`menuPermissions`) still apply normally, so admins can hide the item per role from settings if desired.
