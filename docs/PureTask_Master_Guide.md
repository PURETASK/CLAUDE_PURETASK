# PureTask — Master Build Guide

**Status:** Canonical reference document
**Last assembled:** May 2026
**Purpose:** Single source of truth for every design decision, schema element, wireframe, and build phase agreed across the project. Use this as the document you re-read before any major build decision.

---

## How to use this document

This is a **reference** document, not a tutorial. It captures _what was decided_ and _why_, plus the corrected build plan. When you (or Claude Code) start working on something:

1. Open this document
2. Find the relevant section
3. Confirm the locked decision before writing code
4. If a decision needs to change, update it here **first**, then update code

The document is organized to be skimmed. Each section starts with a short summary, then drills into specifics.

---

# Section 1 — Project Identity & Vision

## What PureTask is

A **trust-first cleaning marketplace** for Northern California. Customers book vetted residential cleaners and pay only when work is verified through photos, GPS, and customer approval. Cleaners build a public reputation that translates directly into higher pay rates and lower platform commissions.

The product is built around three guarantees:

- **Verified work** — every cleaning includes before/after photo proof and GPS check-in/out
- **Pay only when satisfied** — customer holds payment until they approve the work (or 24-hour auto-approve)
- **Fair platform** — cleaners keep 85–90% of subtotals, with commission shrinking as they prove themselves

## What PureTask is NOT

This is critical for resisting scope creep and feature drift:

- **Not Handy or TaskRabbit.** Those platforms commoditize cleaners. PureTask treats cleaners as named professionals with reputation and tier progression.
- **Not a casual gig app.** The trust pitch is to customers, who value precision and accountability. Anything that erodes that erodes the brand.
- **Not a national platform at launch.** NorCal-only. ZIP-scoped trust signals require local density.
- **Not a commodity-priced platform.** Tier-locked rate ranges intentionally prevent a race to the bottom.

## Brand identity

After a deliberate identity choice during system design, PureTask is positioned as a **premium trust marketplace**, not a cleaner-flexibility marketplace. This means:

- Tighter scheduling discipline (fixed times, not windows, at MVP)
- Strong accountability (real on-time windows, real demotion mechanics)
- Customers pay for predictability and verification
- Cleaners trade some autonomy for higher rates and clearer reputation rewards

Every future decision should be checked against this identity. If a feature pushes toward "more flexible for cleaners at the cost of customer precision," that feature is suspect.

## Target launch metrics

- ~9 months from now to launch (realistic, accounting for solo founder + new framework)
- ~$3,000–$3,500 total launch cost
- Focused launch in 1–3 NorCal ZIP codes for initial supply density

---

# Section 2 — Locked Design Decisions

This is the master record of every decision we agreed to. **Do not deviate without a deliberate revisit.**

## 2.1 — Pricing & economics

### Cleaner commissions (tier-scaled)

| Tier                             | Commission |
| -------------------------------- | ---------- |
| Rising Pro (during first 6 jobs) | **12%**    |
| Rising Pro (post-graduation)     | 15%        |
| Proven Specialist                | 13%        |
| Top Performer                    | 11%        |
| All-Star Expert                  | 10%        |

**Why tier-scaled commission matters:**

- Tier promotion = commission goes down (real reward)
- Tier drop = commission goes up (real cost)
- This reinforces the tier narrative with a financial signal in both directions

### Customer fees

- **$9.99 flat booking fee per cleaning** — locked. (My recommendation was $7.99 for better conversion at low tiers; you chose $9.99 for better margin. Either is defensible; $9.99 is locked.)
- **No monthly fees** — customer or cleaner

### Payouts

- **Weekly payouts free** — Friday ~noon Pacific
- **Instant payouts available** — 5% fee, opt-in
- **No monthly fees**

### Hour minimums (by tier)

- Rising Pro / Proven Specialist: **4-hour minimum**
- Top Performer / All-Star Expert: **2-hour minimum**

### First-cleaning incentive

- **$15 apology credit** issued automatically if a customer's first booking has any flagged issue (late arrival, photo gap, etc.). Funded by platform.

## 2.2 — Trust system

### The 4 tiers

1. **Rising Pro** — entry tier, baseline rate range
2. **Proven Specialist** — earned reputation, higher rate range
3. **Top Performer** — strong consistent reputation, higher still
4. **All-Star Expert** — top-tier, highest rates, lowest commission

### Reliability score — the 6 metrics

A nightly cron job at 2:00 AM Pacific computes each cleaner's score from the previous 90 days of data.

| Metric                 | Weight | What it measures                                                                                            |
| ---------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| On-time arrival        | 25%    | Clock-in within 5 min of `scheduled_at`, partial credit at 6–15 min and 16–30 min, no-show penalty separate |
| Job completion         | 20%    | % of accepted bookings that reach approved/auto_approved                                                    |
| Customer rating        | 20%    | Weighted average of 1–5 star ratings, 3.8 floor for deduction                                               |
| Photo compliance       | 15%    | First photo within 15 min, all required-room photos before clock-out                                        |
| Communication response | 10%    | 4-hour SLA on in-app messages during active bookings (phases 1–5)                                           |
| Reschedule rate        | 10%    | % of accepted bookings rescheduled by cleaner; 20% considered "perfect," penalty above                      |

### 90-day window — locked

Slower to respond to changes (good or bad), but cleaners trust it because random bad luck washes out. Re-evaluable post-launch with real data.

### Tier transitions

- **14-day demotion buffer** — score must remain below tier threshold for 14 consecutive days before tier drops
- **48-hour appeal window** on every tier-drop notification (real human-review path, not theater)
- **Veteran cushion** — long-tenured cleaners get a slightly larger buffer to handle one-off bad weeks

### Probation states

When a cleaner's score drops to a warning band, the dashboard shifts to a probation state with:

- Warning banner at top
- Score widget in warning colors
- Metric breakdown showing which areas crashed
- Recent score-affecting events log
- Clear "How to recover" path with 14-day requirement
- Existing bookings remain active
- Appeal option available

## 2.3 — Badges (~25 total across 6 categories)

| Category              | Examples                                                                      |
| --------------------- | ----------------------------------------------------------------------------- |
| Trust                 | ID Verified, Background Checked, Insurance Verified                           |
| Performance           | High Rating, Streak (consecutive 5-stars), Photo Pro                          |
| Customer Relationship | Repeat Favorite, Quick Responder                                              |
| ZIP-locked            | Trusted by Neighbors, Top-rated in [ZIP], Customer favorite in [ZIP]          |
| Specialty             | Deep Clean Specialist, Move-out Specialist, Airbnb Pro, Pet-friendly Home Pro |
| Veteran               | 1-Year Pro, 100-job Milestone, etc.                                           |

### ZIP-locked badges — full mechanics

**Trusted by Neighbors** (any tier):

- 10+ completed jobs in that ZIP
- 4.5+ average rating across those jobs
- All within last 12 months
- Cleaner in good standing
- Displayed for 6 months, auto-renews on rolling 12-month window

**Top-rated in [ZIP]** (Top Performer or above):

- 25+ jobs in ZIP, 4.7+ rating

**Customer favorite in [ZIP]** (All-Star Expert):

- 5+ active recurring customers in ZIP

A cleaner can hold multiple badges across multiple ZIPs. Badges fade to "Inactive" if criteria slip, then disappear after another 30 days. Cleaner gets notified at each transition.

### Specialty endorsements

Earned by accumulating customer review-tags. After N tagged reviews mentioning a specialty (e.g., "great at deep cleans"), the badge unlocks.

## 2.4 — Booking lifecycle

### What "active booking" means — locked definition

**A booking is active from the moment the cleaner accepts (or system instant-confirms via availability calendar) until the moment the cleaning is approved by the customer or auto-approved by 24-hour timeout.**

### The 6 phases

1. **Confirmed** — booking exists, payment authorized, scheduled time hasn't arrived
2. **Imminent** — within 2 hours of scheduled start; "On my way" button enables
3. **In-transit** — cleaner has tapped "On my way," GPS pings every 3 min
4. **In-progress** — cleaner has clocked in, working
5. **Awaiting approval** — cleaner has clocked out, customer has 24 hours
6. **Closed** — approved by customer or auto-approved at 24-hour timeout

Communication SLAs (the 4-hour rule for scoring) apply during phases 1–5.

### "On my way" page — it's a system, not a screen

- Enables 2 hours before service
- Reveals entry instructions (ONLY at this point — privacy decision)
- Triggers GPS pings every 3 min
- Sends customer push notification
- Has running-late escape hatch
- Has in-app messaging button
- Expires entry instructions 4 hours after booking ends

### Cleaner acceptance SLA

- **4-hour response window** to accept/decline a request-to-book
- After 4 hours, request expires and is offered to the next-best Match Score cleaner
- Instant-book bookings via availability calendar bypass this entirely

## 2.5 — Photo system

### Required photos (vary by service type)

- **Standard clean** — kitchen, living room, bathrooms, bedrooms (or as configured)
- **Deep clean** — extended set including baseboards, inside appliances
- **Move-out clean** — comprehensive room-by-room
- **Airbnb turnover** — quick set focused on guest-facing spaces

### Photo rules — locked

- **15-minute first-photo rule** — first photo required within 15 minutes of clock-in (anti-spoofing)
- **Before-clock-out gate** — all required-room photos must be uploaded before cleaner can clock out
- **Customer photo opt-out flow** — customers can opt out of photos at booking, but doing so waives their right to photo-based dispute resolution
- **Photo etiquette training** — required during cleaner onboarding, includes DO/DON'T rules
- **Encryption at rest**
- **90-day deletion window** — photos automatically deleted after 90 days unless under active dispute

### Legal requirement

CCPA-compliant photo policy must be in place **before** photo capture is built. This is non-negotiable in California.

## 2.6 — GPS & geofencing

- 3-minute pings during transit phase
- 100m geofence around service address triggers clock-in availability
- Location pings only at clock-in and clock-out during the job (privacy)
- GPS-spoofing mitigations: cross-check IP geolocation, photo within 15 min of clock-in
- Entry instructions are kept private until "On my way" page is opened

## 2.7 — In-app messaging

- Encrypted messages scoped to active bookings
- 4-hour response SLA tracked for reliability scoring
- Available throughout active booking phases (1–5)
- Closed booking = thread becomes read-only

This is **infrastructure, not polish.** The booking flow doesn't work without it.

## 2.8 — Dispute system

### Dispute window

- **48 hours from approval** (or auto-approval at 24h) for customer to open a dispute
- After 48 hours, booking is final

### Resolution path (3-tier)

1. **Direct resolution** — cleaner offers re-clean, partial refund, or stand-by-work in dispute thread
2. **Mediation** — admin reviews photo evidence and conversation thread if direct doesn't settle
3. **Platform decision** — final rubric-based decision when photos don't settle it

### Auto-resolution mechanism

- If cleaner has full photo coverage and customer doesn't counter within 48 hours, dispute auto-resolves in cleaner's favor
- If photos are missing or insufficient, default favors customer at the 48-hour mark

### Frivolous claim protection (cleaner-side)

- 1st denied claim: warning email
- 2nd in 6 months: account flagged for review
- 3rd: account restricted to request-to-book mode (cleaners can decline)

This costs the platform nothing and improves cleaner retention.

### Dispute pattern affects customer reliability score

Customers with multiple denied disputes get visible reliability impact (band-not-number visible to cleaners).

## 2.9 — Insurance & liability

- **Cleaner is fully responsible** for damage. Platform does not provide coverage.
- **Insurance Verified badge** available for cleaners who upload proof of their own insurance — opt-in, not required, not subsidized
- **Public-facing message** keeps contractor-aligned framing ("you and your cleaner work it out") while underlying mechanism complies with credit card dispute systems
- **Real lawyer required** before launch to validate ToS, photo policy, and liability framing

## 2.10 — Reschedule & cancellation

- 20% reschedule rate considered "perfect" baseline (penalty above this)
- Recurring bookings: 14-day cleaner-side cancellation notice
- Customer can pause/skip/cancel recurring at any time
- 5-no-shows-in-60-days hard trigger (rolling) → 1-week fixed suspension

## 2.11 — Recurring bookings

- Default cadence: every 2 weeks
- Charged per cleaning, not upfront
- Smart cadence defaults by service type:
  - Airbnb: weekly
  - Standard: biweekly
  - Deep clean: every 8–12 weeks
- Cleaners see recurring as a separate inbox stream
- Customer can pause / skip / cancel without penalty

## 2.12 — Customer reliability scoring

- Cleaners rate customers post-job
- Score visible to cleaners as **band**, not number ("Reliable customer," "Unverified," "Has had issues")
- **3 no-shows in 90 days** → restricted to request-to-book mode
- Dispute pattern feeds into score
- Customer can see their own status

## 2.13 — Match Score (customer-facing cleaner suggestions)

The algorithm that ranks cleaners on the customer's discovery page. 6 factors:

1. Distance from customer's service address
2. Tier (higher tier ranks higher, but doesn't dominate)
3. Availability (matches customer's requested window)
4. ZIP-locked badge match (huge boost if cleaner has badge for customer's ZIP)
5. Specialty match (if customer is booking a deep clean, deep-clean specialists rank higher)
6. New cleaner spotlight boost (cold-start mechanism)

### "Why am I seeing this cleaner?" transparency

Every cleaner profile includes a Match Score transparency card explaining which factors contributed. This is a deliberate trust signal — reduces "shadow algorithm" anxiety on both sides.

### New cleaner spotlight

A marketplace cold-start mechanism. New cleaners get a temporary visibility boost in their early jobs window. Without this, supply side stalls.

---

# Section 3 — Database Schema Overview

## High-level

- **PostgreSQL** (Supabase)
- **54 tables** total, organized into 6 logical groups (B1–B6)
- ~250–300 columns across all tables
- ~80 foreign-key relationships
- ~60 indexes for query performance
- ~12 enum types for constrained values
- ~8 background jobs / cron tasks
- ~6 audit/event tables for immutable history

## Identity model

- Shared `users` table for all human accounts (customer / cleaner / admin)
- Separate profile tables joined to `users` (`customer_profiles`, `cleaner_profiles`, `admin_profiles`)
- Email uniqueness enforced at `users` table
- Phone format: E.164 standardized

## The 6 logical groups

| Group | Theme                                    | Approx. tables |
| ----- | ---------------------------------------- | -------------- |
| B1    | Core identity + accounts                 | 6              |
| B2    | Bookings + lifecycle events              | ~10            |
| B3    | Trust mechanics (scoring, tiers, badges) | ~10            |
| B4    | Photos + GPS + messaging                 | ~6             |
| B5    | Money (payouts, fees, disputes, refunds) | ~10            |
| B6    | Admin + audit + jobs queue               | ~12            |

> **Note:** Exact table list is captured in `puretask_schema_overview.md` (the planning doc Claude Code generated). The corrected SQL files (B2/B5/B8 dumps) need to be re-emitted before deploy — that's a Pre-Phase 1 task.

## The five layers of the system

Building the schema alone is not enough. The full system has 5 layers, each depending on the previous:

```
1. SCHEMA            ← what exists (we have this)
2. QUERIES           ← how the app reads/writes (B1 drill)
3. SYNC RULES        ← how denormalized data stays correct (B2 drill)
4. BUSINESS LOGIC    ← how trust/score/tier mechanics work (B3 drill)
5. DEPLOYMENT        ← how it gets into a database (B4 drill)
```

B5 is the catch-all: drill into any specific table you're worried about.

## Key infrastructure pieces the schema supports

- **Exclusion constraint** on `bookings` to prevent double-booking the same cleaner at the same time (ranges-based, Postgres `EXCLUDE`)
- **Audit/event tables** for immutable history (`booking_state_event`, `score_events`, `dispute_events`)
- **Score snapshots** — nightly snapshots so you can see a cleaner's score at any past date
- **Background job queue** for cron jobs (nightly score, weekly payout, badge renewal)

---

# Section 4 — Wireframe Inventory

## Total scope

**~70 wireframes** mapped, **52+ designed** across batches.

## Batch structure

| Batch  | Theme                       | Status              | Screens |
| ------ | --------------------------- | ------------------- | ------- |
| 1 (v3) | Core dashboards & trust UX  | ✅ Designed         | 14      |
| 2      | Onboarding flow (cleaner)   | ⏳ Not yet designed | 7       |
| 3a     | Customer signup/discovery   | ⏳ Not yet designed | ~6      |
| 3b     | Customer settings & profile | ✅ Designed         | 5       |
| 4      | Booking flow + active job   | ✅ Designed         | 8       |
| 5      | Trust & reliability         | ✅ Designed         | 6       |
| 6      | Onboarding & explainers     | ✅ Designed         | 6       |
| 7      | Admin tools                 | ✅ Designed         | 7       |
| 8      | Edge cases & support        | ✅ Designed         | ~6      |

## Notable screens worth re-reading before build

- **WF 2c** — Score breakdown deep-dive (the trust story made tangible)
- **WF 2d** — Dashboard probation state (negative-state design with dignity)
- **WF 7** — Cleaner profile, customer-facing (Match Score transparency, sticky CTA)
- **WF 8** — Cleaner list page (the heavy filtering query)
- **WF 49** — Photo etiquette training
- **WF 51** — Tier system explainer
- **WF 52** — Reliability score explainer
- **WF 53** — Score change notifications (4 states including tier-drop appeal)

## Open wireframe gaps

The two remaining batches (2 and 3a) cover the customer signup gate logic and the full multi-step cleaner application form. These are pattern-matched to existing batches and can be designed when needed — they're not blocking the build plan.

---

# Section 5 — The Corrected 10-Phase Build Plan

This is the canonical build plan with all 12 gaps integrated. Time estimates assume **solo founder + new framework**. Realistic range is 30–45 weeks.

## Pre-Phase 1 — Foundation prep (parallel to Phase 1, ~2–3 weeks)

These run **alongside** Phase 1, not before. Don't block coding on them.

- [ ] Have Claude Code re-dump corrected B2/B5/B8 SQL files
- [ ] Create empty `puretask-production` Supabase project
- [ ] **Engage lawyer** for: CCPA-compliant photo policy, Cleaner ToS, Customer ToS, insurance/liability framing
- [ ] Decide on co-pilot/contractor support (even just "a friend who knows React")
- [ ] Confirm launch ZIP code(s) for supply targeting

## Phase 1 — Foundation (1–2 weeks)

1. Set up Next.js 15 project with TypeScript, Tailwind, shadcn/ui, App Router
2. Connect Next.js to Supabase dev project (env vars, client setup)
3. Deploy to Vercel ("hello world" deploy proves the pipeline)
4. Empty production Supabase exists (already done in Pre-Phase 1)
5. Establish folder structure conventions (components/, lib/, server actions, etc.)

**Deliverable:** "Hello world" deployed to Vercel, connected to dev Supabase, basic shell.

## Phase 2 — Authentication (1–2 weeks)

6. Wire up Supabase Auth — email/password
7. Build sign-in, sign-up, password reset, email verification screens (WF 36, 37)
8. Build the basic logged-in shell — header, navigation, sign-out
9. Connect `auth.users` events to your `users` table (trigger or callback)

**Deliverable:** A user can sign up, verify email, sign in, sign out.

## Phase 3 — Customer onboarding (1 week)

10. Customer signup flow → creates `users` + `customer_profiles` rows
11. Customer settings page (WF 28, 29) — manage profile, addresses, preferences
12. Address management (add/edit addresses for service)

**Deliverable:** A customer can complete a profile and add a service address.

## Phase 4 — Cleaner onboarding pipeline (3 weeks)

13. Cleaner application form (multi-step, WF 33–37 plus the unbuilt 11-step form)
14. Photo etiquette training screen (WF 49) — gated step in onboarding
15. Application submission → creates `cleaner_applications` row in `submitted` state
16. Stripe Identity verification integration
17. Checkr background check integration
18. Stripe Connect onboarding (WF 63)
19. Admin application review interface (WF 55) — approve/reject/request info

**Deliverable:** A cleaner can apply, complete identity + background + payout setup, and be approved.

## Phase 5 — Browse, discovery, and matching (3–4 weeks)

20. Customer homepage (WF 1) — service catalog, recent bookings, recommendations
21. Cleaner list page (WF 8) — the heavy query, with filters
22. Match Score algorithm — all 6 factors
23. "Why am I seeing this cleaner?" transparency card
24. New cleaner spotlight boost
25. Cleaner profile page (customer-facing, WF 7)

**Deliverable:** A customer can browse, filter, and view cleaner profiles with full Match Score transparency.

## Phase 6 — Booking transaction (5–6 weeks — THE BIGGEST)

This is the hardest phase. **Half your bugs will live here.** Sub-phases must be respected.

### 6a — Stripe customer payment (~1 week)

26. Stripe customer payment method setup
27. Booking flow UI (selecting service, time, cleaner, address)
28. Booking creation transaction (insert booking + booking_state_event + Stripe authorize)

### 6b — In-app messaging infrastructure (~1 week)

29. Encrypted in-app messaging (booking-scoped)
30. 4-hour response SLA tracking

### 6c — Cleaner-side acceptance (~3 days)

31. Cleaner-side booking acceptance (WF 3, 4-hour SLA, expiration)

### 6d — GPS and "On my way" infrastructure (~1 week)

32. GPS ping system (3-min cadence during transit)
33. Geofence trigger for clock-in (100m radius)
34. "On my way" page state machine (2hr enable, entry instruction reveal, push notification)

### 6e — Active job tracking + photo system (~1.5 weeks)

35. Active job tracking (WF 4, 5, 9 — arrived, in progress, completing)
36. Photo upload system (with 15-min first-photo rule)
37. Photo encryption at rest, 90-day deletion job
38. Before-clock-out photo gate
39. Customer photo opt-out flow (with dispute waiver acknowledgment)

### 6f — Approve and pay (~3 days)

40. Approve and pay flow (WF 10) with Stripe charge capture
41. 24-hour auto-approval cron job

### 6g — Recurring bookings (~1 week)

42. Recurring booking setup (WF 21, 22)
43. Smart cadence defaults by service type
44. Cleaner-side recurring stream

**Deliverable:** End-to-end loop — book, accept, on-my-way, clock-in, photos, clock-out, approve, pay.

## Phase 7 — Trust systems (3–4 weeks)

45. Reliability score calculation (nightly cron, all 6 metrics)
46. Tier transition logic (14-day buffer, 48-hour appeal)
47. Score snapshots and history
48. Probation state UI (WF 2d)
49. Score breakdown deep-dive (WF 2c)
50. Tier system explainer (WF 51)
51. Reliability score explainer (WF 52)
52. Score change notifications (WF 53, all 4 states)
53. **Badge system** — sub-phase:
    - Badge schema + earning logic
    - ZIP-locked badge calculation (per-ZIP tracking)
    - Tier-locked variant logic
    - Display rules
    - Renewal/decay logic with notifications
54. **Customer reliability scoring** — parallel to cleaner scoring
    - Cleaner-rates-customer post-job
    - Band visibility to cleaners
    - 3-no-shows-in-90-days hard trigger

**Deliverable:** Full trust mechanics live, tier system functional, badges earnable.

## Phase 8 — Disputes (3 weeks)

55. Dispute creation (48-hour window after approval)
56. Dispute thread UI (cleaner offers re-clean / partial refund / stand by work)
57. Photo-evidence direct resolution
58. 24-hour customer auto-approval cron
59. Admin mediation interface
60. Frivolous claim tracking (1st warning, 2nd flag, 3rd restriction)
61. Dispute pattern feed into customer reliability score

**Deliverable:** Full dispute lifecycle from creation to resolution, with admin tools.

## Phase 9 — Money operations (2–3 weeks)

62. **Tier-aware commission calculation engine** — sub-phase:
    - Reads cleaner's tier at moment of payout
    - Reads cleaner's job count for Rising Pro 12% window check
    - Returns commission rate
63. Friday weekly payout batch job
64. Instant payout flow (5% fee)
65. $15 first-cleaning apology credit logic
66. Payout history and statements (cleaner side)
67. Receipt generation (customer side)

**Deliverable:** Money flows correctly in both directions, with tier-aware commission.

## Phase 10 — Polish & marketing (3–4 weeks)

68. Notifications (push, email, SMS) — design + delivery
69. Empty states, error states, loading states
70. First-time tours (WF 48)
71. Marketing pages (about, how it works, FAQ)
72. SEO landing pages (12 NorCal city × service combos — defer to post-launch if scope creeps)

**Deliverable:** Launch-ready polish.

## Honest tradeoffs in this sequence

**Stripe Connect, Checkr, Identity verification in Phase 4 (not the end).** These are hard integrations. Putting them late makes launch unpredictable. Tackling them mid-build, when you have momentum, lets you debug without launch pressure.

**Admin tooling pulled into Phase 4.** Cleaners need approval before they can do anything. Admin review tooling is therefore a hard dependency for the cleaner side.

**Phase 6 split into 7 sub-phases.** This is the only phase where I aggressively recommend respecting the sub-phase boundaries. Trying to do "the booking flow" as a single push is how marketplaces ship in 18 months instead of 9.

---

# Section 6 — Pre-Phase 1 Checklist

These are the things to do this week or next, before Phase 1 begins. They run in **parallel** with Phase 1, not before.

## Legal (start immediately)

- [ ] Identify and contact 2–3 California-based marketplace/tech lawyers
- [ ] Initial consult to scope: ToS, photo/CCPA policy, contractor classification, liability framing
- [ ] Get a quote and engagement letter
- [ ] Begin draft of Cleaner ToS
- [ ] Begin draft of Customer ToS
- [ ] Draft CCPA-compliant photo policy
- [ ] Decide insurance approach (cleaner-responsible model + opt-in Insurance Verified badge)

## Schema & infrastructure

- [ ] Have Claude Code re-dump corrected B2/B5/B8 SQL files
- [ ] Create empty `puretask-production` Supabase project
- [ ] Confirm dev Supabase project is healthy
- [ ] Document env-var conventions (.env.local for dev, Vercel env for prod)

## Operational decisions

- [ ] Decide on co-pilot/contractor approach (named human you can ask, even informally)
- [ ] Confirm launch ZIP code(s)
- [ ] Outline cleaner-recruitment plan for cold-start (you'll need 5–10 cleaners ready before customer launch)

## Communication

- [ ] Set up project tracking (Linear, Notion, GitHub Projects — pick one and stick with it)
- [ ] Set up a separate dev journal (you've been keeping these — good practice)

---

# Section 7 — Risk Flags & Honest Tradeoffs

This section exists because the user preferences explicitly ask for honest critique, not just hype. Read this before any major decision.

## Risk 1: The estimate is optimistic

Solo founder + new framework + first marketplace project usually takes **1.5–2x** longer than optimistic estimates. The 30–45 week range already accounts for this, but real life has a way of adding more. **Plan for 12 months, not 9, and treat 9 as a stretch goal.**

## Risk 2: Phase 6 is the killer

The booking transaction phase touches: Stripe (multi-step charge flow), the database (multi-table transactions), state management (booking states), real-time updates (cleaner sees new bookings), notifications (multiple parties), the exclusion constraint (handling double-booking errors gracefully), photo upload, GPS, and messaging.

**Half your bugs will live here.** Allocate 5–6 weeks honestly. If you find yourself at 3 weeks and "almost done," you're not — you're missing edge cases.

## Risk 3: The schema is large

54 tables is a lot for a solo founder. The schema reflects everything we designed because we designed thoroughly. But it's also an option to **scope down to a simpler V1**:

| Drop for V1                                          | Adds back in V2       |
| ---------------------------------------------------- | --------------------- |
| ZIP-locked badges (use general "Trusted" badge only) | ZIP-locked logic      |
| Recurring bookings                                   | Recurring schema + UI |
| New cleaner spotlight                                | Cold-start boost      |
| Multi-tier badge variants (one badge per category)   | Tier-locked variants  |
| Specialty endorsements                               | Specialty system      |

A scoped-down V1 lands in 4–5 months. The full plan lands in 9–12. **The schema supports both paths** — you can launch with most tables empty and fill them in V2.

**My recommendation:** Don't scope down. The trust story is what makes PureTask different, and trust requires the full system. But if life forces you to choose, the table above is the cut list.

## Risk 4: Brand drift toward "casual marketplace"

Watch for the pull toward "give cleaners more flexibility" — we identified this pattern during system design. Each request feels reasonable in isolation, but cumulatively they shift PureTask's identity from premium trust to casual gig. Re-read Section 1 ("Brand identity") before agreeing to any feature that loosens scheduling, accountability, or proof requirements.

## Risk 5: CCPA cannot be retrofitted

Build photo capture **after** the policy is in place. Building it first and bolting on policy later is a regulatory liability in California. The lawyer engagement in Pre-Phase 1 is non-negotiable — not just nice-to-have.

## Risk 6: Solo coding gets lonely and dangerous

Solo founders go deep into bad patterns alone because no one is reading their code. Even 5–10 hours of senior contractor review at key milestones (after Phase 2, Phase 6, Phase 7) prevents this. **Worth budgeting $500–1500 for this. Real money saver.**

## Risk 7: The 12% Rising Pro window incentive

The 12% commission for Rising Pros' first 6 jobs is a strong recruiting tool. But it also means a cleaner who games the platform (creates a new account after graduating) gets an unfair re-entry. **Mitigation:** tie graduation tracking to identity-verified user, not account. Important to enforce in code.

---

# Section 8 — What To Do This Week

The first 5 actions, ordered. Do not skip ahead.

## Action 1 — Engage the lawyer (this week)

The single longest-lead-time item. Until you have ToS drafts and a CCPA-compliant photo policy in motion, Phase 6 is at risk. Find 2–3 lawyers, schedule consults, get a quote.

## Action 2 — Re-dump the corrected schema (this week or next)

In a Claude Code session, ask for clean SQL output of B1–B6 with the corrections applied to B2/B5/B8. Save to a `db/migrations/` folder in your repo. This is your safety net if you need to redeploy.

## Action 3 — Create the production Supabase project (5 minutes)

Just create it. Empty. Don't migrate anything yet. Having it exist with a known name and URL means you don't make this decision under launch pressure later.

## Action 4 — Decide on co-pilot support

Ask one developer friend if they'd be willing to do quarterly code reviews. Or set aside $500–1500 for senior contractor reviews at Phase 2, 6, and 7 milestones. Make the decision now so you don't end up in week 20 alone in a pattern hole.

## Action 5 — Begin Phase 1

Start the Next.js project. Get to "hello world deployed on Vercel, connected to Supabase dev." This is 1–2 weeks of work and sets the foundation for everything.

---

# Appendix A — Glossary

- **WF** — Wireframe
- **B1–B6** — The six logical groups of the database schema
- **Rising Pro / Proven Specialist / Top Performer / All-Star Expert** — The 4 tiers
- **ZIP-locked badge** — A reputation badge tied to a specific ZIP code where the cleaner has performed well
- **Match Score** — The 6-factor algorithm ranking cleaners on the customer's discovery page
- **Active booking phases (1–6)** — Confirmed → Imminent → In-transit → In-progress → Awaiting approval → Closed
- **14-day demotion buffer** — Score must remain below tier threshold for 14 consecutive days before tier drops
- **48-hour appeal window** — Time after a tier-drop notification during which the cleaner can appeal
- **Veteran cushion** — Long-tenured cleaners get a slightly larger buffer
- **Frivolous claim** — A customer damage claim that is denied based on photo evidence

# Appendix B — Decision log discipline

When you change a decision in this document:

1. Update the relevant section
2. Add a line to the bottom of the section: `Updated [date]: [what changed and why]`
3. If the change affects schema or build phase, update those sections too
4. Mention the change in your dev journal so future-you knows when and why

This is the difference between a real reference doc and a fossilized PDF.

---

**End of master guide.**
