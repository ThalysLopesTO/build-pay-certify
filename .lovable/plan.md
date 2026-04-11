

# Improve Punch Records UI: Fix Duplicate Duration and Add Break Time

## Problem Summary
1. **Duplicate duration**: The Duration column shows raw time (e.g. "7h 32m") AND a RuleBasedHoursCell below it showing the same or similar value -- appears as duplicated text
2. **No break time visibility**: Break minutes stored on timesheets aren't displayed in the punch monitor

## Changes

### 1. Fetch `break_minutes` from timesheets
**File:** `src/components/admin/LivePunchMonitor.tsx`

Add `break_minutes` to the timesheet select query (line 203) and to the `PunchEntry` interface.

### 2. Update LivePunchTable to show single duration + break column
**File:** `src/components/admin/live-punch-monitor/LivePunchTable.tsx`

**Desktop table:**
- Update `PunchEntry` interface to include `break_minutes?: number | null`
- Rename "Duration" header to "Worked Duration"
- Add new "Break Time" column header after "Worked Duration"
- In the Duration cell (lines 495-514): remove the `RuleBasedHoursCell` sub-rendering -- show only the single `calculateTotalTime` value
- Add a new Break Time cell that displays `entry.break_minutes` formatted as "30m", "1h 05m", or "0m" if null/zero

**Mobile card layout:**
- Replace the current "Time" section in the 3-column grid with "Worked" label
- Add a 4th column or a separate row for "Break" showing the formatted break time
- Remove the separate `RuleBasedHours` component block (lines 272-283) to eliminate duplication

### 3. Helper for break formatting
Add a simple inline helper in LivePunchTable:
```typescript
const formatBreakTime = (minutes: number | null | undefined): string => {
  if (!minutes) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${h}h`;
};
```

## What stays the same
- All payroll calculation logic (useTimeSummaryDataWithRules, useTimeSummaryDetails, calculateWorkedHours)
- All other pages and components
- Edit/delete/flag/location actions
- Pagination, filters, realtime subscriptions
- The RuleBasedHours component file itself (just unused in this table)

## Files to modify
1. `src/components/admin/LivePunchMonitor.tsx` -- add `break_minutes` to query + interface
2. `src/components/admin/live-punch-monitor/LivePunchTable.tsx` -- fix duplicate, add break column, improve mobile cards

