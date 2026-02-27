

# Fix: Quote Save Fails Due to Empty Date Strings

## Root Cause
Database logs show: `invalid input syntax for type date: ""`

The `formData` has `expiry_date: ''` (empty string) which gets spread directly into the Supabase insert/update. Postgres rejects empty strings for date columns — it needs `null` instead.

## Fix

**File: `src/components/admin/quotes/QuoteEditor.tsx`**

In the `handleSave` function (around lines 236-277), sanitize the formData before sending to Supabase. Convert empty string date fields to `null`:

```typescript
// Before spreading formData into the mutation, sanitize empty dates
const sanitizedData = {
  ...formData,
  expiry_date: formData.expiry_date || null,
  client_id: formData.client_id || null,
  client_company: formData.client_company || null,
  client_phone: formData.client_phone || null,
  client_address: formData.client_address || null,
  quote_number: formData.quote_number || undefined,
};
```

Then use `sanitizedData` instead of `formData` in both the create and update mutation calls (lines 240, 270-276).

This applies to both code paths:
1. **Update path** (line 239-244): Replace `...formData` with `...sanitizedData`
2. **Create path** (line 270-276): Replace `...formData` with `...sanitizedData`

Single file change, ~10 lines added.

