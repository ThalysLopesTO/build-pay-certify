

# Daily Hours Summary — Expandable Panel on Punch In/Out Page

## Overview
Add a collapsible "Daily Hours Summary" panel to the Live Punch Monitor page. Users pick a date range (start + end), optionally filter by jobsite/employee, and see total worked hours grouped by day — plus aggregate totals.

## Architecture

**No new queries or DB changes.** The summary fetches its own timesheet data for the selected range via a single Supabase query (reusing the same `timesheets` table + profile joins pattern already in `LivePunchMonitor.tsx`). Duration math reuses the same punch-to-punch logic already used in the table (check_out - check_in, minus break_minutes). Incomplete punches (no check_out) are excluded from totals with a note shown.

## New Files

### 1. `src/hooks/useDailyHoursSummary.ts`
- Custom hook accepting `{ companyId, startDate, endDate, jobsiteId?, employeeId? }`
- Queries `timesheets` table with `check_in_time.gte` / `check_in_time.lte` for the range, plus optional jobsite/employee filters
- Only includes records with both `check_in_time` and `check_out_time`
- Groups by day (date string of `check_in_time`), sums duration per day
- Returns: `{ dailyTotals: Array<{ date: string, totalMinutes: number, breakMinutes: number, punchCount: number }>, totalDays, totalMinutes, totalBreakMinutes, avgMinutesPerDay, skippedCount }`
- Uses `useQuery` with a distinct query key; memoized grouping logic

### 2. `src/components/admin/live-punch-monitor/DailyHoursSummary.tsx`
- Collapsible panel component toggled by a "Daily Hours Summary" button
- Contains:
  - Two date pickers (Start Date / End Date) using existing `Calendar` + `Popover` pattern
  - Jobsite select (reuses existing jobsites data passed as prop)
  - Employee select (reuses `useEmployees` hook)
  - "Generate" button to trigger the query
- Display section:
  - Vertical list of days: `Apr 10 — 8h 02m` with break time shown subtly
  - Totals card at bottom: Days Worked, Total Hours, Total Break, Avg Hours/Day
  - Empty states for no-range-selected and no-results
- Responsive: filters stack on mobile, list is vertical card-style

## Modified Files

### 3. `src/components/admin/LivePunchMonitor.tsx`
- Add state: `showDailySummary` boolean
- Add a "Daily Hours Summary" button next to the existing header area (near the Punch Records heading or after the filter card)
- Render `<DailyHoursSummary>` conditionally, passing `jobsites` and `companyId`
- No changes to existing query, filters, table, or any other logic

## Duration Formatting
Reuse the same `Math.floor(ms / 3600000)` + minutes pattern already used in `LivePunchTable.tsx` and CSV export. Extract to a tiny shared helper if needed, but keep it simple.

## Permissions
The component is only rendered inside `LivePunchMonitor`, which is already gated to admin/management/foreman roles. No additional permission check needed.

## UI Placement
```text
┌─────────────────────────────────────────┐
│  Live Punch Monitor        [Refresh][CSV]│
├─────────────────────────────────────────┤
│  KPI Cards (existing)                    │
├─────────────────────────────────────────┤
│  Filters (existing)                      │
├─────────────────────────────────────────┤
│  [▶ Daily Hours Summary]  ← new button   │
│  ┌─ expanded panel ─────────────────┐    │
│  │ Start: [Apr 7]  End: [Apr 11]    │    │
│  │ Jobsite: [All]  Employee: [All]  │    │
│  │ [Generate Summary]               │    │
│  │                                  │    │
│  │ Apr 07 — 8h 02m  (break: 30m)   │    │
│  │ Apr 08 — 7h 46m  (break: 30m)   │    │
│  │ Apr 09 — 6h 55m  (break: 0m)    │    │
│  │                                  │    │
│  │ ─────────────────────────────    │    │
│  │ Days Worked: 3                   │    │
│  │ Total Hours: 22h 43m            │    │
│  │ Total Break: 1h 00m             │    │
│  │ Avg/Day: 7h 34m                 │    │
│  └──────────────────────────────────┘    │
├─────────────────────────────────────────┤
│  Punch Records (existing table)          │
└─────────────────────────────────────────┘
```

## Files Summary

| File | Action |
|------|--------|
| `src/hooks/useDailyHoursSummary.ts` | Create — query + grouping logic |
| `src/components/admin/live-punch-monitor/DailyHoursSummary.tsx` | Create — panel UI with filters + results |
| `src/components/admin/LivePunchMonitor.tsx` | Add toggle button + render new panel |

