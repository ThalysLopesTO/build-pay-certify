

# Fix Password Reset - Custom Email via Resend

## Problem Analysis

The "Forgot Password" feature is failing with error **"Failed to send reset email"** because:

1. **Current Implementation**: `ForgotPasswordForm.tsx` uses `supabase.auth.resetPasswordForEmail()` - Supabase's built-in email service
2. **Error**: Supabase's SMTP returns `535 Authentication credentials invalid` - their default email service is not configured/working
3. **Good News**: A complete custom solution already exists but isn't connected:
   - `send-password-reset` edge function (sends branded emails via Resend)
   - `password_reset_tokens` table (stores secure tokens)
   - `reset-password` edge function (verifies token and updates password)

---

## Solution

Connect the existing custom password reset system to the frontend. Two files need updates:

---

## Changes Required

### 1. Update `ForgotPasswordForm.tsx`

**Current**: Calls `supabase.auth.resetPasswordForEmail()` (Supabase's native email)
**New**: Calls the `send-password-reset` edge function (custom Resend email)

```typescript
// BEFORE
const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
  redirectTo: `${window.location.origin}/reset-password`
});

// AFTER
const { data, error } = await supabase.functions.invoke('send-password-reset', {
  body: { email: email.toLowerCase() }
});
```

This will send a beautifully branded StackBuild email via Resend with a custom reset link.

---

### 2. Update `ResetPassword.tsx`

**Current**: Uses Supabase session-based flow (checks for recovery session)
**New**: Uses custom token-based flow (reads `?token=` from URL, calls `reset-password` edge function)

Changes needed:
- Read `token` from URL search params instead of checking for Supabase session
- Call `reset-password` edge function with `{ token, newPassword }` instead of `supabase.auth.updateUser()`
- Handle token validation errors gracefully

**Key code change**:
```typescript
// BEFORE
const { error } = await supabase.auth.updateUser({ password });

// AFTER
const { data, error } = await supabase.functions.invoke('reset-password', {
  body: { token, newPassword: password }
});
```

---

### 3. Expand Role Access in Edge Function

The current `send-password-reset` function only allows admin/super_admin/management roles. Need to expand to allow ALL users (employees, foremen) to reset their passwords.

**Change line 54**:
```typescript
// BEFORE
.in('role', ['admin', 'super_admin', 'management'])

// AFTER
// Remove role filter - all users can reset their password
.eq('user_id', authUserData.user.id)
```

---

## Flow After Fix

```text
User clicks "Forgot Password"
        │
        ▼
Enters email → ForgotPasswordForm
        │
        ▼
Calls send-password-reset edge function
        │
        ▼
Edge function:
  ├── Looks up user in auth.users
  ├── Checks user_profiles (any role allowed)
  ├── Creates token in password_reset_tokens
  └── Sends branded email via Resend
        │
        ▼
User clicks link in email
  → https://app.stackbuild.ca/reset-password?token=abc123
        │
        ▼
ResetPassword page reads token from URL
        │
        ▼
User enters new password → Calls reset-password edge function
        │
        ▼
Edge function:
  ├── Validates token (not expired, not used)
  ├── Updates password via admin API
  └── Marks token as used
        │
        ▼
Success → Redirects to login
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ForgotPasswordForm.tsx` | Call `send-password-reset` edge function instead of Supabase native |
| `src/pages/ResetPassword.tsx` | Use token-based flow with `reset-password` edge function |
| `supabase/functions/send-password-reset/index.ts` | Remove role restriction to allow all users |

---

## What Already Works

These components are already built and working:
- `send-password-reset` edge function (beautiful branded email template)
- `reset-password` edge function (token validation, password update)
- `password_reset_tokens` table (secure token storage)
- `RESEND_API_KEY` secret (already configured)

---

## Summary

| Before | After |
|--------|-------|
| Uses Supabase's broken SMTP | Uses Resend (already configured) |
| Generic email (if it worked) | Beautiful StackBuild branded email |
| Only admin/management roles | All users can reset password |
| Session-based flow | Secure token-based flow |

