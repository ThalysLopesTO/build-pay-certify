
# Scan Receipt - Smart Intake Feature Implementation Plan

## Overview
Add an AI-powered receipt scanning feature to the Income & Expenses module that allows users to upload a receipt image, extract data using OCR/AI, and pre-fill the expense form for review before saving.

---

## Architecture

```text
User clicks "Scan Receipt"
        │
        ▼
Step 1: Upload Receipt (Modal Tab A)
        │ Upload image → expense-attachments bucket
        ▼
Call Edge Function: receipt-extract
        │ { company_id, attachment_path, transaction_type }
        ▼
Edge Function:
        │ 1. Generate signed URL for image
        │ 2. Call Lovable AI (Gemini) with image
        │ 3. Extract: vendor, date, total, category_guess
        │ 4. Query expense_categories → map to category_id
        │ 5. Return structured data
        ▼
Step 2: Review Details (Modal Tab B)
        │ Pre-fill formData with extracted values
        │ User can edit any field
        ▼
Click "Save Expense"
        │ Reuse existing handleSubmit() logic
        ▼
Transaction saved with receipt metadata
```

---

## UI Changes

### File: `src/components/admin/IncomeExpensesManagement.tsx`

**Add "Scan Receipt" Button (Desktop header ~line 617)**
```tsx
<Button 
  onClick={() => openScanReceiptModal()} 
  className="bg-gradient-to-r from-amber-500 to-orange-500 ..."
>
  <Camera className="h-4 w-4 mr-2" />
  Scan Receipt
</Button>
```

**Add mobile "Scan Receipt" button (~line 668)**

**New State Variables:**
- `isScanModalOpen: boolean`
- `scanStep: 'upload' | 'review'`
- `isExtracting: boolean`
- `extractionResult: ExtractionResponse | null`
- `receiptFile: File | null`
- `uploadedReceiptPath: string | null`

**New ScanReceiptModal Component** (inline or separate file):
- Uses existing Dialog component
- Two tabs/steps using existing Tabs component
- Step 1 (Upload): Modified ExpenseAttachmentField with auto-submit on upload
- Step 2 (Review): Pre-filled form fields + confidence indicators
- "Save Expense" button calls existing `handleSubmit()` after setting formData

---

## New Component: `src/components/admin/income-expenses/ScanReceiptModal.tsx`

**Props:**
```typescript
interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (formData: FormData) => void;
  categories: HierarchicalCategory[];
  companyId: string;
}
```

**Features:**
- Tab A: Upload Receipt
  - Drag/drop or click to upload
  - Shows upload progress
  - Auto-triggers extraction on upload success
  
- Tab B: Review Details
  - Pre-filled fields with confidence badges (high/medium/low)
  - Editable: expense_title, vendor_payee, amount, expense_date, category_id, notes
  - Shows original receipt thumbnail
  - "Save Expense" triggers parent's handleSubmit

---

## New Edge Function: `supabase/functions/receipt-extract/index.ts`

**Input:**
```typescript
{
  company_id: string;
  attachment_path: string;
  transaction_type: 'expense' | 'income';
}
```

**Process:**
1. Validate inputs
2. Create signed URL for the image in `expense-attachments` bucket
3. Call Lovable AI Gateway with the image:
   - Model: `google/gemini-2.5-flash` (supports vision)
   - Prompt: Extract vendor, date, total, category from receipt
4. Parse AI response
5. Query `expense_categories` for company to map category guess
6. Return structured response

**Output:**
```typescript
{
  vendor_payee: string;
  expense_date: string; // YYYY-MM-DD
  amount: number;
  category_id: string | null;
  category_guess: string;
  subcategory_guess: string | null;
  confidence: {
    vendor: 'high' | 'medium' | 'low';
    date: 'high' | 'medium' | 'low';
    amount: 'high' | 'medium' | 'low';
    category: 'high' | 'medium' | 'low';
  };
  expense_title: string; // Generated from vendor + date
  line_items?: Array<{ description: string; amount: number }>;
  raw: object; // Full AI response for debugging
}
```

**Category Mapping Logic:**
```typescript
// Get all categories for company
const { data: categories } = await supabase
  .from('expense_categories')
  .select('*')
  .eq('company_id', company_id);

// Fuzzy match category_guess against category names
const matchedCategory = categories.find(cat => 
  cat.name.toLowerCase().includes(categoryGuess.toLowerCase()) ||
  categoryGuess.toLowerCase().includes(cat.name.toLowerCase())
);
```

---

## Database Migration

**File:** `supabase/migrations/[timestamp]_add_receipt_extraction_columns.sql`

```sql
-- Add columns for receipt extraction metadata
ALTER TABLE public.bills_expenses 
ADD COLUMN IF NOT EXISTS receipt_raw JSONB,
ADD COLUMN IF NOT EXISTS receipt_confidence JSONB,
ADD COLUMN IF NOT EXISTS extraction_status TEXT CHECK (extraction_status IN ('pending', 'completed', 'failed', 'manual'));

-- Add index for extraction status queries
CREATE INDEX IF NOT EXISTS idx_bills_expenses_extraction_status 
ON public.bills_expenses(extraction_status) 
WHERE extraction_status IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.bills_expenses.receipt_raw IS 'Raw extraction response from AI/OCR';
COMMENT ON COLUMN public.bills_expenses.receipt_confidence IS 'Confidence scores for extracted fields';
COMMENT ON COLUMN public.bills_expenses.extraction_status IS 'Status of receipt extraction: pending, completed, failed, manual';
```

---

## Config Update

**File:** `supabase/config.toml`
```toml
[functions.receipt-extract]
verify_jwt = true
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/admin/income-expenses/ScanReceiptModal.tsx` | CREATE | New modal component for receipt scanning |
| `src/components/admin/IncomeExpensesManagement.tsx` | MODIFY | Add Scan Receipt button + modal integration |
| `supabase/functions/receipt-extract/index.ts` | CREATE | AI-powered receipt extraction |
| `supabase/config.toml` | MODIFY | Add receipt-extract function config |
| `supabase/migrations/[timestamp]_add_receipt_extraction_columns.sql` | CREATE | Database schema update |

---

## Implementation Details

### handleSubmit Reuse Strategy
The ScanReceiptModal will:
1. Set parent's formData with extracted values
2. Set parent's transactionType to 'expense'
3. Close scan modal and open create dialog
4. OR directly call handleSubmit with a synthetic event

Better approach: Extract save logic into a reusable function:
```typescript
const saveTransaction = async (data: TransactionFormData) => {
  // Current handleSubmit logic without e.preventDefault()
};
```

### Confidence Display
```tsx
const ConfidenceBadge = ({ level }: { level: 'high' | 'medium' | 'low' }) => {
  const colors = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700', 
    low: 'bg-red-100 text-red-700'
  };
  return <Badge className={colors[level]}>{level}</Badge>;
};
```

### AI Prompt for Receipt Extraction
```
Analyze this receipt image and extract the following information:
1. Vendor/Store name
2. Date of purchase (format: YYYY-MM-DD)
3. Total amount paid (numeric value only)
4. Best category guess from: [list of company categories]
5. Individual line items if visible

Return as JSON with confidence levels (high/medium/low) for each field.
```

---

## Existing Code Preserved

- All filters, charts, KPIs remain untouched
- Printing functionality unchanged
- Export to Excel unchanged
- Mobile transaction list unchanged
- Category management unchanged
- Current CRUD operations unchanged (just reused)

---

## Technical Notes

1. **Storage**: Uses existing `expense-attachments` bucket
2. **AI**: Uses Lovable AI Gateway with Gemini (supports images)
3. **Auth**: Edge function requires JWT (verify_jwt = true)
4. **Backwards Compatible**: New columns are nullable, existing inserts unaffected
5. **Mobile Support**: ScanReceiptModal will work on mobile with camera capture
