# PureTask — V1 Web Launch Scope

**Status:** Locked for engineering focus (2026-05-16)  
**Goal:** Ship a trustworthy private beta in one metro — not “complete Phase 10.”

---

## Success definition

V1 is done when **one staging run** of [v1-staging-e2e-checklist.md](./v1-staging-e2e-checklist.md) passes with **zero P0 blockers** (auth, booking, payment authorization/capture path, cleaner payout line item creation, admin approve application, basic dispute or support ticket).

---

## In scope (must work)

### Customer

| Flow | Routes / modules |
| --- | --- |
| Sign up, email verify, role = customer | `/auth/*`, `/onboarding/role-select` |
| Profile + addresses (geocode when Maps key set) | `/app/settings`, `src/features/customer/` |
| Browse cleaners in service area | `/app/cleaners`, `src/features/discovery/` |
| Book job (create → pending/accepted states) | `/app/bookings`, `src/features/booking/` |
| Pay (Stripe payment method + charge path) | `src/features/payments/` |
| Job day: messages, tracking if built | `/app/bookings/[id]/*` |
| Approve work / auto-approve cron | approve actions + `/api/cron/auto-approve` |
| Review + tip (optional but in scope) | reviews + payments actions |
| File dispute (minimal path) | `/app/bookings/[id]/dispute` |
| Support ticket | `/app/support` |

### Cleaner

| Flow | Routes / modules |
| --- | --- |
| Apply (multi-step draft → submit) | `/cleaner/apply`, `/cleaners/apply` |
| Checkr + Stripe Identity + Connect | checkr/, identity/, connect/ |
| Admin approves application | `/admin/applications` |
| Availability + accept/decline jobs | `/app/cleaner/availability`, booking actions |
| Active job (photos, on-my-way, complete) | `/cleaner/jobs/*`, `booking/actions/job-flow.ts` |
| Earnings / payout visibility | `/app/cleaner/earnings`, weekly payout cron |

### Admin

| Flow | Routes / modules |
| --- | --- |
| Application queue decision | `/admin/applications` |
| Dispute resolution (Tier 2 minimum) | `/admin/disputes` |
| Support reply / resolve | `/admin/support` |
| Refund when required | `admin/actions/refund-actions.ts` |

### Platform

| Item | Notes |
| --- | --- |
| RLS on all user tables | `db/migrations/` |
| Webhooks: Stripe Connect, Identity, Checkr | `/api/webhooks/*` |
| Cron: auto-approve, weekly payout, nightly reliability | `/api/cron/*` + `CRON_SECRET` |
| Marketing minimum | `/`, `/pricing`, `/coverage`, legal pages |
| CI | `.github/workflows/ci.yml` |

---

## Out of scope for V1 (post-launch)

See [v1-post-launch-backlog.md](./v1-post-launch-backlog.md). Summary:

- Full Phase 10 notification matrix (FCM/native push, every event type)
- Complete empty/error/loading component library (10b)
- All city × service SEO landings (10c)
- Recurring bookings as launch requirement (code exists; not gating v1)
- Favorites, waitlist polish, press kit, full help CMS
- Dedicated `src/features/trust/` module refactor
- E2E Playwright suite at scale (manual checklist gates v1; automate after)

---

## Environments

| Environment | Purpose |
| --- | --- |
| **Local** | Dev with `.env.local` from `.env.example` |
| **Staging** | Full integration test; mirrors production secrets pattern |
| **Production** | Private beta only after staging checklist green |

Configure staging using [v1-staging-env-checklist.md](./v1-staging-env-checklist.md).  
Local dev with secrets added over time: [secrets-when-ready.md](./secrets-when-ready.md).

---

## Schema source of truth

**Only** `db/migrations/*.sql` (ordered `0001` → `0016`).  
Do **not** apply SQL from `b1-b8 needs review/` — see that folder’s README.

---

## Review cadence

1. Run staging E2E checklist after any change to booking, payments, webhooks, or RLS.
2. No new feature work while **P0** items from the checklist are open.
3. Update this doc only via founder decision + `docs/puretask-decisions.md`.
