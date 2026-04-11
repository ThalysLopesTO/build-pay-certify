

# Refactor Live Punch Monitor Table to Modern SaaS Design

## Summary
Rewrite `LivePunchTable.tsx` and update `LivePunchMonitor.tsx` to use the new `TableCard` wrapper and enhanced `Table` components (already created), producing a clean, Untitled UI-inspired design. No logic, data, or query changes.

## What Changes

### 1. `src/components/admin/live-punch-monitor/LivePunchTable.tsx` (Full rewrite ~787 lines)

**Desktop table redesign:**
- Replace the inner `Card`/`CardHeader`/`CardContent` wrapper with `TableCard.Root` + `TableCard.Header` (title, badge count, trailing Live indicator)
- Use the enhanced `Table` with `size="sm"` for tighter, more professional rows
- Replace `TableHead` with `TableHeadSortable` on: Employee, Jobsite, Check-in, Check-out, Worked Duration, Break Time, Status
- Add local `sortDescriptor` state + `useMemo` sorted list (client-side sort on the paginated data passed in, or lift sort to parent)
- Clean up row styling: remove heavy gradients, use simple `hover:bg-muted/50`, alternating rows via `even:bg-muted/30`
- Reduce cell padding from `py-6 px-6` to default table size padding
- Employee column: keep avatar + name + date subtitle, reduce font from `text-lg` to `text-sm font-medium`
- Status badges: simplify from gradient badges to flat `BadgeWithDot`-style using existing `Badge` with a small dot indicator
- Actions column: make buttons smaller (`h-8 w-8`), remove `rounded-full hover:scale-105` animations
- Pagination: move into `TableCard.Footer`, simplify styling
- Remove the duplicate `Card` wrapper (parent `LivePunchMonitor.tsx` already wraps in a `Card`)

**Mobile card layout:**
- Keep existing card-based layout largely intact
- Minor cleanup: remove excessive gradients, use cleaner borders
- Selection checkbox remains touch-friendly

**Sorting implementation:**
- Add `sortColumn` and `sortDirection` state inside `LivePunchTable`
- Sort `filteredEntries` via `useMemo` before rendering
- Sorting fields map to entry properties (employee name string, jobsite name, check_in_time, check_out_time, calculated duration, break_minutes, status)

### 2. `src/components/admin/LivePunchMonitor.tsx` (Minor updates)

- Remove the outer `<Card className="shadow-sm">` wrapper around `<LivePunchTable>` (lines 656-677) since the table component will use `TableCard.Root` internally
- Move the "Punch Records" header + badge + missing clock-out button + date display (lines 614-641) into `LivePunchTable` via the `TableCard.Header` -- pass title/badge as props, or keep them outside and just remove the redundant card
- Keep bulk action bar placement as-is (above the table)

### 3. `src/components/admin/live-punch-monitor/BulkActionBar.tsx` (No changes)

Already clean and functional.

## Files

| File | Action |
|------|--------|
| `src/components/admin/live-punch-monitor/LivePunchTable.tsx` | Rewrite |
| `src/components/admin/LivePunchMonitor.tsx` | Minor update (remove redundant Card wrapper) |

## What does NOT change
- No database/schema changes
- No Supabase query changes
- No payroll/timesheet calculation changes
- No alert system changes
- No new dependencies
- All existing props, modals, and handlers remain intact
- Mobile card layout preserved (cleaned up)
- BulkActionBar, BulkClockOutModal, BulkBreakTimeModal, BulkNoteModal untouched

