

# Improve Invoice Details Modal - Complete Payment Breakdown

## Overview

Update the Invoice Details dialog to show a clear, complete financial breakdown including:

1. **Subtotal** - Pre-tax amount
2. **Tax** - Tax percentage and calculated amount
3. **Total Invoice** - Full invoice amount
4. **Stripe Fee** - Processing fee (for paid invoices)
5. **StackBuild Fee** - 1% platform fee (for paid invoices)
6. **Total Received** - Net amount after all deductions

---

## Visual Layout

```text
+----------------------------------------+
| Invoice Details                    [X] |
| Complete information for INV-0020      |
+----------------------------------------+
| Client Company          | Email        |
| Caroline Borba Da Silva | thalys@...   |
+----------------------------------------+
| INVOICE BREAKDOWN                      |
|                                        |
| Subtotal                      $100.00  |
| Tax (13%)                      $13.00  |
| ─────────────────────────────────────  |
| Total Invoice                 $113.00  |
+----------------------------------------+
| PAYMENT DETAILS (paid invoices only)   |
|                                        |
| Stripe Processing Fee          -$3.58  |
| StackBuild Fee (1%)            -$1.13  |
| ─────────────────────────────────────  |
| You Received                  $108.29  |
+----------------------------------------+
| Status: [Paid Badge]                   |
+----------------------------------------+
```

---

## Changes Required

### File: `src/components/admin/InvoiceTracker.tsx`

**Replace lines 482-512** with a new structured breakdown:

**Section 1: Client Info** (keep existing)
- Client Company
- Email

**Section 2: Invoice Breakdown** (new)
- Subtotal: `invoice.subtotal`
- Tax row: Shows `invoice.tax`% and calculated amount
- Separator line
- Total Invoice: `invoice.total_amount` (emphasized)

**Section 3: Payment Details** (only for paid invoices with Stripe data)
- Stripe Processing Fee: `-$X.XX` (from `stripe_processing_fee_cents / 100`)
- StackBuild Fee (1%): `-$X.XX` (from `stackbuild_fee_cents / 100`)
- Separator line
- **You Received**: `net_to_company_cents / 100` (highlighted in green)

**Section 4: Status** (keep existing)
- Status badge

**Section 5: Notes** (keep if present)

---

## Technical Details

### Data Fields Used

| Field | Source | Format |
|-------|--------|--------|
| `subtotal` | invoice.subtotal | Dollars |
| `tax` | invoice.tax | Percentage (e.g., 13) |
| `total_amount` | invoice.total_amount | Dollars |
| `stripe_processing_fee_cents` | invoice.stripe_processing_fee_cents | Cents → divide by 100 |
| `stackbuild_fee_cents` | invoice.stackbuild_fee_cents | Cents → divide by 100 |
| `net_to_company_cents` | invoice.net_to_company_cents | Cents → divide by 100 |

### Calculations

```typescript
// Tax amount
const taxAmount = invoice.subtotal * (invoice.tax / 100);

// Fee amounts (convert cents to dollars)
const stripeFee = (invoice.stripe_processing_fee_cents || 0) / 100;
const stackbuildFee = (invoice.stackbuild_fee_cents || 0) / 100;
const netReceived = (invoice.net_to_company_cents || 0) / 100;
```

### Conditional Rendering

- Payment Details section only shows when:
  - `invoice.status === 'paid'`
  - AND `invoice.net_to_company_cents` exists (indicates Stripe payment)

---

## PaymentBreakdownSection Cleanup

Since we're now showing fees inline, we have two options:
1. **Keep PaymentBreakdownSection** for Technical Details only (Stripe IDs, timestamps, dashboard link)
2. **Remove it entirely** to avoid duplication

**Recommendation**: Keep `PaymentBreakdownSection` but it will now serve as the "Technical Details" expandable section for IDs and Stripe dashboard link. The main breakdown will be shown inline in the dialog.

---

## Summary

| Before | After |
|--------|-------|
| Single "Amount: $113.00" line | Full breakdown: Subtotal, Tax, Total |
| Fees shown separately in PaymentBreakdownSection | Stripe Fee + StackBuild Fee shown inline |
| Unclear what company receives | Clear "You Received" amount highlighted |

