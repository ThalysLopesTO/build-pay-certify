

# Create `BadgeWithDot` Component & Unify Badge System

## What We're Building
A reusable `BadgeWithDot` component following Untitled UI's badge system (as shown in the reference image), then refactoring existing inline badge patterns across the project to use it.

## New File: `src/components/base/badges/badges.tsx`

A CVA-powered component with these props:

| Prop | Values | Description |
|------|--------|-------------|
| `type` | `pill-color`, `pill-outline` | Filled pastel bg vs outline-only |
| `color` | `gray`, `brand`, `error`, `warning`, `success`, `blue`, `indigo`, `purple`, `pink`, `orange` | Maps to Untitled UI color rows from the reference |
| `size` | `sm`, `md`, `lg` | Controls padding, font size, dot size |
| `children` | ReactNode | Label text |
| `pulse` | boolean | Optional animated pulse on the dot |
| `className` | string | Override escape hatch |

Each color maps to a specific pastel bg + darker text + matching dot:
- `gray` → `bg-gray-50 text-gray-700 border-gray-200`, dot `bg-gray-500`
- `brand` → `bg-brand-50 text-brand-700 border-brand-200` (mapped to primary)
- `error` → `bg-red-50 text-red-700 border-red-200`, dot `bg-red-500`
- `warning` → `bg-amber-50 text-amber-700 border-amber-200`, dot `bg-amber-500`
- `success` → `bg-green-50 text-green-700 border-green-200`, dot `bg-green-500`

Also supports custom hex via a `customColor` prop for cases like the existing `#d58e2a` (Missing) and `#43b66e` (Complete) solid badges — these become a `solid` type variant with white text.

## Refactor: `LivePunchTable.tsx`

Replace the 6 inline `<Badge>` with dot patterns:
- **Active** → `<BadgeWithDot color="success" size="sm" pulse>Active</BadgeWithDot>`
- **Missing** → `<BadgeWithDot type="solid" customColor="#d58e2a" size="sm">Missing</BadgeWithDot>`
- **Complete** → `<BadgeWithDot type="solid" customColor="#43b66e" size="sm">Complete</BadgeWithDot>`
- **Live** → `<BadgeWithDot color="success" size="sm" pulse>Live</BadgeWithDot>`

## Refactor: Other Badge Consumers

Update `TimesheetStatusBadge.tsx`, `RoleBadge.tsx`, and `status-badges.tsx` convenience components to wrap `BadgeWithDot` internally, keeping their public API unchanged.

## Files

| File | Action |
|------|--------|
| `src/components/base/badges/badges.tsx` | **Create** — new `BadgeWithDot` component |
| `src/components/admin/live-punch-monitor/LivePunchTable.tsx` | Replace 6 inline badge+dot patterns |
| `src/components/ui/status-badges.tsx` | Refactor internals to use `BadgeWithDot` |
| `src/components/admin/timesheets/TimesheetStatusBadge.tsx` | Refactor to use `BadgeWithDot` |
| `src/components/admin/time-summary/RoleBadge.tsx` | Refactor to use `BadgeWithDot` |

