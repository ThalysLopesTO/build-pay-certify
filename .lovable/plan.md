## What I found

**Quotes are fine.** Quotes have a real `draft` status, emails only go out when someone explicitly clicks "Save & Send" (which opens the email modal), and the reminder job filters `status = 'sent'`. Drafts never email a client.

**Invoices are the problem.** There is no `draft` status for invoices:
- The database `invoices.status` column defaults to `'pending'`, and the only statuses that exist in the data today are `pending` and `paid`.
- `useInvoices.ts` never sends a status on insert, so "Save as Draft" in the invoice form creates a **pending** invoice — identical to a sent one.
- The `send-reminders` edge function pulls invoices with `status IN ('pending','sent')` and emails the client due-soon / overdue reminders. So every "draft" invoice starts emailing clients automatically.
- The `check_invoices_due_soon` / `check_invoices_overdue` database functions also generate notifications for those same drafts.

## Plan

**1. Add a real draft status for invoices**
- Persist `status: 'draft'` when the user clicks "Save as Draft" in the invoice form, and `status: 'pending'` when they use "Send Invoice".
- Add `'draft'` to the invoice status type in `src/components/admin/types/invoice.ts`.

**2. Stop all automated emails/notifications for drafts**
- `send-reminders`: only consider invoices with `status IN ('pending','sent')` — drafts are excluded automatically once they carry the `draft` status. Add an explicit `.neq('status','draft')` guard as a belt-and-braces measure.
- Migration to update `check_invoices_due_soon` and `check_invoices_overdue` so they skip drafts.

**3. Promote a draft when it is actually sent**
- When an invoice is emailed (via the Invoice Tracker "Send email" action, or "Save & Resend" in edit mode), flip its status from `draft` to `pending` and stamp `sent_date`, so reminders resume normally from that point.

**4. UI**
- Invoice Tracker: show a grey "Draft" badge, add "Draft" to the status filter dropdown, and exclude drafts from the "Pending" / "Overdue" money totals so the dashboard numbers stay accurate.
- Mobile card gets the same badge treatment.

### Technical notes
- Files touched: `src/hooks/useInvoices.ts`, `src/components/admin/CreateInvoiceForm.tsx`, `src/components/admin/types/invoice.ts`, `src/components/admin/InvoiceTracker.tsx`, `src/components/admin/invoices/InvoiceTrackerMobileCard.tsx`, `supabase/functions/send-reminders/index.ts`, plus one migration for the two reminder DB functions.
- `invoices.status` is a plain `text` column, so no enum change is needed.
- Existing invoices are untouched — nothing currently marked pending gets retroactively converted to draft.
