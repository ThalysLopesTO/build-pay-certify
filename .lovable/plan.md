

# Fix Badge Transparency on iOS

## Problem
The Missing and Complete badges appear transparent/not solid on iOS, unlike the reference images. The `variant="outline"` applies a `text-foreground` class that can conflict with the custom styling on iOS Safari.

## Fix
Change all Missing and Complete badges from `variant="outline"` to `variant="default"` (which sets `border-transparent`) to eliminate class conflicts. The custom `bg-[#d58e2a]` / `bg-[#43b66e]` and `text-white` classes will then apply cleanly without any override from the variant.

## Changes in `LivePunchTable.tsx`

6 badge instances to update (`variant="outline"` to `variant="default"`):
- Line 266 (mobile Missing badge)
- Line 276 (mobile Complete badge)  
- Line 535 (desktop Missing badge)
- Line 545 (desktop Complete badge)

Also remove redundant `border-[#d58e2a]` / `border-[#43b66e]` classes since `variant="default"` already sets `border-transparent`.

| File | Action |
|------|--------|
| `LivePunchTable.tsx` | Change 4 badge variant props from "outline" to "default", clean up border classes |

