## Add "Duplicate" action to invoice line items

In `src/components/admin/CreateInvoiceForm.tsx`, add a duplicate button next to the existing remove (X) button on each line item row. Clicking it inserts a copy of that row's current values directly below it.

### Changes

1. **Import `Copy` icon** from `lucide-react` alongside the existing `X` import.
2. **Use `insert` from `useFieldArray`** (already destructured for `append`/`remove`) to add the duplicated row right after the source row, preserving order.
3. **Read the current row values** via `form.getValues(\`line_items.${index}\`)` so any unsaved edits are copied (name, description, quantity, unit_price).
4. **Render a Duplicate button** in the row-actions area (around line 505), styled as a ghost button matching the X button — icon-only with `aria-label="Duplicate item"`, neutral hover color (e.g. `text-muted-foreground hover:text-foreground hover:bg-muted`).
5. **No disabled state** — duplicating is always allowed.

### Out of scope

- Quote line items (`QuoteEditorLineItemsSection.tsx`) — only the user's invoice request.
- Schema, persistence, or PDF changes — values flow through the existing field array.
