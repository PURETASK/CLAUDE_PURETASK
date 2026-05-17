# PureTask — Implementation Overview

_Last generated from repository inventory: 2026-05-14_

This document describes **what exists in the codebase today**: routes, feature modules, server actions, API handlers, shared libraries, database objects, and operational hooks. It is a technical inventory, not the full product vision (see `docs/PureTask_Master_Guide.md` and `docs/phases/` for roadmap and specs).

---

## 1. Product and stack (as implemented)

**PureTask** is modeled as a trust-first residential cleaning marketplace: customers discover cleaners, book jobs, pay through Stripe, and complete flows for verification, disputes, and reviews. **Cleaners** onboard through applications, Stripe Connect, identity and background checks, availability, job execution, and payouts.

**Locked stack in use:**

| Layer | Implementation |
| --- | --- |
| App | Next.js 15 App Router (`src/app/`), React 19, TypeScript strict |
| Styling | Tailwind CSS 4, global styles in `src/app/globals.css` |
| Data | Supabase Postgres with RLS; migrations in `db/migrations/` |
| Auth | Supabase Auth (email flows); session refresh in `src/lib/supabase/middleware.ts` |
| Forms | react-hook-form + zod (per feature `validation.ts` files) |
| Client cache | TanStack Query where client fetching is used |
| Payments / payouts | Stripe (`stripe` package), Connect + webhooks |
| Identity | Stripe Identity session + webhook |
| Background checks | Checkr API + webhook |
| Email / SMS / push | Resend, Twilio, Web Push (VAPID) — wired where env vars are set |

Package manager: **pnpm** only (`package.json`).

---

## 2. High-level architecture

- **Server Components by default**; `'use client'` only where interactivity requires it.
- **Server actions** (`'use server'`) in `src/features/<area>/` for mutations; many return `{ ok, error }` or similar typed results.
- **Route handlers** under `src/app/api/` for webhooks, cron-style jobs, push subscription, notifications, and milestone endpoints (not general CRUD APIs).
- **Three Supabase clients**: browser (`src/lib/supabase/browser.ts`), server/cookies (`server.ts`), middleware (`middleware.ts`), plus **admin/service-role** (`admin.ts`) for privileged server paths.
- **Environment validation** at startup: `src/lib/env.ts` (Zod). Core Supabase + site URL are required; Stripe, Checkr, cron, email, VAPID, Twilio, Google Maps are optional but enable corresponding features.

---

## 3. Routing and layouts

### 3.1 Route groups

| Group | Purpose | Notable URL prefixes |
| --- | --- | --- |
| `(marketing)` | Public marketing and SEO pages | `/`, `/pricing`, `/how-it-works`, `/coverage`, `/help`, `/trust/*`, `/cleaning/[city]/[service]`, etc. |
| `(app)` | Authenticated customer and cleaner app chrome | `/app`, `/app/bookings`, `/app/cleaners`, `/cleaner/*`, etc. |
| `(admin)` | Admin console | `/admin`, `/admin/applications`, `/admin/disputes`, etc. |
| `auth/*` | Sign-in, sign-up, password reset, verify email | `/auth/sign-in`, etc. |
| `onboarding/*` | Post-auth role selection and tours | `/onboarding/role-select`, `/onboarding/welcome`, etc. |
| `legal/*` | Legal content | e.g. `/legal/photography-policy` |
| `cleaners/apply` | Public apply entry (outside `(app)` group) | `/cleaners/apply` |

The **marketing home** is `src/app/(marketing)/page.tsx` (serves `/`).

### 3.2 Middleware (`src/middleware.ts`)

- Refreshes Supabase session via `updateSession`.
- **Unauthenticated** users hitting `/app`, `/cleaner`, `/admin`, or `/onboarding` are redirected to `/auth/sign-in?next=…`.
- **Authenticated** users on auth pages are sent to `/app`.
- **Role gating** after `user_metadata.role_confirmed`:
  - If role not confirmed, non-`/onboarding` protected routes redirect to `/onboarding/role-select`.
  - **Customers** cannot access `/app/cleaner/*` (redirect to `/app`).
  - **Cleaners** cannot access customer-only prefixes such as `/app/cleaners`, `/app/bookings`, `/app/recurring`, `/app/favorites`, `/app/waitlist`, `/app/dashboard` (redirect to `/app/cleaner`).

---

## 4. Database (schema source of truth)

All shipped schema changes belong in **`db/migrations/*.sql`** (never Studio-only edits for production intent).

### 4.1 Core domain batches (B1–B8)

These migrations define the primary tables and RLS for the product:

| Migration | Domain | Representative tables |
| --- | --- | --- |
| `0001_b1_core_identity.sql` | Identity & profiles | `users`, `customer_profiles`, `cleaner_profiles`, `admin_profiles`, `addresses`, `auth_sessions`, `customer_favorites`, `user_milestones` |
| `0002_b2_booking_lifecycle.sql` | Booking & scheduling | `services`, `bookings`, `booking_state_events`, `booking_photos`, `recurring_schedules`, `recurring_occurrences`, `availability_rules`, `time_off_blocks`, `cleaner_service_zips`, `serviced_areas` |
| `0003_b3_trust_evidence.sql` | Social proof & conflict | `messages`, `traits`, `reviews`, `review_traits`, `tips`, `disputes`, `dispute_messages`, `dispute_resolutions` |
| `0004_b4_cleaner_operations.sql` | Cleaner quality & tiers | `reliability_events`, `reliability_score_snapshots`, `tier_assignments`, `cleaner_appeals`, `badges`, `cleaner_badges`, `specialties`, `cleaner_specialties`, `cleaner_suspensions`, `customer_reliability_events` |
| `0005_b5_money.sql` | Payments & insurance artifacts | `payment_methods`, `charges`, `refunds`, `commission_records`, `payouts`, `payout_line_items`, `insurance_policies`, `stripe_webhook_events` |
| `0006_b6_platform_operations.sql` | Ops & support | `notifications`, `notification_preferences`, `notification_deliveries`, `admin_actions`, `support_tickets`, `support_ticket_messages` |
| `0007_b7_onboarding_verification.sql` | Pipeline & waitlist | `cleaner_applications`, `background_checks`, `identity_verifications`, `waitlist_signups` |
| `0008_b8_audit_fixes.sql` | Auditing / consistency fixes | (follow-up policies and fixes on above) |

### 4.2 Phase migrations (0009–0016)

Incremental behavior on top of B1–B8, including:

- **Auth sync**: trigger/function to sync `auth.users` → `public.users` (Phase 2).
- **Customer / cleaner onboarding RLS** and profile bootstrap (Phase 3 / 3a / fixes).
- **Cleaner onboarding** policies and related access (Phase 4).
- **`is_admin()`** helper, admin RLS on sensitive tables, admin profile access (Phase 4f).
- **Geocoding & discovery**: `addresses.geocoded_at`, PostGIS-related extensions (`cube`, `earthdistance`), `distance_miles()`, public read view `cleaner_profiles_public`, discovery-oriented RLS (Phase 5).
- **Waitlist** insert policy for customers (Phase 5).
- **Role confirmation** metadata support (`0016_add_role_confirmed.sql`).

Types for the database are maintained in **`src/types/database.types.ts`** (and related generated shapes). Regenerate after schema changes per `AGENTS.md`.

---

## 5. Feature modules (`src/features/`)

Each folder groups UI (where present), validation, queries, and server actions around a domain. **Barrel `index.ts` files are intentionally avoided** in features per project rules.

### 5.1 Auth (`src/features/auth/`)

- **Actions**: `signInAction`, `signUpAction`, `forgotPasswordAction`, `resetPasswordAction`, `confirmRoleAction` (role selection → metadata), `signOutAction`.
- **Components**: sign-in/up/forgot/reset forms.
- **Validation**: `validation.ts` shared with forms and actions.

### 5.2 Customer (`src/features/customer/`)

- **Actions**: profile update; address CRUD and default address; photo policy acceptance.
- **Components**: profile/address/settings UI building blocks (e.g. `ProfileForm`, `AddressList`, `PhotoPolicyForm`).
- **Geocoding**: `geocode-address-queue.ts` queues address normalization/geocode from server actions.
- **Queries/types**: customer-scoped reads.

### 5.3 Discovery & browse (`src/features/discovery/`)

- **Match scoring**: `match-score.ts` — transparent **display** scoring from distance, tier, specialties, recency, etc. (public-safe; no secret weights in API responses). Unit tests in `scoring.test.ts`.
- **Ranking**: `browse-ranking.ts` for ordering cleaners in browse UIs.
- **Actions**: `toggleFavoriteAction`, `joinWaitlistAction`.
- **Components**: `CleanerCard`, filters, tier badge, match breakdown, favorite button.

### 5.4 Booking (`src/features/booking/`)

- **Actions** (`actions.ts`): `createBookingAction` (pricing, Stripe authorization path, notifications/email hooks), `acceptBookingAction`, `declineBookingAction`, `rescheduleBookingAction`, `cancelBookingAction`.
- **Lifecycle helpers** (`actions/lifecycle.ts`): `cancelBooking`, `requestReschedule` with state guards and cancellation policy.
- **Library**: `booking-states.ts` (state machine / events via `writeBookingStateEvent`), `cancellation-policy.ts`, `pricing.ts` (+ `pricing.test.ts`), `validation.ts`.
- **Components**: booking form/card, state badges, cleaner/customer action buttons, mark complete, cancel, etc.
- **Queries**: shared loaders for bookings and profile IDs used across features.

### 5.5 Recurring bookings (`src/features/recurring/`)

- **Actions**: `createRecurringScheduleAction`, `skipOccurrenceAction`, `pauseScheduleAction`, `resumeScheduleAction`, `endScheduleAction`.

### 5.6 Payments & tips (`src/features/payments/`)

- **Actions**: add/set default/delete **payment methods**; `addTipAction`; **instant payout** request and toggle; integrates Stripe and Supabase money tables.
- **Components**: payment method card, instant payout button.
- **Queries**: payment-related reads.

### 5.7 Reviews (`src/features/reviews/`)

- **Actions**: `submitReviewAction`.
- **Components**: `ReviewForm`, `ReviewCard`.
- **Queries** and **validation**.

### 5.8 Messaging (`src/features/messaging/`)

- **Actions**: `sendMessageAction` (booking-scoped thread).
- **Components**: thread, bubbles, input.

### 5.9 Disputes & job completion (`src/features/disputes/`)

- **Actions**: `markJobCompleteAction`, `approveBookingAction`, `fileDisputeAction`, `cleanerRespondAction`, `customerAcceptResolutionAction`, `customerRejectResolutionAction`, `adminResolveDisputeAction`.
- **Components**: dispute thread, resolution UI, cleaner response form, admin resolve form, state badges.
- **Validation** for dispute payloads.

> Note: `src/features/trust/` currently holds placeholders (`.gitkeep`); trust/tier **logic** largely lives under **cleaner operations**, **discovery** match score, and **reliability** queries.

### 5.10 Cleaner application & profile (`src/features/cleaner/`)

- **Actions** (`actions.ts`): multi-step **application draft** (`createDraftAction` redirect pattern), `saveStepAction`, `submitApplicationAction`, `adminDecisionAction` (approve/reject pipeline).
- **Profile**: `profile-actions.ts` (`updateBioAction`).
- **Availability** (`availability-actions.ts`): `saveAvailabilityAction`, `addTimeOffAction`, `removeTimeOffAction`.
- **Checkr** (`checkr/`): `createCheckrCandidateAction`, consent UI, webhook handler, policy helpers.
- **Stripe Identity** (`identity/`): `createIdentitySessionAction`, launcher UI.
- **Connect** (`connect/`): `createConnectOnboardingAction` for Stripe Connect onboarding.
- **Insurance** (`insurance/`): `uploadInsuranceDocument` — Supabase Storage bucket `certificates` + `insurance_policies` row.
- **Tax** (`tax/`): `saveTaxInfo` — encrypts tax ID via `src/lib/encryption.ts`, updates `cleaner_profiles`.
- **Appeals** (`appeals/`): `submitAppeal` → `cleaner_appeals`.
- **Components**: long multi-step application wizard, tier explainer, insurance states, admin decision form, etc.
- **Queries**: cleaner-scoped reads including availability.

### 5.11 Notifications (`src/features/notifications/`)

- **Actions**: mark one / mark all read.
- **Settings**: `settings-actions.ts` (e.g. SMS preferences).
- **Queries**: inbox reads.

### 5.12 Support (`src/features/support/`)

- **Actions**: `createTicketAction`, `replyToTicketAction`, `adminReplyAction`, `resolveTicketAction`.

### 5.13 Admin (`src/features/admin/`)

- **Applications queue**: `applications/actions.ts` (`adminApplicationDecisionAction`), filters, detail views, activity-style components.
- **Refunds** (`actions/refund-actions.ts`): `adminProcessRefund` — inserts `refunds` row, writes `admin_actions` audit via `lib/audit.ts`.
- **Shared**: `AdminLayout`, KPI-style components, `NeedsAttention`, GMV sparkline, activity feed.
- **Audit**: `lib/audit.ts` + `writeAdminAction` helper.

### 5.14 Reliability (`src/features/reliability/`)

- **Queries** for customer/cleaner reliability dashboards (read models over `customer_reliability_events`, snapshots, etc.).

### 5.15 Onboarding tours (`src/features/onboarding/`)

- **Components**: e.g. customer first-time tour UI, wired to milestone APIs (see §7).

---

## 6. Shared UI and cross-cutting code

- **`src/components/ui/`** — shadcn-style primitives (managed by shadcn workflow; avoid hand-edits except upgrades).
- **`src/components/shared/`** and top-level **`src/components/`** — e.g. `NotificationBell`, service cards.
- **`src/contexts/ToastContext.tsx`** — global toast provider (wrapped in root `layout.tsx`).
- **`src/hooks/`** — e.g. `use-milestones.ts` for guided onboarding completion.
- **`src/lib/utils/`** — formatting helpers (e.g. errors per `AGENTS.md` patterns).

---

## 7. API routes (`src/app/api/`)

| Path | Role |
| --- | --- |
| `webhooks/stripe-connect/route.ts` | Stripe Connect account/payment lifecycle events → DB updates |
| `webhooks/stripe-identity/route.ts` | Stripe Identity verification outcomes |
| `webhooks/checkr/route.ts` | Checkr report/invitation updates |
| `cron/auto-approve/route.ts` | **GET** + `Authorization: Bearer CRON_SECRET` — auto-approves bookings in `awaiting_approval` past `auto_approval_due_at` |
| `cron/weekly-payout/route.ts` | **POST** + `x-cron-secret` — aggregates unpaid `payout_line_items`, creates `payouts`, Stripe transfers |
| `cron/nightly-reliability/route.ts` | **POST** + `x-cron-secret` — recomputes cleaner reliability scores from `reliability_events` + rating bonus, writes snapshots |
| `notifications/route.ts` | Server-driven notification fan-out / delivery hooks (implementation details in file) |
| `push/subscribe`, `push/unsubscribe` | Web Push subscription persistence |
| `milestones/welcome-tour`, `milestones/cleaner-tour` | Progress markers for `user_milestones` |

Cron routes expect **`CRON_SECRET`** in environment and appropriate Vercel/external scheduler configuration.

---

## 8. Shared libraries (`src/lib/`)

| Module | Responsibility |
| --- | --- |
| `env.ts` | Validated environment surface |
| `supabase/*` | Browser, server, middleware, admin clients |
| `stripe/webhooks.ts`, `stripe/connect.ts`, `stripe/identity.ts` | Stripe SDK usage for payments, Connect, Identity |
| `checkr/client.ts`, `checkr/webhooks.ts` | Checkr REST + webhook verification |
| `email/resend.ts`, `email/templates.ts` | Resend transactional email |
| `sms.ts` | Twilio SMS |
| `webpush.ts` | VAPID web push |
| `encryption.ts` | Sensitive field encryption (tax IDs) |
| `google-maps/geocoding.ts` | Address geocoding when `GOOGLE_MAPS_API_KEY` is set |
| `milestones.ts` | User milestone helpers |
| `notifications/score-templates.ts` | Copy/templates for score-related notifications |
| `assets.ts` | Static asset paths (e.g. icons for marketing) |

---

## 9. Server-only jobs

- **`src/server/jobs/backfill-geocoding.ts`** — batch/backfill geocoding for addresses (run in controlled environments).

---

## 10. SEO and global app files

- **`src/app/sitemap.ts`** — dynamic sitemap generation.
- **`src/app/error.tsx`** — route-level error UI.
- Root **`layout.tsx`** — fonts, metadata defaults, `ToastProvider`.

---

## 11. Testing

- **Vitest** (`vitest`, `@vitejs/plugin-react`, `jsdom` in devDependencies).
- **Unit tests**: `booking/pricing.test.ts`, `booking/lib/booking-states.test.ts`, `discovery/scoring.test.ts`.
- **CI**: `.github/workflows/ci.yml` — lint, typecheck, Vitest on push/PR.
- Scripts: `pnpm test`, `pnpm test:watch`, `pnpm test:coverage`.

---

## 12. V1 launch process

| Doc | Purpose |
| --- | --- |
| `docs/v1-launch-scope.md` | In/out scope for web v1 |
| `docs/v1-staging-env-checklist.md` | Secrets, webhooks, crons |
| `docs/v1-staging-e2e-checklist.md` | Manual staging QA |
| `docs/v1-post-launch-backlog.md` | Deferred work after v1 |

Reference-only: `b1-b8 needs review/README.md`, `all_wireframes_needs_review/README.md`.

---

## 13. Gaps, placeholders, and operational notes

1. **`src/features/trust/`** — reserved per `AGENTS.md` folder plan; tier/reliability/match behavior is implemented in **cleaner**, **discovery**, and **reliability** modules instead.
2. **Phase 1 smoke test**: historical docs reference `src/app/page.tsx` querying `smoke_test`; the app’s **`/`** route is now the **marketing** page. The `smoke_test` table remains optional dev-only per phase-1 docs.
3. **Third-party features** require secrets: Stripe webhooks, Checkr, Resend, Twilio, VAPID, Google Maps, and cron secret must be present for full end-to-end behavior in staging/production.
4. **Admin UI** assumes `admin_profiles` + `is_admin()` RLS paths are correctly populated for operator accounts.

---

## 14. How to keep this document accurate

After major work:

1. Add or adjust migrations only under `db/migrations/`.
2. Regenerate `src/types/database.types.ts` when schema changes.
3. Add new feature folders under `src/features/<name>/` with `actions.ts`, `validation.ts`, and thin route files under `src/app/`.
4. Extend `src/lib/env.ts` and `.env.example` together when introducing new secrets.

For **why** decisions were made, see `docs/puretask-decisions.md`. For **phase intent**, see `docs/phases/phase-*-spec.md`.
