

# Match Daily Hours Summary Export to Reference Format

## Overview
Restructure the PDF, Excel, and CSV exports to match the reference image: company header with address/phone/email, data grouped by **Location (jobsite)** instead of by employee, summary stat boxes, and a two-column Grand Totals section.

## Changes

### 1. Fetch `role` in the breakdown hook
**File: `src/hooks/useEmployeeHoursBreakdown.ts`**
- Add `role` to the `user_profiles` select query (line 96)
- Store role in the profiles Map and expose it on `EmployeeBreakdown` interface

### 2. Pass full company settings to export
**File: `src/components/admin/live-punch-monitor/DailyHoursSummary.tsx`**
- Pass `companyAddress`, `companyPhone`, `companyEmail` from `companySettings` to `DailyHoursSummaryExport`
- Pass the selected `jobsiteId` filter label so the Filters section can be rendered

### 3. Restructure the export component
**File: `src/components/admin/live-punch-monitor/DailyHoursSummaryExport.tsx`**

**New data structure**: Instead of flat employee→punch rows, build a **jobsite-grouped summary**:
- Group employees by jobsite (using punch-level jobsite data)
- Per employee per jobsite: calculate Days worked, Raw Hrs, Paid Hrs, Punch count, Issues (incomplete count)
- Subtotal per jobsite

**Header block** (all formats):
- Company name, address, phone, email (top-right aligned in PDF/Excel)
- "PAYROLL SUMMARY REPORT" title with company name subtitle
- Period dates (left), Generated timestamp (right)
- Timezone
- Filters section showing active filters

**Summary stats row**: Locations count, Employees count, Total Paid Hours, Issues count

**Data table per location**:
- Section header: "Location: {jobsite name}"
- Columns: Employee, Role, Days, Raw Hrs, Paid Hrs, Punches, Issues
- SUBTOTAL row per location

**Grand Totals section** (two-column layout):
- Total Employees, Total Locations, Total Days Worked, Total Raw Hours (left)
- Total Paid Hours, Total Punches, Total Issues (right)

Apply this structure to Excel (with orange styling), CSV, and PDF exports.

## Files Summary

| File | Action |
|------|--------|
| `useEmployeeHoursBreakdown.ts` | Add `role` to profile fetch and interface |
| `DailyHoursSummary.tsx` | Pass company address/phone/email and filter info |
| `DailyHoursSummaryExport.tsx` | Full restructure to jobsite-grouped summary format |

