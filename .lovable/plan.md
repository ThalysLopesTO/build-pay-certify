
Fix the employee punch page by removing the remaining full-page failure points and restoring direct access to the clock screen.

## What’s likely going wrong
The screenshot shows the top-level `ErrorBoundary` is still replacing the whole employee dashboard content. From the code review, there are 3 strong risk points:

1. `EmployeeDashboard.tsx` still wraps all tab content in one global `<ErrorBoundary>`, so any child error hides the whole punch page.
2. `useRolePermissions()` throws on query failure and is used by both employee nav components and the dashboard home; if that query fails, navigation/home can crash.
3. Mobile nav is inconsistent:
   - home cards navigate to `time-tracker`
   - desktop nav includes `time-tracker`
   - mobile bottom nav does not include `time-tracker`, only `timesheet`
   This can make the employee flow feel broken and inconsistent even when the page is healthy.

## Plan

### 1. Remove the full-page employee dashboard boundary
File: `src/pages/EmployeeDashboard.tsx`

- Stop wrapping `renderContent()` in the top-level `ErrorBoundary`
- Let each screen/component handle its own resilience instead

Result: if one widget fails, the employee can still access the punch-in/out screen normally.

### 2. Make role-permission loading non-fatal
File: `src/hooks/useRolePermissions.ts`

- Change the permissions query to fail safely:
  - return `[]` on query error instead of throwing
  - log a warning for debugging
- Keep the current default behavior in `filterMenuByPermissions()` / `isMenuItemVisible()` where missing permissions means “show items”

Result: navigation and employee home won’t crash just because the permissions table/query fails temporarily.

### 3. Restore punch access in mobile navigation
File: `src/components/employee/EmployeeBottomNav.tsx`

- Replace the current bottom-nav `timesheet` entry with `time-tracker`
- Label it clearly as `Time Clock` or `Clock In/Out`
- Keep the same permission filtering pattern already used elsewhere

Result: employees on mobile can always reach punch in/out directly from the main nav.

### 4. Harden the employee home widgets further
File: `src/components/employee/EmployeeDashboardHome.tsx`

- Change the user profile query from `.single()` to `.maybeSingle()`
- Wrap the weekly hours card and quick-action sections in minimal `ErrorBoundary` blocks, just like other widgets
- Guard numeric values like weekly progress/hours before calling `.toFixed()`

Result: if home data is missing or malformed, only that small section fails, not the whole employee experience.

### 5. Keep the punch page itself resilient
File: `src/components/employee/TimeTracker.tsx`

- Guard any remaining user-facing values that may be null or invalid:
  - location text
  - formatted dates/times
  - summary numbers used in `.toFixed()`
- Keep the current section-level boundaries around status/history/summary
- Ensure the main clock in/out card is never wrapped in a failing boundary

Result: the core punch actions remain visible even if secondary timesheet data is bad.

## Expected outcome
After this fix:
- employees should see the normal employee page again
- mobile users should have a direct button/tab for punch in/out
- a broken widget should no longer hide the whole screen
- temporary Supabase/query issues should degrade gracefully instead of crashing the dashboard

## Files to update
- `src/pages/EmployeeDashboard.tsx`
- `src/hooks/useRolePermissions.ts`
- `src/components/employee/EmployeeBottomNav.tsx`
- `src/components/employee/EmployeeDashboardHome.tsx`
- `src/components/employee/TimeTracker.tsx`

## Technical note
I do not see a single confirmed crash stack in the available logs, so this plan focuses on removing the remaining architectural failure points that can still produce the exact full-page error state shown in the screenshot. This is the safest path to bring the employee punch page back without breaking the rest of the system.
