## Goal
Fix the “Failed to decline request” error when cancelling/declining a time request.

## Findings
- The frontend now calls `decline_missed_punch_request`, and the RPC exists in Supabase.
- The database status enum for `missed_punch_requests.status` does **not** include `declined`.
- The RPC tries to set `status = 'declined'`, so Postgres rejects the update before the request can be cancelled.

## Plan
1. **Database migration**
   - Add `declined` to the existing `request_status` enum if it does not already exist.
   - Keep the existing `decline_missed_punch_request` RPC and permissions intact.

2. **Frontend safety check**
   - Ensure the decline mutation continues surfacing the real RPC error message instead of only the generic toast.
   - No layout or UI changes.

3. **Verification**
   - Re-check that `request_status` contains `declined`.
   - Confirm the RPC can update pending requests to declined without the enum failure.