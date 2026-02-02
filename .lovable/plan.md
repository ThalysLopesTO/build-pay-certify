
# Add Transaction Type Selection Before Scan

## Overview
Modify the Scan Receipt flow to ask users to select Income or Expense **before** taking/uploading the photo. This makes the workflow clearer and helps users focus on the correct document type from the start.

---

## Current Flow vs. New Flow

```text
CURRENT FLOW:
┌─────────────────────────────────────────┐
│ Step 1: Upload Receipt                  │
│ (user uploads any image)                │
├─────────────────────────────────────────┤
│ Step 2: Review Details                  │
│ (AI suggests type, user can change)     │
└─────────────────────────────────────────┘

NEW FLOW:
┌─────────────────────────────────────────┐
│ Step 1: Select Type                     │
│ "What are you scanning?"                │
│ [Expense] [Income]                      │
├─────────────────────────────────────────┤
│ Step 2: Upload Receipt                  │
│ (upload area with context message)      │
├─────────────────────────────────────────┤
│ Step 3: Review Details                  │
│ (type pre-selected, editable)           │
└─────────────────────────────────────────┘
```

---

## UI Design for Step 1 (Type Selection)

```text
┌──────────────────────────────────────────────────────────────┐
│  🎯 Scan Receipt                                    [X]      │
├──────────────────────────────────────────────────────────────┤
│  ○ Select Type    ○ Upload    ○ Review                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│              What are you scanning?                          │
│                                                              │
│  ┌─────────────────────────┐  ┌─────────────────────────┐    │
│  │                         │  │                         │    │
│  │    ↓ EXPENSE            │  │    ↑ INCOME             │    │
│  │                         │  │                         │    │
│  │    Receipt, bill,       │  │    Invoice sent,        │    │
│  │    purchase receipt     │  │    payment received     │    │
│  │                         │  │                         │    │
│  │    Examples:            │  │    Examples:            │    │
│  │    • Store receipts     │  │    • Client invoices    │    │
│  │    • Utility bills      │  │    • Payment slips      │    │
│  │    • Supplier invoices  │  │    • Sales receipts     │    │
│  │                         │  │                         │    │
│  └─────────────────────────┘  └─────────────────────────┘    │
│                                                              │
│  Click to select and continue                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Changes to ScanReceiptModal.tsx

#### 1. Add New Tab Value
```typescript
// Change from 2 tabs to 3 tabs
const [activeTab, setActiveTab] = useState<'select-type' | 'upload' | 'review'>('select-type');
```

#### 2. Update Tabs Component
```tsx
<Tabs value={activeTab}>
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="select-type">
      Select Type
    </TabsTrigger>
    <TabsTrigger value="upload" disabled={!transactionType}>
      Upload
    </TabsTrigger>
    <TabsTrigger value="review" disabled={!extractionResult}>
      Review
    </TabsTrigger>
  </TabsList>
```

#### 3. New Select Type Tab Content
```tsx
<TabsContent value="select-type" className="space-y-6 mt-4">
  <div className="text-center">
    <h3 className="text-lg font-semibold text-slate-700">
      What are you scanning?
    </h3>
    <p className="text-sm text-muted-foreground mt-1">
      Select the type of document to help with processing
    </p>
  </div>

  <div className="grid grid-cols-2 gap-4">
    {/* Expense Card */}
    <button
      onClick={() => handleTypeSelectAndContinue('expense')}
      className="flex flex-col items-center p-6 rounded-xl border-2 border-slate-200 
                 hover:border-red-400 hover:bg-red-50/50 transition-all group"
    >
      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center 
                      group-hover:bg-red-200 transition-colors">
        <TrendingDown className="h-7 w-7 text-red-600" />
      </div>
      <span className="font-semibold text-lg mt-3">Expense</span>
      <span className="text-sm text-muted-foreground text-center mt-1">
        Receipt, bill, purchase
      </span>
      <div className="mt-3 text-xs text-slate-400 text-center">
        Store receipts, utility bills, supplier invoices
      </div>
    </button>
    
    {/* Income Card */}
    <button
      onClick={() => handleTypeSelectAndContinue('income')}
      className="..."
    >
      ...Income card content...
    </button>
  </div>
</TabsContent>
```

#### 4. Add Handler for Type Selection
```typescript
const handleTypeSelectAndContinue = (type: 'income' | 'expense') => {
  setTransactionType(type);
  setActiveTab('upload'); // Move to upload tab
};
```

#### 5. Update Upload Tab Context
Add a small indicator showing what type was selected:
```tsx
<TabsContent value="upload">
  {/* Type indicator at top */}
  <div className="flex items-center justify-center gap-2 mb-4 p-2 rounded-lg bg-slate-50">
    {transactionType === 'expense' ? (
      <>
        <TrendingDown className="h-4 w-4 text-red-600" />
        <span className="text-sm font-medium">Scanning an Expense</span>
      </>
    ) : (
      <>
        <TrendingUp className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium">Scanning an Income</span>
      </>
    )}
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => setActiveTab('select-type')}
      className="text-xs"
    >
      Change
    </Button>
  </div>
  
  {/* Existing upload area */}
  ...
</TabsContent>
```

#### 6. Update Reset State
```typescript
const resetState = useCallback(() => {
  setActiveTab('select-type'); // Start at type selection
  // ... rest of reset
}, []);
```

#### 7. Pass Selected Type to Edge Function
Update the extraction call to pass the pre-selected type:
```typescript
const extractReceiptData = async (attachmentPath: string) => {
  const { data, error } = await supabase.functions.invoke('receipt-extract', {
    body: {
      company_id: companyId,
      attachment_path: attachmentPath,
      transaction_type: transactionType  // Use pre-selected type
    }
  });
  // ...
};
```

#### 8. Keep Type Selector in Review (for changes)
The existing type selector in the Review tab remains unchanged, allowing users to correct if needed.

---

## Summary of Changes

| File | Changes |
|------|---------|
| `src/components/admin/income-expenses/ScanReceiptModal.tsx` | Add 'select-type' tab, type selection cards, update flow |

---

## User Flow After Implementation

```text
1. User clicks "Scan Receipt"
         │
         ▼
2. Modal opens at "Select Type" step
   "What are you scanning?"
   [Expense Card] [Income Card]
         │
         ▼ (user clicks Expense)
         
3. Moves to "Upload" step
   Shows: "Scanning an Expense [Change]"
   User takes photo or uploads file
         │
         ▼
4. AI extracts data (knows it's expense)
         │
         ▼
5. "Review" step
   - Type still shown (can change)
   - All extracted fields editable
   - Duplicate detection runs
         │
         ▼
6. User saves
```

---

## Benefits

1. **Clearer Intent**: User knows what they're scanning before upload
2. **Better AI Context**: Edge function receives type upfront for better accuracy
3. **Familiar Pattern**: Follows common "select then act" UX pattern
4. **Still Flexible**: User can still change type in Review if AI/user made mistake
5. **No Breaking Changes**: Existing functionality preserved
