## Goal

Add filters and bulk PDF download to the **All Timesheets** tab only. Zero changes to the form, view modal, edit modal, hook, PDF generator, or database.

## Scope

Single file edit: `src/components/admin/manual-timesheets/ManualTimesheetsTable.tsx`.

## UI additions (above the table, inside the same card)

A toolbar with:

1. **Search** — free text matching `employee_name`, `employee_role`, `project_name` (case-insensitive).
2. **Employee** — dropdown built from unique `employee_name` values present in the loaded list, plus "All employees".
3. **Project / Jobsite** — dropdown built from unique `project_name` values, plus "All projects".
4. **Role / Trade** — dropdown built from unique `employee_role` values (excluding null), plus "All roles".
5. **Date range** — two date pickers (From / To) matched against `pay_period_start`/`pay_period_end` (inclusive overlap). Parsed at noon local time.
6. **Clear filters** button — visible only when any filter is active.
7. Result count: "Showing X of Y timesheets".

## Multi-select download

- Checkbox column added as the first column on the desktop table; mobile cards get a small checkbox in the top-left.
- Header checkbox toggles "select all visible (filtered) rows".
- A sticky action bar appears when ≥1 row is selected: "N selected · [Download PDFs] · [Clear]".
- Bulk download iterates the selected timesheets and calls the existing `generateManualTimesheetPDF` for each (sequentially, with a small await gap so browsers don't block downloads). Progress shown as "Downloading X of N…" on the button. No changes to the PDF utility.

## State (local, in this component)

```ts
const [search, setSearch] = useState('');
const [employeeFilter, setEmployeeFilter] = useState<string>('all');
const [projectFilter, setProjectFilter] = useState<string>('all');
const [roleFilter, setRoleFilter] = useState<string>('all');
const [fromDate, setFromDate] = useState<string>('');
const [toDate, setToDate] = useState<string>('');
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
```

## Filtering logic (memoized)

```text
filtered = items.filter(ts =>
  (search === '' || matches name/role/project) &&
  (employeeFilter === 'all' || ts.employee_name === employeeFilter) &&
  (projectFilter === 'all'  || ts.project_name === projectFilter) &&
  (roleFilter === 'all'     || ts.employee_role === roleFilter) &&
  (fromDate === '' || ts.pay_period_end   >= fromDate) &&
  (toDate   === '' || ts.pay_period_start <= toDate)
)
```

When the filtered set changes, prune `selectedIds` to only ids that still appear (so hidden rows aren't accidentally downloaded).

## Non-goals (explicitly NOT touched)

- `useManualTimesheets` hook
- `manualTimesheetPDF.ts`
- `HourlyTimesheetForm`, `ManualTimesheetEditModal`, `ManualTimesheetViewModal`
- Database schema, RLS, types
- Foreman/Management dashboards or any other table/list

## Acceptance

- All filters reduce both desktop table rows and mobile cards.
- Header checkbox selects only currently filtered rows.
- "Download PDFs" produces one PDF per selected row; existing single-row Download button still works unchanged.
- Clearing filters restores the full list; selection persists for ids still visible.
