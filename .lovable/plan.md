

# Daily Hours Summary — Break Fix, Column Layout, and Export Downloads

## Changes

### 1. Always show Break (even when 0)
**File: `src/components/admin/live-punch-monitor/EmployeeHoursBreakdown.tsx`**
- Remove the `punch.breakMinutes > 0` condition on line 121 — always render break (e.g., "0m")
- Remove the `emp.totalBreakMinutes > 0` condition on line 76 — always show employee-level break total

### 2. Convert punch rows to a columnar table layout
**File: `src/components/admin/live-punch-monitor/EmployeeHoursBreakdown.tsx`**
- Replace the current inline flex-wrap layout for each day's punches with a proper table/grid with columns:
  - **Date** | **Start** | **End** | **Break** | **Raw Hours** | **Paid Hours** | **Jobsite** | **Actions**
- Each day header row spans full width with the date
- Individual punches render as table rows beneath
- On mobile, collapse to a stacked card layout
- Employee header stays as-is (avatar, name, totals)

### 3. Add export buttons (Excel, CSV, PDF)
**File: `src/components/admin/live-punch-monitor/DailyHoursSummaryExport.tsx`** — **Create**
- New component accepting `employees: EmployeeBreakdown[]`, `dateRange`, `companyName`, `grandTotals`
- **CSV export**: Employee-grouped rows with Date, Start, End, Break, Raw Hours, Paid Hours, Jobsite columns. Employee subtotals and grand total at bottom.
- **Excel export**: Uses `xlsx-js-style` (already in project). Styled headers, employee-grouped sheets or sections, subtotals. Same columns as CSV.
- **PDF export**: Uses `jsPDF` + `autoTable` (already in project). Employee sections with day-by-day table, totals per employee, grand total footer.
- UI: Dropdown for CSV/Excel + separate PDF button (same pattern as `TimeSummaryExport.tsx`)

**File: `src/components/admin/live-punch-monitor/DailyHoursSummary.tsx`**
- Import and render `DailyHoursSummaryExport` next to the "Generate Summary" button when results are showing
- Pass breakdown data and date range

## Files Summary

| File | Action |
|------|--------|
| `EmployeeHoursBreakdown.tsx` | Fix break display, convert to column table |
| `DailyHoursSummaryExport.tsx` | **Create** — Excel/CSV/PDF export |
| `DailyHoursSummary.tsx` | Add export component |

