## Goal

Let admins move a non-approved timesheet out of an Approved-Timesheets folder back into the All Timesheets tab, with a clear UX (not just a tiny "X" icon).

## Current state

- Inside a folder (e.g. "Project Eagle - Week April 30"), every row already has a small `X` button calling `removeItem.mutate(ts.id)` which deletes the `manual_timesheet_folder_items` row — the timesheet then reappears in All Timesheets.
- The button is unlabelled, has no confirmation, and is shown for every status (including approved/declined). Users don't realise it's the "move back" action.
- RLS already allows admins/managers to delete folder items.

## Changes (UI only — frontend)

File: `src/components/admin/manual-timesheets/ApprovedTimesheetsTab.tsx`

1. Replace the bare `X` button with an explicit "Move back to All Timesheets" action:
   - Use an `Undo2` (or `ArrowLeftCircle`) icon + visible tooltip "Move back to All Timesheets".
   - Only render it when `ts.approval_status !== 'approved'` (and admin). Approved timesheets stay locked in the folder, matching the user's request.
2. Add a confirmation dialog before calling `removeItem.mutate(ts.id)` so admins don't remove items by accident. Title: "Move timesheet back?", body explains it returns to the All Timesheets tab and stays editable, with Cancel / Move back buttons.
3. Toast message updated to "Moved back to All Timesheets" (override the hook's generic "Removed from folder" toast by passing `onSuccess` in the mutate call, or update the hook's default — prefer per-call override to avoid touching the hook).

No DB or RLS changes required — permissions already cover this.

## Verification

- As admin, open a folder with a Pending timesheet → click the new "Move back" action → confirm → row disappears from folder, reappears in All Timesheets.
- Approved rows show no "Move back" button.
- Non-admin users see no "Move back" button.
