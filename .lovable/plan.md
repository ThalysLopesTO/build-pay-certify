

# Fix: Timesheet Delete Not Actually Deleting Records

## Root Cause
The `timesheets` table has RLS (Row Level Security) enabled but **no DELETE policy exists**. This means:
- The Supabase `.delete()` call completes without error
- But RLS silently blocks it -- zero rows are deleted
- The `onSuccess` callback fires and shows the "Success" toast, misleading the user

## Fix

### 1. Add a DELETE RLS policy on the `timesheets` table (migration)
Create a new migration that adds a DELETE policy allowing admin, super_admin, and management roles to delete timesheets within their company:

```sql
CREATE POLICY "Admins can delete timesheets"
ON public.timesheets
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin', 'management')
      AND user_profiles.company_id = timesheets.company_id
  )
);
```

### 2. Update `useDeleteTimesheet.ts` to verify deletion actually happened
Change the delete call to use `.select()` or check the response count, so if RLS blocks the delete in the future, it throws an error instead of showing false success. Specifically, use `.select().single()` pattern or check `data`/`count` to confirm a row was actually removed.

## Files
| File | Action |
|------|--------|
| `supabase/migrations/[timestamp]_add_timesheets_delete_policy.sql` | Create |
| `src/hooks/useDeleteTimesheet.ts` | Minor update for delete verification |

## Impact
- Only affects delete operations on the `timesheets` table
- No payroll or calculation logic changes
- No other pages affected

