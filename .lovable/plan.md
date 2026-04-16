

Looking at the screenshot, the badges that need changing are visible in the Time Requests page:

1. **Status badge top-right of card**: "Pending" — currently a solid dark amber/brown filled badge with white text (looks heavy and clashes with the rest of the page)
2. **Tab count badges**: "3" (orange filled circle) and "5" (green filled circle) — heavy filled circles
3. **Stat card icon tiles**: Inbox (dark amber filled square), Check (dark green filled square), X (dark red filled square) — these dark filled squares look out of place with the otherwise light/flat SaaS design

The rest of the page (sync hint pill, time chips "Clock In → 6:25 AM", filter triggers) looks clean — those should stay.

The project's `BadgeWithDot` system uses soft tinted backgrounds (`bg-amber-50 text-amber-700 border-amber-200`) which would match much better than the current heavy solid fills.

## Plan

# Soften Badges on Time Requests Page

## Problem
Three badge styles look heavy and out of sync with the rest of the SaaS design:
- **Status badge** ("Pending"): solid dark amber fill, white text → too dark
- **Tab count badges** ("3", "5"): solid orange/green filled circles → too loud
- **Stat card icon tiles**: dark filled squares (amber/green/red) → clash with the flat aesthetic

## Changes (single file: `TimeRequestsManagement.tsx`)

### 1. Status badge (top-right of each request card)
Replace solid dark badge with project's standard `BadgeWithDot` soft-tint style:
- Pending → `color="warning"` (soft amber bg, amber dot)
- Approved → `color="success"` (soft green bg, green dot)
- Declined → `color="error"` (soft red bg, red dot)

### 2. Tab count badges ("Active 3" / "Approved & Archived 5")
Replace solid filled circles with subtle inline counts:
- Use a small rounded pill with soft tinted bg matching the tab state (`bg-muted text-muted-foreground` when inactive, `bg-primary/10 text-primary` when active)
- Or use `BadgeWithDot` with `hideDot` and `size="sm"` for consistency

### 3. Summary card icon containers (Pending / Approved / Declined)
Replace dark filled squares with the soft-tint pattern already used in Live Punch Monitor cards:
- `h-9 w-9 rounded-lg bg-amber-50` with `text-amber-600` icon (Pending)
- `h-9 w-9 rounded-lg bg-emerald-50` with `text-emerald-600` icon (Approved)
- `h-9 w-9 rounded-lg bg-red-50` with `text-red-600` icon (Declined)

## What Stays Identical
- All logic, handlers, data, filters, hooks
- Sync hint pill at top (looks good)
- Time chips ("Clock In → 6:25 AM") (look good)
- Filter bar and dropdowns (look good)
- Card layout and content structure

## Files Changed
| File | Change |
|------|--------|
| `src/components/admin/TimeRequestsManagement.tsx` | Swap heavy badges for soft-tint `BadgeWithDot` style; flatten icon tiles in summary cards; refine tab count chips |

