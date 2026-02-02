

# Fix: Enable Lovable AI for Receipt Extraction

## Problem Identified

From the edge function logs:
```
LOVABLE_API_KEY not configured
```

The `receipt-extract` edge function requires access to the Lovable AI Gateway to analyze receipt images, but the `LOVABLE_API_KEY` secret is not configured.

## Current Secrets
- GOOGLE_MAPS_API_KEY ✓
- RESEND_API_KEY ✓
- STRIPE_SECRET_KEY ✓
- STRIPE_WEBHOOK_SECRET ✓
- **LOVABLE_API_KEY** ✗ (Missing)

---

## Solution

Enable Lovable AI on this project. This will automatically provision the `LOVABLE_API_KEY` secret that the edge function needs.

---

## Steps

1. **Enable Lovable AI**: I'll use the connector tool to enable Lovable AI on this project
2. **No code changes needed**: The edge function is already written correctly to use `LOVABLE_API_KEY`
3. **Test**: After enabling, the receipt scanning should work

---

## What Happens After Enabling

```text
User uploads receipt image
        │
        ▼
Edge function: receipt-extract
        │ Now has LOVABLE_API_KEY ✓
        ▼
Calls Lovable AI Gateway (Gemini)
        │ Analyzes the receipt image
        ▼
Returns extracted data
        │ vendor, date, amount, category
        ▼
Review step shows pre-filled form ✓
```

---

## No Code Changes Required

The `receipt-extract` edge function is already implemented correctly:

```typescript
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
if (!LOVABLE_API_KEY) {
  console.error('LOVABLE_API_KEY not configured');
  return new Response(
    JSON.stringify({ error: 'AI service not configured' }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

Once the secret is available, the function will work as designed.

