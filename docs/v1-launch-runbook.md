# V1 Launch Runbook — staging → private beta

Concrete, ordered steps to stand up **staging** and get to a green E2E run. Pairs with [v1-staging-env-checklist.md](./v1-staging-env-checklist.md) (the env grid) and [v1-staging-e2e-checklist.md](./v1-staging-e2e-checklist.md) (the journeys). This runbook adds the _do-this-in-this-order_ sequence + the exact SQL/commands.

> **Status going in:** all code-side P0s from [v1-p0-punchlist.md](./v1-p0-punchlist.md) are fixed; migrations through `0019` are applied to the current Supabase project. What's left is operational: vendor accounts + a staging environment + the manual E2E pass.

---

## 1. Vendor accounts (longest lead time — start first)

| Vendor                       | What you need                                       | Lead time                             |
| ---------------------------- | --------------------------------------------------- | ------------------------------------- |
| **Stripe** (platform)        | Account in **test mode**; Secret + Publishable keys | minutes                               |
| **Stripe Connect** (Express) | Connect enabled on the account                      | minutes (test) / 2–4 wk (live review) |
| **Stripe Identity**          | Identity enabled                                    | minutes (test)                        |
| **Checkr**                   | Sandbox account + API key                           | **4–6 wk** for production             |
| **Google Maps**              | Geocoding API key                                   | minutes                               |
| **Resend**                   | API key + a verified from-address                   | ~1 day (domain verify)                |
| Insurance partner            | Only needed for Phase 8c (post-beta)                | 4–8 wk                                |

For a **staging dry-run you can do today**, Stripe test mode + Checkr sandbox + a Maps key are enough; everything else degrades gracefully.

---

## 2. Environment variables

Set in Vercel (staging) and locally in `.env.local`. Full grid in [v1-staging-env-checklist.md](./v1-staging-env-checklist.md).

**Required (app won't boot without these):**
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`

**Required for full E2E:**
`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_CONNECT_WEBHOOK_SECRET`, `STRIPE_IDENTITY_WEBHOOK_SECRET`, `CHECKR_API_KEY`, `CHECKR_WEBHOOK_SECRET`, `CRON_SECRET`, `TAX_ENCRYPTION_KEY`

Generate the tax key once per environment:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Recommended (degrade gracefully if absent):** `GOOGLE_MAPS_API_KEY`, `RESEND_API_KEY` + `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_VAPID_*` / `VAPID_*`, `TWILIO_*`

---

## 3. Database

All migrations live in `db/migrations/` and apply in filename order (`0001` → `0019`).

- **Current Supabase project** (`hmynhxsdhpgoxucysqac`): migrations are already applied through `0019` (incl. the booking-photos bucket and the security hardening).
- **A fresh staging project:** apply `0001` → `0019` in order, then continue below.

---

## 4. Webhook endpoints (register in each provider dashboard)

Base = `NEXT_PUBLIC_SITE_URL`.

| Provider          | Endpoint                        | Secret env                       | Key events                                               |
| ----------------- | ------------------------------- | -------------------------------- | -------------------------------------------------------- |
| Stripe (platform) | `/api/webhooks/stripe-connect`  | `STRIPE_CONNECT_WEBHOOK_SECRET`  | `account.updated`, `payment_intent.*`, `charge.refunded` |
| Stripe Identity   | `/api/webhooks/stripe-identity` | `STRIPE_IDENTITY_WEBHOOK_SECRET` | `identity.verification_session.*`                        |
| Checkr            | `/api/webhooks/checkr`          | `CHECKR_WEBHOOK_SECRET`          | `report.completed`, `report.*`                           |

For local dev: `stripe listen --forward-to localhost:3000/api/webhooks/stripe-connect`.

---

## 5. Cron

Registered automatically from `vercel.json` on deploy. All require `CRON_SECRET`. After the first deploy, confirm the jobs under **Vercel → Project → Cron Jobs**. Vercel Cron always sends `GET` with `Authorization: Bearer <CRON_SECRET>` — every cron route is reachable that way (the `weekly-payout` and `nightly-reliability` routes also keep a `POST` + `x-cron-secret` entrypoint for manual/internal calls).

### Plan toggle: Hobby (active) ↔ Pro

Vercel **Hobby** allows only **2 cron jobs at daily-or-less frequency**. The repo ships two configs:

| File                          | Plan  | Crons                                                                                                   |
| ----------------------------- | ----- | ------------------------------------------------------------------------------------------------------- |
| `vercel.json` (**active**)    | Hobby | `nightly` (daily 08:00 UTC) + `weekly-payout` (Fri 20:00 UTC)                                           |
| `vercel.pro.json` (reference) | Pro   | `auto-approve` hourly · `daily-reminders` hourly · `nightly-reliability` daily · `weekly-payout` weekly |

`/api/cron/nightly` is an umbrella that runs **auto-approve + daily-reminders + nightly-reliability** in sequence, so all jobs still run on Hobby — just batched once a day instead of hourly. The individual cron routes are unchanged and still work standalone.

**To switch to Pro** (restores hourly auto-approve + reminders): upgrade the project to Pro, then copy the `crons` array from `vercel.pro.json` into `vercel.json` and redeploy. No code change — the `nightly` umbrella simply goes unused. The trade-off on Hobby: a booking auto-approves and review/imminent reminders fire in the daily 08:00 UTC sweep rather than within the hour.

---

## 6. Supabase Auth dashboard toggles (one-time)

- **Authentication → Providers → Email:** enabled + **Confirm email = ON** (the `/auth/confirm` route handles the callback).
- **Authentication → Policies:** enable **Leaked password protection** (flagged by the security advisor; dashboard-only, not a migration).

---

## 7. Admin bootstrap

`is_admin()` returns true when the signed-in user has a row in `admin_profiles`. After creating your admin user in Supabase Auth (Authentication → Users → Add user, with a confirmed email), run this in the SQL editor — replace the email:

```sql
with u as (
  select id from auth.users where email = 'admin@puretask.co'
)
insert into public.admin_profiles (user_id, permission_level)
select id, 'super' from u
on conflict do nothing;

update public.users
set primary_role = 'admin'
where id = (select id from auth.users where email = 'admin@puretask.co');
```

Verify: signed in as that user, `select public.is_admin();` returns `true`, and `/admin/*` routes load.

---

## 8. Smoke + E2E

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test   # green today
pnpm build                                                  # needs the 4 required env vars
```

Then run [v1-staging-e2e-checklist.md](./v1-staging-e2e-checklist.md) sections **A–D** with three test accounts (customer / cleaner / admin). **Any failed P0 row blocks launch** until fixed or descoped with founder sign-off.

---

## 9. Known remaining work that will affect the E2E run

These are tracked and intentionally not yet done — expect them to surface:

- **Cleaner onboarding vendor flows** (issues #27/#28/#29): the Checkr / Stripe Identity / Connect **launcher buttons are still stubs**. The server + webhook sides are correct, but a cleaner can't actually complete B4/B5/B6 until those launchers are wired to the real hosted flows. **This will block E2E section B** until done — it's the main pre-beta engineering item once accounts exist.
- **Duplicate approval/job-flow screens** (issue #34): functional + capturing, but multiple screens do the same thing; pick canonical ones before public launch.
- **DB hardening leftovers:** `extension_in_public` + the leaked-password toggle (step 6).

---

## 10. One-line status

Code-side V1 is hardened and green. The gate to a private beta is now: **vendor accounts → wire the three onboarding launchers (#27/#28/#29) → green E2E run → ship to Sacramento.**
