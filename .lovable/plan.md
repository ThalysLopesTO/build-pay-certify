

# Auto-Close Stale Punches & Yellow "Missing" Badge

## Problem
An employee punched in on April 9 but never clocked out. Today is April 11, and the system still shows them as "Active" with a continuously growing duration (132h+). The punch should have been capped at midnight of April 9 and marked "Missing".

## Rule
If `check_in_time` is on any day **before today** and `check_out_time` is null, the punch is **stale**:
- Display status as **"Missing"** with a yellow/amber badge
- Cap displayed duration at **11:59:59 PM of the check-in day** (stop counting)
- Only punches from **today** with no check-out remain "Active" with a live counter

## Changes -- `LivePunchTable.tsx` only

### 1. Add `isMissingCheckout` helper
Compares check-in date to today's date (midnight boundary). Returns true if check-in is before today and no check-out exists.

### 2. Update duration calculation
Add `getEffectiveEnd()` that returns:
- `check_out_time` if present
- Midnight of check-in day if stale (missing)
- `Date.now()` if same-day open punch (active)

### 3. Add yellow "Missing" badge
Three status states:
- **Active** (green pulse) -- open punch from today
- **Missing** (yellow/amber) -- open punch from a past day
- **Complete** (green static) -- has check-out

Applied to both desktop table rows and mobile cards.

### 4. Update sort value
Missing = 2 (sorts after Active=0 and Complete=1).

## Files
| File | Action |
|------|--------|
| `src/components/admin/live-punch-monitor/LivePunchTable.tsx` | Add stale detection, cap duration, yellow badge |

No database, query, or other file changes.

