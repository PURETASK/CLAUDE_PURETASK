# Phase 7a — Plain-English Breakdown

This document walks through every section of `phase-7a-spec.md` and explains:
- What each thing means in plain English
- What needs to be designed (decisions to make)
- What needs to be built (actual files)
- Why each decision matters
- Beginner-trap warnings where they apply

Phase 7a is **the math behind PureTask's accountability**. Before Phase 7a, score and tier appear in wireframes but the platform has no way to actually compute them. After Phase 7a, scores update nightly, tiers transition with the right gates, and commission rates flow correctly through payment. Read section by section.

---

# Section 0 — External account prerequisites

## What it means in plain English

Phase 7a is the **first phase since Phase 1 with no new external service to set up**. Everything is internal: Postgres tables, application code, and cron jobs. Stripe is already set up (Phase 4 + Phase 6a). Checkr is already set up (Phase 4). No third-party APIs.

This is unusual for a phase of this complexity. Most phases of comparable scope require new vendor integrations. Phase 7a is internal infrastructure.

## What "cron infrastructure" means

A "cron job" is a scheduled task that runs at a specific time. You'll have at least three:

1. **Score recalc** at 3 AM Pacific every night — recomputes every cleaner's score
2. **Tier evaluation** at 4 AM Pacific every night — checks if any cleaners crossed tier thresholds
3. **Tier drop warning** at 5 AM Pacific every night — flags cleaners who'll drop in 24 hours

You have a few options for how to run cron in this stack:

- **Vercel Cron** — Vercel-native. Configured in `vercel.json`. Best for sub-hour jobs at modest scale. Recommendation: use this for v1.
- **Supabase pg_cron** — runs inside Postgres. Good for database-heavy jobs. Slightly more complex to set up but more reliable for high-frequency jobs.
- **Inngest** — third-party with retry semantics. Overkill for v1.

The recommendation is Vercel Cron because it's simplest. Migrate later if cron load grows.

## Why "no lawyer items"

The five inconsistency lock-ins (Rising Pro commission, background check renewal cadence, recurring tier gating, tier transition rules, reschedule scoring) are **product decisions**, not legal questions. They were ambiguous in wireframes and need resolution, but they don't require lawyer review.

The trust page wording ("We don't read messages") was flagged for lawyer review during the wireframe deep dive — that's polish work for Phase 10, not blocking for Phase 7a.

## Beginner traps

- **Don't try to test cron jobs by waiting.** Use a manual trigger function during development. Wait-for-3-AM is brutal feedback loop.
- **Don't use Vercel Cron for jobs that run more than once an hour.** Vercel has rate limits; pg_cron handles high-frequency better.
- **Don't deploy cron jobs without monitoring.** Silent cron failures = silent score drift. Set up alerting from day one.

---

# Section 1 — Summary

## What it means in plain English

The summary promises six things will work by end of Phase 7a:

1. **Every score-impacting action records an event.** Phase 6 sub-phases (booking accept, late arrival, photo upload, review submission, etc.) call a single dispatcher function. The dispatcher inserts into `reliability_events`. Phase 6 doesn't insert directly — that's a clean separation.

2. **Score is computed nightly.** A cron at 3 AM Pacific recalcs every active cleaner. Reads last 90 days of events. Weights by 6 factor categories. Outputs a score 0-100. Stores on `cleaner_profiles.reliability_score` AND in a snapshot row.

3. **Tier is evaluated daily.** A second cron at 4 AM Pacific checks if any cleaner has crossed a tier threshold. Applies the 14-day standard gate (or 44 days for veterans). Triggers transitions.

4. **First-6-jobs apprenticeship works.** Rising Pros pay 12% commission for their first 6 completed jobs, then jump to 15% standard. The counter on `cleaner_profiles.lifetime_completed_jobs` is the source of truth.

5. **The trust UI surfaces real data.** WF 2c (score breakdown), WF 51 (tier explainer), WF 52 (score explainer) all render Phase 7a-computed data. No more stub data.

6. **Commission engine integrates with Phase 6f.** When a payment captures, the cleaner's tier determines their commission rate. Cleaner balance updates correctly.

## Why this is one sub-phase, not three

You might wonder why score, tier, and commission are bundled. They're related because:

- Tier is computed from score
- Commission is computed from tier
- Without all three, none of them produce useful output

You can't ship "score works but tier doesn't" because cleaners would see scores fluctuating with no consequence. You can't ship "tier works but commission doesn't" because cleaners would see tier promotions without rate changes. The three are interdependent.

## Why this matters

Phase 7a is the moment PureTask becomes a **fair platform** in a measurable sense. Before this, "we'll reward good cleaners" is a promise. After this, the math runs. Every cleaner gets a score they can read, a tier they can compare to, and a commission that reflects their performance.

This is also the moment the platform becomes **legally defensible**. If a cleaner sues claiming bias in tier assignment, you have an audit trail of `reliability_events` showing exactly what behaviors drove their score. Document the math.

---

# Section 2 — Acceptance criteria

## What it means in plain English

Acceptance criteria are the binary pass/fail checklist. Don't ship until every box checks.

The criteria break into six groups:

### Score event ingestion

The dispatcher pattern matters. Phase 6 sub-phases call `recordReliabilityEvent({...})`. They don't write to the table directly. This decoupling means Phase 7a can change the schema or scoring rules without touching Phase 6 code.

Idempotency matters. If the same booking_completed event fires twice (e.g., once from clock-out, once from capture), only one row should exist. The partial unique index enforces this.

### Nightly score recalc

The cron must run reliably. **14 consecutive nights without failure** is the minimum bar. If it fails, you have score drift — cleaner sees score 82 yesterday, 79 today, but no event explains the change.

Performance matters because at scale (1000+ cleaners), recalc that takes 30 minutes will drift into business hours. Target: 5 minutes total for 1000 cleaners.

The 90-day window is a deliberate choice. Longer windows make recovery slower (a bad week 100 days ago still hurts). Shorter windows make scores volatile (one bad day swings score). 90 days is the cleaning industry standard.

### Tier engine + transitions

The 14-day gate prevents whiplash. Without it, a cleaner with score 73 (Top Performer minus 2) might get demoted on a single bad day. With the gate, they need 14 consecutive days at <75 before demotion.

The 30-day veteran cushion is additive. Veteran = 90+ completed jobs. Veterans get 14 + 30 = 44 days before demotion. Rationale: established cleaners earned the trust; one bad month shouldn't crash their tier.

The first-6-jobs apprenticeship is for new cleaners. Rising Pros pay 12% (vs 15% standard) for their first 6 jobs. Rationale: ramp-up support during onboarding.

### UI integration

WF 2c, WF 51, WF 52 must render Phase 7a data. If they show stub data, Phase 7a isn't done. If they show outdated data (e.g., last week's snapshot), Phase 7a isn't done.

### Commission engine

Commission lookup happens at capture time, not booking time. This matters: if a cleaner promotes between booking and capture (rare; mostly recurring), they get the better rate.

Tip pass-through is 100%. PureTask never takes commission on tips. Booking fee ($9.99) always goes to platform regardless of tier.

### Cross-cutting

Coverage ≥80% on `lib/reliability/` files because the math is high-stakes. Bugs here cause real money mismatches. Tests catch them cheaply.

## Beginner traps

- **Don't gate Phase 7a on "every Phase 6 sub-phase fires perfectly."** Use stubs where Phase 6 sub-phases aren't yet built. Stubs activate when the sub-phase ships.
- **Don't ship without monitoring.** Cron failures are silent killers. First 14 days post-deploy: monitor closely.
- **Don't underestimate testing time.** Phase 7a is high-stakes math. Budget at least 3 of the 15 days for tests.

---

# Section 3 — Database state required

## What it means in plain English

You're adding **minimal schema** for Phase 7a. The B4 schema already designed the trust system properly. Phase 7a just needs to verify columns exist + add a few indexes.

### What B4 gives you

- `reliability_events` — append-only event log. Ready as-is.
- `reliability_score_snapshots` — daily snapshots. Ready as-is.
- `tier_assignments` — current tier + history. Ready as-is.
- `cleaner_appeals` — appeals (Phase 7b uses, but schema sufficient now).
- `badges` + `cleaner_badges` — badges (Phase 7c uses).
- `cleaner_specialties` + `specialties` — specialties (Phase 7c uses).

### What Phase 7a adds

Three small additions:

1. **`lifetime_completed_jobs` column** on `cleaner_profiles`. Tracks first-6-jobs apprenticeship.
2. **`reliability_score` column** with constraint. Verify exists; add if not.
3. **Two columns on `tier_assignments`** for pending-drop tracking: `pending_drop_warned_at` and `pending_drop_appeal_id`.

Plus three indexes for performance.

### Why these aren't already in B4

B4 was designed before the wireframe deep dive surfaced the specific need for first-6-jobs apprenticeship and pending-drop pre-warning. They're correctly scoped as "additions" rather than "redesign."

### Why this is mostly schema-ready

You're standing on a well-designed foundation. The B4 schema author thought about score, tier, badges, and appeals from day one. Phase 7a inherits good structure.

## Beginner traps

- **Don't drop and recreate `reliability_events`.** Append-only history is the audit trail. Even if early test data is messy, keep it; don't delete to reset.
- **Don't add NOT NULL columns without DEFAULT.** Existing rows would error on the migration. Use `ADD COLUMN ... DEFAULT 0` or similar.
- **Verify indexes don't already exist.** B4 may have added them. `IF NOT EXISTS` is your friend.

---

# Section 4 — Files to create

## What it means in plain English

The spec lists ~25 files. Spread across:

### Cleaner-facing routes (3 files)

`/cleaner/score-breakdown` (WF 2c), `/cleaner/tiers` (WF 51), `/cleaner/score` (WF 52). These are the trust UI surfaces that became the canonical references for cleaners curious about their tier system.

### Reliability components (6 files)

`ScoreFactorRow`, `RecentEventRow`, `TierBandCard`, `TierProgressIndicator`, `RecommendationPanel`, `RatePanelInline`. These are the building blocks. WF 2c is mostly `ScoreFactorRow` × 6 + `RecentEventRow` × 20. WF 51 is mostly `TierBandCard` × 4.

### Library code (8 files — the math core)

This is where the most attention goes. **These are pure functions.** They take inputs, return outputs. No side effects. No React. No DB writes.

- `event_dispatcher.ts` — the only place `reliability_events` is INSERTED into
- `event_types.ts` — the locked enum + delta lookups (one source of truth)
- `event_grace_check.ts` — 30-day cleaner-reschedule grace
- `decline_budget_check.ts` — 7-day decline budget
- `score_calculator.ts` — events → factor scores → composite score
- `tier_calculator.ts` — score → tier band
- `transition_gate_checker.ts` — 14-day + veteran cushion
- `snapshot_writer.ts` — writes `reliability_score_snapshots`

These deserve **extensive unit tests**. Spend the time. Bugs here cause real money issues downstream.

### Commission library (2 files)

`commission_calculator.ts` is a pure function. `commission_lookup.ts` is a thin DB read.

### Server actions (4 files)

API routes for querying score/tier/events. Thin handlers; logic in lib/.

### Background jobs (3 files)

The crons. Each is small — load cleaners, iterate, call lib functions, write results.

### Phase 6 integration

This is the unusual part of Phase 7a: it requires modifying Phase 6 code. Specifically, replacing stubs with real `recordReliabilityEvent()` calls in:

- Phase 6a (booking lifecycle)
- Phase 6b (messaging)
- Phase 6d (GPS / lateness)
- Phase 6e (photo system)
- Phase 6f (approve & pay)

These are integration changes, not new files.

## Why so much library code

The bias toward `lib/` files is intentional. **Pure functions are testable.** When you separate the math from the side effects, you can write fast unit tests that don't need a database. You catch logic bugs in milliseconds, not in production after a week of bad scores.

The flip side: don't put logic in components or server actions. Components render. Server actions orchestrate. Lib code computes. Keep the boundaries.

## Beginner traps

- **Don't put `reliability_events` INSERT statements in 6 places.** All inserts go through `event_dispatcher.ts`. Centralize.
- **Don't write tests after the code.** Test-first for the lib/ files. Catch bugs early.
- **Don't skip the unit tests on `score_calculator.ts`.** This function determines real money. Hand-compute expected outputs for 30+ test cases.

---

# Section 5 — Event types and point deltas

## What it means in plain English

The spec lists every event type and its point delta. This is **the canonical list.** Phase 7a's `event_types.ts` is essentially a TypeScript translation of this table.

### Why deltas are negative for bad behavior, positive for good

Score formula: `factor_score = 100 - sum(deltas)`. Negative deltas reduce the score. Positive deltas reduce penalties (or add to a positive baseline).

Or another way to think about it: each event "costs" or "earns" points. Adding up, weighted by category, gives the score.

### Why the deltas are what they are

The values aren't arbitrary. They reflect the relative severity of each behavior:

- A no-show (-10) is much worse than a late arrival with notice (-1).
- A 1-star review (-5) is worse than a 3-star review (-1).
- Customer-initiated reschedule (0) doesn't penalize; cleaner-initiated under 48h (-5) penalizes significantly.

The exact numbers are calibrated against typical event volumes per cleaner. A cleaner doing 20 bookings/month with 2 late arrivals and one 5-star review accumulates: -2 (late) -2 (late) +1 (review) = -3. Over 90 days: -9 from this set. With other events, this nets out to maybe -15 to +15 typical range.

The platform should be **forgiving enough that good cleaners stay near the top** and **strict enough that bad behavior drops you out of the top tier**. These calibrations are the recommended starting values; expect tuning post-launch.

### Why caps exist on positive events

`on_time_arrival` capped at 5/week prevents gaming. Without the cap, a cleaner could artificially inflate their score by taking 30 short bookings per week. The cap means after 5 on-time arrivals per week, additional ones don't add to score.

### Why grace periods exist

The `cleaner_reschedule_*_first_per_month` events with delta 0 (or -1 with notice) is the grace mechanism. First cleaner-initiated reschedule per rolling 30-day window is forgiven (or reduced). This handles real life — emergencies happen. The platform isn't unforgiving for one event; it's strict for patterns.

## Beginner traps

- **Don't change deltas mid-flight.** If you adjust delta values after launch, historical events with old values stay (correctly). New events get new values. This causes score discontinuity. Lock values; tune via cleaner outreach if needed.
- **Don't allow client-side delta computation.** Delta is server-computed at event-write time. Stored explicitly on the event row. Audit trail.
- **Don't skip the metadata field.** `metadata JSONB` stores cause details (e.g., `{"minutes_late": 12}`). This drives WF 2c event descriptions. Without metadata, all late-arrival events look identical to cleaner.

---

# Section 6 — Implementation order

## What it means in plain English

Phase 7a is 15 working days. Order matters because some pieces unblock others.

### Days 1-3: Event ingestion

Build the dispatcher first. It's the contract Phase 6 will call into. Get the contract right, then iterate.

### Days 4-6: Score recalc

Build the math + cron. This is where the most testing happens. The pure function `score_calculator.ts` deserves obsessive testing.

### Days 7-10: Tier engine

Build tier evaluation + transition gates. The 14-day gate logic is subtle. Edge cases (cleaner crosses up then back down within 14 days) need careful handling.

### Days 11-13: UI integration

Build the cleaner-facing screens. Most of this is layout + querying — the data is already computed.

### Days 14-15: Commission engine + closeout

Build commission calculator. Wire into Phase 6f. End-to-end E2E test.

### Why this order

Dependencies dictate order. You can't test score recalc without events flowing. You can't test tier evaluation without scores flowing. You can't test UI without tier data. You can't test commission without tier.

### Why some days might extend

Realistic: any day might extend by 50%. The most likely time sinks:

- **Day 6 cron deployment.** Vercel Cron + monitoring + first-night failure debugging.
- **Day 8 transition gate edge cases.** "Did the cleaner cross threshold 14 days ago consecutively or did they bounce?" — getting the consecutive-day SQL right takes thought.
- **Day 15 E2E testing.** Stripe + cleaner balance + tier change + commission rate switch — lots of integration points.

Build buffer.

## Beginner traps

- **Don't build all four sub-phases in parallel.** Sequential focus produces correct code; parallel produces half-done code.
- **Don't deploy cron on Day 6 without monitoring.** Cron failures should alert; otherwise you find out in three weeks when a cleaner asks why their score is wrong.

---

# Section 7 — Specific gotchas

## What it means in plain English

The spec lists 8 gotchas. These are real production issues. Read them, understand them, defend against them.

### Gotcha A — Recalc race with concurrent events

Cron starts at 3 AM. New event fires at 3:01 AM. The new event might miss this night's snapshot. **The fix: idempotent recalc + 24-hour cycle.** Tomorrow's recalc will pick up the missed event. Don't try to lock during recalc — too much contention.

### Gotcha B — 90-day window edge cases

Boundary issues bite. Define `created_at >= NOW() - INTERVAL '90 days'` precisely. Inclusive on lower bound. Document.

### Gotcha C — Veteran cushion gaming

Cleaner with 90 jobs takes vacation; score crashes. Could they decline jobs to keep cushion active? **No** — declining 4+ jobs in 7 days is itself a penalty event. Net effect: gaming is hard.

### Gotcha D — Tier promotion celebration delay

Cleaner crosses 90 today. Standard gate says wait 14 days. Cleaner sees their score and expects something. **The fix: Phase 7b adds "approaching" pre-notification at day 7.** Phase 7a doesn't fire celebration until day 14 confirmed. Avoid premature celebration.

### Gotcha E — Apprenticeship rate timing

Rising Pro books 6th job. Customer reschedules 3 weeks. By capture, cleaner has 8 jobs from other bookings. Which rate? **Lock at capture time.** `lifetime_completed_jobs` at capture moment determines rate. Document.

### Gotcha F — Cron job overlap

3 AM cron slow tonight. 4 AM cron starts before 3 AM finishes. Tier eval reads stale scores. **The fix: 4 AM cron checks "score recalc completed today" flag.** Skip cleaners not yet recalculated.

### Gotcha G — New cleaner score 50

Score formula on 0 events = 100 (no penalties). But 100 = All-Star. Wrong. **The fix: new cleaners start with `reliability_score = 50` (set at approval).** Recalc respects this until cleaner has ≥5 completed bookings.

### Gotcha H — Commission rate change mid-payout cycle

Cleaner promoted from Top Performer (11%) to All-Star (10%) Wednesday. Friday payout includes Tuesday's capture (11%) + Thursday's capture (10%). **The fix: each `cleaner_payouts` row stores its own commission_rate.** Friday payout aggregates pre-computed splits. No retroactive recompute.

## Why these matter

Each gotcha, if missed, surfaces as a production incident. Some surface in testing. Others surface only with real cleaner volume. Read them, write defensive code.

## Beginner traps

- **Don't trust local testing for cron scheduling.** Cron behavior in Vercel + Supabase + DST + concurrent jobs is different from local. Verify in staging.
- **Don't assume the 8 gotchas are exhaustive.** They're the ones we know. There will be others. Monitor closely first 14 days.

---

# Section 8 — Deployment plan

## What it means in plain English

Pre-deploy checklist, deployment order, rollback plan. Standard.

The unique-to-Phase-7a element: **soft launch for 7 nights before announcing the tier system to cleaners.** Even with all the testing, you want real cron data before letting cleaners see their scores fluctuate. If a cleaner sees their score change unexpectedly without explanation, trust collapses.

## Why "soft launch"

Cleaners are watching their score. Bugs in Phase 7a are visible to them. The platform's accountability promise is on the line. Soft launch lets you catch surface-able bugs before announcing.

## Beginner traps

- **Don't announce the tier system before 7 nights of clean cron runs.** Announce it on a Monday (cleaners log in early in the week). 7 nights = the prior week of consistent running.
- **Don't forget to test rollback.** Schema migrations are forward-only. App code can roll back. Cron jobs can pause. Practice the rollback before production deploy.

---

# Section 9 — Phase 7a → 7b/7c handoff

## What it means in plain English

Phase 7a output is ready for Phase 7b (notifications + appeals) and Phase 7c (badges).

For 7b:
- Score events flowing → 7b can listen and dispatch notifications
- Tier transitions firing → 7b can render WF 53 notification states
- Tier drop pre-warning at day 13/43 → 7b implements 48-hour appeal window

For 7c:
- `lifetime_completed_jobs` tracked → 7c uses for ZIP badge eligibility (25+ in ZIP requires count)
- Score data → 7c filters by score thresholds
- Tier data → 7c boosts in Match Score (Phase 5 already consumes)

## Why the decoupling

7a, 7b, 7c are intentionally decoupled. 7a fires events; 7b/7c listen. 7c uses 7a's data; 7a doesn't know about badges. This means:

- 7a can ship and run without 7b or 7c
- 7c can be built in parallel with 7b
- 7b/7c upgrades don't break 7a

## What 7a doesn't do

- 7a doesn't notify cleaners (Phase 7b)
- 7a doesn't run badge logic (Phase 7c)
- 7a doesn't apply admin appeals (Phase 7b)

Phase 7a stubs the trigger points. Phase 7b/7c fill them in.

---

# Section 10 — Open questions

## What it means in plain English

Three questions don't block 7a but should resolve before 7b/7c:

1. **Notification batching threshold.** Spec says batch 5 same-direction events into one notification. Confirm the threshold based on cleaner feedback.
2. **Appeal admin review SLA.** Recommendation: 48 hours from submission.
3. **Veteran threshold.** Recommendation: 90 jobs. Re-confirm if data suggests different.

These are tuning questions, not architectural ones.

## Why this is okay

7a is well-defined. The open questions affect 7b/7c implementation, not 7a. Don't block 7a on them.

---

# Notes on what comes next

After Phase 7a:

- **Phase 7b** (1.5 weeks) — notifications + appeals
- **Phase 7c** (2 weeks) — badges (parallel with 7b)
- **Phase 7d** (1 week) — verification + closeout

Total Phase 7: 6-7 weeks. Phase 7a is the foundation. Everything else depends on its correctness.

After Phase 7:

- **Phase 8** — disputes (3 weeks, depends on 6e photo + 6f approval lifecycle)
- **Phase 9** — money operations + payouts (3 weeks, depends on 7a commission engine)
- **Phase 10** — notifications + polish (4 weeks, integrates everything)

---

This explainer is the canonical Phase 7a learning document. The spec (`phase-7a-spec.md`) is for execution; this is for understanding. The master outline (`phase-7-master-outline.md`) is for navigation across all of Phase 7.
