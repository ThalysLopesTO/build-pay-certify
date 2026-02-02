
# Fix Missing Transaction Data in Bills/Expenses Filtering

## Problem Summary
The user is seeing **0 results** when filtering transactions in the Bills/Expenses page, even though the database contains 448+ transactions for their company. This is a critical data visibility bug.

---

## Root Causes Identified

### 1. Custom Date Range Not Persisted to URL
When users select "Custom Range" and pick dates:
- Only `?range=custom` is saved to URL
- The actual start/end dates are NOT persisted
- On page refresh, dates reset to `null`, breaking filtering

### 2. State Synchronization Issue
Two independent hooks manage date range state:
- `useDateRangeFilter()` - owns the actual `selectedRange` and `customRange` state
- `useTransactionFilters()` - tracks `dateRangeType` from URL params

These hooks are not synchronized on page load:
- `useDateRangeFilter` defaults to `'this-month'`, ignoring URL params
- URL may have `?range=custom` but the hook doesn't read it

### 3. INNER JOIN Excludes Transactions Without Categories  
The query uses `expense_categories!inner` which excludes transactions where:
- `category_id` is NULL (9 transactions affected)
- Category was deleted

---

## Solution Plan

### Fix 1: Persist Custom Date Range to URL

**File: `src/hooks/useTransactionFilters.ts`**

Add URL parameters for custom start/end dates:

```typescript
// Add new state for custom dates from URL
const [customStartDate, setCustomStartDate] = useState<Date | null>(
  searchParams.get('start') ? new Date(searchParams.get('start')!) : null
);
const [customEndDate, setCustomEndDate] = useState<Date | null>(
  searchParams.get('end') ? new Date(searchParams.get('end')!) : null
);

// Update syncToUrl to include custom dates
const syncToUrl = () => {
  const params = new URLSearchParams();
  // ... existing params
  if (dateRangeType === 'custom') {
    if (customStartDate) params.set('start', format(customStartDate, 'yyyy-MM-dd'));
    if (customEndDate) params.set('end', format(customEndDate, 'yyyy-MM-dd'));
  }
  setSearchParams(params);
};
```

### Fix 2: Synchronize Date Range State

**File: `src/hooks/useDateRangeFilter.ts`**

Update hook to optionally accept initial values from URL:

```typescript
export const useDateRangeFilter = (
  initialRange: DateRangeType = 'this-month',
  initialCustomRange?: DateRange  // NEW: Allow passing custom dates
): UseDateRangeFilterReturn => {
  const [selectedRange, setSelectedRange] = useState<DateRangeType>(initialRange);
  const [customRange, setCustomRange] = useState<DateRange>(
    initialCustomRange || { start: null, end: null }
  );
  // ... rest unchanged
};
```

**File: `src/components/admin/IncomeExpensesManagement.tsx`**

Initialize dateRange hook with URL params:

```typescript
// Read initial values from URL
const [searchParams] = useSearchParams();
const initialRange = (searchParams.get('range') as DateRangeType) || 'this-month';
const initialCustomStart = searchParams.get('start') 
  ? parseLocalDate(searchParams.get('start')!) 
  : null;
const initialCustomEnd = searchParams.get('end') 
  ? parseLocalDate(searchParams.get('end')!) 
  : null;

// Initialize with URL values
const dateRange = useDateRangeFilter(initialRange, {
  start: initialCustomStart,
  end: initialCustomEnd
});
```

### Fix 3: Use LEFT JOIN for Categories (Show All Transactions)

**File: `src/hooks/useHierarchicalCategories.ts`**

Change from `!inner` to regular join to include uncategorized transactions:

```typescript
// Before (excludes transactions without categories)
.select(`
  *,
  expense_categories!inner (...)
`)

// After (includes all transactions)
.select(`
  *,
  expense_categories (...)
`)
```

Handle null categories in the transformation:

```typescript
const expensesWithHierarchy = await Promise.all(
  (data || []).map(async (expense: any) => {
    const category = expense.expense_categories;
    
    // Handle uncategorized transactions
    if (!category) {
      return {
        ...expense,
        parent_category_name: 'Uncategorized',
        subcategory_name: null,
        category_level: 'parent' as const,
      };
    }
    
    // ... existing category logic
  })
);
```

---

## File Changes Summary

| File | Change |
|------|--------|
| `src/hooks/useDateRangeFilter.ts` | Accept initial custom range values |
| `src/hooks/useTransactionFilters.ts` | Persist custom start/end dates to URL |
| `src/hooks/useHierarchicalCategories.ts` | Remove `!inner` join, handle null categories |
| `src/components/admin/IncomeExpensesManagement.tsx` | Initialize dateRange with URL params |

---

## Data Integrity Notes

The database contains:
- **448 total transactions** for Ground Zero company
- **15 transactions** in December 2025
- **13 transactions** in January 2026
- **9 transactions** with missing category_id (will now show as "Uncategorized")

After this fix:
- All 448 transactions will be visible (vs 439 before)
- Custom date ranges will persist across page refreshes
- URL bookmarking/sharing will work correctly

---

## User Flow After Fix

```text
User selects Custom Range → picks Dec 1-31, 2025
         │
         ▼
URL updates: ?range=custom&start=2025-12-01&end=2025-12-31
         │
         ▼
Page shows 15 results for December 2025
         │
         ▼
User refreshes page or shares URL
         │
         ▼
Dates are restored from URL → Same 15 results shown
```
