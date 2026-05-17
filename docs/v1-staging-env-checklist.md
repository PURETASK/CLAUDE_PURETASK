# V1 Staging — Environment & Integration Checklist

Use this when configuring **staging** (Vercel + Supabase project). Copy `.env.example` → Vercel env vars. Mark each row when verified.

**Related:** [v1-staging-e2e-checklist.md](./v1-staging-e2e-checklist.md) (user journeys)

---

## Required (app will not start without these)

Validated in `src/lib/env.ts` at runtime.

| Variable | Where to get it | Verified |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | ☐ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same | ☐ |
| `SUPABASE_SERVICE_ROLE_KEY` | Same (server only; never expose to client) | ☐ |
| `NEXT_PUBLIC_SITE_URL` | Staging URL, e.g. `https://staging.puretask.co` | ☐ |

**Migrations:** All files in `db/migrations/` applied to staging DB in filename order.

---

## V1 integrations (required for full E2E)

| Variable | Enables | Verified |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Charges, Connect | ☐ |
| `STRIPE_PUBLISHABLE_KEY` | Client payment UI | ☐ |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | Connect account + payment events | ☐ |
| `STRIPE_IDENTITY_WEBHOOK_SECRET` | Cleaner identity verification | ☐ |
| `CHECKR_API_KEY` | Background checks | ☐ |
| `CHECKR_WEBHOOK_SECRET` | Checkr status updates | ☐ |
| `CRON_SECRET` | `/api/cron/*` auth | ☐ |
| `TAX_ENCRYPTION_KEY` | Cleaner tax ID storage (32-byte hex) | ☐ |

Generate tax key (once per environment; store in secret manager):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Webhook endpoints (register in provider dashboards)

Base URL = `NEXT_PUBLIC_SITE_URL`

| Provider | Endpoint | Secret env |
| --- | --- | --- |
| Stripe Connect | `/api/webhooks/stripe-connect` | `STRIPE_CONNECT_WEBHOOK_SECRET` |
| Stripe Identity | `/api/webhooks/stripe-identity` | `STRIPE_IDENTITY_WEBHOOK_SECRET` |
| Checkr | `/api/webhooks/checkr` | `CHECKR_WEBHOOK_SECRET` |

Use Stripe CLI for local webhook forwarding during dev.

---

## Cron jobs (Vercel Cron or external scheduler)

All require `CRON_SECRET` in the deployment.

| Route | Method | Header | Purpose |
| --- | --- | --- | --- |
| `/api/cron/auto-approve` | GET | `Authorization: Bearer <CRON_SECRET>` | Auto-approve stale jobs |
| `/api/cron/weekly-payout` | POST | `x-cron-secret: <CRON_SECRET>` | Weekly cleaner payouts |
| `/api/cron/nightly-reliability` | POST | `x-cron-secret: <CRON_SECRET>` | Reliability snapshots |

---

## Recommended for V1 (degraded mode if missing)

| Variable | Enables | If missing |
| --- | --- | --- |
| `GOOGLE_MAPS_API_KEY` | Address geocoding, distance browse | Manual lat/lng or limited discovery |
| `RESEND_API_KEY` + `RESEND_FROM_EMAIL` | Transactional email | In-app notifications only |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` + `VAPID_EMAIL` | Web push | No browser push |
| `TWILIO_*` | SMS notifications | No SMS |

---

## Admin bootstrap

| Step | Verified |
| --- | --- |
| Create admin user in Supabase Auth | ☐ |
| Row in `admin_profiles` + `users.primary_role = 'admin'` | ☐ |
| `is_admin()` returns true for that user (migration 0013) | ☐ |

---

## Smoke commands (local or CI)

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

Production build (needs valid required env):

```bash
pnpm build
```
