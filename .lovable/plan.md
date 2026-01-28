
# Fix Password Reset - getUserByEmail Error

## Problem Identified

The edge function is failing with:
```
TypeError: supabaseClient.auth.admin.getUserByEmail is not a function
```

The method `getUserByEmail` does **not exist** in the Supabase Admin Auth API. This was causing the 500 Internal Server Error.

---

## Solution

Replace the non-existent `getUserByEmail` call with a direct query to the `user_profiles` table, which already has an `email` column.

---

## Changes Required

### File: `supabase/functions/send-password-reset/index.ts`

**Replace lines 33-53** - Change from using auth.admin API to querying user_profiles directly:

```typescript
// BEFORE (broken)
const { data: authUserData, error: authError } = await supabaseClient.auth.admin.getUserByEmail(email);

if (authError || !authUserData?.user) {
  console.log('User not found in auth.users:', email);
  return new Response(
    JSON.stringify({ success: true, message: "If an account exists, a reset link has been sent" }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
}

const { data: userProfile, error: profileError } = await supabaseClient
  .from('user_profiles')
  .select('user_id, first_name, last_name, role, company_id')
  .eq('user_id', authUserData.user.id)
  .single();
```

```typescript
// AFTER (working)
// Query user_profiles directly by email (no auth admin API needed)
const { data: userProfile, error: profileError } = await supabaseClient
  .from('user_profiles')
  .select('user_id, first_name, last_name, role, company_id, email')
  .eq('email', email.toLowerCase())
  .single();

if (profileError || !userProfile) {
  console.log('User not found in user_profiles:', email);
  // Return success regardless to prevent account enumeration
  return new Response(
    JSON.stringify({ success: true, message: "If an account exists, a reset link has been sent" }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
}
```

---

## Why This Works

1. The `user_profiles` table already stores user emails
2. We can look up users directly by email without needing the Admin Auth API
3. The `user_id` in `user_profiles` corresponds to the auth user ID, which we can use to update the password
4. This is simpler and avoids the problematic admin API call

---

## Flow After Fix

```text
User enters email in "Forgot Password"
        │
        ▼
send-password-reset edge function
        │
        ▼
Query user_profiles by email
        │
    ┌───┴───┐
    │       │
  Found   Not Found
    │       │
    ▼       ▼
Generate   Return "success"
token      (prevent enumeration)
    │
    ▼
Store in password_reset_tokens
    │
    ▼
Send branded email via Resend
    │
    ▼
Return success
```

---

## Summary

| Before | After |
|--------|-------|
| Uses non-existent `getUserByEmail` method | Queries `user_profiles` table directly |
| 500 Internal Server Error | Working password reset flow |
| Two database calls (auth + profiles) | Single database call |
