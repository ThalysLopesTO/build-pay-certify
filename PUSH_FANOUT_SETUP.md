# Push on every notification — setup (Supabase dashboard)

This makes a push fire on **every** new row in `notifications` (reports, material
requests, certs, bills, invoices, etc. — for admin/foreman/manager) and every new
`chat_messages` row (for everyone in the conversation). Builds on the Web Push
setup you already did (VAPID keys + `push_subscriptions`).

## 1. Pick a webhook secret
Make up a long random string (e.g. from a password generator) — call it
`PUSH_WEBHOOK_SECRET`. You'll paste the **same** value in two places below.

## 2. Add it as an edge-function secret
Project Settings → **Edge Functions → Secrets** →
https://supabase.com/dashboard/project/qsqjwpajvcmahoamwwww/settings/functions
Add: `PUSH_WEBHOOK_SECRET` = your random string.

## 3. Deploy the `push-fanout` function
Edge Functions → **Create a function** named **`push-fanout`** → paste the full
contents of `supabase/functions/push-fanout/index.ts` → **Deploy**.
**Turn Verify JWT OFF** for this one (the Database Webhook doesn't send a user
token — the `x-push-secret` header is its auth).
Its URL will be:
```
https://qsqjwpajvcmahoamwwww.supabase.co/functions/v1/push-fanout
```

## 4. Create TWO Database Webhooks
Database → **Webhooks** → **Create a new hook** (do this twice).

**Webhook A — notifications**
- Name: `push_on_notification`
- Table: `public.notifications`
- Events: **Insert** only
- Type: **HTTP Request**, Method **POST**
- URL: `https://qsqjwpajvcmahoamwwww.supabase.co/functions/v1/push-fanout`
- HTTP Headers: add one →  `x-push-secret` : `<your PUSH_WEBHOOK_SECRET>`

**Webhook B — chat messages**
- Name: `push_on_chat_message`
- Table: `public.chat_messages`
- Events: **Insert** only
- Same Type/Method/URL/header as Webhook A.

> Supabase enables the needed `pg_net` extension automatically when you create
> the first webhook.

## Done — how it behaves
- Anyone gets a chat message → push "Sender name: message" (opens the app).
- A new admin/foreman/manager notification (report submitted, material request,
  cert expiring, bill due, etc.) → push with that notification's title/description,
  deep-linking to the right screen.
- Timesheet approve/decline already pushes the employee (from the app directly).

## Test
1. Open the app as user A and user B (different accounts) → both **Enable
   notifications**.
2. From A, send B a **chat message** → B's device should get a push within seconds.
3. Have an employee **submit a report / material request** → the admins/foremen/
   managers who'd see that notification get a push.

## Troubleshooting
- No push? Open Supabase → Edge Functions → **`push-fanout` → Logs** and trigger
  again. `401 Unauthorized` = the `x-push-secret` header doesn't match the secret.
  `Missing VAPID keys` = the VAPID secrets aren't set on this function.
- Confirm the recipient actually has a row in `push_subscriptions`.
