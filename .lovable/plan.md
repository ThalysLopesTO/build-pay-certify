# Fix: Managers can't decline time requests

## Problem
- **Approve** works for managers because it calls the `approve_missed_punch_request` SECURITY DEFINER database function, which explicitly allows the `management` (and `foreman`) role.
- **Decline** instead performs a direct client-side `UPDATE` on `missed_punch_requests`, relying entirely on Row-Level Security. This is fragile and is what's failing for managers.
- There is **no** `decline_missed_punch_request` function in the database (contrary to an earlier note).

## Fix (mirror the approve pattern)

### 1. Database — add `decline_missed_punch_request` RPC
Create a `SECURITY DEFINER` function that mirrors the approve permission model:
- Loads the request where `status = 'pending'`; returns a clear error if not found/already processed.
- Verifies the caller via `user_profiles` has role in `('admin','super_admin','management','foreman')` for the request's company.
- Updates the row: `status = 'declined'`, `reviewed_by = auth.uid()`, `reviewed_at = now()`, `decline_reason = <provided>`.
- Returns a JSON result `{ success, ... }` (consistent with approve).
- `GRANT EXECUTE` on the function to `authenticated`.

### 2. Frontend — `src/hooks/useMissedPunchRequests.ts`
Update `useDeclineMissedPunchRequest` to call the new RPC instead of the direct table update:
- `supabase.rpc('decline_missed_punch_request', { request_id, p_decline_reason })`
- Keep the same query invalidations (`missed-punch-requests`, `my-missed-punch-requests`) and success/error toasts; surface the RPC's error message when `success` is false (same style as approve).

## Out of scope
- No UI/layout changes to `TimeRequestsManagement` (decline dialog already works and shows for managers).
- No changes to approve, edit, or delete flows.
- No RLS policy rewrites (the new RPC bypasses the RLS ambiguity entirely, matching approve).

## Verification
- As a manager, open **Time Requests**, decline a pending request with and without a reason → status becomes Declined, toast confirms, list refreshes.
- As an admin, confirm decline still works.
- Confirm a declined request shows the decline reason.
