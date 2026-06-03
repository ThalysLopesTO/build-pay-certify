# Bills & Expenses: Faster, More Professional, Working Mobile Scan

No data is deleted or migrated — all changes are to how existing data is loaded and displayed.

## 1. Fix the slow loading (root cause)

The section is slow because of how the data is fetched, not the amount of data.

**`src/hooks/useHierarchicalCategories.ts` — `getTransactionsWithHierarchy`**
- Today, for every transaction that uses a subcategory, the app fires a *separate* database request to look up its parent category name. With many transactions this becomes hundreds of round-trips (the "Loading…" you see).
- Fix: resolve parent/subcategory names in-memory from the categories list that's already loaded, so transactions load in a single query instead of hundreds.
- Select only the columns the screen needs instead of `*`.

**`src/components/admin/IncomeExpensesManagement.tsx`**
- Categories are currently fetched twice on load (once by the component, once inside the hook). Remove the duplicate fetch.
- Move transaction + category loading to React Query (the app already uses it) so results are cached. Revisiting Bills & Expenses becomes near-instant instead of reloading every time, and the existing pull-to-refresh / save flows trigger a cache refresh.
- Keep the existing 20-per-page pagination for rendering.

Expected result: first load drops from many seconds to roughly one query; repeat visits are instant.

## 2. Make it more professional (all areas)

Applying the project's existing "Untitled UI" SaaS design system (TableCard, semantic tokens, solid badges) consistently:

- **Summary / KPIs:** tighten the income/expense/net KPI cards and the charts at the top — consistent spacing, aligned number formatting, clear up/down indicators.
- **Table + layout:** cleaner column alignment, consistent status/category/type badges, better empty and loading states (skeleton rows instead of a bare "Loading…").
- **Mobile:** polish the transaction card list and the action buttons for a smoother, more app-like feel.

No business logic, totals, or filter behavior changes — visual/structure only.

## 3. Fix receipt scanning on the phone (camera opens, then freezes)

The freeze happens because, after the camera closes, the modal runs several aggressive "viewport recovery" loops and forced re-renders that fight with iOS and leave the screen blank/stuck.

**`src/components/admin/income-expenses/ScanReceiptModal.tsx`**
- Replace the fragile recovery hacks (repeated `recoverViewport()` intervals, multiple forced `renderKey` bumps, delayed tab switches) with a single, reliable flow: keep the file input outside the dialog, switch to the review step once, and do one lightweight repaint on return instead of timed loops.
- Let the user pick from the photo library as well as the camera (more reliable than camera-only capture, and avoids the freeze path entirely when they choose an existing photo).
- Keep the upload → AI extract → review → save flow and all duplicate-detection logic unchanged.

## Technical notes
- Data fetching converts from `useState`/`useEffect` to React Query keyed by company; mutations (create/edit/delete/scan-save) invalidate that query.
- N+1 removal relies on the already-loaded `categories` array for name resolution; uncategorized transactions still show "Uncategorized".
- No schema migration, no edge-function logic change (the `receipt-extract` function stays as-is).

## Out of scope
- Changing totals, tax, or filter logic.
- Backend/database structure changes.
- Native (Capacitor) app changes — this targets the installable web/PWA experience.
