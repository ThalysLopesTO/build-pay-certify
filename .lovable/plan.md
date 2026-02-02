

# Auto-Close Date Picker After Selection

## Current Behavior
The Review Details form in the Scan Receipt modal already allows full editing of all fields:
- Title (text input)
- Vendor/Payee (text input)
- Amount (number input)
- Date (calendar picker)
- Category (dropdown selector)
- Notes (textarea)

As shown in the screenshot, the date picker IS working - the calendar popover opens and the user can select any date.

## Issue Identified
When a date is selected, the popover stays open. Users may expect it to close automatically after selection, like most date pickers.

## Solution
Add controlled state to the Popover component so it closes automatically when a date is selected.

---

## File to Modify

**`src/components/admin/income-expenses/ScanReceiptModal.tsx`**

### Changes

1. Add state for popover open/close:
```typescript
const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
```

2. Update the Popover to be controlled:
```tsx
<Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
```

3. Close popover on date selection:
```tsx
onSelect={(date) => {
  if (date) {
    setFormData(prev => ({ ...prev, expense_date: date }));
    setIsDatePickerOpen(false); // Auto-close
  }
}}
```

---

## Summary

| Field | Status | Editable |
|-------|--------|----------|
| Title | Working | Yes |
| Vendor/Payee | Working | Yes |
| Amount | Working | Yes |
| Date | Working (add auto-close) | Yes |
| Category | Working | Yes |
| Notes | Working | Yes |

This is a minor UX enhancement - all editing functionality is already working correctly.

