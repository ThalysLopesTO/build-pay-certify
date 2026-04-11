

# Upgrade Jobsite Time Rules: Overtime, Approval Workflow, and Payroll-Safe Calculations

## Current State

The app already has:
- `jobsite_time_rules` table with start/end times, break, grace periods
- `JobsiteTimeRules.tsx` UI with toggle, time inputs, break select, grace inputs
- `calculateWorkedHours.ts` engine that clamps punches and applies breaks client-side
- `timesheets` table with `check_in_time`, `check_out_time`, `break_minutes`, `hours_worked`, `status`, `dismissed_flags`
- `RuleBasedHours.tsx` component showing calculated hours per punch
- `EmployeeHoursBreakdown` and `DailyHoursSummary` for reporting

What's missing: overtime detection, overtime approval/rejection workflow, persisted calculated fields, audit trail, minimum-hours-for-break, and the polished UI improvements.

---

## Phase 1: Database Changes

### A. Extend `jobsite_time_rules` table
Add columns:
- `break_apply_after_minutes` (integer, default null) -- minimum shift length before break applies
- `overtime_threshold_minutes` (integer, default 0) -- minutes after scheduled end before OT is flagged

### B. Add calculated fields to `timesheets` table
Add columns:
- `raw_minutes` (integer)
- `adjusted_start_time` (timestamptz)
- `adjusted_end_time` (timestamptz)
- `overtime_minutes` (integer, default 0)
- `final_payable_minutes` (integer)
- `overtime_status` (text, default 'none') -- none | pending | approved | rejected
- `time_rule_applied` (boolean, default false)
- `reviewed_by` (uuid, nullable, references auth.users)
- `reviewed_at` (timestamptz, nullable)
- `review_reason` (text, nullable)
- `manual_override` (boolean, default false)
- `manual_override_by` (uuid, nullable)
- `manual_override_at` (timestamptz, nullable)

### C. Create `timesheet_audit_log` table
- `id` (uuid PK)
- `timesheet_id` (uuid FK -> timesheets)
- `action` (text) -- overtime_approved, overtime_rejected, manual_override, edit, etc.
- `performed_by` (uuid FK -> auth.users)
- `performed_at` (timestamptz, default now())
- `reason` (text, nullable)
- `old_values` (jsonb, nullable)
- `new_values` (jsonb, nullable)
- `company_id` (uuid FK)

RLS: authenticated users can SELECT where company_id matches; INSERT via security definer function.

---

## Phase 2: Calculation Engine Upgrade

### File: `src/lib/timeRules/calculateWorkedHours.ts`

Extend the return type and logic:
- Add `overtimeMinutes` to result
- Add `adjustedStartTime`, `adjustedEndTime`
- Add `overtimeStatus` (none | pending)
- Implement `break_apply_after_minutes`: only deduct break if `totalMinutes >= breakApplyAfterMinutes`
- Implement overtime detection: if `rawOut > ruleEndTime + lateGraceMinutes`, calculate `overtimeMinutes = diffInMinutes(ruleEndTime, rawOut)` and set status to `pending`
- End time logic: if within late grace, clamp to scheduled end (no OT). If beyond, keep real end but flag OT.

### File: `src/lib/timeRules/utils.ts`
- Add `generateOvertimeStatus()` helper

---

## Phase 3: Persist Calculations on Punch Save

### New hook: `src/hooks/useTimesheetCalculation.ts`
- On punch creation or edit, call `calculateWorkedHours` and write the calculated fields (`raw_minutes`, `adjusted_start_time`, `adjusted_end_time`, `overtime_minutes`, `final_payable_minutes`, `overtime_status`, `time_rule_applied`) back to the `timesheets` row
- Called from `PunchEditModal` save handler and from the employee clock-out flow

### Update: `src/hooks/usePunchEdit.ts` (or equivalent)
- After saving punch times, trigger the calculation and persist results

---

## Phase 4: Overtime Approval Workflow

### New hook: `src/hooks/useOvertimeReview.ts`
- `approveOvertime(timesheetId, reason?)` -- sets `overtime_status = 'approved'`, `reviewed_by`, `reviewed_at`, recalculates `final_payable_minutes` to include OT, writes audit log
- `rejectOvertime(timesheetId, reason?)` -- sets `overtime_status = 'rejected'`, caps `final_payable_minutes` at scheduled end, writes audit log
- `bulkApproveOvertime(ids[])` / `bulkRejectOvertime(ids[])`

### New hook: `src/hooks/useTimesheetAuditLog.ts`
- Insert audit entries via a security definer function
- Query audit log for a given timesheet

---

## Phase 5: Jobsite Time Rules UI Upgrade

### File: `src/components/admin/jobsite/JobsiteTimeRules.tsx`

Add:
- "Minimum hours before break applies" input (only shown when break > 0)
- "Overtime threshold" input with helper text
- **Live Preview section** showing example calculations:
  - "Punch in at 5:55 AM -> paid from 6:00 AM"
  - "Punch out at 2:18 PM -> overtime review required (18 min)"
  - "30 min break deducted -> final paid: 7h 30m"
- Polished layout with section dividers and better descriptions

---

## Phase 6: Punch Table UI Improvements

### File: `src/components/admin/live-punch-monitor/LivePunchTable.tsx`

Add columns/badges:
- **Adjusted Hours** column (from `final_payable_minutes`)
- **OT Status** badge: Normal (green), OT Pending (amber), OT Approved (blue), OT Rejected (red)
- **Break** column showing deducted break
- Expandable row or detail popover showing: actual in/out, scheduled start/end, break, OT minutes, final paid, approval history

### New component: `src/components/admin/live-punch-monitor/PunchDetailPopover.tsx`
- Shows full calculation breakdown and audit trail for a single punch
- Includes Approve OT / Reject OT action buttons (role-gated to admin/manager)

---

## Phase 7: Daily Hours Summary Improvements

### File: `src/components/admin/live-punch-monitor/DailyHoursSummary.tsx`

Add:
- OT status filter (All / Pending / Approved / Rejected)
- Per-row OT badge and inline Approve/Reject buttons for admin/manager
- Hover tooltip on hours showing full calculation breakdown

### File: `src/hooks/useEmployeeHoursBreakdown.ts`

Extend to include:
- `overtimeMinutes` per punch
- `overtimeStatus` per punch
- Aggregate OT totals per employee

---

## Phase 8: Bulk Overtime Actions

### File: `src/components/admin/live-punch-monitor/BulkActionBar.tsx`

Add:
- "Bulk Approve OT" button (visible when selected entries have OT pending)
- "Bulk Reject OT" button with optional reason modal
- Role-gated to admin/manager only

---

## Implementation Order

1. Database migrations (Phase 1)
2. Calculation engine (Phase 2)
3. Persist on save (Phase 3)
4. OT review hooks (Phase 4)
5. Time Rules UI (Phase 5)
6. Punch table UI (Phase 6)
7. Daily summary improvements (Phase 7)
8. Bulk actions (Phase 8)

### Files Summary

| File | Action |
|------|--------|
| Migration SQL | Add columns to `jobsite_time_rules`, `timesheets`; create `timesheet_audit_log` |
| `calculateWorkedHours.ts` | Add overtime detection, break threshold, new return fields |
| `utils.ts` | Add overtime helper |
| `useTimesheetCalculation.ts` | New -- persist calculated fields on save |
| `useOvertimeReview.ts` | New -- approve/reject/bulk OT |
| `useTimesheetAuditLog.ts` | New -- audit trail CRUD |
| `JobsiteTimeRules.tsx` | Add break threshold, OT threshold, live preview |
| `LivePunchTable.tsx` | Add OT status badges, adjusted hours column |
| `PunchDetailPopover.tsx` | New -- full calculation breakdown + actions |
| `DailyHoursSummary.tsx` | Add OT filter, inline approve/reject |
| `useEmployeeHoursBreakdown.ts` | Add OT fields to aggregation |
| `BulkActionBar.tsx` | Add bulk OT approve/reject |
| `useJobsiteTimeRule.ts` | Add new fields to interface and payload |

This is a large feature. I recommend implementing it in the order above, with approval checkpoints between phases.

