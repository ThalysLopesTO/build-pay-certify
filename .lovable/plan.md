

# Update Exports: New Excel Theme, Remove CSV, Split PDF

## Summary
Match the Excel Complete export to the green-themed layout from the screenshot, remove CSV, and add PDF Complete + PDF Overview options.

## Changes (single file: `DailyHoursSummaryExport.tsx`)

### 1. Update Excel Complete theme to match screenshot
- **Green header row** (dark green background `#4472C4` or forest green `#548235`, white text) with columns: Employee, Date, Start, End, Break (min), Raw Hours, Paid Hours, Jobsite
- **Employee name in bold** on a row spanning the first column before their punch rows
- **SUBTOTAL row** per employee: bold, light background, showing break total, raw hours total, paid hours total
- **GRAND TOTAL row** at bottom: green/orange background with totals for Break, Raw Hours, Paid Hours
- **Title row**: "Hours Summary — {date range}" merged across top
- Alternating row shading (light gray) for readability
- Column order matches screenshot exactly

### 2. Remove CSV export
- Remove `exportCSV` function
- Remove `'csv'` from `ExportFormat` type
- Remove CSV menu item from dropdown

### 3. Add PDF Complete + PDF Overview
- Rename current `exportPDF` to `exportPDFOverview` (jobsite-grouped, unchanged logic)
- Add `exportPDFComplete`: per-employee daily breakdown matching the Excel Complete layout — employee header, daily punch rows (Date, Start, End, Break, Raw, Paid, Jobsite), employee subtotal, grand total
- Update `ExportFormat` to include `'pdf-complete' | 'pdf-overview'`
- Update dropdown: two PDF items — "PDF (Complete)" and "PDF (Overview)"

### 4. Update dropdown menu
Final menu items:
- Excel (Complete)
- Excel (Overview)  
- PDF (Complete)
- PDF (Overview)

### Files
| File | Action |
|------|--------|
| `DailyHoursSummaryExport.tsx` | Restyle Excel Complete, remove CSV, add PDF Complete/Overview split |

