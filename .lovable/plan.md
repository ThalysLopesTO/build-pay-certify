## Problem

The "Create Punch for Employee" insert is blocked by Row Level Security on the `timesheets` table. The only INSERT policy is `Employees can create their own timesheets`, which requires `user_id = auth.uid()`. When an admin creates a punch for someone else, that check fails → "new row violates row-level security policy for table timesheets".

## Fix

Add a new INSERT policy on `public.timesheets` allowing admins/super_admins/management (and optionally foreman) to insert punches for any employee within their own company:

```sql
CREATE POLICY "Admins can create timesheets for company employees"
ON public.timesheets
FOR INSERT
WITH CHECK (
  company_id = (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = ANY (ARRAY['admin','super_admin','management'])
  )
);
```

No frontend code changes needed — the existing `CreatePunchModal` insert payload already supplies `company_id`, `user_id`, and `manual_override` fields.

## Verification

After migration: open Live Punch Monitor → Add Punch → select another employee → Create punch → row inserts and appears in the list.