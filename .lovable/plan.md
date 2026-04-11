

# Update Badge Styling to Solid Backgrounds

## Changes in `LivePunchTable.tsx`

### Missing badges — solid `#d58e2a` background, white text, white dot
- **Line 266** (mobile): `border-yellow-300 bg-yellow-50 dark:bg-yellow-950 text-[#cf8b2a]` → `border-[#d58e2a] bg-[#d58e2a] text-white`; dot `bg-yellow-500` → `bg-white`
- **Line 535** (desktop): same swap; dot line 536 `bg-yellow-500` → `bg-white`
- **Line 507** (checkout column dot): `bg-yellow-500` → `bg-[#d58e2a]`
- **Line 508** (checkout column text): `text-yellow-600` → `text-[#d58e2a]`
- **Line 297** (mobile checkout text): `text-yellow-600` → `text-[#d58e2a]`

### Complete badges — solid `#43b66e` background, white text, white dot
- **Line 276** (mobile): `text-muted-foreground border-border` → `border-[#43b66e] bg-[#43b66e] text-white`; dot line 277 `bg-muted-foreground` → `bg-white`
- **Line 545** (desktop): `border-green-300 bg-green-50 dark:bg-green-950 text-[#43b66e]` → `border-[#43b66e] bg-[#43b66e] text-white`; dot line 546 `bg-green-500` → `bg-white`

Total: 9 small class changes across the file.

## Files
| File | Action |
|------|--------|
| `LivePunchTable.tsx` | Update badge classes at 9 locations |

