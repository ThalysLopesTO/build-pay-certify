
# Fix Stripe Connect Test/Live Mode Account ID Separation

## Problem Summary

The Stripe Connect integration is failing in LIVE mode because:

1. **Single Column Issue**: The `company_settings` table stores only one column: `stripe_connect_account_id`
2. **Mode Mismatch**: This column was populated with TEST mode account IDs (e.g., `acct_1xyz...`) during development
3. **Cross-Mode Failure**: When switching to LIVE mode (`STRIPE_CONNECT_MODE=live`), the backend attempts to use these TEST account IDs against the LIVE Stripe API, which returns "account not found" errors
4. **Global Impact**: This affects ALL companies because they all have TEST-mode account IDs stored

---

## Solution Overview

Implement environment-specific account ID storage and retrieval across all Stripe Connect edge functions.

---

## Changes Required

### 1. Database Migration

Add two new columns to `company_settings`:

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `stripe_connect_account_id_test` | `text` | YES | Store TEST mode Connect account ID |
| `stripe_connect_account_id_live` | `text` | YES | Store LIVE mode Connect account ID |

**Note**: Keep existing `stripe_connect_account_id` for backward compatibility (can be deprecated later).

```sql
ALTER TABLE company_settings
ADD COLUMN stripe_connect_account_id_test TEXT,
ADD COLUMN stripe_connect_account_id_live TEXT;
```

---

### 2. Edge Function Updates

#### 2.1 Shared Config Helper (`supabase/functions/_shared/stripeConnectConfig.ts`)

Add a utility function to get the correct column name based on mode:

```typescript
export function getAccountIdColumn(mode: 'test' | 'live'): string {
  return mode === 'live' 
    ? 'stripe_connect_account_id_live' 
    : 'stripe_connect_account_id_test';
}
```

---

#### 2.2 `stripe-connect-onboarding/index.ts`

**Current Behavior** (lines 63-77):
- Reads from `stripe_connect_account_id`
- Saves new account to `stripe_connect_account_id`

**New Behavior**:
1. Read the mode-specific column based on `STRIPE_CONNECT_MODE`
2. If null → create new Stripe Express account
3. Save to the mode-specific column only
4. Add "account not found" error handling to auto-recreate if Stripe returns invalid account

**Changes**:
- Line 65: Update SELECT to include both `_test` and `_live` columns
- Line 77: Read from mode-specific column
- Lines 100-104: Write to mode-specific column
- Add try/catch around `accountLinks.create` to handle stale account IDs

---

#### 2.3 `stripe-connect-status/index.ts`

**Current Behavior** (lines 63-94):
- Reads `stripe_connect_account_id`
- Calls `stripe.accounts.retrieve()`
- Throws error if account not found

**New Behavior**:
1. Read mode-specific column
2. If Stripe returns "account not found" → return `connected: false` (graceful degradation)
3. Update logging to show which column is being used

**Changes**:
- Line 65: Update SELECT to include both `_test` and `_live` columns
- Line 74: Check mode-specific column for null
- Line 94: Wrap in try/catch for Stripe errors
- Return `connected: false` instead of throwing on missing account

---

#### 2.4 `stripe-create-invoice-checkout/index.ts`

**Current Behavior** (lines 88-103):
- Reads `stripe_connect_account_id`
- Uses it as `transfer_data.destination`

**New Behavior**:
1. Read mode-specific column
2. Validate account exists in current mode before processing

**Changes**:
- Line 90: Update SELECT to include both `_test` and `_live` columns
- Line 103: Check mode-specific column

---

#### 2.5 `stripe-connect-webhook/index.ts`

This function doesn't directly read account IDs from `company_settings` - it processes incoming webhook events. No changes needed as it gets account info from the Stripe event payload.

---

#### 2.6 `verify-invoice-payment/index.ts`

This function doesn't read the Connect account ID. It only retrieves checkout session/payment intent status. No changes needed.

---

### 3. Frontend TypeScript Types

Update `src/hooks/useCompanySettings.ts` interface (around line 10):

```typescript
export interface CompanySettings {
  // ... existing fields ...
  stripe_connect_account_id: string | null; // Legacy (keep for now)
  stripe_connect_account_id_test: string | null; // NEW
  stripe_connect_account_id_live: string | null; // NEW
  // ... rest of fields ...
}
```

---

## Implementation Order

```text
1. Database Migration
   ├── Add stripe_connect_account_id_test column
   └── Add stripe_connect_account_id_live column

2. Shared Helper Update
   └── Add getAccountIdColumn() function

3. Edge Function Updates (can be parallel)
   ├── stripe-connect-onboarding (read/write mode-specific)
   ├── stripe-connect-status (read mode-specific + graceful error)
   └── stripe-create-invoice-checkout (read mode-specific)

4. Frontend Type Update
   └── Add new fields to CompanySettings interface
```

---

## Logging Enhancements

Each edge function will log:
- Current Stripe mode (TEST/LIVE)
- Which column is being read/written
- Account ID prefix only (e.g., "acct_1xyz...") - never full ID
- Clear indication when creating new account vs. reusing existing

Example log output:
```
[STRIPE-CONNECT-ONBOARDING] Mode: LIVE
[STRIPE-CONNECT-ONBOARDING] Reading from: stripe_connect_account_id_live
[STRIPE-CONNECT-ONBOARDING] Account ID: null (will create new)
[STRIPE-CONNECT-ONBOARDING] Created new account: acct_1ABC... (LIVE)
[STRIPE-CONNECT-ONBOARDING] Saved to: stripe_connect_account_id_live
```

---

## Files to Modify

| File | Changes |
|------|---------|
| Database | Add 2 new columns to `company_settings` |
| `supabase/functions/_shared/stripeConnectConfig.ts` | Add `getAccountIdColumn()` helper |
| `supabase/functions/stripe-connect-onboarding/index.ts` | Mode-aware read/write logic |
| `supabase/functions/stripe-connect-status/index.ts` | Mode-aware read + graceful error handling |
| `supabase/functions/stripe-create-invoice-checkout/index.ts` | Mode-aware read |
| `src/hooks/useCompanySettings.ts` | Add new TypeScript interface fields |

---

## What Will NOT Change

- `company_id` - untouched
- Subscription/billing logic - untouched
- `STRIPE_SECRET_KEY` (main subscription key) - untouched
- Existing `stripe_connect_account_id` column - kept for backward compatibility
- Webhook handling - no changes needed

---

## Expected Outcome

| Scenario | Before | After |
|----------|--------|-------|
| LIVE mode, no LIVE account | 400 error (TEST acct not found) | Creates new LIVE account |
| TEST mode, no TEST account | May reuse wrong acct | Creates new TEST account |
| Switch modes | Fails with account mismatch | Seamlessly uses correct account |
| Status check on missing acct | Throws hard error | Returns `connected: false` |
