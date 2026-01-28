
# Fix Password Reset - Email Not Found in user_profiles

## Problem Identified

From the Edge Function logs:
```
User not found in user_profiles: vida6ix@gmail.com
```

**Root Cause**: Out of 164 users in your system, only 90 have their email stored in `user_profiles`. The super_admin user has `email = null` in `user_profiles`, so the password reset silently fails (shows success but doesn't send email).

---

## Solution

Update the `send-password-reset` Edge Function to use the Supabase Admin API `listUsers` to find users by email in `auth.users` (where emails are always stored), then get profile data from `user_profiles` for personalization.

---

## Changes Required

### File: `supabase/functions/send-password-reset/index.ts`

**Replace the user lookup logic (lines 33-50)**:

```typescript
// BEFORE - Only works if email exists in user_profiles
const { data: userProfile, error: profileError } = await supabaseClient
  .from('user_profiles')
  .select('user_id, first_name, last_name, role, company_id, email')
  .eq('email', email.toLowerCase())
  .single();
```

```typescript
// AFTER - Use Admin API to find user by email in auth.users
const { data: authUsers, error: listError } = await supabaseClient.auth.admin.listUsers();

if (listError) {
  console.error('Error listing users:', listError);
  throw new Error('Failed to look up user');
}

// Find user by email (case-insensitive)
const authUser = authUsers.users.find(
  u => u.email?.toLowerCase() === email.toLowerCase()
);

if (!authUser) {
  console.log('User not found in auth.users:', email);
  // Return success to prevent enumeration
  return new Response(
    JSON.stringify({ success: true, message: "If an account exists, a reset link has been sent" }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
}

// Get additional profile data for personalization (optional)
const { data: userProfile } = await supabaseClient
  .from('user_profiles')
  .select('first_name, last_name, company_id')
  .eq('user_id', authUser.id)
  .single();

// Use auth user ID and profile data for the reset
const userId = authUser.id;
const firstName = userProfile?.first_name || authUser.user_metadata?.first_name || 'there';
const lastName = userProfile?.last_name || authUser.user_metadata?.last_name || '';
const companyId = userProfile?.company_id || null;
```

Then update the rest of the function to use these variables instead of `userProfile.user_id`, etc.

---

## Why This Works

| Source | What it contains |
|--------|-----------------|
| `auth.users` | All users with their email (always populated) |
| `user_profiles` | Additional profile data (email sometimes null) |

By querying `auth.users` via Admin API first, we guarantee we find the user regardless of whether their email is in `user_profiles`.

---

## Flow After Fix

```text
User enters email "vida6ix@gmail.com"
        │
        ▼
Edge function calls auth.admin.listUsers()
        │
        ▼
Finds user in auth.users (always has email)
        │
        ▼
Gets profile data from user_profiles (for name)
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
| Looks up by email in `user_profiles` | Looks up by email in `auth.users` |
| Fails for 74 users with null email | Works for all 164 users |
| Super admin can't reset password | Super admin can reset password ✓ |
