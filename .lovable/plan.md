# Daily Sheet — Group Timesheet with PDF Export

Replace the placeholder "Project" tab in Time Sheet with a new **Daily Sheet** tab that lets an admin/manager log a whole crew for one day and export a clean, client-ready PDF.

## How it works

1. Pick a **Project** (jobsite dropdown, with a "custom name" option like the Hourly form).
2. Pick a **Day** — defaults to today, any date can be chosen.
3. Set a **crew default start / end time** (e.g. 7:00 AM – 3:30 PM).
4. **Select multiple employees** from the company directory (searchable multi-select checkbox list, plus an "add custom name" row for workers without an account).
5. Each selected employee appears as a row pre-filled with the crew times; start, end, and break minutes can be edited per row. Hours per row are calculated automatically, with a crew total at the bottom.
6. Optional notes field (weather, scope of work, etc.).
7. **Download PDF** — generates the report. Nothing is stored in the database; the form is a one-off export tool.

## PDF layout

- Company logo + name header band (same branding helper as the existing timesheet PDF).
- Title "Daily Sheet", project name, and the date.
- Table: `#`, Employee, Role/Trade, Start, End, Break, Total Hours.
- Footer row with total workers and total crew hours.
- Notes block underneath if notes were entered.
- No rates, pay, or money anywhere — safe to send to a client.
- File name: `Daily-Sheet_<Project>_<YYYY-MM-DD>.pdf`.

## Technical notes

- New `src/components/admin/manual-timesheets/DailySheetForm.tsx` (form + crew rows), with a small `DailySheetCrewTable.tsx` for the editable rows.
- New `src/utils/dailySheetPDF.ts` using `jsPDF` + `jspdf-autotable`, reusing the header/branding and image-loading patterns from `src/utils/manualTimesheetPDF.ts`.
- New `src/utils/dailySheetTime.ts` for `HH:mm` parsing and hours math (handles overnight shifts, subtracts break minutes).
- `ManualTimesheetForm.tsx`: swap the `project` tab for `daily` labelled "Daily Sheet" (calendar icon) and render `DailySheetForm`.
- Employees come from the existing `useEmployeeDirectory` hook; projects from `useJobsites('all')`.
- Date parsed at noon local time per project convention; mobile-friendly responsive layout (rows stack as cards under `md`).
- No database migration and no schema changes.
