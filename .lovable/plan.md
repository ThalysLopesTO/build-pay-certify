

# Upgrade Export with Professional Header, Hourly Rate, and Payment Amount

## Overview
Add a professional header matching the reference image (company name, "Payroll Summary Report" subtitle, period dates, generated timestamp, timezone) to all exports. Add Hourly Rate and Amount (Total Paid Hours x Hourly Rate) columns per employee.

## Changes

### 1. Fetch `hourly_rate` in the breakdown hook
**File: `src/hooks/useEmployeeHoursBreakdown.ts`**
- Add `hourly_rate` to the `user_profiles` select query (line 95)
- Store `hourly_rate` in the profiles Map
- Add `hourlyRate: number` to the `EmployeeBreakdown` interface
- Populate it from the profile data (default 0 if null)

### 2. Pass company settings to the export component
**File: `src/components/admin/live-punch-monitor/DailyHoursSummary.tsx`**
- Import and use `useCompanySettings`
- Pass `companyName` and `timezone` as new props to `DailyHoursSummaryExport`

### 3. Upgrade the export component
**File: `src/components/admin/live-punch-monitor/DailyHoursSummaryExport.tsx`**
- Accept new props: `companyName`, `timezone`
- **Excel export**:
  - Professional header block: Company Name (bold, large), "Payroll Summary Report" subtitle, Period Start/End, Generated date/time, Timezone — matching the reference image layout
  - Add "Hourly Rate" and "Amount" columns to the data table
  - Amount = employee's total paid hours (netMinutes / 60) x hourlyRate, shown per subtotal row
  - Each punch row shows the employee's hourly rate; Amount column blank on individual rows, calculated on subtotal
  - Grand total row includes grand amount total
- **CSV export**: Add Hourly Rate and Amount columns, same logic
- **PDF export**: Add header block with company info, add Hourly Rate and Amount columns

## Files Summary

| File | Action |
|------|--------|
| `useEmployeeHoursBreakdown.ts` | Fetch and expose `hourlyRate` per employee |
| `DailyHoursSummary.tsx` | Pass company name and timezone to export |
| `DailyHoursSummaryExport.tsx` | Professional header, hourly rate + amount columns |

