

# Approve Issues & Improve Break Time Editing

## Two Features

### 1. Approve/Dismiss Issue Flags
Allow admins to click an issue badge and mark it as "OK" (approved). The flag stays for audit but visually changes to a green "OK" state.

**Database**: Add a `dismissed_flags` column (text array) to the `timesheets` table to store approved flags per punch. No new table needed.

**File: `src/components/admin/time-summary/EmployeeTimeSummaryRow.tsx`**
- Make each issue badge clickable. On click, call `useUpdateTimesheet` to add the flag to the `dismissed_flags` array for that timesheet.
- If a flag is in `dismissed_flags`, render it as a green "✓ OK" badge instead of the orange/red warning.
- Add a tooltip showing "Click to approve" on unapproved flags and "Approved — click to undo" on approved ones.

**File: `src/hooks/useUpdateTimesheet.ts`**
- Add `dismissedFlags` to the update params so it can persist the array.

**File: `src/hooks/useTimeSummaryDataWithRules.ts`**
- Pass `dismissed_flags` from raw timesheets through to the calculation results so the UI has access.

**File: `src/hooks/useTimeSummaryData.ts`**
- Add `dismissed_flags` to the `DailyPunch` type.

**Migration**: Add `dismissed_flags text[] default '{}'` column to `timesheets`.

### 2. Break Time Preset Selector
Replace the free-form number input in `EditPunchDialog` with preset buttons + custom option.

**File: `src/components/admin/time-summary/EditPunchDialog.tsx`**
- Replace the break minutes `<Input type="number">` with a row of preset buttons: **15 min**, **30 min**, **40 min**, **1 hr**, **1.5 hr**, **Custom**.
- Clicking a preset sets the value immediately. Clicking "Custom" reveals a number input.
- Selected preset gets a highlighted/active style.
- Break deduction logic remains unchanged — it already subtracts `break_minutes` from raw hours to get paid hours.

## Scope
- 1 migration (add `dismissed_flags` column)
- 5 files modified
- No new dependencies

