

# Upgrade Daily Hours Summary to Payment-Ready Employee Breakdown

## Overview
Transform the existing Daily Hours Summary panel into a payment-review tool that groups records by employee, shows day-by-day punch details (time in, time out, break, net hours), and keeps the summary synchronized with the punch table filters.

## Architecture

The existing `useDailyHoursSummary` hook fetches flat timesheet records. We'll create a new hook that fetches the same data but includes `user_id`, `jobsite_id`, and user profile info, then groups by employee → day → individual punches.

## New Files

### 1. `src/hooks/useEmployeeHoursBreakdown.ts`
- Accepts same filter props as `useDailyHoursSummary` (companyId, startDate, endDate, jobsiteId, employeeId)
- Queries `timesheets` with `user_id, check_in_time, check_out_time, break_minutes, jobsite_id, work_note, status`
- Separately fetches `user_profiles` (first_name, last_name, photo_url) and `jobsites` (name) for matched records
- Returns memoized structure:
```
{
  employees: Array<{
    userId: string
    firstName: string
    lastName: string
    photoUrl: string | null
    totalNetMinutes: number
    totalBreakMinutes: number
    days: Array<{
      date: string
      punches: Array<{
        id: string
        checkIn: string
        checkOut: string | null
        breakMinutes: number
        netMinutes: number
        jobsiteName: string
        status: string
        note: string | null
        isIncomplete: boolean
      }>
      dayNetMinutes: number
      dayBreakMinutes: number
    }>
  }>
  grandTotalNetMinutes: number
  grandTotalBreakMinutes: number
  totalDays: number
  incompleteCount: number
}
```
- Incomplete punches (no check_out) are included but flagged `isIncomplete` and excluded from totals

### 2. `src/components/admin/live-punch-monitor/EmployeeHoursBreakdown.tsx`
- Renders the grouped employee breakdown below the summary stats
- For each employee: a card/section with avatar, name, total net hours, total break
- Inside each employee card: day rows, each expandable or inline, showing individual punches with time in/out, break, net hours
- Incomplete punches shown with a warning badge ("Missing Clock Out")
- Desktop: clean table-like rows per employee card
- Mobile: stacked card layout per day

## Modified Files

### 3. `src/components/admin/live-punch-monitor/DailyHoursSummary.tsx`
- Replace `useDailyHoursSummary` with `useEmployeeHoursBreakdown`
- Keep existing filter UI (start date, end date, jobsite, employee selects, generate button)
- Keep existing summary stat cards (Days Worked, Total Hours, Total Break, Avg/Day) — fed from new hook's grand totals
- Replace the simple daily list with `<EmployeeHoursBreakdown>` component
- The daily-only view becomes the employee-grouped view with day details

### 4. `src/hooks/useDailyHoursSummary.ts`
- Keep as-is (other consumers may use it). The new hook replaces it only in DailyHoursSummary component.

## Display Structure

```text
Daily Hours Summary [▲]
┌──────────────────────────────────────────────┐
│ Filters: [Start] [End] [Jobsite] [Employee]  │
│ [Generate Summary]                           │
│                                              │
│ ┌─ Employee: Leonardo Machado ─────────────┐ │
│ │ 📷 Leonardo Machado    Total: 38h 20m    │ │
│ │                        Break: 1h 00m     │ │
│ │                                          │ │
│ │ Mon, Apr 07                              │ │
│ │  6:18 AM → 2:00 PM  Break: 30m  7h 12m  │ │
│ │                                          │ │
│ │ Tue, Apr 08                              │ │
│ │  6:10 AM → 2:14 PM  Break: 0m   8h 04m  │ │
│ │  2:30 PM → 5:00 PM  Break: 0m   2h 30m  │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ┌─ Employee: John Smith ───────────────────┐ │
│ │ ...                                      │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ [Days Worked: 7] [Total: 120h] [Break: 2h]  │
│ [Avg/Day: 17h]                               │
└──────────────────────────────────────────────┘
```

## Key Rules
- Net hours = (check_out - check_in) - break_minutes (same formula already used)
- Incomplete punches flagged, excluded from totals
- Reuses `formatDurationFromMinutes`, `EmployeeAvatar`, `parseLocalDate`
- No changes to payroll, invoice, or other pages
- Permissions inherited from LivePunchMonitor (admin/management/foreman only)

## Files Summary

| File | Action |
|------|--------|
| `src/hooks/useEmployeeHoursBreakdown.ts` | **Create** — query + employee/day grouping |
| `src/components/admin/live-punch-monitor/EmployeeHoursBreakdown.tsx` | **Create** — employee cards with day-by-day punch details |
| `src/components/admin/live-punch-monitor/DailyHoursSummary.tsx` | **Update** — swap to new hook, render employee breakdown |

