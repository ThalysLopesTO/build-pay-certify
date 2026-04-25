## Goal
1. Convert the **Tax** field in the Time Sheet form into a **percentage input** (e.g. 13 = 13%) and auto-calculate the tax amount from the subtotal.
2. Add a **third tab next to "Hourly" and "Project"** called **"All Timesheets"** so the user can view every saved manual timesheet directly from the form area (not just at the bottom of the page).

---

## Part 1 — Tax as Percentage

### Current behavior
- The **Tax** field accepts a flat dollar amount (`tax_amount`).
- `total = subtotal + tax_amount`.

### New behavior
- The **Tax** input becomes a **percentage** (`%`), e.g. typing `13` means 13%.
- The system computes `tax_amount = subtotal × (tax_percent / 100)` automatically.
- The Payment Summary will display:
  - `Subtotal` (Hours × Rate + Extra)
  - `Tax (13%)` → shows the computed dollar amount
  - `Total Payment` = Subtotal + computed tax

### Database storage
We will keep the existing `tax_amount` numeric column (so PDFs, totals, and historical data still work) and **add a new column** `tax_percent` to `manual_timesheets` to store the percentage entered by the user.

```sql
ALTER TABLE public.manual_timesheets
  ADD COLUMN tax_percent numeric(5,2) NOT NULL DEFAULT 0;
```

On save: we persist both `tax_percent` (the % entered) and the computed `tax_amount` (dollars). Old records (where `tax_percent = 0` but `tax_amount > 0`) will be back-filled by deriving `tax_percent = tax_amount / subtotal × 100` on edit, so opening an old record shows the equivalent percentage.

### Files affected
- `src/components/admin/manual-timesheets/PaymentSummary.tsx` — replace Tax dollar input with `%` input; show computed tax inline.
- `src/components/admin/manual-timesheets/HourlyTimesheetForm.tsx` — switch state from `tax` (dollars) to `taxPercent`; compute `tax_amount` before save; back-fill `taxPercent` from initial record.
- `src/hooks/useManualTimesheets.ts` — add `tax_percent` to `ManualTimesheet` and `ManualTimesheetInput` types.
- `src/utils/manualTimesheetPDF.ts` — show `Tax (X%)` label with the dollar amount in the PDF totals section.
- New migration to add `tax_percent` column.

---

## Part 2 — "All Timesheets" Tab in the Form

### Current layout
```text
[ Hourly | Project ]
   form...
(below the card) Saved Timesheets table
```

### New layout
```text
[ Hourly | Project | All Timesheets ]
   - Hourly        → existing form
   - Project       → existing "coming soon"
   - All Timesheets → the saved-timesheets table (search + view/edit/download/delete)
```

The standalone "Saved Timesheets" section at the bottom of the page is removed (everything lives inside the tabs now), giving a cleaner single-card experience.

### Files affected
- `src/components/admin/manual-timesheets/ManualTimesheetForm.tsx` — add a third `<TabsTrigger value="all">` with a `List` icon; render `<ManualTimesheetsTable />` inside it. Show the count badge (e.g. `All Timesheets (12)`) using `useManualTimesheets().list.data?.length`.
- `src/pages/admin/ManualTimesheetsPage.tsx` — remove the bottom "Saved Timesheets" heading + table (now inside the tab).

No changes to permissions, RLS, sidebar, or routing.

---

## Technical Details

**Tax percent input UX**
- Input has `min=0`, `max=100`, `step=0.01`, suffix `%` (rendered with a Tailwind absolute-positioned span inside the input wrapper).
- Real-time line under the input: `= $X.XX` showing the computed tax dollars based on the current subtotal.

**Backwards compatibility for existing rows**
- When opening an old timesheet for edit:
  ```ts
  const initialTaxPercent =
    initial?.tax_percent && initial.tax_percent > 0
      ? initial.tax_percent
      : initial?.subtotal && initial.tax_amount
        ? (initial.tax_amount / initial.subtotal) * 100
        : 0;
  ```
- This guarantees the `%` shown matches the saved dollars for legacy records.

**Save payload**
```ts
const taxAmount = +(subtotal * (taxPercent / 100)).toFixed(2);
const totalPayment = +(subtotal + taxAmount).toFixed(2);

input = { ..., tax_percent: taxPercent, tax_amount: taxAmount, total_payment: totalPayment };
```

**Tabs accent**
- Use existing `Tabs` primitive; new tab uses `<List className="h-4 w-4" />` from `lucide-react` to match the visual style of `<Clock>` / `<Briefcase>`.

---

## Out of Scope
- Project-mode timesheets (still "coming soon").
- Pagination/filtering on the All Timesheets tab — uses the existing table as-is.
- Changes to RLS, roles, sidebar, or other modules.
