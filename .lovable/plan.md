

# Fix: Ensure PWA Mobile Users Get Updated Code

## Problem
The ErrorBoundary and null guards **are applied** in the source code and work for all users. However, **PWA mobile users are at risk** because:

1. The current `public/sw.js` uses a **cache-first strategy** for JS/CSS files — meaning PWA users may be served the old, broken cached bundle indefinitely
2. `src/main.tsx` registers the service worker **without any iframe/preview guards**, which also causes issues in the Lovable editor
3. There's no mechanism to force PWA users to get the new version

## Fix (2 files)

### 1. Replace `public/sw.js` with a minimal no-op service worker
Strip all caching logic. Keep only `install` (skip waiting) and `activate` (claim clients + delete old caches). No `fetch` handler — let the browser load fresh assets every time. This preserves PWA installability without stale caching.

### 2. Update `src/main.tsx` — add iframe/preview guard + force-clear old caches
- Skip service worker registration when inside an iframe or on a Lovable preview host
- On first load, unregister any existing service workers and clear all caches so PWA users immediately get the fixed code
- Keep `registerServiceWorker()` call only for production PWA contexts

### 3. Simplify `src/utils/serviceWorker.ts`
Update to include the guard logic and handle the legacy cache cleanup.

## Scope
- 3 files modified
- No database changes
- Fixes the root cause of PWA users seeing blank pages from stale cached code

