

# Add Two Excel Export Options: Complete & Overview

## What Changes

Replace the single "Excel" option in the Daily Hours Summary export dropdown with two options:

1. **Excel (Complete)** — Per-employee breakdown with daily rows showing Date, Start, End, Break, Raw Hours, Paid Hours, Jobsite, and Note for each punch
2. **Excel (Overview)** — The current jobsite-grouped summary (unchanged logic, just renamed)

## File Changes

### `src/components/admin/live-punch-monitor/DailyHoursSummaryExport.tsx`

**1. Add new export function `exportExcelComplete`:**
- Sheet 1: "Employee Details" — For each employee, output a header row with their name, then day-by-day rows with columns: Date, Start, End, Break, Raw Hours, Paid Hours, Jobsite, Note. Employee total row after each employee. Grand total at the bottom.
- Uses the existing `employees` prop which already contains `days[].punches[]` with all needed fields (checkIn, checkOut, breakMinutes, grossMinutes, netMinutes, jobsiteName, note).
- Same branded header block (company name, address, period, timezone) as the current export.
- Same orange/gray styling conventions.

**2. Rename current `exportExcel` to `exportExcelOverview`:**
- No logic changes, just rename the function.

**3. Update the dropdown menu:**
- Replace the single "Excel" item with two items:
  - "Excel (Complete)" → calls `exportExcelComplete`
  - "Excel (Overview)" → calls `exportExcelOverview`

**4. Update `handleExport`:**
- Change `ExportFormat` type to include `'excel-complete' | 'excel-overview'` instead of `'excel'`.

### Complete Export Layout

```text
[Company Name]
[Address / Phone / Email]
Payroll Detail Report
Period: Apr 01 2026 - Apr 11 2026

── Adriano Junior ──────────────────────────────────
Date       | Start    | End      | Break | Raw    | Paid   | Jobsite       | Note
Wed Apr 01 | 6:06 AM  | 2:00 PM  | 0m    | 7h 54m | 7h 54m | Project Eagle | Drywall install
Thu Apr 02 | 6:06 AM  | 2:00 PM  | 0m    | 7h 53m | 7h 53m | Project Eagle | Framing
                                   Employee Total:   55h 16m  55h 16m

── Next Employee ───────────────────────────────────
...

GRAND TOTAL                                          120h 30m  118h 00m
```

No new files. No database changes. Single file edit.

