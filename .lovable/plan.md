

# Upgrade Daily Hours Summary — Raw/Paid Hours + Inline Editing

## Overview
Add Raw Hours and Paid Hours columns to the employee breakdown, restrict visibility to Admin/Manager, and add inline edit capability for Start Time, End Time, and Break Time using the existing `usePunchEdit` hook.

## Changes

### 1. Role-gate the entire Daily Hours Summary
**File: `src/components/admin/live-punch-monitor/DailyHoursSummary.tsx`**
- At the top of the component, check `user?.role`: if not `admin`, `super_admin`, or `management`, return `null`
- This hides the feature from Foreman and Employee

### 2. Add `grossMinutes` to PunchRecord
**File: `src/hooks/useEmployeeHoursBreakdown.ts`**
- Add `grossMinutes: number` to `PunchRecord` interface
- Add `dayGrossMinutes: number` to `DayBreakdown` interface
- Add `totalGrossMinutes: number` to `EmployeeBreakdown` interface
- Add `grandTotalGrossMinutes: number` to `EmployeeHoursResult` interface
- In the grouping logic, store `grossMinutes` on each punch record (already computed but not stored)
- Sum `dayGrossMinutes` and `totalGrossMinutes` per employee, `grandTotalGrossMinutes` overall

### 3. Update EmployeeHoursBreakdown UI — show Raw, Break, Paid
**File: `src/components/admin/live-punch-monitor/EmployeeHoursBreakdown.tsx`**
- Accept new prop `canEdit: boolean`
- In employee header: show "Total Paid Hours" (net) prominently, plus break total
- Each punch row: display Break, Raw Hours (gross), Paid Hours (net) as separate labeled values
- Add a small edit (pencil) icon button per punch row when `canEdit` is true
- Clicking edit opens the inline edit modal (new component below)

### 4. Create PunchEditModal for inline editing
**File: `src/components/admin/live-punch-monitor/PunchEditModal.tsx`**
- A Dialog/Sheet with fields: Start Time (datetime-local input), End Time (datetime-local input), Break Time (number input in minutes)
- Validation: End > Start, Break <= gross duration
- On save: call `usePunchEdit` mutation with `{ check_in_time, check_out_time, break_minutes }`
- On success: invalidate `employee-hours-breakdown` query key so the summary refreshes
- Reuses existing `usePunchEdit` hook — just adds `employee-hours-breakdown` to its invalidation list

### 5. Update summary stat cards
**File: `src/components/admin/live-punch-monitor/DailyHoursSummary.tsx`**
- Change "Total Net Hours" → "Total Paid Hours" (uses `grandTotalNetMinutes`)
- Add "Total Raw Hours" card (uses `grandTotalGrossMinutes`)
- Keep "Total Break" and "Days Worked"
- Change "Avg / Day" to use paid hours
- Pass `canEdit={user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'management'}` to `EmployeeHoursBreakdown`

### 6. Update usePunchEdit invalidation
**File: `src/hooks/usePunchEdit.ts`**
- Add `queryClient.invalidateQueries({ queryKey: ['employee-hours-breakdown'] })` to `onSuccess` so edits sync the breakdown view

## Files Summary

| File | Action |
|------|--------|
| `src/hooks/useEmployeeHoursBreakdown.ts` | Add grossMinutes fields to types + computation |
| `src/components/admin/live-punch-monitor/EmployeeHoursBreakdown.tsx` | Show Raw/Break/Paid, add edit button |
| `src/components/admin/live-punch-monitor/PunchEditModal.tsx` | **Create** — edit dialog for start/end/break |
| `src/components/admin/live-punch-monitor/DailyHoursSummary.tsx` | Role-gate visibility, update stat card labels |
| `src/hooks/usePunchEdit.ts` | Add breakdown query invalidation |

