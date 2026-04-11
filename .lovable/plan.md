

# Update Badge Background Colors

## Changes in `LivePunchTable.tsx`

### Missing badge — use `#d58e2a` background with white text
4 locations to update:
- **Line 266** (mobile): `border-yellow-300 bg-yellow-50 ... text-yellow-700` → `border-[#d58e2a] bg-[#d58e2a] text-white`; dot → `bg-white`
- **Line 535** (desktop): same swap
- **Line 267** (mobile dot): `bg-yellow-500` → `bg-white`
- **Line 536** (desktop dot): `bg-yellow-500` → `bg-white`
- **Lines 507-508** (checkout column missing text): update dot/text color to match

### Complete badge — use `#43b66e` background with white text
3 locations:
- **Line 276** (mobile): `text-muted-foreground border-border` → `border-[#43b66e] bg-[#43b66e] text-white`; dot → `bg-white`
- **Line 545** (desktop): `border-green-300 bg-green-50 ... text-[#43b66e]` → `border-[#43b66e] bg-[#43b66e] text-white`; dot → `bg-white`

All badges become solid-color filled with white text and a white dot indicator.

## Files
| File | Action |
|------|--------|
| `LivePunchTable.tsx` | Update badge classes at ~6 locations |

