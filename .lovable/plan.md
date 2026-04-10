

# Fix: Raw Hours Calculation Using Clamped Times Instead of Actual Punch Times

## Problem
When an employee punches in at 7:00 AM and out at 4:30 PM, raw hours should be **9.5 hours**. Instead, the system shows **8.5 hours**.

The jobsite "Arbutus 3" has a time rule: start = 08:00, end = 17:00, early grace = 0 minutes. When the employee punches in at 07:00 (before the rule start), the system clamps the effective start to 08:00. It then uses this clamped time to calculate "raw hours" — but raw hours should always be the actual punch-to-punch duration, not the clamped duration.

## Root Cause
In `calculateWorkedHours.ts`, the returned `totalMinutes` is computed from clamped effective times. Then in `useTimeSummaryDataWithRules.ts` line 198, `rawHours` is set to `result.totalMinutes / 60` — which is already clamped, not truly raw.

## Fix

### 1. Add actual raw minutes to `calculateWorkedHours` return value
**File:** `src/lib/timeRules/calculateWorkedHours.ts`

- Add a new field `rawMinutes` to `CalculateWorkedHoursResult` that represents the unclamped punch-to-punch duration
- Set it to `diffInMinutes(rawInDate, rawOutDate)` — the true difference between clock-in and clock-out
- Keep `totalMinutes` as the clamped/effective value (used for paid hour calculations)

### 2. Use `rawMinutes` for raw hours display
**File:** `src/hooks/useTimeSummaryDataWithRules.ts`

- Change line 198 from `result.totalMinutes / 60` to `result.rawMinutes / 60`
- This ensures "Raw Hours" shows actual punch-to-punch time
- Paid hours calculation continues using `result.totalMinutes` (clamped), which is correct

## Expected Result
- 7:00 AM to 4:30 PM → Raw: **9.50 hrs**, Break: 30m, Paid: **9.00 hrs**
- The clamping still applies to paid hours where applicable
- No change to flags or other calculations

## Files to Change
- `src/lib/timeRules/calculateWorkedHours.ts` — add `rawMinutes` field
- `src/hooks/useTimeSummaryDataWithRules.ts` — use `rawMinutes` for raw hours

