
# Fix: Expenses Not Showing Due to Ambiguous Foreign Key Join

## Problem Identified
The database query fails with "Error fetching expenses with hierarchy: Object" because there are **two foreign keys** from `bills_expenses` to `expense_categories`:
1. `category_id` (primary category assignment)
2. `category_detected_id` (AI-detected category from receipt scanning)

When PostgREST encounters multiple foreign keys to the same table, it cannot automatically determine which relationship to use and throws an error.

## Root Cause
```text
bills_expenses table:
├── category_id ─────────────────► expense_categories (FK 1)
└── category_detected_id ─────────► expense_categories (FK 2)

PostgREST sees: "expense_categories (...)"
PostgREST error: "Could not determine which FK to use - ambiguous reference"
```

## Solution
Explicitly specify which foreign key column to use in the Supabase query using the `!column_name` hint syntax.

### File Change: `src/hooks/useHierarchicalCategories.ts`

**Current code (broken):**
```typescript
let query = supabase
  .from('bills_expenses')
  .select(`
    *,
    expense_categories (
      id,
      name,
      category_level,
      parent_category_id
    )
  `)
```

**Fixed code:**
```typescript
let query = supabase
  .from('bills_expenses')
  .select(`
    *,
    expense_categories!category_id (
      id,
      name,
      category_level,
      parent_category_id
    )
  `)
```

The `!category_id` hint tells PostgREST to use the `category_id` column for the join, disambiguating the relationship.

## Why This Broke
The `category_detected_id` column was added as part of the receipt scanning feature. This created a second FK to `expense_categories`, making the original query ambiguous.

## Technical Details

| Change | Description |
|--------|-------------|
| File | `src/hooks/useHierarchicalCategories.ts` |
| Line | ~77-85 |
| Fix | Add `!category_id` hint to disambiguate FK relationship |

## Data Integrity Confirmation
- All 448+ transactions for Ground Zero exist in the database
- All 530+ total transactions system-wide are intact
- This is purely a query syntax issue, not data loss

## Expected Result After Fix
1. Query uses explicit `category_id` FK for the join
2. PostgREST successfully executes the join
3. All transactions load with their category information
4. "All Time" filter displays all 448+ transactions
