

# Block Employee Login on Admin Page

## Problem
The admin login page (`LoginForm.tsx`) accepts employee credentials and redirects them to the employee dashboard. Employees should be rejected with a clear error message, forcing them to use the Employee Login page instead.

## Fix

**File: `src/components/LoginForm.tsx` (lines 28-50)**

After authentication succeeds and user role is determined, if `user.role === 'employee'`, instead of navigating to `/employee/dashboard`:
1. Show a toast error: "This login page is for company/admin users only. Please use the Employee Login page."
2. Call `logout()` to end the session
3. Do NOT navigate

Replace the `case 'employee':` block (line 45-47) from navigating to employee dashboard, to instead showing the error and logging out.

## Scope
- 1 file modified (`src/components/LoginForm.tsx`)
- No database changes

