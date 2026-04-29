## Add Notes to Manual Timesheets

Allow users to attach descriptive notes (work performed, observations, etc.) to a manual timesheet. Notes appear in the form, view modal, and generated PDF.

### 1. Database
- Migration: add `notes text` (nullable) to `public.manual_timesheets`.

### 2. Types & Hook
- `src/hooks/useManualTimesheets.ts` — add `notes: string | null` to `ManualTimesheet` and `notes?: string | null` to `ManualTimesheetInput`.

### 3. Form (HourlyTimesheetForm)
- Add a `notes` state initialized from `initial?.notes ?? ''`.
- New Card section "Notes" placed below `PaymentSummary` containing a `Textarea` (4–6 rows) with placeholder: "Describe the work performed, materials used, observations…".
- Include `notes: notes.trim() || null` in the saved input; reset on create.

### 4. View Modal
- `ManualTimesheetViewModal.tsx` — render a "Notes" section (only when present) with whitespace preserved (`whitespace-pre-wrap`).

### 5. PDF
- `src/utils/manualTimesheetPDF.ts` — after the totals block, if `ts.notes` is present:
  - Add a "Notes" heading.
  - Render with `doc.splitTextToSize(notes, pageWidth - 2*margin)` so long text wraps.
  - Auto-handle page break if `y` near bottom (use `doc.addPage()` when needed).

### Out of scope
- No new tab. Notes live inline within the existing Hourly form (one quick scroll, not a separate step).
- No rich text — plain multi-line text only.
