
# Enhance Scan Receipt Feature - Duplicate Detection & Protection

## Overview
Add professional duplicate detection to prevent double-entry of receipts while preserving all existing functionality (KPIs, charts, filters, printing, CRUD operations).

---

## Architecture Flow

```text
User uploads receipt image
        │
        ▼
Step 1: Upload Receipt
        │ 1. Compute SHA-256 hash (client-side) → receipt_hash
        │ 2. Upload to storage
        │ 3. Call receipt-extract edge function
        ▼
Step 2: Review Details (same tab, enhanced)
        │ After extraction completes:
        │ 1. Run duplicate detection query
        │ 2. Score each candidate (0-100)
        │ 3. Show warning panel if duplicates found
        ▼
User chooses action:
        ├─► "Not a Duplicate" → Save with duplicate_status='ignored'
        ├─► "Mark as Duplicate" → Save with duplicate_status='confirmed', duplicate_of_id set
        └─► "Save Anyway" (heuristic only) → Save with duplicate_status='none'
        ▼
Transaction saved with all metadata
```

---

## Database Migration

**New columns for `bills_expenses` table:**

| Column | Type | Purpose |
|--------|------|---------|
| `receipt_hash` | TEXT | SHA-256 hash of uploaded image |
| `vendor_detected` | TEXT | Original AI-extracted vendor |
| `date_detected` | DATE | Original AI-extracted date |
| `amount_detected` | NUMERIC | Original AI-extracted amount |
| `category_detected_id` | UUID | Original AI-matched category |
| `duplicate_status` | TEXT | Status: none, possible, confirmed, ignored |
| `duplicate_of_id` | UUID | FK reference to the original transaction |
| `duplicate_candidates` | JSONB | Stored candidates at time of save |

**Indexes to add:**
- `idx_bills_expenses_receipt_hash` on `(company_id, receipt_hash)`
- `idx_bills_expenses_duplicate_lookup` on `(company_id, transaction_type, expense_date, amount)`
- `idx_bills_expenses_vendor` on `(company_id, vendor_payee)`

---

## Component Changes

### 1. ScanReceiptModal.tsx Enhancements

**New State Variables:**
```typescript
const [receiptHash, setReceiptHash] = useState<string | null>(null);
const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);
const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
const [duplicateDecision, setDuplicateDecision] = useState<{
  status: 'none' | 'confirmed' | 'ignored';
  duplicateOfId: string | null;
} | null>(null);
```

**File Hashing (before upload):**
```typescript
const computeFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
```

**Duplicate Detection Query:**
```typescript
const checkForDuplicates = async (
  amount: number,
  date: string,
  vendor: string,
  hash: string | null
) => {
  // Query for exact hash match OR heuristic match
  const { data } = await supabase
    .from('bills_expenses')
    .select('id, expense_title, vendor_payee, expense_date, amount, category_id, attachment_url, created_at, receipt_hash')
    .eq('company_id', companyId)
    .eq('transaction_type', 'expense')
    .or(`receipt_hash.eq.${hash},and(amount.gte.${amount - 0.01},amount.lte.${amount + 0.01})`)
    .gte('expense_date', subDays(parseISO(date), 1).toISOString().split('T')[0])
    .lte('expense_date', addDays(parseISO(date), 1).toISOString().split('T')[0])
    .limit(5);
  
  // Score each candidate in client
  return (data || []).map(candidate => ({
    ...candidate,
    score: calculateDuplicateScore(candidate, amount, date, vendor, hash)
  })).filter(c => c.score > 20).sort((a, b) => b.score - a.score);
};
```

**Scoring Algorithm:**
```typescript
const calculateDuplicateScore = (
  candidate: Transaction,
  amount: number,
  date: string,
  vendor: string,
  hash: string | null
): number => {
  let score = 0;
  
  // +60 for exact receipt hash match
  if (hash && candidate.receipt_hash === hash) score += 60;
  
  // +25 for exact amount match (within $0.01)
  if (Math.abs(candidate.amount - amount) <= 0.01) score += 25;
  
  // +10 for date within 1 day
  const daysDiff = Math.abs(differenceInDays(parseISO(date), parseISO(candidate.expense_date)));
  if (daysDiff <= 1) score += 10;
  
  // +5 for vendor match (normalized, case-insensitive)
  const normalizedVendor = vendor.toLowerCase().trim();
  const normalizedCandidate = candidate.vendor_payee.toLowerCase().trim();
  if (normalizedVendor.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedVendor)) {
    score += 5;
  }
  
  return score;
};
```

**UI: Duplicate Warning Panel (in Review step):**
- Yellow/orange warning card when candidates exist
- Shows list of potential duplicates with: title, vendor, date, amount, created_at
- Three action buttons:
  - "Open Existing" → Navigate to edit that transaction
  - "Mark as Duplicate" → Select which one; sets duplicate_status='confirmed'
  - "Not a Duplicate" → Sets duplicate_status='ignored', allows save

**Blocking Behavior:**
- If score >= 90 (hash match): Block Save until user makes a decision
- If score < 90 (heuristic only): Show warning but allow Save

---

### 2. IncomeExpensesManagement.tsx Updates

**Enhanced handleSaveScannedReceipt function:**
```typescript
const handleSaveScannedReceipt = async (
  scannedFormData: FormData,
  receiptMetadata?: ReceiptMetadata,
  duplicateInfo?: {
    receiptHash: string | null;
    vendorDetected: string;
    dateDetected: string;
    amountDetected: number;
    categoryDetectedId: string | null;
    duplicateStatus: 'none' | 'confirmed' | 'ignored';
    duplicateOfId: string | null;
    duplicateCandidates: object[];
  }
) => {
  const transactionData = {
    // ... existing fields ...
    
    // New duplicate protection fields
    receipt_hash: duplicateInfo?.receiptHash || null,
    vendor_detected: duplicateInfo?.vendorDetected || null,
    date_detected: duplicateInfo?.dateDetected || null,
    amount_detected: duplicateInfo?.amountDetected || null,
    category_detected_id: duplicateInfo?.categoryDetectedId || null,
    duplicate_status: duplicateInfo?.duplicateStatus || 'none',
    duplicate_of_id: duplicateInfo?.duplicateOfId || null,
    duplicate_candidates: duplicateInfo?.duplicateCandidates || null,
  };
  
  // ... insert logic ...
};
```

---

### 3. Edge Function Enhancement (Optional)

Add detected fields to response for clarity:
```typescript
const result = {
  // ... existing fields ...
  
  // Add explicit detected fields
  vendor_detected: extracted.vendor || 'Unknown Vendor',
  date_detected: extracted.date || new Date().toISOString().split('T')[0],
  amount_detected: extractedAmount,
  category_detected_id: finalCategoryId,
};
```

---

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `supabase/migrations/[timestamp]_add_duplicate_detection.sql` | CREATE | New columns + indexes |
| `src/components/admin/income-expenses/ScanReceiptModal.tsx` | MODIFY | File hashing, duplicate detection, warning panel, decision handling |
| `src/components/admin/IncomeExpensesManagement.tsx` | MODIFY | Pass new fields to save function |
| `supabase/functions/receipt-extract/index.ts` | MODIFY | Add detected field names to response |

---

## UI Mockup: Duplicate Warning Panel

```text
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  Possible Duplicate Detected                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  This receipt may already exist:                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📄 Starbucks - Jan 30, 2026                         │    │
│  │    $24.50 • Created Feb 1, 2026                     │    │
│  │    [Open] [Mark as Duplicate] [Not a Duplicate]    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ❌ Save blocked until you choose an action                 │
│     (or click "Not a Duplicate" to proceed)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Save Button Protection

**Already Implemented:**
- `isSaving` state exists (line 88)
- Save button already disabled when `isSaving` is true (line 549)

**Enhancement:**
- Add early return if `isSaving` is true in handleSave
- Add toast "Saving..." before async operation
- Clear and explicit success/failure feedback

---

## Preserved Functionality

The following remain completely unchanged:
- All KPI calculations and display
- Monthly Cash Flow Chart
- Category Breakdown Chart
- Date range filters
- Transaction type filters
- Payment status/method filters
- Category filters
- Search functionality
- Pagination
- Excel export
- Print functionality
- Add Income / Add Expense dialogs
- Edit transaction flow
- Delete transaction flow
- Mobile transaction list
- Attachment handling
