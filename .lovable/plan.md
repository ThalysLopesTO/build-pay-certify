## Verification: Managers already have full Employee Management access

No code changes are needed. After auditing the codebase and database, the `management` role already has the same access as `admin` for Employee Management.

### What's confirmed

1. **Sidebar / Routing** — `ManagementDashboard.tsx` renders the same `EmployeeManagement` component used in the Admin Panel, and `managementMenuData.ts` includes the "Employee Management" entry.

2. **UI permissions** — `useIsAdmin()` returns `true` for roles `admin`, `super_admin`, and `management`. This flag controls Edit, Delete, and Reset Password buttons on each employee card, so managers see all three actions.

3. **Database (RLS) on `user_profiles`**:
   - `Company admins update company` policy → `is_user_admin() AND company_id = get_user_company_id()`
   - The `is_user_admin()` function returns true for `admin`, `super_admin`, and `management`.
   - So managers can update names, rates, trades, positions, contact info, etc., for any employee in their company.

4. **Delete (archive)** — the `delete_employee` RPC explicitly allows `admin`, `super_admin`, and `management`.

5. **Password reset** — invoked through the `reset-user-password` edge function from the same UI button visible to managers.

### Conclusion

Managers can already access Employee Management and edit name, rate, trade, position, contact details, reset passwords, and archive employees. No changes required.

If you've seen a specific action fail as a manager (e.g. a button missing, a permission denied error), let me know which employee/action and I'll dig into that specific case.