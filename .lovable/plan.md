## Problem

In the "Complete" Excel export of the Time Summary (Daily Hours Summary), each row's **Date** column is shifted back by one day (Apr 18–May 03 selection shows Apr 17–May 02 in the file). The title row (`Apr 18 2026 - May 03 2026`) is correct because it uses real `Date` objects, but the per-row dates are not.

## Root cause

In `src/components/admin/live-punch-monitor/DailyHoursSummaryExport.tsx` (line 270 of `exportExcelComplete`, and the equivalent line in `exportPDFComplete`):

```ts
const dateStr = format(new Date(day.date), 'EEE MMM dd');
```

`day.date` is a `YYYY-MM-DD` string from `useEmployeeHoursBreakdown`. `new Date('2026-04-18')` is parsed as **UTC midnight**, which becomes Apr 17 in negative-offset timezones like `America/Edmonton` (UTC-6/7). This is the exact pattern called out in the project's core memory ("Parse dates at noon local time to prevent UTC shifts") and we already have `parseLocalDate` in `src/utils/dateUtils.ts` for this.

## Fix

Replace `new Date(day.date)` with `parseLocalDate(day.date)` in `DailyHoursSummaryExport.tsx`:

1. Add import: `import { parseLocalDate } from '@/utils/dateUtils';`
2. In `exportExcelComplete` row builder: `const dateStr = format(parseLocalDate(day.date), 'EEE MMM dd');`
3. Apply the same fix in `exportPDFComplete` (and `exportPDFOverview` if it formats `day.date`) — audit lines 434–648 of the same file and replace any `new Date(day.date)` / `new Date(<YYYY-MM-DD string>)` usage with `parseLocalDate(...)`.

## Verification

After the change, exporting Apr 18 – May 03 should produce rows starting `Sat Apr 18` and ending `Sun May 03`, matching the on-screen Daily Hours Summary and the selected filter range.

No schema, hook, or UI changes required — this is a one-file display fix.