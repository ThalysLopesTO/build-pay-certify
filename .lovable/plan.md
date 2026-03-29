

# Fix Issue Flag Badge Readability

## Problem
The issue badges ("Early", "Late") have poor contrast — the orange text on orange background is hard to read, as shown in the screenshot.

## Fix

**File: `src/components/admin/time-summary/EmployeeTimeSummaryRow.tsx`**

Update the badge styling for the three states:

1. **Active warning (orange)** — increase contrast: use `bg-orange-100 text-orange-800 border-orange-400` (darker text, more opaque background)
2. **Missing checkout (red)** — already uses destructive, keep but ensure white text: `bg-red-600 text-white border-red-600`
3. **Dismissed (green)** — increase contrast: `bg-green-100 text-green-800 border-green-400`

This applies to both desktop (line ~311-317) and mobile (line ~430+) badge renders.

## Scope
- 1 file, styling-only changes

