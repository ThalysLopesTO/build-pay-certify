## Problem

Users intermittently see a crash on the Employee Management page:
> `Cannot read properties of undefined (reading 'activeEmployeeCount')`

## Root cause

In `src/components/admin/employee-management/ImprovedEmployeeManagement.tsx`:

```ts
const { data, isLoading: loading, isError: error } = useEmployees();
const activeEmployeeCount = data.activeEmployeeCount;  // crashes
```

The `useEmployees` query (`src/hooks/new/useUsers.ts`) can legitimately resolve to `null` (when the user profile hasn't loaded yet) or be `undefined` while disabled. In those moments, `isLoading` is `false` but `data` is not an object, so reading `data.activeEmployeeCount` throws and trips the ErrorBoundary — exactly what the screenshot shows.

This is a race condition: profile is still loading, or the query is disabled because `company_id` isn't ready, so the component renders before `data` exists.

## Fix

Make `ImprovedEmployeeManagement` defensive against `data` being null/undefined:

1. Treat "no data yet" the same as `loading` — show `<EmployeeLoadingState />` until `data` is an object.
2. Safely read `data?.activeEmployeeCount ?? 0` and `data?.activeEmployees ?? []`.
3. Also wait for the user profile so the query has a chance to enable (use `useUserProfile`'s loading state, or simply gate on `data` presence — option 3 is simpler and sufficient).

No business-logic changes; purely defensive frontend rendering.

## Files to edit

- `src/components/admin/employee-management/ImprovedEmployeeManagement.tsx` — guard against undefined/null `data` before destructuring.

## Verification

- Reload `/admin/dashboard?tab=employees` — should render loading state then employee list, never the ErrorBoundary.
- Switching tabs quickly should not trigger the crash.
