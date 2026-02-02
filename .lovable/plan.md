
# Add Transaction Type Selection to Scan Receipt

## Overview
Enhance the Scan Receipt feature so the AI can automatically detect whether a scanned document is an **Income** (invoice, payment received) or **Expense** (receipt, bill paid), and allow the user to manually select/change the transaction type in the Review step.

---

## Changes Required

### 1. Edge Function: Add Transaction Type Detection

**File: `supabase/functions/receipt-extract/index.ts`**

Update the AI prompt to also analyze and return the transaction type:

| Field | Value |
|-------|-------|
| `transaction_type` | `"expense"` or `"income"` |
| `transaction_type_confidence` | `"high"`, `"medium"`, or `"low"` |

**AI Prompt Enhancement:**
```
Also determine if this document represents:
- An EXPENSE (receipt, bill paid, purchase made BY the company)
- An INCOME (invoice to customer, payment received, sale made TO a customer)

Return:
{
  ...existing fields...,
  "transaction_type": "expense|income",
  "transaction_type_confidence": "high|medium|low"
}
```

**Detection Heuristics:**
- Keywords like "INVOICE", "Bill To", "Payment Due" suggest income (document sent to customer)
- Keywords like "RECEIPT", "Thank you for your purchase", "Change due" suggest expense
- Presence of company's own name as vendor suggests income

---

### 2. Frontend: Add Transaction Type Selector

**File: `src/components/admin/income-expenses/ScanReceiptModal.tsx`**

#### New State
```typescript
const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
```

#### New UI Element (in Review Step)
Add a transaction type selector at the top of the form using visually distinct cards:

```text
┌──────────────────────────────────────────────────────────────┐
│  Transaction Type                                   [Medium] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────┐    ┌─────────────────────┐          │
│  │ ↓ EXPENSE          │    │ ↑ INCOME            │          │
│  │ Money spent        │    │ Money received      │          │
│  │ (Receipt, Bill)    │    │ (Invoice, Payment)  │          │
│  └────────────────────┘    └─────────────────────┘          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- Use `TrendingDown` icon for Expense (red accent)
- Use `TrendingUp` icon for Income (green accent)
- Show AI confidence badge if transaction type was detected

#### Update Form State Initialization
When extraction completes, set `transactionType` from AI response:
```typescript
setTransactionType(data.transaction_type || 'expense');
```

#### Update Save Flow
Pass `transactionType` to the parent handler so it's saved correctly:
```typescript
const saveData = {
  ...existingFields,
  transaction_type: transactionType
};
```

---

### 3. Update Save Handler

**File: `src/components/admin/IncomeExpensesManagement.tsx`**

Update `handleSaveScannedReceipt` to accept and use the transaction type:

```typescript
const handleSaveScannedReceipt = async (
  scannedFormData: typeof formData,
  receiptMetadata?: { raw: object; confidence: object },
  duplicateInfo?: DuplicateInfo,
  transactionType?: 'income' | 'expense'  // NEW
) => {
  const transactionData = {
    ...existingFields,
    transaction_type: transactionType || 'expense',  // Use passed type
  };
};
```

---

### 4. Update Category Selector Behavior

**File: `src/components/admin/income-expenses/ScanReceiptModal.tsx`**

When transaction type changes, the category selector should filter to show only categories for that type:

```typescript
<HierarchicalCategorySelector
  selectedCategoryId={formData.category_id}
  onCategoryChange={(id) => setFormData(prev => ({ ...prev, category_id: id }))}
  transactionType={transactionType}  // Dynamic based on selection
  insideModal={true}
/>
```

Additionally, when user changes transaction type:
- Clear the category selection (since income and expense categories differ)
- Let the user re-select an appropriate category

---

### 5. Update Types

**File: `src/types/duplicate-detection.ts`**

Add transaction type fields to the extraction result interface:

```typescript
export interface ExtractionResultWithDetected extends ExtractionResult {
  // Existing fields...
  
  // Transaction type detection
  transaction_type?: 'income' | 'expense';
  transaction_type_confidence?: 'high' | 'medium' | 'low';
}
```

---

## Implementation Details

### Transaction Type Card Component
Create inline styled cards rather than a separate component:

```tsx
<div className="grid grid-cols-2 gap-3">
  <button
    type="button"
    onClick={() => handleTransactionTypeChange('expense')}
    className={cn(
      "flex flex-col items-center p-4 rounded-lg border-2 transition-all",
      transactionType === 'expense'
        ? "border-red-500 bg-red-50 text-red-700"
        : "border-slate-200 hover:border-slate-300"
    )}
  >
    <TrendingDown className="h-6 w-6 mb-1" />
    <span className="font-medium">Expense</span>
    <span className="text-xs text-muted-foreground">Money spent</span>
  </button>
  
  <button
    type="button"
    onClick={() => handleTransactionTypeChange('income')}
    className={cn(
      "flex flex-col items-center p-4 rounded-lg border-2 transition-all",
      transactionType === 'income'
        ? "border-green-500 bg-green-50 text-green-700"
        : "border-slate-200 hover:border-slate-300"
    )}
  >
    <TrendingUp className="h-6 w-6 mb-1" />
    <span className="font-medium">Income</span>
    <span className="text-xs text-muted-foreground">Money received</span>
  </button>
</div>
```

### Handler for Type Change
```typescript
const handleTransactionTypeChange = (type: 'income' | 'expense') => {
  setTransactionType(type);
  // Clear category when type changes since categories are type-specific
  setFormData(prev => ({ ...prev, category_id: '' }));
};
```

---

## Summary of File Changes

| File | Changes |
|------|---------|
| `supabase/functions/receipt-extract/index.ts` | Add transaction_type detection to AI prompt and response |
| `src/types/duplicate-detection.ts` | Add transaction_type fields to ExtractionResultWithDetected |
| `src/components/admin/income-expenses/ScanReceiptModal.tsx` | Add transactionType state, type selector UI, dynamic category filtering, pass type to save |
| `src/components/admin/IncomeExpensesManagement.tsx` | Update handleSaveScannedReceipt to accept transactionType parameter |

---

## User Flow After Implementation

```text
1. User uploads receipt/invoice
         │
         ▼
2. AI analyzes and detects:
   - Transaction Type: Expense/Income (with confidence)
   - Vendor, Date, Amount, Category
         │
         ▼
3. Review step shows:
   ┌─────────────────────────────────────┐
   │  Transaction Type        [Medium]   │
   │  [● Expense]  [ Income ]            │  ← User can change
   │                                     │
   │  Title: Starbucks - 2025-12-23      │
   │  Vendor: Starbucks          [High]  │
   │  Amount: $200               [High]  │
   │  Date: Dec 23, 2025         [High]  │
   │  Category: (filtered by type)       │
   └─────────────────────────────────────┘
         │
         ▼
4. User can manually toggle between
   Expense ↔ Income if AI was wrong
         │
         ▼
5. Save creates correct transaction type
```

---

## Edge Cases Handled

1. **AI can't determine type**: Default to "expense" with "low" confidence
2. **User changes type**: Clear category selection since income/expense have different categories
3. **No AI response**: Default to expense, no confidence badge shown
4. **Duplicate detection**: Query filters by the selected transaction_type
