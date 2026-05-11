## Issue

In the new "Create Punch for Employee" modal, clicking the **Employee** dropdown shows nothing — the list of employees doesn't appear.

## Root cause (most likely)

The Radix `<SelectContent>` portal mounts to `document.body` with `z-50`, and the surrounding `<DialogContent>` is also `z-50`. Inside a Dialog, Radix Select sometimes renders with a stacking context that puts it visually behind the dialog overlay, so the list is technically rendered but invisible/non-clickable. This is a known shadcn/ui interaction issue.

A secondary contributing factor: the modal currently doesn't show a placeholder/empty-state when there are no employees, so if the query is still loading (or returned 0 rows) the dropdown looks broken with no hint.

## Fix

Edit `src/components/admin/live-punch-monitor/CreatePunchModal.tsx`:

1. **Force `<SelectContent>` above the dialog**
   - Add `className="z-[60]"` and `position="popper"` to both `<SelectContent>` blocks (Employee + Jobsite). `popper` keeps the list anchored to the trigger and `z-[60]` lifts it above the Dialog's `z-50`.

2. **Add empty/loading hints inside the dropdowns**
   - If `employees` array is empty, render a disabled `<div className="px-2 py-1.5 text-sm text-muted-foreground">No employees found</div>` instead of zero items.
   - Same for jobsites.

3. **No data-fetching changes** — the modal continues to use the `employees` / `jobsites` arrays passed from `LivePunchMonitor`.

## Files to edit

- `src/components/admin/live-punch-monitor/CreatePunchModal.tsx`

## Verification

- Open the modal → click **Employee** → the dropdown appears in front of the dialog with the full list of employees.
- Same for **Jobsite**.
- If a list is empty, "No employees found" / "No jobsites found" is shown instead of a blank list.
