## Restrict Hourly Rate editing to Admins & Managers on Time Sheet

Foremen will still be able to create/edit a manual timesheet, but the **Hourly Rate** input in the Payment Summary will be read-only for them. Other fields (Extra Amount, Tax %) remain editable.

### Changes

1. **`src/components/admin/manual-timesheets/PaymentSummary.tsx`**
   - Add new optional prop `rateLocked?: boolean`.
   - Pass `disabled={disabled || rateLocked}` to the Hourly Rate `Input` only.
   - When `rateLocked` is true, also add a small helper text under the field: "Only Admins and Managers can edit the rate."

2. **`src/components/admin/manual-timesheets/HourlyTimesheetForm.tsx`**
   - Import `useAuth` from `@/contexts/SupabaseAuthContext`.
   - Compute `const canEditRate = ['admin', 'super_admin', 'management'].includes(user?.role || '')`.
   - Pass `rateLocked={!canEditRate}` to `<PaymentSummary />`.

### Out of scope
- No changes to Extra Amount or Tax % editability.
- No changes to backend / DB / roles model.
- Live Punch Monitor permissions (already handled in prior change).
