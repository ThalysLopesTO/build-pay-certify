

# Fix Password Reset CORS Headers

## Problem Identified

The password reset is still failing because **both edge functions have incorrect CORS headers**. The Supabase JavaScript client sends additional headers (`x-client-info`, `apikey`) that are being rejected by the edge functions.

### Current CORS Headers (Broken)
```typescript
'Access-Control-Allow-Headers': 'Content-Type, Authorization'
```

### Required CORS Headers
```typescript
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
```

---

## Root Cause

When calling `supabase.functions.invoke()`, the Supabase client automatically adds:
- `apikey` - The anon/public key
- `x-client-info` - Client library version info
- `authorization` - Auth token (if logged in)
- `content-type` - For the JSON body

The edge functions are rejecting these headers in the CORS preflight response, causing the browser to block the actual request.

---

## Changes Required

### 1. Update `supabase/functions/send-password-reset/index.ts`

**Lines 5-9:** Replace the CORS headers:

```typescript
// BEFORE
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// AFTER
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

---

### 2. Update `supabase/functions/reset-password/index.ts`

**Lines 4-8:** Replace the CORS headers:

```typescript
// BEFORE
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// AFTER
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/send-password-reset/index.ts` | Update CORS headers (lines 5-9) |
| `supabase/functions/reset-password/index.ts` | Update CORS headers (lines 4-8) |

---

## After Deployment

Once these changes are deployed:

1. User clicks "Forgot Password"
2. Enters email address
3. `send-password-reset` edge function accepts the request (CORS passes)
4. Branded email sent via Resend
5. User clicks link in email
6. `reset-password` edge function accepts the new password (CORS passes)
7. Password updated successfully

---

## Summary

| Before | After |
|--------|-------|
| CORS blocking Supabase client headers | All required headers allowed |
| 500 error on password reset | Successful password reset flow |

