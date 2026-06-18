# Web Push notifications — one-time setup

The code is in place. To turn it on, do these 5 steps (once).

## 1. Generate VAPID keys
```bash
npx web-push generate-vapid-keys
```
Copy the **Public Key** and **Private Key** it prints.

## 2. Create the subscriptions table
Open the Supabase **SQL editor** and run the contents of
[`web_push_subscriptions_migration.sql`](./web_push_subscriptions_migration.sql).

## 3. Set the edge-function secrets
```bash
supabase secrets set \
  VAPID_PUBLIC_KEY="<public key from step 1>" \
  VAPID_PRIVATE_KEY="<private key from step 1>" \
  VAPID_SUBJECT="mailto:you@yourcompany.com"
```

## 4. Deploy the edge function
```bash
supabase functions deploy send-push
```
(Keep JWT verification on — the function authorizes the caller itself: only
admin/foreman/management/super_admin may notify, and only users in their own
company. `supabase.functions.invoke` sends the caller's token automatically.)

## 5. Add the public key to the frontend build
Set this env var in your hosting/deploy environment (Vercel/Lovable) **and rebuild**:
```
VITE_VAPID_PUBLIC_KEY=<public key from step 1>
```
> Until this is set, the "Enable notifications" toggle stays hidden (the app
> can't subscribe without the public key). It must be the **same** public key as
> the one in the edge-function secrets.

---

## What works once set up
- Employees tap **Enable notifications** on the Time Clock → their device subscribes.
- When an admin/foreman/manager **approves or declines** a weekly timesheet, that
  employee gets a push ("Timesheet approved ✅" / "Timesheet needs changes") that
  deep-links to **My Reports**.

## Extending it
`notifyUsers(userIds, title, body, url?, tag?)` in `src/lib/push/notify.ts` sends any
push from a client action. Add calls wherever you want (task assigned, material
request decided, etc.).

## Follow-up: server-driven clock-out reminders
This repo already has a `daily-notification-checks` / `send-reminders` scheduled
job pattern. A scheduled function can query open timesheets older than N hours and
call the same `send-push` logic to remind crews to clock out even when the app is
closed — a natural next step on top of this foundation.

## Note on translations
Push titles/bodies are currently English. To localize per recipient, store each
user's language (e.g. on `user_profiles`) and have `send-push` pick the matching
copy before sending.
