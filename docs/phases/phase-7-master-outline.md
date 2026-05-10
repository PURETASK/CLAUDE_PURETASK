# PureTask — Phase 7 Master Outline

**Purpose:** A single navigation document for everything in Phase 7 (the trust system: scores, tiers, badges, appeals), organized by sub-phase. Goal / Design / Build / Verify format for each section.

**Status:** Outline-level navigation. Detailed acceptance criteria, specific code, and gotchas live in `phase-7a-spec.md` (and future per-sub-phase specs). The why-behind-every-decision lives in `phase-7a-explainer.md` (and future).

**Phase scope:** Phase 7 is **the platform's accountability layer**. Cleaners earn or lose score based on behavior. Score determines tier. Tier determines commission rate + rate ceiling + visibility. Badges (ZIP-locked + specialty) reward sustained excellence. Appeals provide due process. By the end of Phase 7, the platform has a live, auditable, fair system that meaningfully differentiates good cleaners from inconsistent ones.

**Phase duration estimate:** 6-7 weeks of focused engineering across 3 sub-phases. 7a sequential; 7b sequential after 7a; 7c can run in parallel with 7b.

**Phase depends on:**
- Phase 6a complete (bookings exist with confirmed/cancelled/completed states; reschedule + cancellation events fire)
- Phase 6f complete (reviews + traits exist; auto-approval + manual approval events fire)
- Phase 6e complete (photo compliance events fire — required photos uploaded vs missing)
- Phase 6d complete (lateness events fire; on-time arrival measurable)
- Phase 6b complete (communication response time measurable)
- B3 + B4 schemas deployed (already done — reliability_events, reliability_score_snapshots, tier_assignments, cleaner_appeals, badges, specialties tables exist)
- At least 10 active cleaners with bookings flowing (so score recalc has real data)

**Wireframes covered by Phase 7:**

| Sub-phase | Primary wireframes | Theme |
|---|---|---|
| 7a | WF 2 (score badge), WF 2c (score breakdown), WF 51 (tier explainer), WF 52 (score explainer), WF 64 (trust page) | Score calc + tier engine |
| 7b | WF 53 (4 notification states), WF 19 (notification center cleaner-side) | Score events + notifications + appeals |
| 7c | WF 65 (ZIP-locked badge detail), WF 66 (specialty endorsement detail), WF 7 (cleaner profile badges section) | Badges (ZIP-locked + specialty) |

---

## How to read this document

Each sub-phase has the four-heading format:
- **Goal** — what this sub-phase accomplishes in plain English
- **Design** — decisions to make before writing code
- **Build** — concrete files, components, migrations, integrations
- **Verify** — how you know it works

If a section doesn't list a Design step, that means decisions are settled in the schema or wireframes — just build to spec.

---

## Phase 7 sub-phase overview

| Sub-phase | Title | Estimated weeks | Critical dependencies |
|---|---|---|---|
| **7a** | Score calculation + tier engine | 3 | Phase 6a/6d/6e/6f/6b complete |
| **7b** | Score events + notifications + appeals | 1.5 | 7a complete |
| **7c** | Badges (ZIP-locked + specialty) | 2 | 7a complete (uses score data) |

**Critical ordering rule:** 7a must ship before everything else. 7b and 7c can run in parallel after 7a is done. 7c benefits from 7a's score history but doesn't strictly require 7b.

---

# Phase 7 — Lock-in decisions (must resolve before any sub-phase ships)

These five inconsistencies surfaced from the wireframe deep dive. Phase 7 spec **must** lock them before any score-impacting code ships. Each has a recommendation + rationale.

## Lock 1 — Rising Pro commission rate

**The conflict:** WF 2b (cleaner dashboard empty state) shows Rising Pro at "12% (first 6 jobs)." WF 51 (tier explainer) shows Rising Pro at 15% standard with "First 6 jobs at 12% fee while you build reputation."

**Lock:** WF 51 is authoritative. Rising Pro standard commission = **15%**. First 6 completed jobs as Rising Pro = **12% apprenticeship rate**.

**Action:** Update WF 2b copy in next wireframe revision. Phase 7a commission engine implements both rates with `cleaner_profiles.lifetime_completed_jobs < 6 ? 0.12 : 0.15` for Rising Pro.

## Lock 2 — Background check renewal cadence

**The conflict:** WF 33 (background check status) says renewal in 24 months ("Renews Sep 14, 2026" from Sep 14, 2024). WF 64 (trust page) says "Renews every 12 months."

**Lock:** **12 months** (per WF 64). Frequent renewal is more trustworthy + matches industry standard for cleaning marketplaces.

**Action:** Update WF 33 copy. Phase 4 background check renewal cron uses 12-month cadence. Notifications fire at 60d and 30d before expiration.

## Lock 3 — Recurring tier gating

**The conflict:** WF 51 (tier explainer) says "Recurring bookings unlock here" at Proven Specialist tier, implying Rising Pros can't do recurring. WF 11 (customer dashboard) and WF 21 (recurring setup) don't gate recurring by tier.

**Lock:** **Recurring NOT tier-gated.** All tiers, including Rising Pro, can have recurring relationships.

**Action:** Update WF 51 copy. Edit Proven Specialist value prop to "Established relationships start showing up here" or similar — keep the differentiator without falsely gating.

## Lock 4 — Tier transition rules

**The conflict:** WF 51 says "14 consecutive days at a different score band before your tier shifts." WF 2c (score breakdown) mentions "Veteran cushion — 30-day buffer for established cleaners." Different mechanisms?

**Lock:** **Both apply, additively.** 14-day standard gate = baseline transition window for all cleaners. Veteran cushion = additional 30 days for cleaners with 90+ completed jobs (definition of "established"). So:
- New cleaner falls below tier band → tier moves after 14 consecutive days
- Veteran cleaner falls below tier band → tier moves after 14 + 30 = 44 consecutive days

**Action:** Phase 7a tier engine implements both gates. Phase 7b notifications surface "tier drop pending" warnings appropriately for both new and veteran cleaners.

## Lock 5 — Reschedule scoring rules

**The conflict:** WF 52 implies cleaner-initiated reschedules penalize but customer-initiated don't. Master Guide ambiguous on the grace mechanic.

**Lock:** Three-rule system:
- **Customer-initiated reschedules**: zero score impact for cleaner (always)
- **Cleaner-initiated reschedule with ≥48h notice**: small score penalty
- **Cleaner-initiated reschedule with <48h notice**: larger penalty
- **First cleaner-initiated reschedule per rolling 30-day window**: penalty waived (one-grace-per-month)

**Action:** Phase 7a score event handler for `booking.rescheduled` event reads initiator + notice timing + checks 30-day grace. Lock these specific deltas in spec section 5.

---

# Phase 7a — Score calculation + tier engine (3 weeks)

**Phase 7a goal:** A cleaner's reliability score is computed nightly from 6 weighted factors. Score determines tier. Tier transitions follow the 14-day standard gate + 30-day veteran cushion. Commission rate per tier is enforced at payment capture (Phase 6f integration). Score breakdown (WF 2c) shows current factor stats. Tier explainer (WF 51) is fully wired with current rate panel.

**Phase 7a depends on:**
- Phase 6 sub-phases producing the events that feed score factors
- B4 schema deployed (reliability_events, reliability_score_snapshots, tier_assignments)
- At least 10 cleaners with 5+ bookings each for testing

**Wireframes:** WF 2 (cleaner dashboard score badge), WF 2c (score breakdown drill-down), WF 51 (tier explainer), WF 52 (score explainer), WF 64 (customer-facing trust page elements that reference tier system).

**Sub-sections of 7a:**

## 7a-1 — Score event ingestion

### Goal
Event handlers for every score-impacting action across the platform write `reliability_events` rows with correct `metric_category`, `point_delta`, and metadata.

### Design

**Decisions to make:**

1. **Event handler architecture.** Centralize via a dispatcher function `recordReliabilityEvent({cleaner_id, booking_id, event_type, ...})`. Phase 6 sub-phases call this; they don't insert into `reliability_events` directly. Single point for: validation, point_delta computation, metadata serialization, snapshot trigger.

2. **Point delta computation.** Stored explicitly on each event (audit pattern; B4 schema). Compute at write time, not read time, so historical events stay accurate even if weights change.

3. **Metric category mapping** (locked from WF 52):
   - `on_time_arrival` (25% weight) — late arrivals, on-time arrivals, no-shows
   - `job_completion` (25% weight) — completions, cleaner-side cancellations
   - `photo_compliance` (15% weight) — photo upload completeness
   - `customer_ratings` (15% weight) — review star ratings
   - `communication` (10% weight) — message response time
   - `reschedule_frequency` (10% weight) — cleaner-initiated reschedules

4. **Event types per category** (final list below; lock in spec):

   On-time arrival category:
   - `late_arrival_with_notice_lt15min` — delta 0
   - `late_arrival_with_notice_15_30min` — delta -1
   - `late_arrival_with_notice_30plus_min` — delta -3
   - `late_arrival_no_notice_15plus_min` — delta -5
   - `no_show` — delta -10
   - `on_time_arrival` — delta +1 (capped at 5/week to prevent gaming)

   Job completion category:
   - `booking_completed` — delta +2
   - `cleaner_cancellation_24h_plus` — delta -3
   - `cleaner_cancellation_under_24h` — delta -8
   - `cleaner_cancellation_under_2h` — treat as no-show (delta -10)

   Photo compliance category:
   - `photos_complete_required_only` — delta 0 (baseline)
   - `photos_complete_with_voluntary_extras` — delta +1
   - `photo_integrity_concern` — delta -3 (admin reviews)
   - `photos_missing_after_clockout_attempt` — delta -2 (cleaner forced to retry)

   Customer ratings category:
   - `review_5_star` — delta +1
   - `review_4_star` — delta +0
   - `review_3_star` — delta -1
   - `review_2_star` — delta -3
   - `review_1_star` — delta -5

   Communication category:
   - `message_response_under_30min` — delta +0 (baseline expectation)
   - `message_response_30min_to_2h` — delta +0
   - `message_response_2h_to_8h` — delta -1
   - `message_response_over_8h` — delta -2

   Reschedule frequency category:
   - `customer_initiated_reschedule` — delta 0
   - `cleaner_reschedule_48h_plus_first_per_month` — delta 0 (grace)
   - `cleaner_reschedule_48h_plus_subsequent` — delta -2
   - `cleaner_reschedule_under_48h_first_per_month` — delta -1 (grace reduced)
   - `cleaner_reschedule_under_48h_subsequent` — delta -5

   Admin adjustments:
   - `admin_manual_adjustment` — delta variable, requires admin_id + reason in metadata

5. **Idempotency.** Some events can fire twice (e.g., booking_completed could be triggered by clock-out and by capture). Use `(booking_id, event_type)` as a deduplication key. `reliability_events` should have a partial unique index.

### Build

- `lib/reliability/event_dispatcher.ts` — `recordReliabilityEvent()` function
- `lib/reliability/event_types.ts` — type enums + delta computation
- `lib/reliability/event_grace_check.ts` — 30-day rolling grace logic for reschedule + decline
- Phase 6 integration calls (modify Phase 6a/d/e/f to call dispatcher at right moments)

### Verify

- Event handler called with each booking lifecycle event produces correct event row
- Idempotency: same event fired twice produces 1 row
- Grace logic: first cleaner-reschedule of the month is graced; second is penalized
- All metric_category enums align with B4 schema

## 7a-2 — Nightly score recalc cron

### Goal
A cron runs nightly at 3 AM Pacific that recomputes every active cleaner's reliability score from their last 90 days of `reliability_events`. Score is stored on `cleaner_profiles.reliability_score` + a snapshot row in `reliability_score_snapshots`.

### Design

1. **90-day rolling window.** Score reflects recent behavior, not lifetime. Events older than 90 days don't affect current score.

2. **Score formula.**

   ```
   For each metric_category:
     factor_score = 100 - sum(point_deltas for events in 90-day window in this category)
                       (clamped 0 to 100)

   reliability_score = sum(factor_score * factor_weight)
                       (rounded to integer, clamped 0 to 100)
   ```

3. **Excluded events.** Events with `is_overturned = TRUE` (admin appeal accepted) are excluded from the sum.

4. **Snapshot per night.** Insert one `reliability_score_snapshots` row per cleaner per night, including all 6 factor scores. Used for WF 2c history graph + audit trail.

5. **Concurrency.** Cron iterates cleaners; each cleaner is independent. Use Postgres advisory locks per cleaner_id to prevent double-processing if cron runs overlap.

6. **Performance target.** 1000 active cleaners → recalc completes in <5 minutes total. Per-cleaner ~300ms acceptable.

7. **Initial value for new cleaners.** New approved cleaners start with `reliability_score = 50` (mid-range, neither punished nor rewarded). After their first 5 completed bookings, score reflects actual performance.

### Build

- `jobs/reliability_score_recalc.ts` — nightly cron handler
- `lib/reliability/score_calculator.ts` — pure function: events → factor scores → composite
- `lib/reliability/snapshot_writer.ts` — writes `reliability_score_snapshots` row
- Cron schedule: Vercel Cron `0 3 * * *` Pacific (or `pg_cron` equivalent)

### Verify

- Cron runs nightly successfully (monitor first 7 days post-deploy)
- Recalc on 100 cleaners completes <30 seconds
- Score values match hand-computed expectations on test data
- New cleaner with 0 events: score = 50
- Cleaner with all-positive events: score capped at 100
- Cleaner with all-negative events: score floored at 0

## 7a-3 — Tier engine + transitions

### Goal
A second cron at 4 AM Pacific (after score recalc) evaluates each cleaner's score against tier band thresholds. Applies the 14-day standard gate + 30-day veteran cushion. Triggers `tier_assignments` rows for transitions. Notifies cleaner via Phase 7b (stub for now if 7b not yet built).

### Design

1. **Tier bands (locked):**
   - **Rising Pro**: score 0-59, $25-35/hr, 15% commission (12% first 6 jobs)
   - **Proven Specialist**: score 60-74, $35-50/hr, 13% commission
   - **Top Performer**: score 75-89, $50-65/hr, 11% commission
   - **All-Star Expert**: score 90+, $60-80/hr, 10% commission

2. **Transition gates:**
   - Standard: 14 consecutive days at a score in different tier band
   - Veteran cushion: additional 30 days IF cleaner has 90+ completed jobs (prevents whiplash for established cleaners)
   - Total gate for veterans = 14 + 30 = 44 consecutive days

3. **Tier promotion:** Score crosses upward into new band → 14 consecutive days check → promote.

4. **Tier drop:** Score crosses downward into lower band → 14 (or 44) consecutive days check → drop.

5. **Pre-warning for drops.** Once cleaner is at day 13 of a pending drop (or day 43 for veterans), trigger Phase 7b "tier drop warning" notification with 48-hour appeal window. If appeal not submitted within 48h: drop proceeds. If appeal submitted: drop pauses pending admin review.

6. **First-6-jobs apprenticeship tracking.** `cleaner_profiles.lifetime_completed_jobs` increments on each `booking_completed` event. Commission engine reads this for Rising Pros: < 6 → 12%; ≥ 6 → 15%.

7. **Tier assignment immutability.** Each tier change creates a new `tier_assignments` row. Old assignment marked `ended_at`. Append-only history.

### Build

- `jobs/tier_evaluation.ts` — daily cron (after score recalc)
- `lib/reliability/tier_calculator.ts` — pure function: score → tier band
- `lib/reliability/transition_gate_checker.ts` — checks consecutive-day window + veteran status
- `lib/reliability/tier_promotion_handler.ts` — celebrates promotion (calls Phase 7b notification)
- `lib/reliability/tier_drop_handler.ts` — issues 48h appeal warning then drop
- Cron schedule: Vercel Cron `0 4 * * *` Pacific

### Verify

- Cleaner score moves into higher band → 14-day gate counter starts → promotion fires after 14 consecutive days
- Veteran (90+ jobs) score drops into lower band → 44-day gate (14+30) before drop
- Pre-warning fires at day 13 (or 43)
- Appeal submitted within 48h pauses drop until admin reviews
- First-6-jobs tracking: completed_jobs increments correctly

## 7a-4 — Score breakdown + tier explainer UI integration (WF 2c, WF 51, WF 52)

### Goal
Cleaner-facing UI surfaces the score system transparently. WF 2c shows score breakdown with all 6 factors and recent events. WF 51 shows tier explainer with current tier highlighted, distance to next, and current rate panel. WF 52 shows score explainer in detail.

### Design

1. **Read-only surfaces.** None of these screens edit data. They render queried state.

2. **WF 2c data sources:**
   - Current score from `cleaner_profiles.reliability_score`
   - 6 factor scores from latest `reliability_score_snapshots` row
   - Recent events from `reliability_events` ordered by created_at DESC, limit 20
   - Pending tier-drop status from `tier_assignments` flagged pending_drop

3. **WF 51 data sources:**
   - Current tier from `tier_assignments.WHERE ended_at IS NULL`
   - Distance to next tier = next_band_threshold - current_score
   - Current rates from `cleaner_profiles.hourly_rates JSONB` per service

4. **WF 52 data sources:** Same as 2c but framed differently (more help-content style).

5. **Recommendation engine** (per WF 2c.9 + WF 52.3): identify the metric_category contributing the most negative drag, return advice text. Pure function `getWeakestFactor(factor_scores)`.

### Build

- `/cleaner/dashboard` augmented with score badge (already in Phase 4-5; verify renders correctly)
- `/cleaner/score-breakdown` (WF 2c) — drill-down route
- `/cleaner/tiers` (WF 51) — tier explainer
- `/cleaner/score` (WF 52) — score explainer
- Components: `ScoreFactorRow`, `RecentEventRow`, `TierBandCard`, `RecommendationPanel`, `RatePanelInline`
- Server actions: query helpers (read-only)

### Verify

- Score breakdown renders all 6 factors with current stats
- Tier explainer highlights current tier; shows distance to next
- Rate panel matches cleaner's actual configured rates
- Recommendation engine flags weakest factor correctly on test data

## 7a-5 — Commission engine integration with Phase 6f

### Goal
At payment capture (Phase 6f), commission is computed from cleaner's current tier (and Rising Pro apprenticeship status). Cleaner balance receives `total - platform_fee - commission`. Tip pass-through stays at 100%.

### Design

1. **Lookup at capture time, not booking time.** Commission rate is set by tier at the moment of capture, not at booking creation. If cleaner promotes between booking and capture, they get the better rate (rare; mostly in long-lead recurring).

2. **Tip handling.** Tips are separate Stripe charges (per Phase 6f). 100% of tip goes to cleaner. No commission on tips.

3. **Booking fee.** $9.99 booking fee always goes to platform. Independent of tier.

4. **Output:** `cleaner_payouts` row (B5 schema) with broken-down amounts:
   - `gross_cents` = booking total in cents
   - `booking_fee_cents` = 999
   - `commission_cents` = (gross - 999) * tier_commission_rate
   - `cleaner_amount_cents` = gross - 999 - commission

### Build

- `lib/payouts/commission_calculator.ts` — pure function: tier + amount → splits
- Phase 6f integration: call this at `payment_intent.captured` webhook
- Verify Friday payout cron (Phase 9) reads `cleaner_payouts` correctly

### Verify

- Capture for Top Performer at $125.99: cleaner gets $125.99 - $9.99 - 11%(of $116) = $103.36
- Capture for Rising Pro on job 3: 12% apprenticeship rate applied
- Capture for Rising Pro on job 7: 15% standard rate applied
- Tip $10: cleaner gets full $10

---

# Phase 7b — Score events + notifications + appeals (1.5 weeks)

**Phase 7b goal:** When score-impacting events fire, cleaners get appropriate notifications. The 4 notification states from WF 53 are wired (small positive, drop, tier promotion, tier drop warning). Tier appeal flow works end-to-end: cleaner submits appeal within 48h → admin reviews → outcome routes back to cleaner. Appeal-accepted reverses the score event via `is_overturned`.

**Wireframes:** WF 53 (4 notification states), WF 19 (notification center cleaner-side), WF 53.4.1 (appeal submission flow).

## 7b-1 — Score event notifications (WF 53 patterns)

### Goal
Each `reliability_event` row that crosses notification thresholds triggers the right notification flavor.

### Design

1. **Notification state matrix:**

   | Trigger | Notification |
   |---|---|
   | Score change ±1 to ±2 (small) | Push only (WF 53.1) |
   | Score change ±3 or more (drop) | Push + in-app banner (WF 53.2) |
   | Tier promotion | Full-screen modal + push (WF 53.3) |
   | Tier drop pending (day 13 or 43) | Full-screen modal + push + email (WF 53.4) |

2. **Causal explanation.** Each notification includes the cause (e.g., "Sarah K. left a 5-star review"). Reads from event metadata.

3. **Throttling.** If 5 small +1 events fire same day, batch into single "Today's score changes: +5" notification end-of-day.

4. **Recovery CTA.** Score drop notifications include "See details" link → WF 2c.

5. **Pause cleanup.** Once tier drop warning issued, suppress further small-positive notifications until appeal window resolves (avoid mixed signals).

### Build

- `lib/reliability/notification_dispatcher.ts` — maps event → notification template
- Notification templates per state (uses Phase 10 notification infrastructure)
- Throttle logic: aggregate same-cleaner same-day same-direction events

### Verify

- Single +1: push delivered with "Sarah K. left a 5-star review"
- Score drop -3: push + in-app banner
- Tier promotion: full-screen modal on next app open + push immediately
- Tier drop pending: full-screen modal + push + email; 48h countdown visible

## 7b-2 — Tier appeal submission (WF 53.4.1)

### Goal
Cleaner with a pending tier drop can submit a one-paragraph appeal within 48h. Appeal goes into admin queue. Tier drop pauses pending admin decision.

### Design

1. **`cleaner_appeals` table exists in B4.** Phase 7b wires application.

2. **One-free-per-drop limit.** Track appeals per `tier_assignments` row. Cleaner gets ONE appeal per drop event. Subsequent appeals on same drop = blocked.

3. **48-hour countdown.** Starts at warning time (day 13 of pending drop). After 48h: drop proceeds. If appeal submitted before 48h: drop paused.

4. **Appeal categories (suggested in WF 53.4):** medical, family, customer issue, other. Optional one-paragraph explanation.

### Build

- `/cleaner/appeals/submit/[tier_assignment_id]` route
- `AppealSubmissionForm` component with category radio + textarea (max 500 chars)
- Server action: insert `cleaner_appeals` row + flag tier drop as paused
- Validation: 48h window enforcement

### Verify

- Cleaner submits appeal within 48h → row inserted; tier drop paused
- Cleaner attempts second appeal on same drop → blocked
- 48h passes without appeal → tier drop proceeds

## 7b-3 — Admin appeal review (admin tooling)

### Goal
Admin sees pending appeals in a queue. Reviews context (cleaner history, recent events, appeal text). Decides: approve (overturn drop), deny (drop proceeds), or modify (custom outcome). Cleaner notified.

### Design

1. **Admin queue surface.** Add appeals queue to admin dashboard (WF 54 attention area).

2. **Decision options:**
   - **Approve** — overturn the score events causing the drop. Set `is_overturned = TRUE` on relevant events. Score recalcs cleaner; tier promotes back.
   - **Deny** — drop proceeds. Cleaner notified with admin reason.
   - **Modify** — partial overturn (e.g., overturn only specific events). Custom resolution.

3. **Decision rationale required.** Same pattern as Phase 8 dispute mediation. Visible to cleaner.

4. **Cleaner notification.** Appeal outcome triggers push + email.

### Build

- Admin appeals queue (extends WF 54)
- `/admin/appeals/[appeal_id]` review screen
- Server action: decision handler + score recalc trigger
- Notification template for outcome

### Verify

- Admin approves appeal → events flagged overturned → score recalcs → tier reverts
- Admin denies appeal → tier drops as scheduled → cleaner notified with reason
- Cleaner can submit one appeal per tier-drop event

---

# Phase 7c — Badges (ZIP-locked + specialty) (2 weeks)

**Phase 7c goal:** Two parallel badge systems wired and visible. ZIP-locked badges (Top-rated in 94110, Trusted by neighbors, Customer favorite) reward sustained local excellence. Specialty badges (Eco-friendly, Pet-friendly, Move-out specialist, Airbnb expert, Allergen-aware, On-time pro) reward customer-confirmed traits. Both display on cleaner cards (Phase 5 integration) and profile (WF 7).

**Wireframes:** WF 65 (ZIP-locked badge detail), WF 66 (specialty endorsement detail), WF 7 (cleaner profile badges section).

## 7c-1 — ZIP-locked badge system

### Goal
A nightly cron evaluates each cleaner's per-ZIP performance. Awards ZIP-locked badges based on threshold criteria. Badges expire after 6 months and re-evaluate.

### Design

1. **Badge types** (locked):
   - **Top-rated in [ZIP]**: 25+ cleanings in ZIP + 4.7+ avg rating + active last 90 days
   - **Trusted by neighbors in [ZIP]**: 10+ cleanings + 4.5+ avg rating
   - **Customer favorite in [ZIP]**: 5+ active recurring relationships in ZIP

2. **Per-ZIP scoping.** Same cleaner can hold multiple ZIP-locked badges (one per ZIP they're active in). Profile shows top 3.

3. **6-month re-eval.** Badge `expires_at` = earned_at + 6 months. At expiry, re-evaluate: if criteria still met, renew; if not, badge ends.

4. **Schema.** Use B4 `badges` + `cleaner_badges` tables. Add `zip_code` column to `cleaner_badges` for ZIP-locked variants.

### Build

- `jobs/zip_badge_evaluator.ts` — daily cron
- `lib/reliability/zip_badge_calculator.ts` — pure function: cleaner + ZIP → eligible badges
- Schema migration: ALTER TABLE cleaner_badges ADD COLUMN zip_code TEXT
- WF 65 detail page

### Verify

- Cleaner with 26 cleanings in 94110 + 4.8 avg → earns Top-rated in 94110
- Cleaner with 15 cleanings in 94110 + 4.6 avg → earns Trusted by neighbors in 94110 (not Top-rated; criteria not met)
- 6 months pass without performance maintenance → badge expires

## 7c-2 — Specialty badge system

### Goal
Specialty badges unlock when 15+ customers tag a cleaner with the matching trait in reviews AND the cleaner has self-listed the specialty. Decay after 90 days of misalignment.

### Design

1. **Specialty types** (locked):
   - 🌿 Eco-friendly
   - 🐈 Pet-friendly
   - 📦 Move-out specialist
   - 🏠 Airbnb expert
   - 🤧 Allergen-aware
   - ⏰ On-time pro

2. **Earning criteria:**
   - Cleaner self-listed the specialty in `cleaner_specialties` (Phase 4 onboarding)
   - 15+ reviews tagged the matching trait via `review_traits` table

3. **Decay rule:** Rolling 90-day window. If recent (last 90 days) reviews don't continue tagging the trait at sufficient rate, badge fades.

4. **Specialty badge ≠ ZIP-locked.** Specialty applies platform-wide. Cleaner has the badge regardless of ZIP.

5. **Schema.** Use B4 `cleaner_specialties` for self-listings + `cleaner_badges` for awarded badges (with badge_type = specialty_X).

### Build

- `jobs/specialty_badge_evaluator.ts` — daily cron
- `lib/reliability/specialty_badge_calculator.ts` — pure function
- WF 66 detail page

### Verify

- Cleaner self-lists eco_friendly + 16 reviews tagged eco-friendly → earns Eco-friendly badge
- Cleaner self-lists eco_friendly + 14 reviews tagged → no badge yet
- Cleaner had Eco-friendly badge but 90 days of reviews don't tag → badge fades

## 7c-3 — Badge display integration with Phase 5 + WF 7

### Goal
Badges show on cleaner cards (browse list) and cleaner profile (WF 7) with appropriate priority and limits.

### Design

1. **Cleaner card display priority** (top 3 visible):
   - ZIP-locked badge for customer's current ZIP (if applicable) — highest priority
   - Specialty badge matching customer's selected service
   - General badges by recency

2. **Profile display.** All active badges visible on WF 7. Group: ZIP-locked first, then specialty.

3. **Match Score factor integration.** Phase 5 spec defines badge multipliers (1.5x for matching ZIP-locked badge; 1.2x for matching specialty). Phase 7c provides the data; Phase 5 already consumes.

### Build

- Update `BadgeRow` and `BadgeGrid` components in Phase 5 cleaner card / profile to query Phase 7c data
- Tap → WF 65 (ZIP) or WF 66 (specialty) detail pages

### Verify

- Customer in 94110 sees cleaner with Top-rated 94110 badge prominently
- Customer selecting eco-friendly service sees Eco-friendly cleaners boosted
- Tap badge on cleaner card → opens detail page

---

# Phase 7 verification + closeout (Phase 7d)

**Phase 7d goal:** All sub-phases verified end-to-end with real cleaner data. Score system + tier transitions + badges all behaving correctly under realistic load.

### Acceptance criteria

- [ ] Score recalc cron runs nightly without failure for 14 consecutive days
- [ ] Tier evaluation cron runs daily without failure for 14 consecutive days
- [ ] Score change notifications fire correctly for all 4 states (manual test on staging cleaners)
- [ ] Tier appeal flow works end-to-end (submit → admin review → outcome → notification)
- [ ] ZIP-locked badge eval correctly awards/expires badges
- [ ] Specialty badge eval correctly awards/expires badges
- [ ] Commission engine produces correct splits for all tier rates including Rising Pro apprenticeship
- [ ] All 6 factor scores visible in WF 2c with correct weights and stats
- [ ] All 4 tier cards visible in WF 51 with correct rate ranges and commissions
- [ ] WF 7 cleaner profile renders badges correctly in priority order

### Performance targets

- Score recalc 1000 cleaners: <5 minutes total
- Tier evaluation 1000 cleaners: <2 minutes total
- ZIP badge evaluation 1000 cleaners: <3 minutes total
- Specialty badge evaluation 1000 cleaners: <3 minutes total
- Score query for individual cleaner: <50ms p95

### Cross-phase impact

- Phase 6 sub-phases now fire real score events (not stubs)
- Phase 5 cleaner cards reflect real tiers + badges
- Phase 9 commission calculations use real tier rates

---

# Schema additions consolidated

**B4 schema is largely sufficient** for Phase 7. Only minor additions needed:

```sql
-- Add ZIP code to cleaner_badges for ZIP-locked variants
ALTER TABLE cleaner_badges ADD COLUMN zip_code TEXT;
CREATE INDEX idx_cleaner_badges_zip ON cleaner_badges (cleaner_id, zip_code)
  WHERE zip_code IS NOT NULL;

-- Add lifetime_completed_jobs for first-6-jobs apprenticeship tracking
-- (May already exist in B4 — verify before migrating)
ALTER TABLE cleaner_profiles ADD COLUMN IF NOT EXISTS lifetime_completed_jobs INTEGER NOT NULL DEFAULT 0;

-- Add reliability_score column if not present
ALTER TABLE cleaner_profiles ADD COLUMN IF NOT EXISTS reliability_score INTEGER NOT NULL DEFAULT 50
  CHECK (reliability_score >= 0 AND reliability_score <= 100);

-- Tier assignment pending_drop flag
ALTER TABLE tier_assignments ADD COLUMN IF NOT EXISTS pending_drop_warned_at TIMESTAMPTZ;
ALTER TABLE tier_assignments ADD COLUMN IF NOT EXISTS pending_drop_appeal_id UUID
  REFERENCES cleaner_appeals(id);
```

---

# Recommended build order

1. **Phase 7a** (3 weeks) — score + tier engine. **Critical path.**
2. **Phase 7b** (1.5 weeks) — notifications + appeals. Sequential after 7a.
3. **Phase 7c** (2 weeks) — badges. Can start in parallel with 7b after 7a is done.
4. **Phase 7d** (1 week) — verification + closeout.

**Total estimated wall time:** 6-7 weeks.

**Parallel opportunities:**
- 7c can run in parallel with 7b after 7a complete
- 7a-1 (event ingestion) can build incrementally with Phase 6 sub-phases

This document is the canonical Phase 7 navigation reference. Detailed acceptance criteria + code structure live in per-sub-phase spec files. Plain-English walkthroughs live in per-sub-phase explainer files.
