## Overview

Two changes to the Manual Timesheets module:

1. **Hide moved timesheets from "All Timesheets"** — once a timesheet is in any folder, it should only appear in its folder under "Approved Timesheets".
2. **Add an Approval System** — admins can approve / decline a timesheet inside a folder, with optional comment. Approval shows the admin's name and timestamp. Only `admin` role users can approve/decline.

---

## Database changes

New migration adding approval fields on `manual_timesheets`:

```sql
ALTER TABLE public.manual_timesheets
  ADD COLUMN approval_status text NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending','approved','declined')),
  ADD COLUMN approval_comment text,
  ADD COLUMN approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN approved_by_name text,
  ADD COLUMN approved_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_manual_timesheets_approval_status
  ON public.manual_timesheets(company_id, approval_status);
```

RLS update: ensure only users with role `admin` (via existing `has_role` helper) can `UPDATE` approval-related columns. Managers retain read access; approve/decline restricted to admins.

---

## "All Timesheets" filtering

Update `useManualTimesheets.list` to exclude timesheets that already belong to a folder:

```ts
// Fetch folder item ids first, then exclude
const { data: folderItems } = await supabase
  .from('manual_timesheet_folder_items')
  .select('timesheet_id')
  .eq('company_id', user.companyId);

const inFolder = new Set((folderItems ?? []).map(r => r.timesheet_id));
return rows.filter(r => !inFolder.has(r.id));
```

After `moveTimesheets` succeeds in `useTimesheetFolders`, also invalidate `['manual-timesheets']` so the All Timesheets list refreshes.

---

## Approval UI (inside folder detail view)

In `ApprovedTimesheetsTab.tsx` → `FolderDetail` table, add:

- **New column "Status"** showing a badge: `Pending` (gray), `Approved` (green), `Declined` (red). When approved/declined, show `by {admin_name} • {date time}` underneath.
- **Action buttons** (admin only, gated by `user.role === 'admin'`):
  - `Approve` (green check) → opens dialog with optional comment, confirms.
  - `Decline` (red X) → opens dialog requiring a comment, confirms.
- **View modal** also shows the approval block (status, admin name, timestamp, comment).

New hook `useTimesheetApprovalAction` (in `useTimesheetFolders.ts` or new file):

```ts
const approve = useMutation({
  mutationFn: async ({ id, comment, status }) => {
    await supabase.from('manual_timesheets').update({
      approval_status: status, // 'approved' | 'declined'
      approval_comment: comment ?? null,
      approved_by: user.id,
      approved_by_name: `${user.firstName} ${user.lastName}`.trim(),
      approved_at: new Date().toISOString(),
    }).eq('id', id);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['manual-timesheet-folder-items'] });
    queryClient.invalidateQueries({ queryKey: ['manual-timesheets'] });
  },
});
```

For non-admin viewers (manager), buttons are hidden; status badge still visible.

---

## Files to change

- `supabase/migrations/<new>.sql` — add approval columns + RLS for admin-only updates.
- `src/hooks/useManualTimesheets.ts` — exclude in-folder rows from list.
- `src/hooks/useTimesheetFolders.ts` — invalidate manual-timesheets after move/remove; add `approve` mutation.
- `src/components/admin/manual-timesheets/ApprovedTimesheetsTab.tsx` — Status column, Approve/Decline buttons + comment dialog, admin gating.
- `src/components/admin/manual-timesheets/ManualTimesheetViewModal.tsx` — show approval block.
- `src/integrations/supabase/types.ts` — auto-regenerated.

---

## Notes

- Removing a timesheet from a folder will make it reappear in "All Timesheets" (its approval status persists on the row but it's effectively unfiled again).
- Decline requires a comment; Approve makes it optional.
- Admin role detection uses the existing `useAuth().user.role` value already used elsewhere in the admin panel.