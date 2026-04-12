

# Fix PDF Export — autoTable v5 finalY Access

## Problem
Line 341: `(tableResult as any).finalY` crashes because `autoTable()` in v5.0.2 returns `undefined`. The `finalY` value is on `doc.lastAutoTable.finalY`.

## Fix
**File: `src/components/admin/live-punch-monitor/DailyHoursSummaryExport.tsx`**

- Line 325: Remove the `const tableResult =` assignment — just call `autoTable(doc, {...})`
- Line 341: Replace `(tableResult as any).finalY` with `(doc as any).lastAutoTable.finalY`

Two lines changed. No other files affected.

