## Add Employee Photos to Manual Timesheet Dropdown + PDF

Show the employee's circular profile photo (with initials fallback) in the "Select Employee" dropdown, and render a circular avatar in the PDF header next to the employee details.

### 1. Persist photo on the timesheet
- **Migration**: add `employee_photo_url text` (nullable) to `public.manual_timesheets`. Storing it on the row keeps the PDF stable even if the employee later changes their photo.
- **`src/hooks/useManualTimesheets.ts`** — add `employee_photo_url: string | null` to `ManualTimesheet` and optional on `ManualTimesheetInput`.

### 2. Dropdown UI (`HourlyTimesheetForm.tsx`)
- Import shadcn `Avatar`, `AvatarImage`, `AvatarFallback`.
- Helper `initials(first, last)` returning up to 2 letters.
- Each `SelectItem`: 24px avatar + name + position, in a flex row.
- `SelectTrigger`: replace plain `SelectValue` with a custom render — when an employee is selected, show the avatar + name; otherwise show the placeholder.
- On submit, include `employee_photo_url: employee?.photo_url ?? null` in the input.

### 3. PDF (`src/utils/manualTimesheetPDF.ts`)
- After the header band, before the meta block, if `ts.employee_photo_url`:
  - Reuse `loadImageAsDataUrl` + `getImageSize` + `detectImageFormat`.
  - Draw a 48pt circle: use `doc.circle(cx, cy, r, 'S')` outline + `doc.saveGraphicsState()` / clip path via `doc.ellipse` is unavailable — jsPDF supports clipping via `doc.clip()` only on path. Practical approach: draw the image as a 48×48 square at the avatar position, then overlay a white "donut" mask using 4 white rectangles is too messy. Instead use the documented jsPDF roundedRect clipping pattern:
    1. `doc.saveGraphicsState()`
    2. Build a circular path: `doc.circle(cx, cy, r, null)` followed by `doc.clip()` and `doc.discardPath()`
    3. `doc.addImage(...)` covering the bounding box
    4. `doc.restoreGraphicsState()`
    5. Draw a thin border circle on top: `doc.setDrawColor(220) ; doc.circle(cx, cy, r, 'S')`
  - Fallback when no photo: draw a filled light-gray circle and render initials in the center.
- Position: right side of the header band (so it doesn't fight with the company logo on the left), or just below the divider next to "Employee:" label. Place it to the **left of the meta block** and shift the "Employee:" / "Project:" / "Pay Period:" / "Type:" text right by ~58pt when photo is shown.

### 4. View Modal (small bonus, keeps UI consistent)
- `ManualTimesheetViewModal.tsx`: show the avatar next to the Employee name (uses `timesheet.employee_photo_url`).

### Out of scope
- No bulk back-fill for existing rows — older timesheets simply render the initials fallback in the PDF.
- No upload UI (photos already managed in user profiles).
