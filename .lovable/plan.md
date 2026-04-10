

# Fix: Raw and Paid Hours Still Using Clamped Values

## Problem
The previous fix only partially addressed the issue. While `useTimeSummaryDataWithRules.ts` line 198 was updated to use `result.rawMinutes` for raw hours, **paid hours** in both files still use `result.totalMinutes` (clamped by jobsite rules). And `useTimeSummaryDetails.ts` (the expanded daily breakdown) was never updated at all.

Current behavior for 7:00 AM - 4:30 PM with 8:00 AM rule start:
- Raw: 8.50 (clamped, wrong) in detail view
- Paid: 8.50 or 8.00 (clamped minus break, wrong)

Expected behavior (per your confirmation):
- Raw: 9.50 (actual punch-to-punch)
- Paid: 9.00 (raw minus 30m stored break)

## Root Cause — Two files, three lines

### File 1: `src/hooks/useTimeSummaryDetails.ts` (expanded daily rows)
- **Line 130**: `raw_hours: result.totalMinutes / 60` — uses clamped time, should use `result.rawMinutes / 60`
- **Line 121**: `paidMinutes = Math.max(0, result.totalMinutes - storedBreakMinutes)` — uses clamped time as base for paid, should use `result.rawMinutes`
- **Line 125**: `paidMinutes = result.paidMinutes` — fallback also uses clamped paid, should use `result.rawMinutes`

### File 2: `src/hooks/useTimeSummaryDataWithRules.ts` (aggregated totals)
- **Line 204**: `paidMinutes = Math.max(0, result.totalMinutes - storedBreakMinutes)` — same issue, should use `result.rawMinutes`
- **Line 206**: `paidMinutes = result.paidMinutes` — same issue, should use `result.rawMinutes`

## Fix

### `useTimeSummaryDetails.ts`
```
Line 121: result.totalMinutes → result.rawMinutes
Line 125: result.paidMinutes → result.rawMinutes  (no stored break = no deduction)
Line 130: result.totalMinutes → result.rawMinutes
```

### `useTimeSummaryDataWithRules.ts`
```
Line 204: result.totalMinutes → result.rawMinutes
Line 206: result.paidMinutes → result.rawMinutes
```

## Result
- Raw hours = actual clock-in to clock-out duration (9.50 for 7am-4:30pm)
- Paid hours = raw minus stored break only (9.00 when 30m break stored, 9.50 when no break stored)
- Time rule flags (Early, Late, etc.) still generated correctly for review purposes
- Clamping no longer affects pay calculation, only flags

## Files to change
- `src/hooks/useTimeSummaryDetails.ts`
- `src/hooks/useTimeSummaryDataWithRules.ts`

