

# Redesign Time Requests Page — SaaS Polish + Live Punch Integration Clarity

## Goals
Modernize the Time Requests page to match the project's "Untitled UI" aesthetic (consistent with the redesigned Live Punch Monitor), improve UX for reviewing/approving requests, and make the Live Punch Monitor link explicit. **No logic or data changes** — same approve/decline/edit/delete flows, same RPC (`approve_missed_punch_request`) that already auto-syncs the timesheet (which feeds Live Punch Monitor + employee history).

## What's Wrong Today
- Heavy gradients, `text-3xl font-bold`, oversized 4-color borders, decorative card stacking
- Filters are in a big separate card with `border-t-4` — disconnected from content
- Dense info blocks: 6 grey tinted tiles repeating the same visual weight
- No visual cue that approval will write straight to the Live Punch Monitor
- No quick metrics (Pending / Approved this week / Declined) for situational awareness
- Approve/Decline buttons take full-width on top of Edit/Delete row — too tall, redundant on mobile

## Changes (single file: `TimeRequestsManagement.tsx`)

### 1. Page header
- Cleaner heading (`text-2xl font-semibold`, single small Clock icon, muted subtitle)
- Add an info hint pill: "Approved requests sync automatically to Live Punch Monitor" with a subtle ArrowRight icon

### 2. New Summary Cards row (3 cards)
Flat bordered cards matching Live Punch Monitor's new design:
- **Pending Review** (amber dot) — count of pending requests
- **Approved** (emerald dot) — count of approved requests  
- **Declined** (red dot) — count of declined requests
Same `text-3xl font-semibold`, soft tinted icon container (`h-9 w-9 bg-color/10`)

### 3. Unified Filter Bar
- Wrap Status + Jobsite filters in one bordered card (`rounded-lg border bg-card`)
- Compact inline triggers: icon inside the SelectTrigger (Activity / Building), no stacked labels
- Add a third filter: **Date range** (Today / This Week / This Month / All) — purely client-side filter on `request_date`
- Add "Clear filters" link button when any filter is active

### 4. Tabs polish
- Slimmer tabs (`h-10`), use `BadgeWithDot`-style solid count badges (matches project memory rule)
- Rename "Active Requests" → "Active" / "Archived Requests" → "Approved & Archived" for clarity

### 5. Redesigned Request Card
- Remove the thick 4px left border; use a small status dot + status pill in the top-right
- Two-row info layout instead of 6 tinted tiles:
  - Row 1 (employee strip): Avatar circle with initials → name + employee ID + submitted-at timestamp → status badge
  - Row 2 (request details, compact inline): Date • Type (In/Out/Both) • Jobsite • Supervisor — separated by subtle dividers, single muted background
  - Row 3 (corrected times, only when present): two pill-style time chips with arrows: `Clock In → 6:25 AM` / `Clock Out → 2:04 PM`
  - Row 4: Reason in a muted bordered block with FileText icon
  - Row 5 (declined only): red-tinted decline reason block
- Footer actions: Approve (primary green) + Decline (ghost red) for pending, Edit + Delete (ghost icons only on the right) for admin/management
- After Approve button: small inline note "Will create/update timesheet for this employee on [date]" — sets expectation that it auto-flows to Live Punch Monitor

### 6. Empty states
- Replace dashed border boxes with a subtle centered illustration block matching shadcn empty-state pattern (small icon, heading, muted helper text)

### 7. Decline + Edit + Delete dialogs
- Keep functionality identical
- Apply consistent header styling (smaller icon, semantic tokens)
- Edit dialog: tighten spacing, group corrected times side-by-side when "Both" is selected

## Live Punch Monitor Integration (verified, no change needed)
The `useApproveMissedPunchRequest` hook already calls the `approve_missed_punch_request` RPC which creates/updates the timesheet record, then invalidates `['live-punch-monitor']`, `['live-punch-data']`, `['employee-timesheets']`, and `['timesheets']`. So an approved request already updates Live Punch Monitor and the employee's history in real time. The redesign just makes this **visible** to the user via the header hint and the per-request inline note.

## What Stays Identical
- All hooks, queries, mutations, RPC calls
- Approve / Decline / Edit / Delete logic and permissions (`admin`, `super_admin`, `management` for edit/delete)
- Active vs Archived split (pending+declined vs approved)
- Decline-with-reason flow, delete confirmation, edit form fields
- Mobile responsive behavior

## Files Changed
| File | Change |
|------|--------|
| `src/components/admin/TimeRequestsManagement.tsx` | Header redesign, add summary cards row, unified filter bar with date filter, polished cards, empty states, dialog styling |

## Memory Update
Save: `mem://features/timesheets/time-requests-live-punch-sync` — "Approving a missed punch request via `approve_missed_punch_request` RPC creates or updates the timesheet entry, automatically reflecting in Live Punch Monitor and the employee's history. No separate write needed."

