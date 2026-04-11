

# Adapt Untitled UI Table Style into StackBuild

## Problem
The Untitled UI table component requires `react-aria-components`, `@untitledui/icons`, and Tailwind CSS v4 design tokens -- none of which exist in this project. Installing those dependencies would conflict with the existing Tailwind v3 + Radix/shadcn stack and risk breaking the entire app.

## Approach
Instead of installing the incompatible library, I will **re-skin the existing shadcn `Table` component** to match the Untitled UI table's visual design. This gives you the same look and feel without dependency conflicts.

### What gets built

1. **Enhanced `src/components/ui/table.tsx`** -- Update styling to match Untitled UI's design:
   - Sticky header with `bg-secondary` (gray background)
   - Row hover with `hover:bg-muted/50`
   - Bottom border via pseudo-elements (cleaner divider lines)
   - Size variants (`sm` / `md`) via a context provider
   - Proper spacing matching Untitled UI's `px-6 py-4` (md) and `px-5 py-3` (sm)

2. **New `src/components/ui/table-card.tsx`** -- A wrapper component matching `TableCard.Root` and `TableCard.Header` from Untitled UI:
   - Rounded card with shadow and ring border
   - Header with title, optional badge count, description, and trailing content
   - Footer area for pagination

3. **Sortable column header support** -- Add a `TableHeadSortable` sub-component that shows sort direction arrows (ascending/descending chevrons) using Lucide icons (already installed), matching the Untitled UI sort UX.

4. **Checkbox column support** -- The existing `Checkbox` component will be used in selection columns, matching the Untitled UI pattern of a leading checkbox column.

5. **Utility function** -- Add a simple `cx` alias in `src/lib/utils.ts` (maps to the existing `cn` function) so any copied patterns work without changes.

### Files

| File | Action |
|------|--------|
| `src/components/ui/table.tsx` | Modify -- add size variants, updated spacing/colors |
| `src/components/ui/table-card.tsx` | Create -- card wrapper with header/footer |
| `src/lib/utils.ts` | Minor update -- export `cx` alias |

### What does NOT change
- No new npm dependencies (no react-aria, no @untitledui/icons)
- No Tailwind version upgrade
- Existing tables across the app continue to work (backward compatible)
- No payroll, timesheet, or business logic changes

