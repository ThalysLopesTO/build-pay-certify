# Add Time Requests to the Manager Menu

## Goal
Let managers (role `management`) access the same **Time Requests** screen admins use — viewing, approving, declining, editing, and deleting employee missed-punch corrections.

## Good news: backend already allows it
No database or permission changes are needed:
- RLS on `missed_punch_requests` already grants `management` view/update/delete access.
- The `approve_missed_punch_request` and `decline_missed_punch_request` RPCs already accept `management`.
- The `TimeRequestsManagement` component already treats `management` the same as `admin` for edit/delete buttons.

The feature is simply not surfaced in the manager sidebar or wired into the manager dashboard router.

## Changes (frontend only)

### 1. Add the menu item — `src/components/management/sidebar/managementMenuData.ts`
Add a "Time Requests" entry (Clock icon, `id: 'time-requests'`) to the `employees` section, right after Employee Registration — matching where it lives in the admin sidebar.

### 2. Wire the route — `src/pages/ManagementDashboard.tsx`
- Import `TimeRequestsManagement` from `@/components/admin/TimeRequestsManagement`.
- Add a `case 'time-requests': return <TimeRequestsManagement />;` to the `renderContent()` switch.

## Out of scope
- No database, RLS, or RPC changes (already support managers).
- No changes to the admin experience.
- No new business logic — managers reuse the exact same component and flows as admins.

## Verification
- Open the manager dashboard, confirm **Time Requests** appears under Employee Management.
- Open it and confirm the list loads with Approve / Decline / Edit / Delete actions working.
