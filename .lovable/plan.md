
# Fix Password Reset - Pagination Issue with listUsers()

## Problem Identified

From the Edge Function logs:
```
User not found in auth.users: vida6ix@gmail.com
```

**But the user DOES exist** in `auth.users`:
- Email: `vida6ix@gmail.com`
- ID: `d3a9d9e0-e3f2-4113-99e9-b535387f90a9`

**Root Cause**: The `auth.admin.listUsers()` method has a default pagination limit (typically 50 or 100 users). With **169 users** in the system, users on later pages aren't being found.

---

## Solution

Replace `listUsers()` with `listUsers({ perPage: 1000 })` to fetch all users in a single request, or use a loop to paginate through all pages.

---

## Changes Required

### File: `supabase/functions/send-password-reset/index.ts`

**Replace lines 33-44** - Update the listUsers call to handle pagination:

```typescript
// BEFORE - Only gets first page of users
const { data: authUsers, error: listError } = await supabaseClient.auth.admin.listUsers();

// ...

const authUser = authUsers.users.find(
  u => u.email?.toLowerCase() === email.toLowerCase()
);
```

```typescript
// AFTER - Get all users with higher perPage limit
const { data: authUsers, error: listError } = await supabaseClient.auth.admin.listUsers({
  perPage: 1000  // Max allowed, should cover all users
});

if (listError) {
  console.error('Error listing users:', listError);
  throw new Error('Failed to look up user');
}

// Find user by email (case-insensitive)
const authUser = authUsers.users.find(
  u => u.email?.toLowerCase() === email.toLowerCase()
);
```

---

## Why This Works

| Issue | Fix |
|-------|-----|
| `listUsers()` returns ~50 users by default | `perPage: 1000` fetches up to 1000 users |
| User at position 100+ not found | Now all 169 users will be searched |

---

## Alternative Approach (Even Better)

Instead of listing all users, we could use a filter in the query. However, since Supabase Admin API doesn't support filtering by email directly, the `perPage: 1000` approach is the most reliable fix.

---

## Flow After Fix

```text
User enters email "vida6ix@gmail.com"
        │
        ▼
Edge function calls auth.admin.listUsers({ perPage: 1000 })
        │
        ▼
Returns all 169 users (instead of first 50)
        │
        ▼
Finds user at position ~100+
        │
        ▼
Generates token & sends branded email via Resend
        │
        ▼
User receives email with reset link ✓
```

---

## Summary

| Before | After |
|--------|-------|
| `listUsers()` - default ~50 users | `listUsers({ perPage: 1000 })` - all users |
| vida6ix@gmail.com not found | vida6ix@gmail.com found ✓ |
| No email sent | Password reset email sent ✓ |
