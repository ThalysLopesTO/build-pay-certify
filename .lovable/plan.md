# Fix Super Admin Dashboard Access

## The problem

The super admin account is `thalysadmin@gmail.com` (the currently logged-in `vida6ix@gmail.com` is a regular `admin`). When you open `/super-admin/dashboard`, you get bounced to `/admin-login`. There are three flaws causing this:

1. **`RoleBasedRedirect`** sends *any* logged-out visit to a path containing `/dashboard` straight to `/admin-login` — including `/super-admin/dashboard`. So opening the link before signing in always kicks you to the admin login page.
2. **`/super-admin/dashboard` has no guard.** It is a bare route with no check that the visitor is actually a super admin and no redirect to the super admin login when logged out.
3. **The admin login form** routes a `super_admin` to `/admin/dashboard` (not `/super-admin/dashboard`). Since super admins have no company, that path then bounces again — causing a redirect loop feeling.

## The fix

Goal (per your choice): sign in as the super admin at `/super-admin/login` and land reliably on `/super-admin/dashboard`.

### 1. `src/components/auth/RoleBasedRedirect.tsx`
- When **not authenticated**: if the path starts with `/super-admin`, redirect to `/super-admin/login` instead of `/admin-login`. Keep the existing `/admin-login` fallback for other `/dashboard` paths.
- Confirm an authenticated `super_admin` on `/super-admin/dashboard` is **not** redirected (expected path already matches, so this stays working).

### 2. `src/pages/SuperAdminDashboard.tsx`
- Add a lightweight guard at the top using `useAuth()`:
  - While `loading`, show the existing spinner/`SuperAdminLoading`.
  - If not authenticated → `Navigate` to `/super-admin/login`.
  - If authenticated but `role !== 'super_admin'` → `Navigate` to that user's own dashboard (e.g. admin → `/admin/dashboard`).
  - Otherwise render the dashboard.

### 3. `src/components/LoginForm.tsx`
- Split the `super_admin` case out of the shared `admin` case so a super admin signing in via `/admin-login` is sent to `/super-admin/dashboard` (no more company/subscription bounce).

## How to use it after the fix
Go to `/super-admin/login`, sign in with `thalysadmin@gmail.com`, and you'll land on the platform console. (If you don't know that account's password, you can reset it — let me know and I'll guide you.)

## Notes
- No database or RLS changes. The super admin record already exists and is active.
- Purely frontend routing/guard changes; no impact on admin/management/foreman/employee flows.
