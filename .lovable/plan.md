## Goal
Foremen should be able to export the **Excel (Complete)** report from the Daily Hours Summary. Other export formats (Excel Overview, PDF Complete, PDF Overview) remain admin/management/super_admin only.

## Changes

### 1. `src/components/admin/live-punch-monitor/DailyHoursSummary.tsx`
- Add `foreman` to the role list that's allowed to see the Export button. Replace the `canExport` check so foremen pass it, and pass a new `userRole` prop down to `DailyHoursSummaryExport`.

### 2. `src/components/admin/live-punch-monitor/DailyHoursSummaryExport.tsx`
- Accept a new `userRole` prop.
- When `userRole === 'foreman'`, render only the **Excel (Complete)** dropdown item (hide Excel Overview, PDF Complete, PDF Overview).
- Admin / management / super_admin keep all four options unchanged.

## Verification
- Log in as foreman → open Daily Hours Summary → Export button visible → dropdown shows only "Excel (Complete)" → file downloads.
- Log in as admin/management → all four export options still appear.
- Employee role still cannot see the Daily Hours Summary at all.
