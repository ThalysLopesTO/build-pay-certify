
## Goal
Hide three pages from navigation (**Timesheets**, **Payroll Summary**, **Time Summary**) and move **Live Punch Monitor** under the **Management Operations** group — without deleting any underlying components, routes, hooks, or DB logic.

## Strategy: Hide, Don't Delete
- Keep `EmployeeTimesheets`, `PayrollSummary`, `TimeSummaryPage`, `LivePunchMonitor` components intact.
- Keep their `case` handlers in `AdminDashboard.tsx` and `ManagementDashboard.tsx` (so any deep links / emails / dashboard quick-action cards that still point there don't break — they just become unreachable from the sidebar).
- Only remove the **menu entries** from the sidebars and rewire the **Live Punch Monitor** menu position.

This minimizes blast radius — no imports removed, no shared hooks touched, no DB or realtime channels affected.

## Files to Change

### 1. `src/components/admin/sidebar/menuData.ts`
- **Remove from `groupedMenuItems.employees`**: `time-summary`
- **Move `live-punch-monitor`**: from `groupedMenuItems.employees` → into `groupedMenuItems.managementOps` (as the first item)
- **Remove from `groupedMenuItems.managementOps`**: `timesheets`, `payroll-summary`
- Result: `managementOps` group becomes `[live-punch-monitor]` only. `employees` group keeps `employees`, `employee-registration`, `time-requests`.
- Leave the unused `menuData` entries (`timesheets`, `payroll-summary`, `time-summary`) in the array — harmless and keeps types/icons intact.

### 2. `src/components/management/sidebar/managementMenuData.ts`
In `managementMenuItems.operations`, remove these three items:
- `Timesheet Approval` (id: `timesheets`)
- `Payroll Summary` (id: `payroll-summary`)
- `Time Summary` (id: `time-summary`)

`Live Punch Monitor` already lives under `operations` here — no move needed.

### 3. `src/components/admin/dashboard/AdminDashboardContent.tsx`
Quick Actions still link to the removed tabs. Update:
- Remove the **"My Timesheet"**, **"Timesheet Approval"**, and **"Payroll Summary"** entries from the `quickActions` array (keep "Bills & Expenses").
- Add replacement quick actions so the grid still has 4 cards: suggest **Live Punch Monitor** (`live-punch-monitor`), **Time Requests** (`time-requests`), **Daily Reports** (`daily-reports`).
- Update the two stat cards (`Total Hours This Week`, `Timesheets (Last 7 Days)`) — re-target their `onClick` from `'timesheets'` → `'live-punch-monitor'` so clicks still go somewhere meaningful.

### 4. `src/components/management/ManagementDashboardHome.tsx`
Same treatment in the Management home quick-actions — replace `timesheets` and `payroll-summary` cards with `live-punch-monitor` and another relevant action (e.g. `bills-expenses` if not already present, or `daily-tasks`).

## What We're NOT Touching
- `AdminDashboard.tsx` / `ManagementDashboard.tsx` route switch — all `case` handlers stay.
- Component files (`EmployeeTimesheets.tsx`, `PayrollSummary.tsx`, `TimeSummaryPage.tsx`, `LivePunchMonitor.tsx`).
- Hooks (`useDailyHoursSummary`, `useUpdateTimesheet`, etc.) — all DB/timesheet logic preserved.
- `UserRolesTab.tsx` permission keys — leaving them protects existing role configs.
- Foreman dashboard, employee mobile nav, missed-punch sync, realtime channels.

## Section Label Note
The Admin sidebar's `Management Operations` group label/icon stays as is. With only Live Punch Monitor inside, it's a single-item group — acceptable, and matches the user's "move under Management Operations" instruction exactly.

## Verification Checklist (post-implement)
1. Admin sidebar: no Timesheets, Payroll Summary, or Time Summary entries visible.
2. Admin sidebar: Live Punch Monitor appears under "Management Operations" (not "Employee Management").
3. Management sidebar: no Timesheet Approval, Payroll Summary, Time Summary entries.
4. Admin Dashboard quick actions: no broken links, 4 cards render, each click navigates to a valid section.
5. Time-clock punch-in/out still works (LivePunchMonitor still receives realtime updates because component & hooks untouched).
6. Email deep-links containing `?tab=timesheets` etc. still render the page (route handler preserved).
