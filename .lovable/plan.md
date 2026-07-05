# Edit & Resend Invoices

Enable editing any invoice — even after it's been sent — from the Invoice Tracker. The user can change everything (client, jobsite, title, PO/number, due date, line items, discount, tax, notes), then **Save**, or **Save & Resend** to re-email the updated invoice to the client.

## What exists today
- Invoices are created via `CreateInvoiceForm` (client, metadata, line items, totals).
- `useInvoices` supports create, status-change (paid/pending/expired), and delete — but **no full edit**.
- The Tracker row "…" menu offers View details, Download PDF, status changes, Delete. No Edit.
- Resend already works through the existing email button (`InvoiceEmailSender` / `autoSendInvoiceEmail`).

## Changes

### 1. Add an `updateInvoice` mutation (`src/hooks/useInvoices.ts`)
- New mutation that updates the invoice row (title, client fields, jobsite_id, invoice_number, discount, tax, due_date, notes) scoped by `company_id`.
- Replace line items: delete existing `invoice_line_items` for the invoice, then insert the new set (same shape as create).
- On success: invalidate the `['invoices', companyId]` query and toast "Invoice updated".
- Export `updateInvoice` / `updateInvoiceMutation` / `isUpdating`.

### 2. Make the invoice form reusable for edit (`src/components/admin/CreateInvoiceForm.tsx`)
- Accept optional props: `invoice?` (the invoice to edit), `onSaved?` (callback to close dialog).
- When an `invoice` is passed (edit mode):
  - Prefill all form fields from the invoice, including client selection and line items. Line-item descriptions currently stored as `"Name - Description"` are split back into `name` / `description` on load.
  - Replace the footer buttons with **Save** and **Save & Resend** (instead of Save Draft / Send Invoice). No `form.reset()` after saving.
  - **Save** → calls `updateInvoice`, then `onSaved()`.
  - **Save & Resend** → calls `updateInvoice`, then re-emails via `autoSendInvoiceEmail` (reusing the create form's existing email logic), then `onSaved()`.
- Create mode behavior is unchanged.

### 3. Wire "Edit" into the Tracker (`src/components/admin/InvoiceTracker.tsx`)
- Add an **Edit** item to the row "…" dropdown (pencil icon), available for every invoice regardless of status.
- Opens a dialog (`Dialog` with large content) rendering the form in edit mode; closing it refreshes the list.
- Add the same Edit action to the mobile card (`src/components/admin/invoices/InvoiceTrackerMobileCard.tsx`) and its handler.

## Notes
- No database schema or RLS changes — the `invoices` and `invoice_line_items` tables and their update policies already support this; edits are company-scoped in the mutation.
- Resend uses the existing email pipeline, so branding/PDF stay consistent.
- Editing does not automatically change status; the user controls status separately as today.

## Technical details
- Line-item round-trip: split on the first `" - "` so an item saved as `"Framing - 2x4 lumber"` re-loads with name `Framing`, description `2x4 lumber`; items with no dash load with an empty name.
- `updateInvoice` recomputes `amount = quantity * unit_price` per line item on insert, mirroring create.
- Totals (subtotal/tax/total) continue to be derived the same way the create form and DB already handle them.
