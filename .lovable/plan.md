## Goal
Give foremen access to the **Daily Hours Summary** panel (Live Punch Monitor) with full filter + edit ability, but hide the **Export** button from them.

## Files to change

**`src/components/admin/live-punch-monitor/DailyHoursSummary.tsx`**

1. Add `'foreman'` to `ALLOWED_ROLES` so the panel renders for foremen.
2. Keep `canEdit` true for foremen (they get inline edit on rows like admins).
3. Add a separate `canExport = ['admin','super_admin','management'].includes(user.role)` and wrap the `<DailyHoursSummaryExport ... />` block (lines ~225–241) so it only renders when `canExport` is true. Foremen see the data and edits but no Export button.

No backend / RLS changes needed — read and edit permissions already cover foremen.

## Memory update
The existing memory `[Punch monitor access rules]` says "Daily Hours Summary = admin/management only". After implementation I'll update it to: foremen now have view + edit access, but export is still admin/management only.

## Verification
- Log in as foreman → Live Punch Monitor → Daily Hours Summary panel is visible, filters/Generate work, inline edits save, **Export button is hidden**.
- Log in as admin/management → unchanged: panel visible with Export button.
- Log in as employee → still hidden.
