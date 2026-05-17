# Secrets — add when you are ready

PureTask is built so you can **run and develop with only Supabase** configured. Everything else is optional until you turn on payments, background checks, email, etc.

---

## Quick start (minimum)

1. Copy env file:
   ```bash
   pnpm setup:env
   ```
2. Edit **`.env.local`** and set only these four (from your Supabase project → Settings → API):

   | Variable | Required |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Yes |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
   | `SUPABASE_SERVICE_ROLE_KEY` | Yes |
   | `NEXT_PUBLIC_SITE_URL` | Yes (`http://localhost:3000` locally) |

3. Apply migrations to your Supabase DB (`db/migrations/` in order).
4. Run:
   ```bash
   pnpm dev
   ```

You can sign up, onboard, browse (limited without Maps), manage profile/addresses, and use support — **without Stripe, Checkr, or email**.

Check status anytime:

- App: **Settings → Integrations** (`/app/settings/integrations`)
- Terminal: `pnpm integrations:check`

---

## What each secret unlocks

| Variable(s) | Unlocks | Safe to skip until |
| --- | --- | --- |
| **Supabase** (4 vars above) | Auth, DB, app boot | Never — required |
| `STRIPE_SECRET_KEY` + `STRIPE_PUBLISHABLE_KEY` | Cards, bookings charge, Connect, Identity | You test booking/payout |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | Connect account status updates | Stripe Connect onboarding |
| `STRIPE_IDENTITY_WEBHOOK_SECRET` | Identity verification status | Cleaner identity step |
| `CHECKR_API_KEY` | Create background check candidates | Cleaner apply + Checkr |
| `CHECKR_WEBHOOK_SECRET` | Checkr status webhooks | Checkr reports completing |
| `TAX_ENCRYPTION_KEY` (64 hex chars) | Encrypted cleaner SSN storage | Cleaner tax settings |
| `CRON_SECRET` | `/api/cron/*` jobs | Auto-approve, payouts, reliability cron |
| `GOOGLE_MAPS_API_KEY` | Geocoding + distance browse | Discovery in a real metro |
| `RESEND_API_KEY` + `RESEND_FROM_EMAIL` | Transactional email | Email notifications |
| `NEXT_PUBLIC_VAPID_*` + `VAPID_PRIVATE_KEY` + `VAPID_EMAIL` | Web push | Push notifications |
| `TWILIO_*` | SMS | SMS notifications |

Full template: **`.env.example`**. Staging checklist: **`docs/v1-staging-env-checklist.md`**.

---

## Generating keys

**Tax encryption** (one per environment; store in secret manager):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Web Push VAPID:**

```bash
npx web-push generate-vapid-keys
```

**Cron:** any long random string (same value in Vercel env + cron `Authorization` / `x-cron-secret` headers).

---

## Webhook URLs (after deploy)

Base = your `NEXT_PUBLIC_SITE_URL`:

| Service | Path |
| --- | --- |
| Stripe Connect | `/api/webhooks/stripe-connect` |
| Stripe Identity | `/api/webhooks/stripe-identity` |
| Checkr | `/api/webhooks/checkr` |

If secrets are missing, these routes return **503** (not configured) instead of failing silently.

---

## V1 full test

When you are ready to validate the marketplace path, fill every row in `docs/v1-staging-env-checklist.md` and run `docs/v1-staging-e2e-checklist.md`. The Integrations page should show **V1 E2E ready**.

---

## Order we recommend adding secrets

1. Supabase (dev)
2. Stripe test mode + webhooks (booking + Connect)
3. Checkr sandbox + webhook
4. `TAX_ENCRYPTION_KEY` (cleaner tax step)
5. `CRON_SECRET` + Vercel crons
6. Google Maps (discovery)
7. Resend → VAPID → Twilio (notifications polish)
