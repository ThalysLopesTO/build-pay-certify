# Saved Daily Sheets

Daily Sheets are currently generate-and-download only — nothing is kept. This adds persistence plus a new tab listing every past Daily Sheet with one-click PDF re-download.

## What the user gets

1. When "Download PDF" is pressed on the Daily Sheet form, the sheet is also **saved** to the company record (project, day, crew rows, times, breaks, hours, notes, job-detail header fields).
2. A new tab **Daily Sheets** (next to Hourly / Daily Sheet / All Timesheets / Approved Timesheets) shows the saved history:
   - Sortable-by-newest list: project name, day, number of workers, total crew hours, created by, created date.
   - Row actions: **Download PDF** (regenerates the exact same branded PDF from the stored data), **Load into form** (prefills the Daily Sheet form for a quick edit + re-save), **Delete**.
   - Search by project name and a date-range-free simple month/day sort; empty state when nothing saved yet.
   - Mobile: rows collapse into cards; desktop uses the standard `TableCard` layout.
3. Admins and managers see the same tab; visibility follows the existing Time Sheet page permissions.

## Technical notes

- New table `public.daily_sheets`: `company_id`, `jobsite_id` (nullable), `project_name`, `sheet_date`, `crew` (jsonb array of `{id,name,role,start,end,breakMinutes,notes}`), `total_hours` numeric, `notes`, `job_details` jsonb (po_builder, job_name, site_address, supervisor, weather, safety_meeting, meeting_time), `created_by`, `created_at`, `updated_at` + update trigger. GRANTs for `authenticated`/`service_role`, RLS enabled: company members can read/insert/update/delete rows of their own company (admin/manager scoping via the existing helper functions).
- New hook `src/hooks/useDailySheets.ts` (react-query: `list`, `create`, `update`, `remove`) mirroring `useManualTimesheets.ts` conventions.
- `DailySheetForm.tsx`: on successful PDF generation, insert (or update when a sheet was loaded from history) via the hook; keep the download behaviour unchanged. Accept optional `initialSheet` prop for "Load into form".
- New `src/components/admin/manual-timesheets/SavedDailySheetsTable.tsx` reusing `generateDailySheetPDF` from `src/utils/dailySheetPDF.ts` for re-download (logo/company settings pulled from the same hooks, so branding stays current).
- `ManualTimesheetForm.tsx`: add the fifth tab with a count badge, and wire the "Load into form" action to switch back to the Daily Sheet tab.
- Dates stored as `date` and parsed at noon local time per project convention.
