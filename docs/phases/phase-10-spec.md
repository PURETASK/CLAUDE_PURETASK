# Phase 10 — Polish & Marketing

## Goal

Launch-ready polish: global error/loading/404 states, real marketing landing pages, email notifications for key booking events, and settings cleanup.

## Scope

### 10.1 — Error / loading / not-found states

Global safety net so no user hits a blank screen:

- `src/app/not-found.tsx` — branded 404 with nav back home
- `src/app/(app)/error.tsx` — app error boundary with "Try again" button
- `src/app/(app)/loading.tsx` — app-shell loading skeleton (spinner + pulse bars)
- Route-level `loading.tsx` for: `/app/bookings`, `/app/cleaners`, `/app/cleaner`

### 10.2 — Marketing site

Replace the Phase 1 smoke-test root page with a real landing page. New route group `(marketing)` with its own header/footer layout.

**Pages:**
- `/` — Hero, how it works (3 steps), trust signals (background checks, tier system, photo proof), CTA
- `/how-it-works` — Expanded 6-step flow for both customers and cleaners
- `/faq` — Frequently asked questions (pricing, trust, cancellation, payout)
- `/pricing` — Transparent fee table (tier commission rates, platform fee, payout schedule)
- `/for-cleaners` — Cleaner recruitment: earnings calculator, tier benefits, apply CTA

**Shared marketing layout:** sticky nav with logo + "Sign in" + "Get started" buttons; footer with links.

### 10.3 — Email notifications (Resend)

Install `resend`. Fire-and-forget emails on key server-action side effects.

**Emails sent:**

| Event | Recipient | Subject |
|---|---|---|
| Cleaner accepts booking | Customer | Your cleaning is confirmed |
| Booking created (new request) | Cleaner | New booking request |
| Cleaner marks job complete | Customer | Your cleaner finished — please approve |
| Dispute filed | Cleaner | A customer filed a dispute |
| Dispute response received | Customer | Your cleaner responded to your dispute |
| Payout initiated | Cleaner | Your payout is on its way |

Simple HTML strings — no React Email dependency. All emails include booking number + deep link.

`RESEND_API_KEY` added to env schema (optional, silently skipped if missing).

### 10.4 — Settings polish

- Fix Payment Methods stub card in `/settings` → real link to `/app/settings/payment-methods`
- Notifications page at `/settings/notifications` — email on/off toggles stored in `customer_profiles` JSON or simple boolean columns (use a JSON preferences object on the existing profile row)
- Fix layout nav link: "Settings" → `/settings` (not `/app/settings` which redirects anyway)
- Cleaner settings page at `/app/cleaner/settings`:
  - Toggle `instant_payout_enabled`
  - Edit bio
  - View/update hourly rates (display only for Phase 10)

### 10.5 — SEO & metadata

- `export const metadata` on all marketing pages (title, description, OpenGraph)
- `src/app/sitemap.ts` — static routes sitemap
- `src/app/robots.ts` — allow crawl of marketing, disallow app

## What's NOT in Phase 10

- Push notifications (requires APNS/FCM setup)
- SMS notifications (Twilio, deferred)
- City landing pages (12 NorCal SEO pages — post-launch)
- Full first-time tour/walkthrough UI (WF 48)
- Two-factor auth
- Real-time in-app notifications

## Completion criteria

- [x] 404 / error / loading states exist at app level
- [x] `/` is a real landing page, not the smoke test
- [x] `/how-it-works`, `/faq`, `/pricing`, `/for-cleaners` all render
- [x] Email sent when cleaner accepts booking (verifiable in Resend dashboard)
- [x] Payment Methods card in settings links to real page
- [x] `/settings/notifications` renders with toggles
- [x] `/app/cleaner/settings` renders with instant payout toggle
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test` all pass
