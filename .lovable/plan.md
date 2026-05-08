## Goal

Add an option to download all selected timesheets as a **single combined PDF** (one file, multiple pages), instead of only the current behavior that saves a separate PDF per timesheet.

## Current behavior

In `ManualTimesheetsTable.tsx`, the bulk action button "Download N PDFs" loops through selected timesheets and calls `generateManualTimesheetPDF()` once per timesheet, producing N separate downloads.

## Proposed change

1. **Refactor `src/utils/manualTimesheetPDF.ts`**
   - Extract the per-timesheet rendering logic into an internal helper `renderTimesheetIntoDoc(doc, ts, branding, { isFirst })` that draws into an existing `jsPDF` instance (calling `doc.addPage()` between timesheets).
   - Keep the existing `generateManualTimesheetPDF(ts, branding)` working (it will create a doc, call the helper, and save).
   - Add a new export `generateCombinedManualTimesheetsPDF(timesheets, branding)` that creates one `jsPDF`, renders each timesheet on its own page(s), and saves a single file like `timesheets-combined-YYYY-MM-DD.pdf`.

2. **Update `ManualTimesheetsTable.tsx` bulk action UI**
   - Replace the single "Download N PDFs" button with a small dropdown (or two adjacent buttons) offering:
     - **Download as single PDF** (combined, new default) — calls `generateCombinedManualTimesheetsPDF`.
     - **Download separate PDFs** — keeps current behavior with progress indicator.
   - Reuse existing `selectedIds` / `bulkProgress` state. Combined download shows a simple "Generating combined PDF…" state (no per-file progress needed).

3. **No backend, schema, or permissions changes.** Foreman/admin access rules stay the same.

## Files to edit

- `src/utils/manualTimesheetPDF.ts` — refactor + new combined export.
- `src/components/admin/manual-timesheets/ManualTimesheetsTable.tsx` — bulk action UI + handler.

## Verification

- Select multiple timesheets → "Download as single PDF" → one PDF opens with each timesheet on its own page, branding/logo intact, page numbers continuous.
- "Download separate PDFs" still produces N individual files as before.
- Single-row download button (per timesheet) unchanged.
