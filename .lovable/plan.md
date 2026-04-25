## Goal

Build a new, fully independent **Time Sheet** module accessible only to Admin and Manager roles. It lets them manually create hourly timesheets per employee + project + pay period, calculate payment, save to Supabase, list/edit/delete, and export a branded PDF. Punch-in/out and existing `weekly_timesheets` flows are untouched.

## Scope

- New page mounted at `tab=manual-timesheets` in both Admin and Management dashboards.
- New sidebar entry "Time Sheet" (icon: ClipboardList) under **Management Operations** for both portals.
- New Supabase table `manual_timesheets` (independent — does NOT touch `weekly_timesheets` or `timesheets`).
- Hourly type: full functionality. Project type: selectable but shows a "Coming soon" placeholder so the UI is future-proof without committing logic now.

## Database

New table `public.manual_timesheets`:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK default gen_random_uuid() | |
| `company_id` | uuid NOT NULL | RLS scope |
| `employee_id` | uuid NOT NULL | references `user_profiles.user_id` (no FK to auth.users) |
| `employee_name` | text NOT NULL | snapshot |
| `timesheet_type` | text NOT NULL default `'hourly'` | `'hourly' \| 'project'` |
| `jobsite_id` | uuid NULL | optional FK-style ref to `jobsites.id` |
| `project_name` | text NOT NULL | resolved jobsite name OR custom typed name |
| `pay_period_start` | date NOT NULL | |
| `pay_period_end` | date NOT NULL | |
| `daily_hours` | jsonb NOT NULL default `'[]'` | `[{date:'2025-04-20', day:'Monday', hours:8}, ...]` |
| `total_hours` | numeric(10,2) NOT NULL default 0 | |
| `hourly_rate` | numeric(10,2) NOT NULL default 0 | editable snapshot |
| `extra_amount` | numeric(10,2) NOT NULL default 0 | |
| `subtotal` | numeric(10,2) NOT NULL default 0 | total_hours * hourly_rate + extra |
| `tax_amount` | numeric(10,2) NOT NULL default 0 | |
| `total_payment` | numeric(10,2) NOT NULL default 0 | subtotal + tax |
| `created_by` | uuid NOT NULL | `auth.uid()` |
| `created_at` | timestamptz default now() | |
| `updated_at` | timestamptz default now() | trigger |

**RLS** (company-isolated, admin/manager-only):

- `SELECT/INSERT/UPDATE/DELETE` allowed when `company_id = public.get_user_company_id()` AND role IN (`admin`, `super_admin`, `management`) — reuse `is_company_admin()` helper which already covers all three.
- Trigger `update_manual_timesheets_updated_at` to maintain `updated_at`.

## Frontend

### New files

- `src/pages/admin/ManualTimesheetsPage.tsx` — page shell (header + form + list).
- `src/components/admin/manual-timesheets/ManualTimesheetForm.tsx` — type selector + hourly form.
- `src/components/admin/manual-timesheets/HourlyTimesheetForm.tsx` — employee/project/period + dynamic day grid + calc summary.
- `src/components/admin/manual-timesheets/DailyHoursGrid.tsx` — day-by-day rows generated from start/end date.
- `src/components/admin/manual-timesheets/PaymentSummary.tsx` — total hours / rate / extra / subtotal / tax / total.
- `src/components/admin/manual-timesheets/ManualTimesheetsTable.tsx` — list with desktop table + mobile cards.
- `src/components/admin/manual-timesheets/ManualTimesheetViewModal.tsx` — read-only detail.
- `src/components/admin/manual-timesheets/ManualTimesheetEditModal.tsx` — reuse `HourlyTimesheetForm` in edit mode.
- `src/components/admin/manual-timesheets/EmptyState.tsx`.
- `src/hooks/useManualTimesheets.ts` — list/create/update/delete with React Query, scoped to `companyId`.
- `src/utils/manualTimesheetPDF.ts` — jsPDF + autotable branded export (logo from `companies.logo_url`).
- `src/utils/manualTimesheetDays.ts` — pure helper: given start/end → array of `{date, day, hours:0}`.

### Wiring

**Admin** (`src/pages/AdminDashboard.tsx`):
- Import + add `case 'manual-timesheets': return <ManualTimesheetsPage />;`
**Management** (`src/pages/ManagementDashboard.tsx`):
- Same case.
**Sidebar**:
- `src/components/admin/sidebar/menuData.ts` — add menu item `{ id:'manual-timesheets', title:'Time Sheet', icon: ClipboardList }` and include it in `groupedMenuItems.managementOps` (sits next to Live Punch Monitor).
- `src/components/management/sidebar/managementMenuData.ts` — add `{ id:'manual-timesheets', title:'Time Sheet', icon: ClipboardList }` to `operations` array.

Both sidebars are already only rendered for admin/manager portals, so role gating happens at the route level. No employee/foreman portal changes.

### Hourly form behavior

1. **Employee**: dropdown from `useEmployeeDirectory()`. On select, auto-fill `hourly_rate` from `user_profiles.hourly_rate` (editable after).
2. **Project**: combobox listing jobsites (via existing `useJobsiteActions`/jobsites query) + free-text input. State stores `{ jobsite_id?: string, project_name: string }`. Custom name → `jobsite_id = null`, `project_name = typed`.
3. **Pay period**: two `DatePicker`s. On both selected, `manualTimesheetDays(start, end)` generates rows; each row has a numeric `Input` for hours (0 placeholder).
4. **Calc summary** (live):
   - `total_hours = sum(daily_hours[].hours)`
   - `subtotal = total_hours * hourly_rate + extra_amount`
   - `total_payment = subtotal + tax_amount`
5. **Validation**: employee, project_name, period start ≤ end, period ≤ 31 days (guardrail), hours 0–24 per day.
6. **Submit**: insert via `useManualTimesheets().create`; toast success; reset form; invalidate list.

### List

- Columns: Employee, Project, Pay Period (formatted), Total Hours, Total Payment, Created Date, Actions.
- Actions: View (modal), Edit (modal), Download PDF, Delete (with `AlertDialog` confirm).
- Loading skeleton + empty state.
- Mobile: stacked cards with same actions.

### PDF (`manualTimesheetPDF.ts`)

Uses jsPDF + jspdf-autotable v5 (per project memory: read `doc.lastAutoTable.finalY`):
- Header: company logo (if `logo_url` set), company name, "TIME SHEET" title.
- Meta block: Employee, Project, Pay Period, Created Date.
- Daily hours table.
- Totals block: Total Hours, Hourly Rate, Subtotal, Extra, Tax, **Total Payment** (bold).
- Footer: page number, generated timestamp.
- Filename: `Timesheet_{Employee}_{periodStart}_{periodEnd}.pdf`.

## Safety / Guardrails

- New table only; no changes to `weekly_timesheets`, `timesheets`, `time-tracker`, or `LivePunchMonitor`.
- RLS uses existing `get_user_company_id()` + role check (admin/super_admin/management).
- Sidebar only adds an entry — does not reorder or remove anything.
- Edit/Delete confirmed via existing AlertDialog pattern; updates set `updated_at` via trigger.
- Project Type "Project" is shown but renders an "Available soon" panel — no DB writes for that type yet.

## Out of scope (deferred)

- Project-type timesheet (line items, cost codes) — placeholder only.
- Bulk export of multiple timesheets — single-record PDF only.
- Approval workflow — these are admin-created records, no employee approval needed.
