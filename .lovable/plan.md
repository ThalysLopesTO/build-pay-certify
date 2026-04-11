

# Fix PDF Export — jspdf-autotable v5 API Change

## Problem
`jspdf-autotable` v5 changed its API. The code uses the old v3/v4 pattern `(doc as any).autoTable({...})` and `(doc as any).lastAutoTable`, which throws at runtime in v5.

## Fix
**File: `src/components/admin/live-punch-monitor/DailyHoursSummaryExport.tsx`**

1. Change import from `import 'jspdf-autotable'` to `import autoTable from 'jspdf-autotable'`
2. Replace `(doc as any).autoTable({...})` calls with `autoTable(doc, {...})`
3. Replace `(doc as any).lastAutoTable.finalY` with the return value from `autoTable()` — in v5, `autoTable()` returns an object with `finalY`

| Line | Change |
|------|--------|
| 15 | `import autoTable from 'jspdf-autotable'` |
| 325-339 | `const result = autoTable(doc, { startY: yPos, ... })` |
| 341 | `yPos = result.finalY + 10` (use return value) |

