# Daily Sheet PDF — Branded Redesign

Rebuild the Daily Sheet PDF so it matches the uploaded reference layout (dark/gold "Daily Timesheet" form), without the AM/PM sub-columns since times already include AM/PM.

## What the PDF will look like

1. **Header band (dark)** — company logo on the left, angled gold accent, right side shows "DAILY TIMESHEET" in gold with the project name and date line below it.
2. **Info block** — two-column boxed grid with labeled cells, mirroring the reference:
   - Left: PO / Builder, Job Name, Site Address
   - Right: Date, Supervisor, Weather (sunny / partly / cloudy / rain markers), Safety Meeting (Yes / No)
   - Fields that have no value render as empty boxes so the sheet can be filled by hand.
3. **Crew table** — dark header row with gold sub-accent, columns: `NO. | EMPLOYEE NAME | POSITION / TRADE | TIME IN | TIME OUT | BREAK (UNPAID) | TOTAL HOURS | NOTES`. Times print as `7:00 AM` / `3:30 PM` (no AM/PM checkbox columns). Table pads out to a minimum of 15 rows with blank ruled lines so it reads like the printed form.
4. **Total hours bar** — dark bar on the right reading "TOTAL HOURS" with the sum in a gold cell.
5. **Bottom section** — two boxes side by side: "Site Notes / Work Completed" (prints the notes, with ruled lines for extra space) and "Supervisor Signature" with a signature line and "Print Name" line.
6. **Footer band (dark)** — company phone, email, website when available, plus page number.

## Form additions (Daily Sheet tab)

Add optional inputs so the new header fields can be filled before export, collapsed under an "Optional job details" section:
- PO / Builder, Job Name, Site Address, Supervisor
- Weather selector (sunny / partly cloudy / cloudy / rain / none)
- Safety meeting: Yes / No / not set

Existing project, date, crew defaults, employee dropdown, custom names and notes stay exactly as they are. Per-row Notes text is included in the table.

## Technical notes

- `src/utils/dailySheetPDF.ts`: replace the current autoTable-based layout with a hand-drawn layout using jsPDF primitives for the bands/boxes and `jspdf-autotable` for the crew grid (dark `headStyles`, `theme: 'grid'`, fixed column widths, blank filler rows). Palette: near-black `#1C1A17`, gold `#C9A227`, hairline grey borders — derived so it also works when a company has its own logo.
- Extend `DailySheetData` with the new optional fields (`poBuilder`, `jobName`, `siteAddress`, `supervisor`, `weather`, `safetyMeeting`) and add optional `notes` per crew row.
- `PdfBranding` gains optional `phone`, `email`, `website` for the footer band; falls back to omitting them.
- `DailySheetForm.tsx`: new optional-detail state + inputs, passed into `generateDailySheetPDF`.
- Overflow handling: when crew exceeds one page, repeat the table header on page 2+ and keep the totals/notes/signature block on the last page.
- QA: generate a sample PDF, render pages to images and inspect for clipping/overlap before finishing.
