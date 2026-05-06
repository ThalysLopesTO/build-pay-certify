## Goal

Show the **work notes** (entered by employees at punch-out) inside the **Daily Hours Summary**, both in the on-screen breakdown and in the Excel/PDF exports — so admins can review notes alongside hours for each day.

## Scope

The note data is already fetched (`work_note` → `PunchRecord.note` in `useEmployeeHoursBreakdown`). It's just not displayed anywhere in the summary UI or exports today. This is a presentation-only change.

## Changes

### 1. On-screen breakdown — `EmployeeHoursBreakdown.tsx`

**Desktop table:**
- Add a new `Notes` column (after Jobsite, before Actions).
- Render `punch.note` truncated with a tooltip on hover for the full text. Show `—` when empty.

**Mobile card layout:**
- Below the existing punch row meta line, add a small note block when `punch.note` exists:
  ```
  📝 <note text>
  ```
  Styled muted, wrapped, full text visible.

### 2. Excel export (Complete mode) — `DailyHoursSummaryExport.tsx`

In `exportExcelComplete`:
- Add a `Notes` column to each employee's per-punch detail table.
- Populate with `punch.note ?? ''`.
- Widen that column and enable wrap-text so longer notes stay readable.

(Overview Excel stays unchanged — overview is per-employee aggregate, no per-punch notes apply.)

### 3. PDF export (Complete mode) — `DailyHoursSummaryExport.tsx`

In `exportPDFComplete`:
- Add a `Notes` column to the per-punch autoTable for each employee.
- Use `columnStyles` to set a wider width and `cellWidth: 'wrap'` so notes wrap onto multiple lines without breaking the layout.
- If a row has no note, leave the cell empty.

(Overview PDF stays unchanged.)

## Technical notes

- Data source is already in place: `useEmployeeHoursBreakdown.ts` selects `work_note` and maps it to `PunchRecord.note` — no DB or hook changes needed.
- No new dependencies.
- No business logic changes — totals, filtering, approvals, and timezone handling all stay the same.

## Out of scope

- Editing notes from the summary view (notes are still entered/edited via the existing punch-out flow and `PunchEditModal`).
- Adding notes to the Overview exports (they're aggregate-level, not per-punch).