
# Invoice Number: Follow PO Number or Auto-Increment

## Problem
1. The PO Number field exists in the form but is never sent to the database
2. The `generate_invoice_number()` function uses `COUNT(*) + 1` which can create duplicates after deletions
3. Invoice numbers should use the PO number when provided, otherwise auto-increment from the highest existing number

## Current State
- **Trigger**: `set_invoice_number` fires BEFORE INSERT - only generates a number if `invoice_number` is NULL or empty
- **Function**: `generate_invoice_number()` uses `COUNT(*) + 1` (buggy - deletions cause gaps/duplicates)
- **Latest invoice**: INV-0025
- **PO Number**: Collected in the form but never passed to the insert

## Solution

### 1. Fix the `generate_invoice_number()` Database Function
Replace `COUNT(*) + 1` with `MAX(number) + 1` to correctly auto-increment regardless of deletions.

```sql
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text AS $$
DECLARE
  next_num INTEGER;
  invoice_num TEXT;
BEGIN
  -- Get the highest existing number + 1 (not COUNT which breaks after deletions)
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.invoices
  WHERE invoice_number ~ '^INV-[0-9]+$';

  invoice_num := 'INV-' || LPAD(next_num::TEXT, 4, '0');

  -- Handle concurrent inserts
  WHILE EXISTS (SELECT 1 FROM public.invoices WHERE invoice_number = invoice_num) LOOP
    next_num := next_num + 1;
    invoice_num := 'INV-' || LPAD(next_num::TEXT, 4, '0');
  END LOOP;

  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;
```

### 2. Update `set_invoice_number()` Trigger to Use PO Number
Modify the trigger so that if `invoice_number` is provided (from the PO field), it validates for uniqueness. If duplicate, it falls back to auto-generation.

```sql
CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS trigger AS $$
BEGIN
  -- If invoice_number was provided (from PO number), validate uniqueness
  IF NEW.invoice_number IS NOT NULL AND NEW.invoice_number != '' THEN
    -- Check if it already exists
    IF EXISTS (SELECT 1 FROM public.invoices WHERE invoice_number = NEW.invoice_number) THEN
      RAISE EXCEPTION 'Invoice number % already exists', NEW.invoice_number;
    END IF;
  ELSE
    -- Auto-generate next number
    NEW.invoice_number := public.generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3. Pass PO Number as Invoice Number from the Form

**File: `src/hooks/useInvoices.ts`**
- Update the `CreateInvoiceData` type and insert logic to accept an optional `invoice_number` field

**File: `src/components/admin/types/invoice.ts`**
- Add optional `invoice_number` field to `CreateInvoiceData`

**File: `src/components/admin/CreateInvoiceForm.tsx`**
- In `onSubmit`, if `po_number` is filled in, pass it as `invoice_number` in the invoice data
- Update the PO Number field label to clarify it will be used as the invoice number

### 4. Detailed Code Changes

**`src/components/admin/types/invoice.ts`** - Add `invoice_number` to CreateInvoiceData:
```typescript
export interface CreateInvoiceData {
  title: string;
  invoice_number?: string; // Optional - from PO number
  // ... rest stays the same
}
```

**`src/components/admin/CreateInvoiceForm.tsx`** - Pass PO number as invoice_number:
```typescript
const invoiceData = {
  ...data,
  invoice_number: data.po_number?.trim() || undefined, // Use PO as invoice number
  // ... rest
};
```

**`src/hooks/useInvoices.ts`** - Include invoice_number in insert:
```typescript
const insertData = {
  // ... existing fields
  invoice_number: invoiceData.invoice_number || null, // Let trigger auto-generate if empty
};
```

## Summary

| Change | Purpose |
|--------|---------|
| Migration: Fix `generate_invoice_number()` | Use MAX instead of COUNT to prevent duplicates |
| Migration: Update `set_invoice_number()` trigger | Accept provided number, validate uniqueness, raise error on duplicate |
| `types/invoice.ts` | Add optional `invoice_number` to CreateInvoiceData |
| `CreateInvoiceForm.tsx` | Pass PO number as invoice_number |
| `useInvoices.ts` | Include invoice_number in insert data |

## Behavior After Fix
- **PO number provided**: Invoice gets that exact number (e.g., user enters "27" -> INV-0027, or "PO-123" -> "PO-123"). If duplicate, shows error.
- **PO number empty**: Auto-generates next sequential number from the highest existing (e.g., INV-0025 exists -> INV-0026)
- **No more duplicates**: MAX-based logic handles deletions correctly
