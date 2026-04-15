

# Fix Quote Editor Freezing with Many Line Items

## Problem
When adding 10+ line items on mobile, every keystroke triggers a full re-render of all line items. With each item containing 4-5 inputs plus a DnD sortable wrapper, this causes the page to freeze. Root causes:

1. `SortableLineItem` is not memoized — all items re-render on every single keystroke
2. `handleLineItemChange`, `addLineItem`, `removeLineItem` are recreated every render, breaking any memoization
3. Index-based keys (`line-item-${index}`) cause unnecessary DOM reconciliation when items shift

## Changes

### 1. `QuoteEditor.tsx` — Memoize callbacks, add stable IDs
- Wrap `handleLineItemChange`, `addLineItem`, `removeLineItem`, `handleReorderLineItems` with `useCallback`
- Generate a stable `_tempId` (e.g., `crypto.randomUUID()`) for each new line item so keys don't shift when items are added/removed

### 2. `SortableLineItem.tsx` — Wrap with `React.memo`
- Add `React.memo` to prevent re-rendering items whose props haven't changed
- Since callbacks will now be stable via `useCallback`, only the item that changed will re-render

### 3. `QuoteEditorLineItemsSection.tsx` — Use stable keys
- Change `key={`line-item-${index}`}` to use the stable `_tempId` or existing `id` from each item
- Update `SortableContext` items array to use the same stable IDs

## Expected Result
Typing in item #3 will only re-render item #3 instead of all 10+ items. Adding/removing items won't cause full DOM re-mounts. The page will remain responsive even with 15-20 line items on mobile.

## Files Changed
| File | Change |
|------|--------|
| `QuoteEditor.tsx` | Add `useCallback` to handlers, add `_tempId` to new items |
| `SortableLineItem.tsx` | Wrap component with `React.memo` |
| `QuoteEditorLineItemsSection.tsx` | Use stable IDs for keys and DnD context |

