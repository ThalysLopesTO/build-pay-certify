

# Fix: Blank Page on Mobile Employee Dashboard

## Root Cause Analysis

After reviewing every component in the employee flow, the code logic itself is well-guarded. The blank page is caused by two things:

1. **No app-level ErrorBoundary** — If ANY component throws (Header, navigation, ProtectedRoute query), the entire React tree unmounts to a white screen. There is nothing catching errors at the top level in `App.tsx`.

2. **Stale PWA cache** — The previous `sw.js` fix deployed a no-op service worker, but existing PWA installs won't activate the new worker until all app windows are closed and reopened. Many mobile users never fully close the app, so they're stuck on the old cached broken bundle indefinitely.

## Changes

### 1. Add a top-level ErrorBoundary in `App.tsx`

Wrap `<AppInner />` (the entire route tree) with an `<ErrorBoundary>` that shows a full-page "Something went wrong — Reload" screen instead of blank white. This is the last line of defense.

### 2. Wrap `EmployeeDashboard` layout components individually

In `EmployeeDashboard.tsx`, wrap `<Header />`, `<EmployeeDesktopNav />`, and `<EmployeeBottomNav />` each in `<ErrorBoundary fallbackMinimal>`. Currently, if `Header` or nav crashes, the entire page dies. With individual boundaries, the content area (clock in/out) stays visible even if the header fails.

### 3. Force service worker update with `skipWaiting` message

Update `src/utils/serviceWorker.ts` to send a `skipWaiting` message to any waiting service worker during registration, so the new no-op worker activates immediately without requiring the user to close all tabs.

Also add a `controllerchange` listener that auto-reloads the page once the new service worker takes over, ensuring the stale cached bundle is replaced.

### 4. Update `public/sw.js` to handle the `skipWaiting` message

Add a `message` event listener so that when the registration code sends `{ type: 'SKIP_WAITING' }`, the worker calls `self.skipWaiting()` immediately.

## Expected Result
- Mobile PWA users who are stuck on old cached code will get force-updated on next open
- If any component still crashes, users see a reload button instead of a blank page
- Clock in/out functionality remains accessible even if secondary components fail

## Files
- `src/App.tsx` — add top-level ErrorBoundary
- `src/pages/EmployeeDashboard.tsx` — wrap Header, nav components in individual boundaries
- `public/sw.js` — add SKIP_WAITING message handler
- `src/utils/serviceWorker.ts` — send skipWaiting + listen for controllerchange

