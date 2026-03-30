

# Fix: Blank Page When Employees Click Time Tracker

## Root Cause

There is **no Error Boundary** anywhere in the app. When any component throws a runtime error, the entire React tree unmounts — resulting in a blank page.

The most likely crash points are **force-unwrapped null values** (`check_in_time!`) throughout the time tracker components. If a timesheet record has a null `check_in_time` (e.g., from a manual admin insert or data issue), calling `format(new Date(null!), ...)` from date-fns **throws an exception**, which crashes the entire page.

Identified crash points:
- `TimeTracker.tsx` line 153: `todayActiveTimesheet.check_in_time!`
- `TodayStatusBox.tsx` lines 27, 40, 41, 85: multiple `check_in_time!` force unwraps
- `WeeklyHistorySection.tsx` lines 55, 155: `check_in_time!` in table rendering

## Fix (3 changes)

### 1. Add a global Error Boundary component

**New file: `src/components/common/ErrorBoundary.tsx`**

A React class component that catches render errors and shows a recovery UI with a "Reload" button instead of a blank page. Wrap the `EmployeeDashboard` content (and ideally the whole app's route content) with this boundary.

### 2. Remove all `!` force unwraps — add null guards

**Files: `TimeTracker.tsx`, `TodayStatusBox.tsx`, `WeeklyHistorySection.tsx`**

Replace every `timesheet.check_in_time!` with a null check:
- Filter out timesheets with null `check_in_time` before processing
- Use optional chaining: `timesheet.check_in_time ? format(...) : '--:--'`
- Guard `todayActiveTimesheet.check_in_time` before formatting

### 3. Wrap EmployeeDashboard content with ErrorBoundary

**File: `EmployeeDashboard.tsx`**

Wrap `{renderContent()}` with `<ErrorBoundary>` so if any child component crashes, employees see a "Something went wrong — tap to reload" message instead of a blank page.

## Scope
- 1 new file (ErrorBoundary)
- 4 files modified (null guards + boundary wrap)
- No database changes, no new dependencies

