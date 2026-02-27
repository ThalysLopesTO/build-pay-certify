

# Fix: Return to Quotes List After Saving

## Problem
When clicking "Save Quote", the quote saves successfully (toast appears) but the user stays on the editor instead of returning to the quotes list. The `handleSubmit` function never calls `onClose()`.

## Fix

**File: `src/components/admin/quotes/QuoteEditor.tsx`** (line ~309)

After the success toast in `handleSubmit`, add `onClose()` to navigate back:

```typescript
toast({
  title: "Success",
  description: quote ? "Quote updated successfully" : "Quote created successfully",
});

onClose(); // Return to quotes list

return resultQuote;
```

Note: `handleSaveAndSend` calls `handleSubmit()` and then opens the email modal, so `onClose()` should only be called when saving without sending. We need to add a parameter to `handleSubmit` to control this:

```typescript
const handleSubmit = async (returnToList = true) => {
  // ... existing save logic ...
  
  toast({ ... });
  
  if (returnToList) {
    onClose();
  }
  
  return resultQuote;
};
```

Then update `handleSaveAndSend` to pass `false`:
```typescript
const result = await handleSubmit(false);
```

And update the save button's `onClick` to just call `handleSubmit()` (which defaults to `true`).

Single file change, ~4 lines modified.

