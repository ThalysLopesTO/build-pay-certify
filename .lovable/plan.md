

# Fix: Employee Dashboard Crashing (ErrorBoundary Showing)

## Analysis

The ErrorBoundary we added is catching an error, which is better than a blank page — but employees still can't clock in/out because the **entire content area** is replaced by the error UI. The current ErrorBoundary wraps ALL of `renderContent()`, so any crash in any sub-component kills everything.

Since I can't reproduce the exact error from code alone, the fix needs to be **two-pronged**: make it more resilient AND show us what's actually failing.

## Changes

### 1. Show actual error details in ErrorBoundary (`ErrorBoundary.tsx`)

Add a collapsible "Show Details" section that displays the error message and component stack. This way when employees report issues, the screenshot will show exactly what crashed.

### 2. Wrap individual sections in TimeTracker and Dashboard Home with mini error boundaries

Instead of one ErrorBoundary killing the whole page, wrap each major card/section individually. If `TodayStatusBox` crashes, the clock in/out buttons still work. If `WeeklyHistorySection` crashes, everything else still works.

**`TimeTracker.tsx`**: Wrap `TodayStatusBox`, `WeeklyHistorySection`, and the weekly summary card each in their own `<ErrorBoundary>`.

**`EmployeeDashboardHome.tsx`**: Wrap `DashboardHero`, the weekly hours card, `BirthdayWidget`, and the quick actions grid each in their own `<ErrorBoundary>`.

### 3. Harden `TodayStatusBox.tsx` — remaining `!` force unwraps

Lines 52-53 still have `check_out_time!` force unwraps inside the reduce. Wrap in a try-catch and add null guards.

### 4. Harden `useTimesheets.ts` — protect against invalid dates

Add validation in `computeRawHours` to check that `new Date()` produces a valid date before computing. Return 0 for invalid data instead of NaN.

### 5. Harden `EmployeeDashboardHome.tsx` — handle query error state

The `user_profiles` query throws on `.single()` when no profile exists. Change `if (error) throw error` to just return null, preventing the query from entering error state.

## Scope
- 4 files modified (`ErrorBoundary.tsx`, `TimeTracker.tsx`, `EmployeeDashboardHome.tsx`, `TodayStatusBox.tsx`, `useTimesheets.ts`)
- No database changes

