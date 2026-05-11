## Issue

Live Punch Monitor crashes on load in production (`app.stackbuild.ca`) with `TypeError: r.map is not a function`. The minified stack (`zqe`, react-vendor reconciler) doesn't pinpoint the component, and no matching runtime error is captured locally — meaning either (a) something in the production data shape is unexpected, or (b) a prop that should be an array is occasionally not one.

The page mounts several sibling components that iterate arrays (`LivePunchFilters`, `LivePunchMobileFilters`, `DailyHoursSummary`, `LivePunchTable`, `LivePunchSummaryCards`, the new `CreatePunchModal`). Any one of them receiving a non-array (e.g. `null`, an object, or a Supabase error envelope) would crash the whole page since they share the same React subtree.

## Fix — defensive guards + isolated error boundary

### 1. Always coerce to arrays where data flows in

In `src/components/admin/LivePunchMonitor.tsx`:

- Compute `const employeesList = Array.isArray(employees) ? employees : [];` and `const jobsitesList = Array.isArray(jobsites) ? jobsites : [];` once, after the `useQuery` calls.
- Pass `employeesList` / `jobsitesList` everywhere instead of the raw query result (filters, mobile filters, `DailyHoursSummary`, `CreatePunchModal`).
- Same coercion for `punchEntries` → `const entries = Array.isArray(punchEntries) ? punchEntries : [];` and use `entries` for filtering/iteration.

In `src/components/admin/live-punch-monitor/CreatePunchModal.tsx`:

- Replace `employees?.map(...)` and `jobsites?.map(...)` with `(Array.isArray(employees) ? employees : []).map(...)`. Belt-and-braces in case a parent ever passes the raw query object.

In `src/components/admin/live-punch-monitor/DailyHoursSummary.tsx`:

- Same `Array.isArray` guard on the `jobsites?.map` and `employees?.map` calls inside the filter selects.

### 2. Wrap the page in a scoped ErrorBoundary that logs the real component stack

Add a thin wrapper around the `LivePunchMonitor` body using the existing `src/components/common/ErrorBoundary.tsx`. On error, log `error.message` + `errorInfo.componentStack` to the console so the next production occurrence shows the actual failing component name (even with minified function names, the component-stack walk is preserved).

### 3. Sanity-check the queries

In `LivePunchMonitor.tsx`:

- After each `useQuery`, log a one-shot `console.warn('[LivePunchMonitor] employees not array:', employees)` in a `useEffect` if `employees` is defined and not an array (same for `jobsites`, `punchEntries`). This is a 1-line diagnostic that survives minification and pinpoints the misshape next time.

### 4. No DB or feature changes

- No schema migration, no new feature, no behavior change for working cases. Purely defensive + diagnostic.

## Files to edit

- `src/components/admin/LivePunchMonitor.tsx` — array coercions, diagnostic warnings, ErrorBoundary import + wrap.
- `src/components/admin/live-punch-monitor/CreatePunchModal.tsx` — `Array.isArray` guards on the two `.map` calls.
- `src/components/admin/live-punch-monitor/DailyHoursSummary.tsx` — `Array.isArray` guards on the two `.map` calls in the filter selects.

## Verification

- Reload `/admin/dashboard?tab=live-punch-monitor` → page renders even if a query returns nothing or an unexpected shape; if data shape ever is wrong, the in-page error boundary shows a friendly fallback for that section instead of the full-page crash, and the console reports which prop was misshaped.
- Existing functionality (filters, table, daily hours summary, Add Punch modal) continues to work normally.

## Optional follow-up (only if the issue persists after this fix)

If the crash still happens, ask the user to reproduce it in the **preview** URL (not the published one) so we get an unminified stack trace pointing at the exact line.
