

# Upgrade Employee Punch Out Flow with Break Time + Required Note

## Summary
Enhance the `ClockOutNoteModal` to require break time selection and a work note before finalizing punch out. Update the clock out mutation to save `break_minutes` alongside the existing `work_note`. No database migration needed -- `break_minutes` and `work_note` columns already exist on `timesheets`.

## Changes

### 1. Rewrite `ClockOutNoteModal.tsx`
**File: `src/components/employee/ClockOutNoteModal.tsx`**

Transform from optional note-only modal to a full "Complete Punch Out" confirmation:
- Title: "Complete Punch Out"
- Subtitle explaining the step
- **Break Time** (required): Select with options: No break (0), 15 min, 30 min, 1 hour, Custom. If Custom selected, show numeric input (validated >= 0). Soft warning if > 90 min.
- **Work Note** (required): Textarea with 500 char max, placeholder examples
- **Confirm Punch Out** button (disabled until break selected + note filled)
- **Cancel** button (does NOT finalize -- closes modal safely)
- Mobile-friendly: large inputs, touch-friendly buttons
- Update `onClockOut` signature to `(breakMinutes: number, note: string) => void`

### 2. Update `TimeTracker.tsx`
**File: `src/components/employee/TimeTracker.tsx`**

- Update `handleClockOutWithNote` to accept `(breakMinutes: number, note: string)` and pass both to the `clockOut` mutation
- Pass updated props to `ClockOutNoteModal`

### 3. Update clock out mutation in `useTimesheets.ts`
**File: `src/hooks/useTimesheets.ts`**

- Add `breakMinutes` to clock out mutation params: `{ timesheetId, location, workNote, breakMinutes }`
- Save `break_minutes` in the update payload
- Compute and save `raw_minutes` (diff between check_in and check_out in minutes)
- Compute and save `final_payable_minutes` (raw - break)

### 4. Add "Note" column to `WeeklyHistorySection.tsx`
**File: `src/components/employee/time-tracker/WeeklyHistorySection.tsx`**

- Add a "Note" column after Paid Hours showing truncated work_note (or "—")
- Add `work_note` to the Timesheet type usage (already on the type but not displayed)

No database migration needed. No new tables or columns required.

## Files Summary

| File | Action |
|------|--------|
| `ClockOutNoteModal.tsx` | Rewrite with break presets + required note + confirm flow |
| `TimeTracker.tsx` | Update handler to pass breakMinutes |
| `useTimesheets.ts` | Add breakMinutes to mutation, compute raw/paid minutes |
| `WeeklyHistorySection.tsx` | Add Note column to table |

