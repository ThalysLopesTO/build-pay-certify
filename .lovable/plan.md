

# Bulk Actions for Punch Correction in Live Punch Monitor

## Summary
Add multi-select capability and bulk action workflows to the Punch In/Out page, allowing admins/managers/foremen to select multiple punch records and apply corrections (clock-out, break time, notes) in bulk. Integrate with the existing flagging and status system to surface punch issues (e.g., missing clock-out) for quick resolution.

## Technical Details

### New Files

**1. `src/components/admin/live-punch-monitor/BulkActionBar.tsx`**
- Renders when 1+ records are selected
- Desktop: sticky bar above table showing selected count + action buttons
- Mobile: sticky bottom bar with compact action buttons
- Actions: "Set Clock Out", "Add Break Time", "Add Note", "Clear Selection"
- Only visible to admin/super_admin/management/foreman roles (checked via `useAuth`)

**2. `src/components/admin/live-punch-monitor/BulkClockOutModal.tsx`**
- Time picker defaulting to current time
- Validation: clock-out must be after check-in for every selected record; shows list of invalid records
- Confirms with summary: "Apply clock-out time to X records?"
- Uses `usePunchEdit` mutation in a loop (or Promise.all) to update each record
- Shows success/partial failure feedback via toast

**3. `src/components/admin/live-punch-monitor/BulkBreakTimeModal.tsx`**
- Reuses the same preset pattern already in EditPunchModal (15m, 30m, 40m, 1h, 1.5h, Custom)
- Validates break doesn't exceed worked time for each record
- Applies same break value to all selected records via `usePunchEdit`

**4. `src/components/admin/live-punch-monitor/BulkNoteModal.tsx`**
- Textarea for note input
- Toggle: "Append to existing notes" vs "Replace existing notes"
- Applies to all selected records

### Modified Files

**5. `src/components/admin/live-punch-monitor/LivePunchTable.tsx`**
- Add props: `selectedIds: Set<string>`, `onToggleSelect: (id: string) => void`, `onToggleSelectAll: () => void`, `selectionEnabled: boolean`
- Desktop: add checkbox column as first column (header has select-all checkbox)
- Mobile: add checkbox to each card header area
- Selected rows get a highlighted background style
- Add "Missing Punch Out" filter quick-action: a button/badge near the status filter that filters to `check_out_time IS NULL` records
- Add "Select all from jobsite" action: when a jobsite filter is active, show a helper link to select all visible

**6. `src/components/admin/LivePunchMonitor.tsx`**
- Add state: `selectedIds: Set<string>`, bulk modal open states
- Add selection handlers (toggle single, toggle all visible, clear)
- Add role check: `const canBulkEdit = ['admin', 'super_admin', 'management', 'foreman'].includes(user?.role || '')`
- Render `BulkActionBar` when `canBulkEdit && selectedIds.size > 0`
- Render bulk modals
- Add a "Missing Clock Out" quick-filter button in the filter area that sets `statusFilter` to `'active'` (entries without check_out_time)
- On bulk action success, clear selection and refetch data
- Pass selection props down to `LivePunchTable`

**7. `src/hooks/usePunchEdit.ts`**
- Add a new exported hook `useBulkPunchEdit` that accepts an array of `{ id, data }` and runs updates via `Promise.allSettled`
- Returns results summary (succeeded count, failed items with reasons)
- Invalidates queries on completion
- Reuses the same Supabase update logic pattern

### Alert System Integration
- The existing flag system (`flaggedEntries` Set) and status-based filtering (`active` = missing clock-out) serve as the "alert" mechanism on this page
- Add a prominent "Missing Clock Out" badge/button near filters that counts entries without `check_out_time` and one-click filters to them
- When filtered to "Active" status, users can select-all and bulk clock out

### Role Permissions
- Selection checkboxes and bulk action bar only render when `canBulkEdit` is true
- Regular employees never see these controls

### Responsive Design
- Desktop: checkbox column + top sticky action bar
- Mobile: checkboxes in card headers + bottom sticky action bar with horizontally scrollable action buttons

### Performance
- `useBulkPunchEdit` uses `Promise.allSettled` to batch updates
- Selection state is a simple `Set<string>` -- minimal re-renders
- Query invalidation happens once after all updates complete, not per-record

## Files Summary
| File | Action |
|------|--------|
| `src/components/admin/live-punch-monitor/BulkActionBar.tsx` | Create |
| `src/components/admin/live-punch-monitor/BulkClockOutModal.tsx` | Create |
| `src/components/admin/live-punch-monitor/BulkBreakTimeModal.tsx` | Create |
| `src/components/admin/live-punch-monitor/BulkNoteModal.tsx` | Create |
| `src/components/admin/live-punch-monitor/LivePunchTable.tsx` | Modify |
| `src/components/admin/LivePunchMonitor.tsx` | Modify |
| `src/hooks/usePunchEdit.ts` | Modify |

No database changes required. No payroll logic affected.

