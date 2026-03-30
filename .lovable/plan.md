

# Real-Time Employee Hours with Break & Paid Hours Breakdown

## Problem
1. When admins edit check-in/out times or breaks, the employee panel still shows stale `hours_worked` values — it doesn't recalculate from the updated times
2. Employees see no breakdown of breaks, raw hours, or paid hours
3. The weekly summary only shows a single "Total Hours" number with no context

## Solution

### 1. Recalculate hours client-side instead of relying on stored `hours_worked`

**File: `src/hooks/useTimesheets.ts`**
- After fetching weekly timesheets, compute `raw_hours` from `check_in_time` / `check_out_time` diff for each entry
- Compute `paid_hours` as `raw_hours - (break_minutes / 60)`
- Include `break_minutes` in the returned data (already exists in DB, just not selected/used)
- Update `totalWeeklyHours` to sum paid hours, and add new totals: `totalRawHours`, `totalBreakMinutes`
- Enable **real-time subscription** on the `timesheets` table filtered by `user_id` so admin edits push updates instantly

### 2. Show break and paid hours in Weekly History table

**File: `src/components/employee/time-tracker/WeeklyHistorySection.tsx`**
- Add columns: **Break** and **Paid Hours**
- "Break" shows `30m`, `1h`, etc. (formatted from `break_minutes`)
- "Total Hours" column renamed to "Raw Hours" showing clock-in to clock-out duration
- New "Paid Hours" column = raw minus break
- Add a **summary footer row** at the bottom of the table showing:
  - Total Raw Hours | Total Break | Total Paid Hours

### 3. Update "This Week's Summary" card with breakdown

**File: `src/components/employee/TimeTracker.tsx`** (lines 214-250)
- Replace the single "Total Hours" display with three stats:
  - **Raw Hours** (total clock-in to clock-out)
  - **Total Breaks** (sum of all break_minutes for the week)
  - **Paid Hours** (raw minus breaks)
- Progress bar tracks **Paid Hours** toward 40h

### 4. Update Today's Status with break info

**File: `src/components/employee/time-tracker/TodayStatusBox.tsx`**
- Recalculate today's hours from timestamps instead of stored `hours_worked`
- Add a 4th stat box showing today's total break time

### 5. Real-time updates via Supabase subscription

**File: `src/hooks/useTimesheets.ts`**
- Add a `useEffect` with `supabase.channel()` listening to `timesheets` table changes filtered by `user_id`
- On any INSERT/UPDATE/DELETE, invalidate the `['timesheets']` query cache
- This ensures admin edits to times/breaks appear on the employee panel within seconds

## Scope
- 4 files modified
- No database changes (break_minutes already exists on timesheets table)
- No new dependencies

