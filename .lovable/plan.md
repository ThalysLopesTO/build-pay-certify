

## Goal
1. Add **Import Clients** (xlsx/xls/csv) with template download, preview, validation, dedup, and result summary.
2. Fix **Clients page freeze** at the root cause.

## Root Cause of Freeze

After auditing the code, the freeze is **not** caused by realtime subscriptions (there are none on `clients`). The actual culprits are in `ClientsTable.tsx` and `ClientMobileCard.tsx`:

1. **Modal mounted per-row**: `<ClientFormModal>` is rendered inside the `clients.map(...)` loop in `ClientsTable` and `ClientMobileCard`. With N clients, N copies of the form modal mount on render. Each modal calls `useCreateClient()` + `useUpdateClient()` (which subscribe to React Query). Same for `ClientPortalLinkDialog`. With 50+ clients this multiplies React Query observers and form state by N → render lag and UI freeze on edits.
2. **Search recomputes whole list every keystroke** without `useMemo` — minor, but compounds with #1.
3. **`isLoading` evaluated twice**: once in `ClientsList`, once via `useIsMobile` re-evaluation — minor, but causes extra renders.

### Fix Strategy
- Hoist `ClientFormModal`, `ClientPortalLinkDialog`, and `AlertDialog` to the **table parent** (single instance). Pass the active client via state (`editingClient`, `portalClient`, `deletingClient`).
- Same pattern for the mobile list — single set of modals at `ClientsMobileList` level instead of one per `ClientMobileCard`.
- Wrap `filteredClients` and stat totals in `useMemo` keyed on `clients` + `searchQuery`.
- Stabilize row callbacks with `useCallback` only where they cross memoization boundaries.

This is the real root cause — no virtualization or pagination needed yet.

## Feature: Import Clients

### Schema Note
The existing `clients` table only has: `client_name`, `client_email`, `client_company`, `client_phone`, `client_address`. Columns like `city`, `province`, `postal_code`, `country`, `notes` **don't exist**. To honor the request without a risky schema migration, the importer will:
- Map `address`, `city`, `province`, `postal_code`, `country` → concatenate into a single `client_address` string.
- `notes` → ignored with a warning (or stored at end of address). Documented as a limitation.

If the user wants real columns, that's a follow-up migration.

### New Files
- `src/lib/clients/importParser.ts` — parse xlsx/xls/csv (using existing `xlsx` + `papaparse`), normalize headers (case-insensitive, accepts aliases like "Client Name", "Full Name", "Phone Number", "Company Name").
- `src/lib/clients/importValidator.ts` — per-row validation (name required, email format via zod), in-file dedup (email, phone, name+company), DB dedup against existing `clients` for current `company_id`.
- `src/lib/clients/importTemplate.ts` — generates the downloadable `.xlsx` sample with headers + 1 example row.
- `src/hooks/useImportClients.ts` — batch insert (chunks of 200) using `supabase.from('clients').insert(batch)`, returns per-batch results, invalidates `['clients']` once at the end.
- `src/components/admin/clients/ImportClientsModal.tsx` — main drawer/modal with 3 steps: **Upload → Preview/Validate → Result**.
- `src/components/admin/clients/import/ImportDropzone.tsx` — drag-and-drop + file picker.
- `src/components/admin/clients/import/ImportPreviewTable.tsx` — preview with row-level status badges (Valid / Duplicate / Invalid), checkboxes, and "Skip duplicates" / "Skip invalid" toggles.
- `src/components/admin/clients/import/ImportResultSummary.tsx` — final counts.

### UI Wiring
- `ClientsPage.tsx`: add **Import Clients** button next to **New Client** (desktop). Mobile: add a secondary FAB or menu item under the existing FAB.
- Shows a single result toast and refreshes via `invalidateQueries(['clients'])`.

### Validation Rules (in `importValidator.ts`)
- `name` required → otherwise `Invalid`.
- `email` if present → must match standard regex; **email is not strictly required at DB level** but the `clients.client_email` column is `NOT NULL`. The importer will:
  - Auto-fill missing/invalid emails with a placeholder (`no-email-<uuid>@import.local`) and flag the row as **Warning: placeholder email** so users see what happened. (Or skip — user toggles via a "Require email" switch.)
- Duplicate detection (in-file): email match, phone match, or `name+company` match → `Duplicate`.
- Duplicate detection (DB): batch-fetch existing clients for `company_id` once at preview time, build Sets of normalized emails/phones/(name+company), check each row.
- User toggles: **Skip Invalid** (default on) and **Skip Duplicates** (default on). Cannot import while invalid rows are selected unless toggle is off.

### Result Summary
Total rows | Imported | Skipped (duplicates) | Skipped (invalid) | Failed (DB error). Then `queryClient.invalidateQueries(['clients'])`.

### Security
- All inserts go through Supabase client respecting existing RLS on `clients` (already restricts by `company_id`). Importer uses `user.companyId` from `useAuth()` — same pattern as `ClientFormModal`.
- No edge function needed; client-side bulk insert is safe under RLS.

## Files Changed
**New (8):**
- `src/lib/clients/importParser.ts`
- `src/lib/clients/importValidator.ts`
- `src/lib/clients/importTemplate.ts`
- `src/hooks/useImportClients.ts`
- `src/components/admin/clients/ImportClientsModal.tsx`
- `src/components/admin/clients/import/ImportDropzone.tsx`
- `src/components/admin/clients/import/ImportPreviewTable.tsx`
- `src/components/admin/clients/import/ImportResultSummary.tsx`

**Modified (4):**
- `src/pages/admin/ClientsPage.tsx` — add Import button, memoize stats/filter.
- `src/components/admin/clients/ClientsTable.tsx` — hoist modals out of map (freeze fix).
- `src/components/admin/clients/ClientsMobileList.tsx` — hoist modals out of cards.
- `src/components/admin/clients/ClientMobileCard.tsx` — accept `onEdit/onDelete/onPortal` props instead of owning modals.

## What We're NOT Touching
- `clients` table schema — no migration. Extra columns folded into `client_address`.
- `useClients.ts` query/mutation logic — only consumers change.
- RLS policies.
- Other entities (invoices, quotes) that reference clients.

## Limitations (documented for user)
- `notes`, `city`, `province`, `postal_code`, `country` are merged into `client_address` (no dedicated columns yet — request a schema migration if needed).
- Email is required by DB; rows missing email get a placeholder unless skipped.
- Bulk import processes in batches of 200; very large files (>5k rows) will work but show progress.

