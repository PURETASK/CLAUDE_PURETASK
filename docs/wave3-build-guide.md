# Wave 3 Build Guide — the Cleaner App

**The single doc we build Wave 3 from.** Re-skin every cleaner-side screen to its HTML wireframe, build the few genuine gaps, and leave the backend untouched. Companion to [`screen-build-spec.md`](./screen-build-spec.md); same rules, cleaner scope.

> **Key facts (from a full repo inventory):**
> - The cleaner **nav is already wired** in the role-aware `AppShell` (`nav-config.ts` → Home `/app/cleaner` · Jobs `/app/cleaner/bookings` · Earnings `/app/cleaner/earnings` · Profile `/app/settings`). No shell work needed.
> - Most cleaner pages **exist and already use clean tokens**, but **do not match the wireframe layouts** — so this is a real re-skin (match each wireframe's structure + our primitives + `AppShell`-style headers), not just a token swap.
> - **One missing page:** the **Jobs list** at `/app/cleaner/bookings` (the Jobs tab target) does not exist — build it.
> - **35 server actions + all queries already exist.** We only touch presentation + existing data wiring.

---

## 1. Locked decisions (same as Wave 2)

- **Source of truth = the HTML wireframes** in `PURETASK-MASTER-FILE/wireframes and b1-b7 docs/` (the `cleaner_*` set). Recreate each wireframe's layout + content + restraint.
- **Tokens:** Clean Aero Glow; brand blue `#169af5` on primary actions only. Reuse the Wave-1 primitives: `Card`, `ListRow`, `SectionHeader`, `Stars`, `MoneyRow`, `StatusBadge`, `Stepper`, `EmptyState`, `Chip`, `cn()`.
- **Headers:** page-level back-arrow header pattern (lucide `ArrowLeft`) like the Wave-2 screens; the shell provides the chrome — no per-page full-screen wrappers.
- **Backend untouched.** Re-skin only changes markup + existing data reads/writes. Preserve every server-action call + FormData field name exactly (verify before editing, as with the booking flow).
- **Money/score-sensitive screens** (earnings, payouts, score, clock-in/out, dispute response): preserve action wiring by construction; verify carefully.

## 2. Navigation (already built — do not rebuild)

| Role | Mobile bottom tabs | Desktop |
| --- | --- | --- |
| **Cleaner** | **Home** `/app/cleaner` · **Jobs** `/app/cleaner/bookings` · **Earnings** `/app/cleaner/earnings` · **Profile** `/app/settings` | Sidebar, same + secondary (Availability, My Score, Support) |

Role comes from `user.user_metadata.role === 'cleaner'`. Secondary nav: Availability `/app/cleaner/availability`, My Score `/app/cleaner/score`, Support `/app/support`.

## 3. The two cleaner route trees (reality)

Both live under the `(app)` group, so **both already render inside `AppShell`**:

- **`/app/cleaner/*`** — the in-shell cleaner area: dashboard, bookings, earnings, score, settings, availability. **Canonical.**
- **`/cleaner/*`** — job-execution + onboarding/verification transit routes: `jobs/[id]/active`, `jobs/[id]/on-my-way`, `jobs/[id]/complete`, `apply/*`, `background-check`, `connect-onboarding`, `photo-training`, `score/appeal|explainer|tiers`, `settings/insurance|tax`, `tax-info`, `verify-identity`.

Keep the wired paths as-is (don't rename routes). Re-skin both trees to the same clean look.

---

## 4. Master cleaner screen matrix

Status = current repo state. Action: **Re-skin** (exists, restyle to wireframe) · **Extend** (exists, add wireframe features) · **New** (build).

| # | Screen | Wireframe | Route | Status | Backend (action / query) | Action | Batch |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Cleaner dashboard (score+tier, next job, week, visibility, badges) | `cleaner_dashboard_mobile_v1` | `/app/cleaner` | BUILT | `getMyBookingsAsCleaner`, `getMyScoreHistory` | Re-skin | B1 |
| 2 | **Job inbox (new / upcoming / past, accept/decline)** | `cleaner_job_inbox_mobile_v1` | `/app/cleaner/bookings` | **MISSING** | `getMyBookingsAsCleaner`, `acceptBookingAction`, `declineBookingAction` | **New (gap)** | B1 |
| 3 | Booking detail (cleaner side) | (reuse) | `/app/cleaner/bookings/[id]` | BUILT | `getBookingById`, accept/decline | Re-skin | B1 |
| 4 | On my way (GPS, ETA, running-late) | `become_a_cleaner`/batch1 | `/cleaner/jobs/[id]/on-my-way` | PARTIAL | `markEnRoute`, `markRunningLate`, `markArrived` | Re-skin | B2 |
| 5 | Active job (timer, room photo grid, clock-out) | `cleaner_active_job_mobile_v1` | `/cleaner/jobs/[id]/active` | BUILT | `clockIn`, `clockOut`, `submitRoomPhotos` | Re-skin | B2 |
| 6 | Job complete (post clock-out) | (batch) | `/cleaner/jobs/[id]/complete` | BUILT | — | Re-skin | B2 |
| 7 | Earnings & payouts | `cleaner_earnings_mobile_v1` | `/app/cleaner/earnings` | BUILT | `getMyCleanerEarnings` (+ instant-payout toggle) | Re-skin | B3 |
| 8 | Score breakdown / explainer | `wireframes_batch1_v3` | `/cleaner/score/explainer` | BUILT | `ScoreExplainer`, `getMyScoreHistory` | Re-skin | B3 |
| 9 | Tiers | `wireframes_batch1_v3` | `/cleaner/score/tiers` | BUILT | `TierExplainer` | Re-skin | B3 |
| 10 | Score history | `wireframes_batch1_v3` | `/app/cleaner/score` | BUILT | `getMyScoreHistory` | Re-skin | B3 |
| 11 | Score appeal | `wireframes_batch1_v3` | `/cleaner/score/appeal` | BUILT | `submitAppeal` | Re-skin | B3 |
| 12 | Cleaner settings | `cleaner_settings_v1` | `/app/cleaner/settings` | BUILT | bio editor + payout toggle + links | Re-skin | B3 |
| 13 | Availability (schedule + service area) | (batch) | `/app/cleaner/availability` | BUILT | availability + service-area save | Re-skin | B3 |
| 14 | Profile detail / editor (bio, languages, specialties, rates, services) | `cleaner_profile_detail_v1`, `cleaner_profile_editor_v1` | `/app/cleaner/settings/profile` * | PARTIAL | profile update | Re-skin / build | B4 |
| 15 | Insurance upload (COI + status) | `cleaner_insurance_upload_v1` | `/cleaner/settings/insurance` | PARTIAL | `uploadInsuranceDocument` | Re-skin | B4 |
| 16 | Tax info (SSN + classification) | `wireframes_batch3b_batch4a` | `/cleaner/settings/tax` (+ `/cleaner/tax-info`) | BUILT | `saveTaxInfo` | Re-skin | B4 |
| 17 | Background check (Checkr) | `wireframes_batch3b_batch4a` | `/cleaner/background-check` | BUILT | `createCheckrCandidateAction` | Re-skin | B4 |
| 18 | Verify identity (Stripe Identity) | (batch) | `/cleaner/verify-identity` | BUILT | `createIdentitySessionAction` | Re-skin | B4 |
| 19 | Connect onboarding (Stripe payouts) | (batch) | `/cleaner/connect-onboarding` | BUILT | `createConnectOnboardingAction` | Re-skin | B4 |
| 20 | Application (11-step) | `cleaner_application_mobile_v1` | `/app/apply`, `/app/apply/step/[step]`, `/app/apply/status` | BUILT | `createDraftAction`, `saveStepAction`, `submitApplicationAction` | Re-skin | B5 |
| 21 | Profile setup (post-approval checklist) | `cleaner_profile_setup_mobile_v1` | `/app/cleaner/setup` | **—** | onboarding links | **New** | B5 |
| 22 | Photo training | (batch) | `/cleaner/photo-training` | BUILT | — | Re-skin | B5 |
| 23 | Cleaner tour (5 slides) | (onboarding) | `/onboarding/cleaner-tour` | BUILT | — | Re-skin | B5 |
| 24 | Become a cleaner (marketing) | `become_a_cleaner_mobile_v1` | `/for-cleaners` | PARTIAL | — | Re-skin | B5 |
| 25 | Dispute response (cleaner side) | `cleaner_dispute_response_v1` | `/app/cleaner/bookings/[id]/dispute` | BUILT | `cleanerRespondAction`, `getDisputeForBooking` | Re-skin | B6 |

\* #14: there is no dedicated cleaner profile *view* today — the Profile tab points at `/app/settings`. Decide in B4: either build `/app/cleaner/settings/profile` (editor) and surface a public-style detail, or fold into cleaner settings.

---

## 5. Genuine gaps / new builds

1. **Job inbox list** `/app/cleaner/bookings` (B1) — **the Jobs tab 404s today.** Build a page that loads `getMyBookingsAsCleaner()` and segments into **New requests** (state `booking_requested`, with Accept/Decline via `acceptBookingAction`/`declineBookingAction`), **Upcoming** (confirmed/in-progress), **Past** (completed/cancelled). Mirror the customer dashboard pattern with `Card` + `StatusBadge` + a small `JobCard`.
2. **Profile-setup checklist** `/app/cleaner/setup` (B5) — post-approval onboarding checklist (insurance, tax, Connect, photo-training, first availability). New page linking the existing verification routes with done/pending states.
3. **Cleaner profile view/editor** (#14, B4) — thin today; decide build-vs-fold.

## 6. Shared components to add (only if reused ≥2×)

- **`JobCard`** (`src/features/cleaner/components/JobCard.tsx`) — a cleaner-side booking row/card: customer, service, date/time, payout, `StatusBadge` + optional Accept/Decline. Used by dashboard (#1) + job inbox (#2) + booking detail (#3).
- Otherwise reuse Wave-1 primitives. A vertical/numbered list works for the application steps via the existing `Stepper`.

## 7. Build order (sub-batches → one PR each, verified)

- **B1 — Daily drivers:** Job inbox list (NEW) + `JobCard`, cleaner dashboard re-skin, cleaner booking-detail re-skin. _After this the Jobs tab works and the home screen matches the wireframe._
- **B2 — Job execution:** on-my-way, active job (timer + photo grid + clock-out), job complete.
- **B3 — Money & standing:** earnings/payouts, score (history/explainer/tiers/appeal), settings, availability.
- **B4 — Verification & profile:** profile detail/editor, insurance, tax, background check, verify-identity, connect onboarding.
- **B5 — Onboarding funnel:** application (entry/steps/status), profile-setup checklist (NEW), photo training, cleaner tour, for-cleaners marketing.
- **B6 — Dispute response.**

## 8. The build recipe (per screen)

1. Read the wireframe → note sections, content, CTAs, states.
2. Find the route + the existing action/query (matrix above). **Read the action signature + FormData keys before editing** — preserve them exactly.
3. Rebuild the UI with our tokens + primitives + a back-arrow header. Keep all data wiring.
4. `tsc --noEmit` + `eslint` green → commit. (Local `next build` is currently blocked by a full disk → Vercel verifies. Run `node node_modules/typescript/bin/tsc --noEmit` and `node node_modules/eslint/bin/eslint.js --fix <files>` directly — `pnpm` isn't on PATH.)

## 9. Verification + ops notes

- **Toolchain:** `pnpm` isn't on PATH in this shell; run the local binaries directly (`node node_modules/typescript/bin/tsc --noEmit`, `node node_modules/eslint/bin/eslint.js`). Next build: `node node_modules/next/dist/bin/next build`.
- **⚠️ Dev disk is full** (~300 MB free) — `next build` ENOSPCs. Gate on tsc + eslint locally; **Vercel preview is the real build check**.
- One PR per batch (B1–B6); keep each reviewable; mark this guide's rows ✅ (PR #) as they land.
