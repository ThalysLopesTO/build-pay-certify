

# Fix: Time Summary Performance and Accuracy Issues

## Problems Identified

1. **Slow loading**: The system makes **N+1 database calls** per employee row. Each `EmployeeTimeSummaryRow` calls `useTimeSummaryDetails` (which calls `rpc_time_summary_details`), and then for each punch, `calculateWorkedHours` calls `getApplicableTimeRule` which queries `jobsite_time_rules` individually. For 20 employees x 10 punches each = **200+ individual Supabase queries** just for time rules.

2. **Break deductions inconsistent**: The `rpc_time_summary_headers` SQL function returns raw `total_minutes` (no break deductions). The client-side `useTimeSummaryDataWithRules` then tries to apply rules asynchronously, but the `EmployeeTimeSummaryRow` component **also** independently fetches and calculates via `useTimeSummaryDetails`. These two paths can race and produce different results.

3. **Missing clock-outs not shown as issues**: The `rpc_time_summary_headers` query filters with `check_in_time IS NOT NULL` but does NOT filter out missing clock-outs. However, `useTimeSummaryDataWithRules` line 155 adds `.not('check_out_time', 'is', null)` — so the raw timesheets query excludes incomplete punches entirely. The headers RPC counts them but the rules calculation ignores them, causing mismatched totals.

4. **Weekend punches potentially missed**: The date filtering in `useTimeSummaryDataWithRules` (lines 143-154) correctly uses date boundaries, but the `rpc_time_summary_headers` uses timezone-converted dates. If a weekend punch's UTC timestamp falls on a different calendar day in the company timezone, it could be excluded from one query but not the other.

## Plan

### Phase 1: Eliminate N+1 queries (performance fix)

**File: `src/lib/timeRules/calculateWorkedHours.ts`**
- Cache `jobsite_time_rules` lookups in a module-level Map keyed by `jobsiteId`, with a 60-second TTL. This prevents hundreds of identical Supabase calls for the same jobsite during a single page load.
- Add a `preloadTimeRules(jobsiteIds: string[])` function that batch-fetches all rules in one query using `.in('jobsite_id', jobsiteIds)`.

**File: `src/hooks/useTimeSummaryDataWithRules.ts`**
- Before the per-timesheet loop (line 208), call `preloadTimeRules()` with all unique jobsite IDs from `rawTimesheets`. This turns N queries into 1.

### Phase 2: Single source of truth for totals (accuracy fix)

**File: `src/components/admin/time-summary/EmployeeTimeSummaryRow.tsx`**
- Change `useTimeSummaryDetails` to only fetch when the row is **expanded** (set `enabled: isExpanded` instead of `enabled: true` on line 63). This removes the N+1 detail queries on initial load.
- Use the pre-calculated `total_paid_hours`, `total_break_minutes`, and `issue_count` from the parent `useTimeSummaryDataWithRules` as the display values instead of independently recalculating.
- Remove the `onTotalsCalculated` callback pattern — the parent hook already has correct totals.

**File: `src/components/admin/time-summary/TimeSummaryTable.tsx`**
- Remove the `employeeTotals` state and `handleEmployeeTotals` callback. Use `total_paid_hours` / `total_raw_hours` directly from the data prop (which comes from `useTimeSummaryDataWithRules`).

### Phase 3: Show missing clock-out as issues

**File: `src/hooks/useTimeSummaryDataWithRules.ts`**
- In the raw timesheets query (line 155), remove `.not('check_out_time', 'is', null)` so incomplete punches are included.
- In the calculation loop (line 208), when `check_out_time` is null, skip hour calculation but add a `MISSING_CHECKOUT` flag and increment the issue count for that employee.
- This ensures employees with missing clock-outs appear with a visible issue indicator and 0 hours for that punch.

### Phase 4: Consistent weekend/date handling

**File: `src/hooks/useTimeSummaryDataWithRules.ts`**
- Fetch company timezone (already available from `useTimeSummaryData`) and use it when constructing date boundaries for the raw timesheets query, matching the approach used by `rpc_time_summary_headers`.

## Scope
- 4 files modified
- No new database tables or migrations
- No new dependencies
- Exports (Excel/CSV/PDF) automatically benefit since they read from `useTimeSummaryDataWithRules` data

