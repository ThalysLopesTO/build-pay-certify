

# Add Break Time to Edit Punch Record Modal

## Summary
Add a Break Time section to the Edit Punch Record modal (used in Punch In/Out page) matching the UX pattern already established in the Time Summary page's Edit Time Entry dialog. No changes to payroll logic or other pages.

## Changes

### 1. Update `PunchEditData` interface in `src/hooks/usePunchEdit.ts`
- Add `break_minutes?: number | null` to the interface so the mutation can save break data
- Add `work_note?: string | null` (currently missing from the interface but already sent)

### 2. Update `src/components/admin/timesheets/EditPunchModal.tsx`
- Add `break_minutes` state field (string, initialized from `timesheet.break_minutes` or `''`)
- Add `isCustomBreak` boolean state
- Add break preset constants matching Time Summary: `[15, 30, 40, 60, 90]`
- Insert Break Time section between Clock Out Time and Jobsite:
  - Label: "Break Time"
  - Row of preset buttons: 15 min, 30 min, 40 min, 1 hr, 1.5 hr, Custom
  - Active preset gets `variant="default"`, others `variant="outline"`
  - Clicking an active preset deselects it (sets to `''`)
  - "Custom" button reveals a numeric input (min=0, max=180)
  - Helper text: "{X} minutes will be deducted from total hours" or "No break deducted"
- In `handleSubmit`: include `break_minutes: breakMinutes ? parseInt(breakMinutes) : 0` in the update data
- In `useEffect`: preload `break_minutes` from `timesheet.break_minutes`
- Make modal scrollable on small screens: add `max-h-[90vh] overflow-y-auto` to DialogContent

### 3. No other files affected
- The `usePunchEdit` hook already spreads `...data` into the update call, so adding `break_minutes` to the data object will save it automatically
- The Live Punch Monitor table already fetches and displays `break_minutes`
- No payroll or Time Summary logic is touched

## Field Order in Modal
1. Clock In Time
2. Clock Out Time
3. **Break Time** (new)
4. Jobsite
5. Work Note

## Files to modify
- `src/hooks/usePunchEdit.ts` — add `break_minutes` to `PunchEditData`
- `src/components/admin/timesheets/EditPunchModal.tsx` — add break time UI section + save logic

