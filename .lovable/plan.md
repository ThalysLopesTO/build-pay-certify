## Add pagination to Time Sheet (Manual Timesheets) page

Add client-side pagination to the "All Timesheets" table at `/admin/manual-timesheets`, showing 20 records per page on both desktop and mobile.

### Changes
**File:** `src/components/admin/manual-timesheets/ManualTimesheetsTable.tsx`

1. Add pagination state:
   - `currentPage` (default 1)
   - `pageSize` (default 20, with selector for 10/20/50/100)
2. Derive `paginated = filtered.slice((currentPage-1)*pageSize, currentPage*pageSize)` and `totalPages = Math.ceil(filtered.length / pageSize)`.
3. Reset `currentPage` to 1 whenever filters (`search`, `employeeFilter`, `projectFilter`, `roleFilter`, `fromDate`, `toDate`, `pageSize`) change.
4. Render `paginated` instead of `filtered` in both the desktop table body and the mobile cards list.
5. Add a pagination footer (reusing the look of `TimesheetPagination`) below the table/cards with:
   - "Showing X to Y of Z timesheets"
   - Page size selector
   - First / Prev / Page N of M / Next / Last buttons
   - Hidden when `totalPages <= 1`
6. Keep "Select all visible" semantics scoped to the current page (selection acts on `paginated` rows), so bulk PDF download only affects what's shown.

### Notes
- Pure client-side; no DB changes. Existing `useManualTimesheets` already returns the full list.
- No new dependencies; uses existing `Button`, `Select`, and lucide icons.
