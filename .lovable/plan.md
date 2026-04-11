

# Fix: Employee Filter Not Showing All Employees

## Problem
The employee dropdown in Daily Hours Summary only queries users with roles `employee` or `foreman` (line 51). This excludes admins, managers, and super_admins from the list.

## Fix
**File: `src/components/admin/live-punch-monitor/DailyHoursSummary.tsx`**
- Remove the `.in('role', ['employee', 'foreman'])` filter on line 51 so that ALL company employees appear in the dropdown, regardless of role.

| File | Action |
|------|--------|
| `DailyHoursSummary.tsx` | Remove role filter from employee query (line 51) |

