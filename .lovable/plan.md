

# Remove Distance Column from Live Punch Monitor

## What's changing
The "Distance" column in the Punch Records table is no longer needed — out-of-range punches are already handled by the red flag + admin notification system.

## Plan

### File: `src/components/admin/live-punch-monitor/LivePunchTable.tsx`

1. **Remove the `getDistanceStatus` function** (lines 82-88) and the TODO comment above it — no longer used anywhere meaningful.

2. **Remove the "Distance" table header** (line 399).

3. **Remove the Distance table cell** (lines 538-542) that currently shows the "Disabled" badge.

4. **Remove the `distanceStatus` variable** from the row map callback (line 421) since nothing references it after the cell is gone.

5. **Verify mobile card layout** — the mobile cards don't currently render a Distance field, so no mobile changes needed.

No other files are affected. No payroll, timesheet, or business logic changes.

