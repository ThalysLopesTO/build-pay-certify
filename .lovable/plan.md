

## Current vs Desired Behavior

**Daily Hours Summary button** (in Live Punch Monitor):
- Current: visible to `admin`, `super_admin`, `management` ✅ matches your rule ("only admins and managers")
- No change needed.

**Employee Hours edit buttons** (inside the Daily Hours Summary panel — `EmployeeHoursBreakdown`):
- Current: only `admin`, `super_admin`, `management` get edit buttons (because `canEdit` is derived inside `DailyHoursSummary` which Foremen can't even open).
- Your rule: **Admin, Manager AND Foreman** should be able to edit employee hours.

### The conflict
Foremen can't currently reach the edit UI because the entire `DailyHoursSummary` panel (where `EmployeeHoursBreakdown` lives) is gated to admin/manager only.

### Two ways to resolve — please pick one

**Option A — Keep summary admin/manager only, but expose edit elsewhere for Foremen**
Foremen edit punches via the existing Live Punch Monitor row actions (not the Daily Hours Summary). I'd verify foremen already have inline edit access on the main monitor table and leave this file alone. (No code change needed if already true.)

**Option B — Let Foremen open Daily Hours Summary too (for editing only)**
Add `foreman` to `ALLOWED_ROLES` so Foremen see the button and can use the breakdown to edit. This contradicts what you said ("only admins and managers can see the button").

### Recommendation
**Option A.** Your stated rule is internally consistent: Foremen edit hours through the Live Punch Monitor's own row controls; the Daily Hours Summary stays an admin/manager reporting tool. I'll save this as a memory rule and verify Foreman edit access on the main monitor table — no code change unless I find a gap.

### Plan
1. Save memory rule: "Daily Hours Summary visible only to admin/management; Foremen edit punches via Live Punch Monitor row actions."
2. Inspect `LivePunchMonitor` row-level edit gating to confirm Foremen already have edit access there.
3. If Foremen are missing edit access on the main monitor, add `foreman` to that gate (one line). If they already have it, no code change.

