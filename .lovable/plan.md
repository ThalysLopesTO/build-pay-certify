

# Add Tooltips to Issue Flags & Show "Missing Punch Out" Clearly

## Problem
1. On desktop, each issue flag shows only a `⚠` icon with no explanation — users can't tell what the issue is
2. Missing clock-outs show as a dash (`—`) with no clear warning label

## Changes

### 1. `src/components/admin/time-summary/EmployeeTimeSummaryRow.tsx`

**Desktop issue badges (line ~278-283)**: Replace the bare `⚠` badges with tooltip-wrapped badges showing human-readable labels:

- `MISSING_CHECKOUT` → "Missing Punch Out"
- `LATE_ARRIVAL` → "Late Arrival"
- `EARLY_PUNCH` → "Early Punch"
- `AFTER_END` → "Stayed Past End"
- `SHORT_DAY` → "Short Day"
- `INVALID` → "Invalid Punch"

Each badge will show a short label (e.g., "Late") and on hover, a tooltip with the full description. For `MISSING_CHECKOUT`, use a distinct orange/red style to make it stand out.

**Missing clock-out display (line ~250-260)**: When `check_out_time` is null and status is not "active", show a red "Missing Punch Out!" label instead of a plain dash.

**Mobile view (line ~364-371)**: Already shows flag names — just map them to the same human-readable labels.

### 2. Add `TooltipProvider` import

Import `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` from `@/components/ui/tooltip`.

## Scope
- 1 file modified (`EmployeeTimeSummaryRow.tsx`)
- No new dependencies

