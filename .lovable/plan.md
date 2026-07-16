## Diagnosis

Backend is healthy for Christiane (chris@avena.com.br):
- Profile is active, single company (7 Star Family), employee role, license active
- 9 active jobsites available to her, RLS permits SELECT/INSERT on timesheets
- No DB errors or failed inserts logged for her account
- She signed in successfully today at 16:29 UTC but has zero timesheets ever

She reports the jobsite dropdown won't let her select — she can't pick a jobsite to punch in. Only she is affected.

The Time Tracker uses a Radix UI `<Select>` (shadcn) for the jobsite picker. On mobile Safari there is a well-known Radix Select touch bug where the dropdown items don't reliably respond to tap on some iOS/browser combinations — the sheet either dismisses on tap or the value never commits. Since everything server-side is fine and only this one user (on phone browser) is affected, the fix is on the client for that picker.

## Fix

Replace the Radix `<Select>` used for jobsite selection in `src/components/employee/TimeTracker.tsx` with a mobile-friendly picker that iOS Safari renders natively and reliably. On small viewports, render a native HTML `<select>` (styled to match); on desktop, keep the current Radix Select (which works well with a mouse). This is a UI-only change.

### Steps

1. In `src/components/employee/TimeTracker.tsx`:
   - Detect mobile via existing `useIsMobile` hook.
   - When mobile: render a native `<select>` bound to `selectedJobsiteId`/`setSelectedJobsiteId`, styled with the same rounded/h-12 look. Options: same jobsites list, plus the "loading" / "no jobsites" fallbacks the current code shows.
   - When not mobile: keep the existing Radix `<Select>` code path unchanged.
   - Keep the placeholder, disabled Clock In button until a jobsite is chosen, and all other logic (offline queue, geolocation) untouched.

2. No changes to backend, RLS, database, hooks, or the clock-in mutation.

### Why this is enough

- Native `<select>` on iOS opens the system wheel picker, which is bulletproof for touch selection.
- Change is scoped to one component and one dropdown, so nothing else in the employee flow is disturbed.
- Desktop UX stays identical.

### Follow-up if the issue persists after this change

If Christiane still cannot punch in after this update, next steps (not in this plan) would be to (a) have her clear Safari site data / hard refresh in case a stale cached bundle is served, and (b) capture a screenshot/console error from her device.

## Technical notes

- File touched: `src/components/employee/TimeTracker.tsx` only.
- Reuses `useIsMobile` from `src/hooks/use-mobile`.
- No new dependencies. No migrations. No edge functions.
