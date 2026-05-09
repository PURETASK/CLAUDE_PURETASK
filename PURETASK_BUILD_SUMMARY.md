# PureTask — Full Build Summary

**Platform:** Verified home cleaning marketplace for Northern California  
**Stack:** Next.js 15 (App Router) · React 19 · Supabase · Stripe · TypeScript · Tailwind CSS v4  
**Deployment:** Vercel  
**Built in 16 phases**

---

## What PureTask Is

PureTask is a two-sided marketplace connecting homeowners with background-checked, identity-verified, GPS-tracked home cleaners. The core trust model is:

- Customers pay only **after approving the work**
- Every cleaner runs through **Checkr background checks** and **Stripe Identity verification**
- Cleaners submit **before/after photos** for every job
- A **tier reputation system** (4 levels) governs commissions and earning limits
- A **nightly reliability score** keeps cleaners accountable

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS v4, Lucide icons |
| Database & Auth | Supabase (Postgres + Row-Level Security) |
| Payments | Stripe (PaymentIntents, Connect, Identity) |
| Background Checks | Checkr API + webhooks |
| Email | Resend (transactional email) |
| SMS | Twilio |
| Web Push | Web Push API (VAPID) |
| Maps/Geo | Google Maps Geocoding API |
| Forms | React Hook Form + Zod validation |
| Data Fetching | TanStack Query v5 |
| Testing | Vitest + jsdom |
| Package Manager | pnpm |

---

## Phase-by-Phase Feature Breakdown

### Phase 1 — Foundation & Deployment
- Next.js 15 App Router project scaffolded and deployed to Vercel
- Supabase project linked, environment variables wired
- ESLint, Prettier, TypeScript strict mode configured
- Repo hygiene: `.gitignore`, archive guardrails

### Phase 2 — Authentication Foundation
- **Sign Up** with email/password via Supabase Auth
- **Sign In** with session persistence
- **Forgot Password** + **Reset Password** flows
- **Email Verification** page
- Auth middleware protecting all `/app/*` routes
- `createSupabaseServerClient` / `createSupabaseBrowserClient` / `createSupabaseAdminClient` abstractions
- Zod-validated server actions for all auth flows

### Phase 3 — Customer Onboarding & Settings
- Customer **profile creation** (full name, phone)
- **Address management**: add, edit, delete multiple service addresses
- Addresses geocoded via Google Maps API
- **Photo waiver** — customers acknowledge the before/after photography policy
- Settings layout with navigation (Profile, Addresses, Privacy)
- **Privacy settings** page

### Phase 4 — Cleaner Onboarding Pipeline
10-step application wizard covering:
1. Personal details
2. Service area (ZIP codes served)
3. Specialties (deep clean, move-out, Airbnb)
4. Experience and references
5. Equipment and supplies
6. Hourly rate and availability
7. Photo training / policies
8. Background check consent (Checkr)
9. Identity verification (Stripe Identity)
10. Bank account connection (Stripe Connect)

Application statuses: `draft → submitted → under_review → approved / rejected`

### Phase 5 — Discovery, Matching & Waitlist
- **Browse Cleaners** page with filter bar (service type, max distance, min rating, sort)
- **Match Score Algorithm** — composite ranking engine:
  - Distance component (0–25 miles, 40% weight)
  - Tier component (cleaner level, 30% weight)
  - Availability alignment (30% weight)
  - ZIP fit multiplier (1.5× if cleaner serves the customer's ZIP)
  - Specialty multiplier (1.2× when cleaner's badge matches requested service)
  - Cold-start multiplier (1.3× for new cleaners with <10 jobs in first 60 days)
- **Match Transparency** — each ranked result returns 6 labeled factor cards (Proximity, Cleaner Level, Schedule Fit, Neighborhood Familiarity, Service Fit, New Pro Visibility) with high/medium/low strength indicators
- **Cleaner Profile** page: bio, tier badge, hourly rate, specialties, reviews
- **Favorites** — customers can save/unsave cleaners
- **Waitlist** — customers in unsupported areas join a waitlist

### Phase 6 — Core Booking Flow
- **Booking Form**: service type, date/time, duration, address selection
- **Pricing engine** (pure function, fully tested):
  - `cleanerSubtotalCents = hourlyRate × hours`
  - `platformFeeCents = subtotal × commissionRate`
  - `totalCharge = subtotal + platformFee`
- Booking state machine: `pending_acceptance → accepted → in_progress → pending_approval → approved / disputed → completed`
- Stripe PaymentIntent created at booking; card authorized but **not captured** until approval
- Cleaner has **4-hour acceptance window**
- **Booking detail page**: full timeline, status badge, action buttons
- **Receipt page** post-completion
- Booking list with `BookingCard` and `BookingStateBadge`
- `CancelBookingButton`, `ApproveWorkButton`, `MarkCompleteButton`, `CleanerActionButtons`

### Phase 7 — Testing Foundation & Dev Tooling
- Vitest configured with jsdom environment
- Unit tests for **Match Score** (scoring.test.ts) — distance, tier, specialty, cold-start components
- Unit tests for **Pricing** (pricing.test.ts) — commission calculations across tiers
- ESLint + Prettier integrated into CI
- Development tooling: `typecheck`, `format:check`, `test:coverage` scripts

### Phase 8 — Reviews & Disputes
**Reviews:**
- Customers submit a star rating + text review after booking completion
- Reviews feed into the cleaner's `average_rating`
- `ReviewForm`, `ReviewCard`, review queries and actions

**Disputes (3-tier system):**
1. **Direct** — cleaner responds with re-clean offer, partial refund, or stands by work; customer accepts or escalates
2. **Mediation** — admin reviews photo evidence and the dispute thread
3. **Platform decision** — final admin ruling using a rubric
- `FileDisputeForm`, `CleanerResponseForm`, `DisputeThread`, `CustomerResolutionButtons`, `AdminResolveForm`
- `DisputeStateBadge` tracks: `open → cleaner_responded → escalated → resolved`
- Admin dispute queue at `/app/admin/disputes`

### Phase 9 — Money Operations
**Payments:**
- Stripe PaymentIntent capture on booking approval
- `PaymentMethodCard` — customers add/view saved cards
- Cleaner payout line items recorded per completed booking
- **Instant payout** option (5% fee) via `InstantPayoutButton`
- `PayoutStateBadge` — `pending → in_transit → paid → failed`

**Earnings:**
- Cleaner earnings dashboard at `/app/cleaner/earnings`
- Payout history with breakdown per job

**Webhooks:**
- `POST /api/webhooks/stripe-connect` — handles `transfer.created`, `payout.paid`, `payout.failed`
- `POST /api/webhooks/stripe-identity` — updates identity verification status
- `POST /api/webhooks/checkr` — updates background check status

### Phase 10 — Polish, Marketing & Email Notifications
**Marketing site (public routes):**
- **Homepage** (`/`) — hero, how-it-works, trust signals, tier callout, CTA
- **How It Works** (`/how-it-works`) — step-by-step customer + cleaner guides, 3-tier dispute explainer
- **For Cleaners** (`/for-cleaners`) — earnings potential, tier commission table, requirements
- **Pricing** (`/pricing`) — customer pricing, cleaner commission rates
- **FAQ** (`/faq`) — common questions
- **Photography Policy** (`/legal/photography-policy`) — legal policy page
- **robots.ts** and **sitemap.ts** for SEO

**Email (Resend):**
- Booking confirmation to customer
- Booking acceptance notification to customer
- Dispute opened notification
- Payout confirmation to cleaner
- Email template system in `src/lib/email/templates.ts`

**Settings:**
- Profile settings
- Notification preferences
- Payment methods

### Phase 11 — Bio Editing, Tips & Availability Calendar
**Cleaner bio editing:**
- `BioEditForm` — cleaners update their public bio from their settings page
- Bio shown on public cleaner profile card

**Tip payments:**
- `TipForm` at `/app/bookings/[id]/tip`
- Customers can add a tip after job completion; processed through Stripe

**Availability calendar:**
- `AvailabilityScheduleForm` — cleaners set their weekly availability per day
- Stored as availability slots, surfaced in booking flow

### Phase 12 — Recurring Bookings
- **Create recurring booking** (`/app/recurring/new`) — frequency (weekly, biweekly, monthly), preferred day/time, service type
- **Recurring booking list** (`/app/recurring`) — view all active schedules
- **Recurring booking detail** (`/app/recurring/[id]`) — manage, pause, cancel
- `recurring` feature with server actions and queries
- Individual bookings auto-generated from the recurring schedule

### Phase 13 — In-App Notifications & Support Tickets
**Notifications:**
- `NotificationBell` component in app nav — shows unread count badge
- Notifications list with read/unread state
- `POST /api/notifications` — create notification
- Events: booking updates, dispute replies, payout status, support ticket replies
- `notifications` feature: actions, queries, settings-actions

**Support Tickets:**
- Customer creates ticket at `/app/support/new` with `NewTicketForm`
- Ticket thread at `/app/support/[id]` — `ReplyForm` for ongoing conversation
- Support list at `/app/support`
- Admin queue at `/app/admin/support` — `AdminReplyForm`, `ResolveForm`
- Ticket statuses: `open → in_progress → resolved → closed`

### Phase 14 — Nightly Reliability Cron & Score UI
**Nightly cron (`POST /api/cron/nightly-reliability`):**
- Runs against all active cleaners
- 90-day rolling window of `reliability_events` (on-time arrivals, completions, cancellations, late starts, photo compliance, rating)
- Score formula: starts at 100, each event adds/subtracts `point_delta`, capped 0–100
- Rating bonus: `(avg_rating / 5) × 25 − 20`
- Score bands: `trusted (≥85)`, `good_standing (≥70)`, `warning (≥55)`, `probation (≥40)`, `suspended (<40)`
- Snapshots written to `reliability_score_snapshots`, cleaner profile updated

**Weekly payout cron (`POST /api/cron/weekly-payout`):**
- Finds all unpaid `payout_line_items`
- Groups by cleaner, sums totals
- Creates a `payouts` record, fires `stripe.transfers.create` to the cleaner's Connect account
- Marks line items as paid, payout state to `in_transit`
- Both crons protected by `x-cron-secret` header

**Score UI:**
- `/app/cleaner/score` — 30-day score history table with date, numeric score, and colored band badge
- `/app/dashboard/reliability` — dashboard reliability overview

### Phase 15 — TOTP Two-Factor Authentication
- **Security settings page** at `/settings/security`
- `MFASetup` client component
- Full TOTP enrollment flow via **Supabase MFA API**:
  - List enrolled factors
  - Enroll new TOTP factor (QR code display)
  - Verify OTP code to activate
  - Unenroll / remove a factor
- Factors listed with status (`verified` / `unverified`)

### Phase 16 — Web Push & SMS Notifications
**Web Push:**
- `PushSubscriptionToggle` component — one-click browser notification opt-in/out
- Service worker registration, VAPID key handling
- `POST /api/push/subscribe` — saves push subscription to database
- `DELETE /api/push/unsubscribe` — removes subscription
- `src/lib/webpush.ts` — server-side push dispatch using `web-push` library
- Notification settings page at `/settings/notifications`

**SMS (Twilio):**
- `SmsSettingsForm` — users add/verify phone number, toggle SMS notifications
- `src/lib/sms.ts` — Twilio client wrapper
- SMS sent for: booking acceptance, dispute updates, payout confirmations

---

## System Architecture Overview

### Routing Layout

```
/ (marketing)       — public landing pages, SEO, no auth required
/auth/*             — sign in, sign up, password reset, email verify
/app/*              — authenticated customer + cleaner app
/admin/*            — admin panel (application queue, disputes, support)
/api/*              — server-side API routes (webhooks, crons, push)
/settings/*         — account settings (profile, addresses, security, notifications)
```

### Feature Module Structure

Each feature lives in `src/features/<domain>/` with:
- `actions.ts` — Next.js Server Actions (form submissions, mutations)
- `queries.ts` — read queries (Supabase calls, used in Server Components)
- `validation.ts` — Zod schemas shared between client and server
- `components/` — UI components scoped to that feature

### Key External Integrations

| Service | Purpose |
|---|---|
| **Supabase** | Auth (email/password + MFA), Postgres database, Row-Level Security |
| **Stripe PaymentIntents** | Customer card authorization + capture |
| **Stripe Connect** | Cleaner bank accounts + direct transfers |
| **Stripe Identity** | Government ID verification for cleaners |
| **Checkr** | Criminal background checks for cleaners |
| **Resend** | Transactional email (booking, disputes, payouts) |
| **Twilio** | SMS notifications |
| **Google Maps Geocoding** | Convert addresses to lat/lng for distance matching |
| **Web Push (VAPID)** | Browser push notifications |

### Tier Commission System

| Tier | Commission | Notes |
|---|---|---|
| Rising Pro | 15% (12% intro) | Intro rate for first 6 jobs |
| Proven Specialist | 13% | — |
| Top Performer | 11% | — |
| All-Star Expert | 10% | Highest earnings, keeps 90% |

Tiers are earned through the nightly reliability score — on-time arrivals, job completions, photo compliance, ratings, and cancellation rate over a 90-day window.

---

## Summary Statistics

- **16 build phases** shipped
- **60+ pages/routes** across marketing, app, admin, settings, and API
- **8 third-party service integrations** (Supabase, Stripe ×3, Checkr, Resend, Twilio, Google Maps)
- **5 cron/webhook endpoints** (nightly reliability, weekly payout, Checkr webhook, Stripe Connect webhook, Stripe Identity webhook)
- **4 cleaner reputation tiers** with differential commission rates
- **6-factor match score algorithm** with transparent breakdown for customers
- **3-tier dispute resolution** system
- **Full-stack TypeScript** throughout — validated at every boundary with Zod
