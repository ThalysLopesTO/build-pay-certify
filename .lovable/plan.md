## Goal

Mirror the "custom project name" toggle for the Employee field, plus add a trade/role field (Taper, Framer, Drywall, Labour, etc.). Both flow through to the View modal, list, and PDF — keeping current PDF layout intact.

## Changes

### 1. Database migration — `manual_timesheets`
Add two nullable columns:
- `employee_role text` — free-text trade label (e.g. "Taper", "Framer")
- (employee custom name is already supported via `employee_name`; no schema change needed for it — when custom is used, `employee_id` will be set to a sentinel/null pattern)

Make `employee_id` nullable to allow custom-name entries with no linked employee record. Keep existing data intact.

```sql
ALTER TABLE public.manual_timesheets
  ADD COLUMN IF NOT EXISTS employee_role text,
  ALTER COLUMN employee_id DROP NOT NULL;
```

### 2. Hook — `src/hooks/useManualTimesheets.ts`
- Add `employee_role: string | null` to `ManualTimesheet` and `ManualTimesheetInput`.
- Allow `employee_id: string | null` in both interfaces.

### 3. Form — `HourlyTimesheetForm.tsx`
- Add `useCustomEmployee` toggle next to "Select Employee" label (mirrors the project toggle: link "Enter custom name" / "Choose from list").
- When custom: render an `Input` for the typed employee name; clear `employeeId`, skip rate auto-fill, photo defaults to null.
- Add a new field "Role / Trade" — a `Select` with preset options (Taper, Framer, Drywaller, Labourer, Painter, Carpenter, Electrician, Plumber, Foreman, Other) plus a free-text fallback when "Other" is chosen. Stored in state as `employeeRole`.
- Submit payload: include `employee_role`; when custom, send `employee_id: null`, `employee_name: customEmployeeName.trim()`, `employee_photo_url: null`.
- Validation: require either a selected employee or a non-empty custom name; role optional but recommended.

### 4. View modal — `ManualTimesheetViewModal.tsx`
- Below the employee name, show role as a small muted line if present (e.g. "Taper").

### 5. List/Table — `ManualTimesheetsTable.tsx`
- If a role column exists, display role as a subtle badge under employee name. (Will inspect file during implementation; otherwise minimal change.)

### 6. PDF — `src/utils/manualTimesheetPDF.ts`
Keep current layout. Two small additions:
- In the meta block, under "Employee:" line, render role on the same line as a parenthetical when present: `John Doe (Taper)`. No layout shifts.
- Avatar/initials fallback already handles missing `employee_photo_url` (custom-name entries).

## Acceptance

- Toggle "Enter custom name" appears next to Employee label, behaves identically to the Project toggle.
- Role selector visible on the form; saved value appears in the View modal and in the PDF next to the employee name.
- Existing timesheets continue to render with no role shown and no layout regression in the PDF.
