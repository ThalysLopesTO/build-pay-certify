## Goal

Let admins manually create a punch-in entry for any employee on any date directly from the Live Punch Monitor, so a missed clock-in can be recorded after the fact and appear in that day's list. Restricted to admin roles only.

## Behavior

- New "Add Punch" button in the Live Punch Monitor header (next to Refresh / Export CSV), visible **only** when `user.role` is `admin` or `super_admin`. Hidden for management, foreman, employee.
- Clicking it opens a dialog "Create Punch for Employee" with fields:
  - **Employee** (searchable select — reuse the same employee list already fetched in `LivePunchMonitor.tsx`).
  - **Jobsite** (select — reuse the company jobsites list).
  - **Date** (date picker, defaults to the currently selected date in the filter).
  - **Check-in time** (time input, required; defaults to 08:00).
  - **Check-out time** (time input, optional — leave empty to create an open/active punch).
  - **Break minutes** (number, optional, default 0; only shown when check-out is set).
  - **Work note** (textarea, optional). Auto-prefixed with `[Manually added by admin]` so it's clearly distinguishable in the punch list.
- On submit:
  - Insert a row into `timesheets` with `company_id`, `user_id`, `jobsite_id`, `check_in_time`, `check_out_time` (nullable), `break_minutes`, `work_note`, `status` = `'active'` if no check-out, else `'completed'`, plus a new `manually_created_by` column referencing `auth.users` (UUID, nullable) so we can audit who added it.
  - Use local timezone parsing per project core rule (build the timestamp as `YYYY-MM-DDTHH:MM:00` in local time, then `.toISOString()`).
  - Invalidate the `live-punch-monitor` query so the new entry appears immediately.
  - Toast confirmation, close dialog.
- The punch then flows through every existing system (Daily Hours Summary, payroll, exports) like a normal entry.

## Files

**New**
- `src/components/admin/live-punch-monitor/CreatePunchModal.tsx` — the dialog and form (uses shadcn Dialog, Select, Input, Button, Textarea + react-hook-form + zod, following existing modal patterns in the folder like `BulkClockOutModal.tsx`).
- `src/hooks/useCreateManualPunch.ts` — `useMutation` wrapper inserting into `timesheets` and invalidating `['live-punch-monitor']`.

**Edited**
- `src/components/admin/LivePunchMonitor.tsx`
  - Add `const canCreatePunch = ['admin','super_admin'].includes(user?.role || '');`
  - Add `[showCreatePunch, setShowCreatePunch]` state.
  - Render an "Add Punch" button (only when `canCreatePunch`) and the `<CreatePunchModal />` consuming the existing employees/jobsites lists already in scope.

**Database (migration)**
- Add nullable column `manually_created_by uuid references auth.users(id)` to `timesheets` (audit trail, no behavior change for existing rows).
- No RLS change needed: existing admin insert policy on `timesheets` already allows it. We will verify the policy in the migration step.

## Out of scope

- No edits to the bulk action bar or Daily Hours Summary.
- Does not change check-out / break logic for existing punches (handled by the existing edit modal).
- No notification or email sent when a manual punch is created (can be added later).

## Verification

- Log in as **admin** → "Add Punch" button visible → submit form → new row appears in the list for the selected date with the manual-entry note prefix and audit field set.
- Log in as **management / foreman / employee** → button is not rendered.
- Created punch appears in Daily Hours Summary totals for that date.
- Open punch (no check-out) shows as "Active" in the table; can be edited/closed via the existing edit modal.
