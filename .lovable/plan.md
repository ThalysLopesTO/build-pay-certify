# Fix invoice save errors (create & edit)

## What's happening
Saving an invoice (new draft or editing an existing one) sometimes fails with a generic "Failed to create/update invoice" toast. The real cause is the database, not the UI.

- `invoices.invoice_number` is `NOT NULL` with a **global** `UNIQUE` constraint.
- The `set_invoice_number()` trigger raises `Invoice number "X" already exists` whenever a typed PO/Invoice number matches **any** invoice number in the whole database (all companies).
- This company enters many free-form numbers (`teste`, client names, `DSS0391 | Shelly`, …), so collisions happen often → save fails.
- Auto-generated `INV-0042` numbers rarely collide (the generator loops), which is why it usually "runs well" and only breaks intermittently.

Two related problems found in the same code path:
- Create never saves `subtotal` / `total_amount`, so new invoices are stored as `$0` totals.
- Uniqueness isn't scoped per company, so a number another company used blocks you.

## The fix

### 1. Database migration — scope invoice numbers per company
- Drop the global `invoices_invoice_number_key` unique constraint.
- Add a composite unique constraint on `(company_id, invoice_number)` so numbers only need to be unique **within a company**.
- Update `set_invoice_number()` to check duplicates scoped to `NEW.company_id`.
- Update `generate_invoice_number()` to take/scope by `company_id` (max + loop within the company), so auto-numbers stay per-company.

### 2. `src/hooks/useInvoices.ts` — persist totals & clearer errors
- In `createInvoiceMutation`, compute and include `subtotal` and `total_amount` (same math the form already shows: subtotal from line items, minus discount %, plus tax %). Do the same defensively in `updateInvoiceMutation`.
- In both `onError` handlers, surface the actual DB message when it's a duplicate-number error (e.g. "Invoice number 'teste' is already used — pick a different number") instead of the generic text.

### 3. `src/components/admin/CreateInvoiceForm.tsx` — no functional change beyond passing totals
- Ensure the computed `subtotal`/`total_amount` (already available via `calculateSubtotal`/`calculateTotal`) are passed through to the mutations.

## Result
- Editing and re-saving an existing invoice keeps its number (same row) with no false collision.
- Creating a draft with a custom PO only fails if that number is already used **in your own company**, and the message says exactly why.
- New invoices store correct totals instead of `$0`.

## Technical notes
- Only additive/ئcorrective schema changes; no data loss. Existing rows keep their numbers.
- No RLS change needed — the license/admin policies already allow these writes.
