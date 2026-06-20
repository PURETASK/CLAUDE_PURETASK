# PureTask — Full context for another AI (copy everything below the line)

Copy from **--- START PASTE ---** through **--- END PASTE ---** into a new chat. Optionally attach files listed in §14.

---

## --- START PASTE ---

### A) Instructions for you (the receiving assistant)

You are onboarding to the **PureTask** codebase. Use this document to:

1. Summarize **product intent**, **roles**, **URL structure**, and **tech stack**.
2. Map **every page route** below to **customer vs cleaner vs admin vs public** access (use §C middleware rules).
3. Explain **feature domains** and **server actions** (§F) at a level suitable for planning or QA.
4. Treat **§H database tables** as the logical schema; migrations in §G are the source of truth on disk.
5. When uncertain, say what is **not** specified here and suggest reading `docs/PureTask_Master_Guide.md`, `AGENTS.md`, `src/middleware.ts`, and `db/migrations/*.sql`.

---

### B) One-paragraph product

PureTask is a **trust-first residential cleaning marketplace** (Northern California). Customers browse vetted cleaners, book services, manage addresses and payments, complete jobs with verification/approval, and can dispute or review. Cleaners apply through a multi-step pipeline (background check, identity, Stripe Connect, insurance, tax), manage availability and jobs, earn through payouts, and are scored on **reliability** and **tiers**. Admins review applications, support tickets, disputes, and refunds. Money is stored in **integer cents**; timestamps are **timestamptz**.

---

### C) Roles, auth, and route guards

**Primary roles** (application concept, stored on `users.primary_role` and Supabase `user_metadata`): `customer`, `cleaner`, `admin`. Onboarding sets `user_metadata.role` and **`role_confirmed`** before full app access.

**Middleware** (`src/middleware.ts`):

- Session refresh on matched routes.
- **Unauthenticated** → cannot access `/app`, `/cleaner`, `/admin`, `/onboarding` (redirect to `/auth/sign-in?next=…`).
- **Authenticated on auth pages** → redirect to `/app`.
- If **`role_confirmed` is false** → any protected route except `/onboarding/*` redirects to `/onboarding/role-select`.
- **Customer** (`primaryRole === 'customer'`) → cannot use `/app/cleaner/*` (sent to `/app`).
- **Cleaner** → cannot use customer-only prefixes: `/app/cleaners`, `/app/bookings`, `/app/recurring`, `/app/favorites`, `/app/waitlist`, `/app/dashboard` (sent to `/app/cleaner`).

**Admin UI** under `/admin/*` is protected like other app routes; server actions also check `users.primary_role === 'admin'` where needed. DB helper **`public.is_admin()`** exists (see migration `0013_phase4_admin_role_setup.sql`).

---

### D) Tech stack (implemented)

| Concern | Choice |
| --- | --- |
| Framework | Next.js 15 App Router, React 19, TypeScript strict |
| Styling | Tailwind CSS 4, Lucide icons |
| DB / Auth | Supabase Postgres + RLS + Auth (httpOnly cookies via SSR) |
| Validation | Zod + react-hook-form |
| Client data | TanStack Query where used |
| Payments | Stripe (PaymentIntents, Connect, Identity webhooks) |
| Background checks | Checkr API + webhook |
| Email / SMS / push | Resend, Twilio, Web Push (VAPID) |
| Geocoding | Google Maps Geocoding (optional env) |
| Tests | Vitest (+ a few unit tests) |
| Package manager | **pnpm only** |

Env validation: `src/lib/env.ts` (required: Supabase URL/keys, `NEXT_PUBLIC_SITE_URL`; optional: Stripe, Checkr, cron, Resend, VAPID, Twilio, Google Maps).

---

### E) Repository layout (high level)

```
src/app/           # Routes: (marketing), (app), (admin), auth, onboarding, legal, api
src/features/      # Domain: actions, validation, queries, components per feature
src/components/    # Shared UI + ui/ (shadcn — do not hand-edit primitives)
src/lib/           # supabase, stripe, checkr, email, sms, webpush, encryption, env, google-maps
src/server/        # e.g. backfill jobs
src/middleware.ts
db/migrations/     # Ordered SQL — schema source of truth
docs/              # Master guide, phases, decisions, this file
```

Conventions: see root **`AGENTS.md`**.

---

### F) Feature modules and main server mutations

Paths under `src/features/<name>/`.

| Module | Responsibility | Notable server actions / server functions |
| --- | --- | --- |
| `auth` | Sign-in/up, password reset, role confirm, sign-out | `signInAction`, `signUpAction`, `forgotPasswordAction`, `resetPasswordAction`, `confirmRoleAction`, `signOutAction` |
| `customer` | Profile, addresses, photo policy | `updateProfileAction`, `addAddressAction`, `updateAddressAction`, `setDefaultAddressAction`, `deleteAddressAction`, `updatePhotoPolicyAction`; `queueAddressGeocodeFromServerAction` |
| `discovery` | Browse, favorites, waitlist, match score display | `toggleFavoriteAction`, `joinWaitlistAction`; `match-score.ts`, `browse-ranking.ts` |
| `booking` | Create/accept/decline/reschedule/cancel bookings; pricing | `createBookingAction`, `acceptBookingAction`, `declineBookingAction`, `rescheduleBookingAction`, `cancelBookingAction`; `actions/lifecycle.ts`: `cancelBooking`, `requestReschedule`; `writeBookingStateEvent` in `lib/booking-states.ts` |
| `recurring` | Recurring schedules | `createRecurringScheduleAction`, `skipOccurrenceAction`, `pauseScheduleAction`, `resumeScheduleAction`, `endScheduleAction` |
| `payments` | PMs, tips, instant payout | `addPaymentMethodAction`, `setDefaultPaymentMethodAction`, `deletePaymentMethodAction`, `addTipAction`, `requestInstantPayoutAction`, `toggleInstantPayoutAction` |
| `reviews` | Post-job reviews | `submitReviewAction` |
| `messaging` | Booking messages | `sendMessageAction` |
| `disputes` | Completion, approval, disputes, resolutions | `markJobCompleteAction`, `approveBookingAction`, `fileDisputeAction`, `cleanerRespondAction`, `customerAcceptResolutionAction`, `customerRejectResolutionAction`, `adminResolveDisputeAction` |
| `notifications` | Inbox + prefs | `markNotificationReadAction`, `markAllNotificationsReadAction`; `settings-actions.ts` (SMS prefs) |
| `support` | Tickets | `createTicketAction`, `replyToTicketAction`, `adminReplyAction`, `resolveTicketAction` |
| `cleaner` | Application wizard, admin decision | `createDraftAction`, `saveStepAction`, `submitApplicationAction`, `adminDecisionAction` |
| `cleaner` | Profile / availability | `updateBioAction`; `saveAvailabilityAction`, `addTimeOffAction`, `removeTimeOffAction` |
| `cleaner/checkr` | Background check | `createCheckrCandidateAction` |
| `cleaner/identity` | Stripe Identity | `createIdentitySessionAction` |
| `cleaner/connect` | Stripe Connect onboarding | `createConnectOnboardingAction` |
| `cleaner/insurance` | COI upload to Storage | `uploadInsuranceDocument` |
| `cleaner/tax` | Encrypted tax ID | `saveTaxInfo` |
| `cleaner/appeals` | Score/tier appeals | `submitAppeal` |
| `admin` | Application queue decisions | `adminApplicationDecisionAction` |
| `admin` | Refunds + audit | `adminProcessRefund` (+ `writeAdminAction`) |
| `reliability` | Dashboard reads | queries over reliability tables |
| `onboarding` | First-time tours (UI) | milestones via API routes |

`src/features/trust/` is largely **placeholder** (`.gitkeep`); tier/reliability/match live under cleaner + discovery + reliability.

---

### G) Database migrations (files on disk)

Apply in **filename sort order** unless your team documented otherwise. **Warning:** three files share the `0010_` prefix — confirm the intended order in your deployment pipeline before applying to a fresh DB.

| File | Purpose (short) |
| --- | --- |
| `0001_b1_core_identity.sql` | Users, customer/cleaner/admin profiles, addresses, sessions, favorites, milestones |
| `0002_b2_booking_lifecycle.sql` | Services, bookings, state events, photos, recurring, availability, zips, serviced areas |
| `0003_b3_trust_evidence.sql` | Messages, traits, reviews, tips, disputes |
| `0004_b4_cleaner_operations.sql` | Reliability, tiers, appeals, badges, specialties, suspensions, customer reliability |
| `0005_b5_money.sql` | Payment methods, charges, refunds, commissions, payouts, insurance policy rows, Stripe webhook events |
| `0006_b6_platform_operations.sql` | Notifications, preferences, deliveries, admin audit actions, support tickets |
| `0007_b7_onboarding_verification.sql` | Cleaner applications, background checks, identity verifications, waitlist |
| `0008_b8_audit_fixes.sql` | Audit / consistency fixes |
| `0009_phase2_auth_user_sync.sql` | Trigger: sync `auth.users` → `public.users` |
| `0010_phase3_customer_onboarding.sql` | Phase 3 customer onboarding RLS/policies |
| `0010_phase3_fix_user_id_rls.sql` | RLS fixes around user id |
| `0010_phase3a_customer_profile_bootstrap.sql` | Customer profile bootstrap |
| `0011_phase3a_addresses_rls.sql` | Address RLS |
| `0012_phase4_cleaner_onboarding.sql` | Cleaner onboarding policies |
| `0013_phase4_admin_role_setup.sql` | `is_admin()`, admin RLS, application admin access |
| `0014_phase5_geocoding_and_browse.sql` | Address `geocoded_at`, earthdistance, `distance_miles()`, view `cleaner_profiles_public`, discovery RLS |
| `0015_phase5_waitlist_customer_insert.sql` | Waitlist insert policy for customers |
| `0016_add_role_confirmed.sql` | Role confirmation support |

Also: **`smoke_test`** table may appear in generated types for dev-only smoke tests (not core product).

---

### H) Consolidated database overview (tables + what they store)

| Table | Purpose |
| --- | --- |
| `users` | App user linked to auth; email, name, primary_role, status |
| `customer_profiles` | Customer row: user link, phone, prefs, soft-delete |
| `cleaner_profiles` | Cleaner row: rates, tier, Stripe Connect id, scores, tax blob refs, activity |
| `admin_profiles` | Admin user link |
| `addresses` | Service/home addresses; lat/lng; geocode timestamp |
| `auth_sessions` | Session/device metadata (app-side) |
| `customer_favorites` | Customer ↔ saved cleaner |
| `user_milestones` | Guided onboarding / tour completion flags |
| `services` | Catalog of bookable service types |
| `bookings` | Single job: parties, schedule, state, money fields, Stripe ids |
| `booking_state_events` | Append-only audit of state transitions + actor + metadata |
| `booking_photos` | Evidence photos tied to booking |
| `recurring_schedules` | Recurring series config |
| `recurring_occurrences` | Generated or tracked instances |
| `availability_rules` | Cleaner weekly availability pattern |
| `time_off_blocks` | Cleaner unavailability windows |
| `cleaner_service_zips` | ZIPs a cleaner serves |
| `serviced_areas` | Broader service area modeling |
| `messages` | Booking-scoped chat |
| `traits` | Review dimensions |
| `reviews` | Star/text reviews post-job |
| `review_traits` | Review ↔ trait scores |
| `tips` | Optional tip records |
| `disputes` | Dispute case on a booking |
| `dispute_messages` | Thread on dispute |
| `dispute_resolutions` | Proposed/accepted resolution payloads |
| `reliability_events` | Point deltas for cleaner behavior |
| `reliability_score_snapshots` | Periodic score snapshots |
| `tier_assignments` | Tier history per cleaner |
| `cleaner_appeals` | Cleaner appeals of score/tier events |
| `badges` / `cleaner_badges` | Achievement badges |
| `specialties` / `cleaner_specialties` | Specialty catalog + assignment |
| `cleaner_suspensions` | Enforcement |
| `customer_reliability_events` | Customer-side reliability (e.g. cancellations) |
| `payment_methods` | Saved cards; Stripe customer + PM ids |
| `charges` | PaymentIntent/charge linkage and amounts |
| `refunds` | Refund records |
| `commission_records` | Platform take per booking/charge |
| `payouts` | Cleaner payout batches |
| `payout_line_items` | Line items owed before payout |
| `insurance_policies` | COI uploads / verification state |
| `stripe_webhook_events` | Idempotency / audit for Stripe |
| `notifications` | User notifications |
| `notification_preferences` | Channel prefs |
| `notification_deliveries` | Per-channel send log |
| `admin_actions` | Immutable admin audit log |
| `support_tickets` | Helpdesk tickets |
| `support_ticket_messages` | Ticket thread |
| `cleaner_applications` | Multi-step onboarding application |
| `background_checks` | Checkr linkage + status |
| `identity_verifications` | Stripe Identity linkage + status |
| `waitlist_signups` | Lead capture |

**View (SQL, may not appear in all generated View types):** `cleaner_profiles_public` — safe subset of cleaner profile for discovery UIs.

**RPC / functions (examples):** `is_admin()`, `current_customer_id()`, `current_cleaner_id()`, `distance_miles(...)`, `booking_buffered_start/end(...)`.

---

### I) Booking lifecycle states (app code)

From `src/features/booking/lib/booking-states.ts`:

`booking_requested` → `confirmed` → `imminent` → `in_transit` → `arrived` → `in_progress` → `awaiting_approval` → `approved` | `auto_approved` → `paid` → `completed`  
Branches: `disputed`, `dispute_resolved`, `reschedule_pending`, `cancelled_by_customer`, `cancelled_by_cleaner`.

Cleaner “active job” states include through `awaiting_approval`; customer-facing “active” also includes `approved` / `auto_approved`.

---

### J) All page routes (Next.js `page.tsx` → URL)

Route groups `(marketing)`, `(app)`, `(admin)` do **not** appear in the URL.

**Public marketing**

- `/` — Home  
- `/about` `/pricing` `/how-it-works` `/coverage` `/faq` `/press`  
- `/for-cleaners`  
- `/help` `/help/[topic]`  
- `/trust/background-checked` `/trust/specialties` `/trust/specialty-endorsed` `/trust/zip-locked` `/trust/neighborhood-expert`  
- `/cleaning/[city]/[service]`  

**Auth**

- `/auth/sign-in` `/auth/sign-up` `/auth/forgot-password` `/auth/reset-password` `/auth/verify-email`

**Onboarding**

- `/onboarding/role-select` `/onboarding/welcome` `/onboarding/cleaner-tour`

**Legal**

- `/legal/photography-policy`

**Public apply**

- `/cleaners/apply`

**Customer app (`/app/...`)** — *cleaners blocked from customer-only paths by middleware*

- `/app` — Customer home  
- `/app/dashboard` `/app/dashboard/reliability`  
- `/app/cleaners` `/app/cleaners/[id]` `/app/cleaners/[id]/book`  
- `/app/bookings` `/app/bookings/[id]` and nested: `messages`, `dispute`, `reschedule`, `review`, `cancel`, `receipt`, `tip`, `tracking`  
- `/app/recurring` `/app/recurring/new` `/app/recurring/[id]`  
- `/app/favorites` `/app/waitlist`  
- `/app/notifications`  
- `/app/support` `/app/support/new` `/app/support/[id]`  
- `/app/apply` `/app/apply/status` `/app/apply/step/[step]` — *customer-side apply flow if distinct from cleaner apply*  
- `/app/settings` `/app/settings/profile` `/app/settings/addresses` `/app/settings/addresses/new` `/app/settings/addresses/[id]` `/app/settings/payment-methods` `/app/settings/security` `/app/settings/notifications` `/app/settings/privacy`

**Cleaner app**

- Under **`/app/cleaner/...`** (customer blocked):  
  - `/app/cleaner` — hub  
  - `/app/cleaner/availability` `/app/cleaner/earnings`  
  - `/app/cleaner/bookings/[id]` + `messages`, `dispute`  
  - `/app/cleaner/score` `/app/cleaner/score/tiers` `/app/cleaner/score/explainer`  
  - `/app/cleaner/settings`  

- Under **`/cleaner/...`** (still inside authenticated `(app)` layout):  
  - `/cleaner/apply` `/cleaner/apply/submit` — **Cleaner apply wizard steps (canonical):** `/app/apply/step/[1–11]` while application is `draft` (see `src/app/(app)/app/apply/step/[step]/page.tsx`). **Alias:** URLs like `/cleaner/apply/step-3` are accepted by `src/app/(app)/cleaner/apply/step-[step]/page.tsx`, which validates `step-` + digits and **redirects** to `/app/apply/step/{n}`.  
  - `/cleaner/background-check` `/cleaner/verify-identity` `/cleaner/connect-onboarding` `/cleaner/photo-training` `/cleaner/tax-info`  
  - `/cleaner/jobs/[id]/on-my-way` `/cleaner/jobs/[id]/active` `/cleaner/jobs/[id]/complete`  
  - `/cleaner/settings` `/cleaner/settings/tax` `/cleaner/settings/insurance`  
  - `/cleaner/score/appeal`  

**Admin**

- `/admin`  
- `/admin/applications` `/admin/applications/[id]`  
- `/admin/bookings` `/admin/bookings/[id]/refund`  
- `/admin/cleaners/[id]` `/admin/customers/[id]`  
- `/admin/disputes` `/admin/disputes/[id]`  
- `/admin/support` `/admin/support/[id]`

---

### K) API routes (`src/app/api/`)

| Route | Role |
| --- | --- |
| `GET /api/cron/auto-approve` | Bearer `CRON_SECRET` — auto-approve stale `awaiting_approval` |
| `POST /api/cron/weekly-payout` | Header `x-cron-secret` — Stripe Connect transfers from `payout_line_items` |
| `POST /api/cron/nightly-reliability` | Header `x-cron-secret` — recompute reliability snapshots |
| `POST /api/webhooks/stripe-connect` | Stripe Connect webhook |
| `POST /api/webhooks/stripe-identity` | Stripe Identity webhook |
| `POST /api/webhooks/checkr` | Checkr webhook |
| `POST /api/push/subscribe` / `POST /api/push/unsubscribe` | Web push keys |
| `…/api/notifications` | Notification plumbing |
| `…/api/milestones/welcome-tour` / `…/api/milestones/cleaner-tour` | Milestone completion |

---

### L) Related docs in this repo (for deeper dives)

- `docs/PureTask_Master_Guide.md` — full product spec  
- `AGENTS.md` — engineering rules  
- `docs/puretask-decisions.md` — decision log  
- `docs/phases/phase-*-spec.md` — phased build specs  
- `docs/puretask-implementation-overview.md` — earlier technical inventory  
- `PURETASK_BUILD_SUMMARY.md` — narrative phase summary  

---

## --- END PASTE ---

---

## §14 What else should you give the AI (you are not wrong to ask — add these for best results)

Paste alone gives **structure**. For accurate **behavior**, **edge cases**, and **ops**, also supply one or more of:

1. **`AGENTS.md` + `docs/puretask-decisions.md`** — non-negotiables (RLS, money as cents, no PII in logs, server action patterns).
2. **`src/middleware.ts` full file** — exact gating (source of truth vs summaries).
3. **A specific `actions.ts`** for the feature under discussion — business rules live there, not only in this list.
4. **`src/lib/env.ts` + `.env.example`** — which integrations are actually configured in each environment.
5. **RLS policy excerpt** for the tables you care about (from migrations) — otherwise another model will guess access wrong.
6. **Booking / payment sequence diagram or Stripe event list** you actually handle in `stripe-connect` webhook — otherwise “what happens after capture” stays vague.
7. **Seed or anonymized DB sample** — realistic joins (booking + charge + profiles) beat empty schema descriptions.
8. **Cron / Vercel schedule** — when auto-approve, payouts, and reliability jobs run in production.
9. **Error copy / toast strings** — if the task is UX or support automation.
10. **Open bugs / “known gaps”** — e.g. duplicate `0010_*` migration ordering, placeholder `trust/` feature folder, tests only on pricing + match score.
11. **Compliance scope** — what PII exists, retention, and what must never be logged (see `AGENTS.md` “Never”).
12. **Staging URLs + test users** (sanitized) — only in private chats, never commit secrets.

If you tell the receiving AI **your goal** (e.g. “security review”, “add feature X”, “write E2E tests”), accuracy jumps more than adding raw file count.

---

## Maintenance

When you add routes, actions, or migrations, update the **--- START / END ---** block in this file so your next paste stays truthful.
