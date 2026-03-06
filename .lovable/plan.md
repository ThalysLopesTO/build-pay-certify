

# Fix: Break Hours Not Reflected in Exports (Excel, CSV, PDF)

## Problem
The UI correctly shows paid hours with break deductions (e.g., Carlos Hernández: 15 raw → 13.50 paid, 90 min break), but exports show raw hours (15) with 0 break. This affects Excel, CSV, and PDF exports.

## Root Cause
**Race condition** in `useTimeSummaryDataWithRules.ts`:

1. When data loads, an **immediate effect** (lines 91-118) sets `dataWithRules` with raw values: `total_paid_hours = total_hours`, `total_break_minutes = 0`
2. Then raw timesheets load and an **async calculation** applies time rules to get correct paid hours and breaks
3. Between steps 1 and 2 finishing, there's a gap where `isLoading = false` but data still has raw values — the export button becomes clickable with stale data

The sequence: timesheets finish loading (`isTimesheetsLoading = false`) → **one render cycle gap** → `calculateRules()` runs and sets `isCalculating = true`. During that gap, `isLoading` is false and the export button is enabled with uncorrected data.

## Fix

### 1. `src/hooks/useTimeSummaryDataWithRules.ts` — Close the race condition gap

In the immediate data effect (line 91), when base data is set and raw timesheets are expected, pre-set `isCalculating = true` so the loading state stays active until rules are fully calculated. This prevents the export button from being clickable before rules are applied.

```typescript
// In the immediate data effect (~line 102), after setting dataWithRules:
// Signal that calculation is pending (closes the gap)
if (baseData.length > 0) {
  setIsCalculating(true);
}
```

Also add a guard: if `rawTimesheets` has loaded but rules haven't been applied yet, keep `isCalculating = true`.

### 2. `src/hooks/useTimeSummaryDataWithRules.ts` — Validate export data

Update the `validatedData` memo to prefer enhanced data (with rules) over immediate data when raw timesheets exist. If rules haven't been calculated yet but raw timesheets are available, return empty array to force waiting.

### 3. Alternative simpler approach — Add `isRulesReady` flag

Add an explicit `isRulesReady` boolean that's only set to `true` after the async `calculateRules()` completes. Return this from the hook. Then in `TimeSummaryPage.tsx`, disable exports until `isRulesReady` is true (in addition to `isLoading`).

**Recommended approach**: Combine options 1 and 3 for belt-and-suspenders safety.

### Files to modify:
- `src/hooks/useTimeSummaryDataWithRules.ts` — Set `isCalculating = true` earlier to close the gap, and expose `isRulesReady`
- `src/components/admin/time-summary/TimeSummaryPage.tsx` — Use `isRulesReady` to disable export button until break calculations are applied

## Scope
- 2 files modified
- No new dependencies
- No database changes

