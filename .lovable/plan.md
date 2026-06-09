# Employee Reimbursement Bills

Let employees optionally attach bill photos when they punch out to request reimbursement, and give admins/managers a dedicated page to review them.

## What the employee sees (punch-out)

In the existing **Complete Punch Out** modal, after Break Time and Work Note, add an optional section:

```text
  Reimbursement bill? (optional)
  [ + Add bill / receipt ]   <- reveals fields when clicked
     • Photos (1+ images, drag/drop or camera)
     • Amount ($)
     • Description / note
```

- Fully optional — punch-out works exactly as today if skipped.
- Supports multiple photos per bill.
- On confirm: the clock-out saves first (unchanged), then the bill record + photos are uploaded and linked to that shift.

## What admins / managers see

New menu item **"Employee Bills"** in the **Management Operations** section (right under "Time Sheet"), present in both the Admin sidebar and Management sidebar.

The page shows a clean card/table list of submitted bills with:

- Photo thumbnail (click to preview full image; multiple photos shown in a gallery)
- Date submitted
- Employee name + avatar
- Project / jobsite
- Amount
- Description
- Status badge (Pending / Approved / Declined)

Actions per bill:
- **Preview photos** (lightbox/dialog)
- **Approve** / **Decline**
- **Delete**

Filtering by status and a pending count, matching the app's existing SaaS table styling (TableCard, BadgeWithDot, `size="sm"`).

## Technical details

### Database (migration)
New table `public.employee_bills`:
- `user_id` (employee), `company_id`, `jobsite_id` (nullable), `timesheet_id` (nullable)
- `amount` (numeric, nullable), `description` (text, nullable)
- `status` (text, default `pending` — values pending/approved/declined)
- `reviewed_by` (uuid, nullable), `reviewed_at` (timestamptz, nullable)
- `created_at`, `updated_at` (with update trigger)

New table `public.employee_bill_photos`:
- `bill_id` (FK -> employee_bills, on delete cascade)
- `file_name`, `file_path`, `file_size`, `uploaded_by`, `created_at`

Standard GRANTs (`authenticated`, `service_role`) + RLS:
- Employees can insert and read their own bills/photos.
- Admins/managers (same company, via existing role check pattern used by other admin tables) can read all, update status, and delete.

### Storage
New bucket `employee-bills` (public, consistent with `equipment-photos`/`expense-attachments`) with `storage.objects` RLS allowing authenticated upload and company-scoped read.

### Frontend
- `useEmployeeBills` hook (employee submit + admin list/approve/decline/delete + photo upload), modeled on `useInventoryPhotos`.
- Extend `ClockOutNoteModal.tsx` with the optional bill section; pass collected bill data up through `TimeTracker.handleClockOutWithNote` so it uploads after clock-out succeeds.
- New `EmployeeBillsManagement.tsx` admin component + photo preview dialog.
- Register `employee-bills` tab in `AdminDashboard.tsx` and `ManagementDashboard.tsx`, and add the menu entry in `menuData.ts` (`managementOps`) and `managementMenuData.ts` (`operations`).

### Notes
- Empty amount/description sanitized to `null` before insert (per project convention).
- Timesheet/jobsite linked from the active shift when available.
