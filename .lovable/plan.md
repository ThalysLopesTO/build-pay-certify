## Add "Approved Timesheets" tab with Folders

Build the foundation for an approval workflow: a new tab next to **All Timesheets** containing user-created folders. From the All Timesheets tab, admins/managers can select multiple timesheets and move them into a folder. The actual approval logic is a follow-up step.

### Database changes

Two new tables (with RLS scoped to `company_id`, just like `manual_timesheets`):

1. **`manual_timesheet_folders`**
   - `id uuid pk`
   - `company_id uuid not null` (FK to companies)
   - `name text not null`
   - `description text`
   - `color text` (optional accent color for the folder card)
   - `created_by uuid not null`
   - `created_at`, `updated_at`

2. **`manual_timesheet_folder_items`** (join table — one timesheet can live in one folder at a time)
   - `id uuid pk`
   - `folder_id uuid not null` (FK → manual_timesheet_folders, on delete cascade)
   - `timesheet_id uuid not null unique` (FK → manual_timesheets, on delete cascade)
   - `company_id uuid not null`
   - `moved_by uuid not null`
   - `moved_at timestamptz default now()`

RLS: select/insert/update/delete restricted to rows where `company_id = current user's company` and the user has admin/manager role (matches existing manual_timesheets policies).

### UI changes

**`ManualTimesheetForm.tsx`** — add a 4th tab:

```text
[ Hourly ] [ Project ] [ All Timesheets (94) ] [ Approved Timesheets (N) ]
```

The new tab renders a new component `ApprovedTimesheetsTab`.

**`ApprovedTimesheetsTab.tsx`** (new)
- Header with **"+ New Folder"** button (opens a small dialog: name, optional description, optional color)
- Grid of folder cards (folder icon, name, item count, created date, menu: rename / delete)
- Click a folder → opens `FolderDetailView` showing the timesheets inside (reusing the same row layout as the main table, with a "Remove from folder" action and the existing View / Edit / Download PDF actions)
- Empty state: "No folders yet — create one to start organizing timesheets for approval."

**`ManualTimesheetsTable.tsx`** — extend the existing bulk action bar (already shows when rows are selected):
- Add a **"Move to folder"** button next to "Download PDFs"
- Opens a small picker dialog listing existing folders + an inline "Create new folder" option
- On confirm: insert rows into `manual_timesheet_folder_items` (upsert on `timesheet_id` so moving between folders works), invalidate both queries, clear selection, toast success

### Hooks (new)

- `useTimesheetFolders` — list / create / rename / delete folders, plus a derived `itemCount` per folder (computed via a single grouped query).
- `useFolderItems(folderId)` — list timesheets in a folder (joins `manual_timesheet_folder_items` → `manual_timesheets`), plus `addItems(timesheetIds, folderId)` and `removeItem(timesheetId)` mutations.

Both hooks invalidate each other so counts stay in sync.

### Out of scope (next step, per your message)
- Approval state machine (pending / approved / rejected inside a folder)
- Per-folder "Approve all" / signature / audit log
- Notifications to employees

Once you approve this plan I'll run the migration and ship the UI.