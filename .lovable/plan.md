

# Fix Blank Page Issue on Mobile & Shared Links

## Root Cause

The **service worker** (`public/sw.js`) is the primary culprit. It aggressively caches the app shell (`/`, JS bundles, CSS) using a **cache-first** strategy. When a new version is deployed:

1. Old cached HTML references old JS/CSS bundle filenames (Vite hashes change on every build)
2. The SW serves the stale HTML from cache
3. The browser tries to load JS files that no longer exist on the server
4. Result: **blank white page** — especially on mobile PWA where the SW persists across sessions

Additionally, the SW has no guard against running in Lovable preview iframes, which can cause issues during development.

## Fix

### 1. Replace aggressive service worker with a safe minimal version

**File: `public/sw.js`**
- Remove all caching logic (cache-first, stale-while-revalidate, navigation interception)
- Replace with a minimal SW that only exists to support PWA installability
- The SW will be essentially a no-op: no fetch interception, no caching
- Add a version bump so existing cached SWs get replaced via `skipWaiting()`

### 2. Force-unregister stale service workers on app load

**File: `src/utils/serviceWorker.ts`**
- Before registering the new minimal SW, unregister all existing service workers
- Clear all caches (`caches.keys()` → `caches.delete()`) to flush stale content
- This ensures users who already have the broken SW cached will recover on next visit

### 3. Add iframe/preview guard

**File: `src/main.tsx`**
- Add a guard before `registerServiceWorker()`: if the app is in an iframe or on a Lovable preview domain, skip SW registration entirely and unregister any existing ones

## Why this works
- The `manifest.json` alone is sufficient for "Add to Home Screen" / PWA installability — no service worker caching needed
- Removing fetch interception means the browser always loads fresh content from the server
- Force-clearing old caches fixes the blank page for users who already have stale data cached

## Scope
- 3 files modified (`public/sw.js`, `src/utils/serviceWorker.ts`, `src/main.tsx`)
- No database changes

