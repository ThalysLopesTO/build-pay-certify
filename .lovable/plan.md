

# Redesign Live Punch Monitor — Cards & Filter Bar

## Goals
Make the summary cards and filter bar look cleaner, more professional, and consistent with the project's "Untitled UI / shadcn" SaaS aesthetic. **No logic changes** — same data, same handlers, same filters.

## What's Wrong Today
- **Cards**: Heavy gradients, oversized 4xl black numbers, fake "+12% / +8% / +5%" trend pills (decorative, not real data), oversized icon tiles with shadows, and a prominent "Live Updates" pill on every card — feels noisy and cluttered.
- **Filters**: Generic outlined inputs with redundant icon labels above and a separate active-filters badge row. Visually disconnected from the cards.

## Changes

### 1. `LivePunchSummaryCards.tsx` — Cleaner stat cards
- Remove gradients, hover scale, and heavy shadows. Use a flat card with subtle border (matches `TableCard` aesthetic).
- Drop the **fake trend pills** (`+12%`, `+8%`, `+5%`) — they aren't real metrics.
- Smaller, refined icon container (rounded-lg, `h-9 w-9`, soft tinted bg, no shadow).
- Number sizing: `text-3xl font-semibold` (not `text-4xl font-black`).
- Title: smaller, normal-case `text-sm font-medium text-muted-foreground` (drop uppercase tracking).
- Replace per-card "Live Updates" badge with a single subtle green dot + "Live" inline next to the value when viewing today.
- Keep grid `1 / md:3` responsive layout and the same 3 metrics.

### 2. `LivePunchFilters.tsx` — Unified filter bar
- Wrap filters in a single bordered card (`rounded-lg border bg-card`) for visual cohesion with the new stat cards.
- Keep the "Filter Controls" header row + "Clear All Filters" button (same logic).
- Replace stacked label-above-input layout with **compact inline triggers**: icon + value inside each Select/Popover trigger button (e.g., calendar icon + "Apr 16, 2026"), removing the separate label row to save vertical space.
- Same 4 controls (Date, Jobsite, Employee, Status), same handlers.
- Active filter badges row: keep, but use the project's `BadgeWithDot` style (solid, no outline) for consistency with project memory.

### 3. Visual consistency
- Use semantic tokens (`text-foreground`, `text-muted-foreground`, `bg-card`, `border`) — no hardcoded `bg-emerald-50`, `text-blue-600` etc. for surfaces. Icon accent colors stay (emerald/blue/orange) but applied only to the icon glyph, not large background tiles.

## Files Changed
| File | Change |
|------|--------|
| `LivePunchSummaryCards.tsx` | Flatten cards, remove fake trend %, simplify icon + Live indicator |
| `LivePunchFilters.tsx` | Wrap in card, compact inline filter triggers, polish active badges |

## What Stays Identical
- All props, hooks, handlers, filter logic, data calculations
- 3 stat metrics and their values
- 4 filter controls and their behavior
- Mobile filters component (`LivePunchMobileFilters.tsx`) — untouched

