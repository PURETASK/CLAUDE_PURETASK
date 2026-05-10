# Phase 7a — Score Calculation and Tier Engine Specification

> **Author note (transparency):** This spec is being written ahead of when Phase 7a will actually be built — minimum 8-12 weeks from now (after Phase 6 sub-phases are firing real events). The spec is correct as of the current date but will need a refresh when implementation actually starts, particularly for: exact point delta values (these may need tuning based on observed cleaner behavior), the 90-day rolling window's interaction with seasonal demand (winter vs summer cleaning patterns), and whether veteran cushion threshold should be 90 jobs or different. Treat this document as an **aggressive draft**.

**Phase goal:** Cleaners' reliability scores are computed nightly from 6 weighted factors. Score determines tier. Tier transitions follow the 14-day standard gate + 30-day veteran cushion. Commission rate per tier is enforced at payment capture. WF 2c (score breakdown), WF 51 (tier explainer), and WF 52 (score explainer) are fully wired. The platform has a live, auditable, fair accountability system.

**Estimated duration:** ~3 weeks of focused engineering (15 working days).

**Depends on:**
- Phase 6 sub-phases firing real score events (Phase 6a/6b/6d/6e/6f)
- B4 schema deployed (reliability_events, reliability_score_snapshots, tier_assignments tables exist)
- At least 10 active cleaners with 5+ completed bookings each (for testing)
- Phase 7 lock-in decisions resolved (5 inconsistencies — see master outline)

**Wireframes covered:** WF 2 (cleaner dashboard score badge — already built in earlier phases; verify renders Phase 7a data), WF 2c (score breakdown drill-down), WF 51 (tier explainer), WF 52 (score explainer), WF 64 (customer-facing trust page references).

**Phase 7a sub-sections (mostly sequential):**

- **7a-1** — Score event ingestion (~3 days)
- **7a-2** — Nightly score recalc cron (~3 days)
- **7a-3** — Tier engine + transitions (~4 days)
- **7a-4** — Score breakdown + tier explainer UI (~3 days)
- **7a-5** — Commission engine integration with Phase 6f (~2 days)

---

## 0. External account prerequisites

Phase 7a has **no external services beyond what's already in place.** The trust system is fully internal: Postgres for data, cron jobs for periodic recalc, application code for event handling.

### 0.1 Cron infrastructure

Verify before start:

- **Cron mechanism chosen.** Options: Vercel Cron (good for sub-1-minute jobs at modest scale), Supabase pg_cron (database-native, runs in Postgres), Inngest (third-party with retry semantics). Recommendation: Vercel Cron for v1 (simplest); migrate to pg_cron if cron load grows.
- **Retry semantics defined.** If recalc fails partway through, what happens? Recommendation: idempotent recalc (rerun-safe); failure logs but doesn't block other cleaners.
- **Monitoring set up.** Log every cron run start/end + cleaner count processed. Surface failures in admin dashboard (WF 54 attention queue).

### 0.2 No lawyer items block Phase 7a

The 5 inconsistency lock-ins are **product decisions**, not legal. The trust page wording (WF 64) was already lawyer-reviewed in Phase 7 master outline as PENDING_LAWYER_REVIEW for "We don't read messages" qualification — that's Phase 10 polish, not blocking 7a.

---

## 1. Summary

Phase 7a is the math behind the platform's accountability. Concretely, by the end of Phase 7a:

1. **Every score-impacting action records a `reliability_events` row.** Phase 6 sub-phases call a centralized dispatcher; Phase 7a doesn't insert into the table directly from Phase 6 code (decoupling).

2. **Score is computed nightly.** Cron runs at 3 AM Pacific. Recalcs every active cleaner's score from last 90 days of events, weighted across 6 factors, clamped 0-100.

3. **Tier is evaluated daily.** Second cron at 4 AM Pacific (after score recalc). Applies 14-day standard gate + 30-day veteran cushion (additive). Triggers `tier_assignments` rows for transitions.

4. **First-6-jobs apprenticeship is tracked.** Rising Pros pay 12% commission for their first 6 completed jobs, then 15% standard. `cleaner_profiles.lifetime_completed_jobs` is the source of truth.

5. **WF 2c, WF 51, WF 52 render real data.** Cleaner dashboard score badge, score breakdown drill-down, tier explainer, score explainer all show current state from Phase 7a tables.

6. **Commission engine integrates with Phase 6f.** At payment capture, commission rate is read from cleaner's current tier (with apprenticeship check for Rising Pros). Cleaner balance updates correctly.

What Phase 7a does NOT do (deferred to 7b/7c):
- Notifications on score change (7b)
- Tier appeal flow (7b)
- ZIP-locked badges (7c)
- Specialty badges (7c)

---

## 2. Acceptance criteria

### Score event ingestion

- [ ] `recordReliabilityEvent()` dispatcher function exists in `lib/reliability/event_dispatcher.ts`
- [ ] Phase 6 sub-phases call dispatcher (not direct INSERT into `reliability_events`)
- [ ] All event types from spec section 5 below produce correctly-shaped rows
- [ ] Idempotency: same `(booking_id, event_type)` produces 1 row, not 2
- [ ] 30-day rolling grace check works for cleaner-initiated reschedule (first/month graced)
- [ ] Decline budget rolling 7-day window enforced (4th+ decline triggers penalty event)

### Nightly score recalc

- [ ] Cron runs at 3 AM Pacific successfully every night for 14 consecutive nights post-deploy
- [ ] Per-cleaner recalc completes in <300ms p95
- [ ] 1000-cleaner full recalc completes in <5 minutes total
- [ ] Score formula: `sum(factor_score × factor_weight)` clamped 0-100, rounded to integer
- [ ] 90-day rolling window: events older than 90 days excluded
- [ ] Overturned events (`is_overturned = TRUE`) excluded from recalc
- [ ] New cleaner with no events: score = 50
- [ ] Cleaner with all-positive events: score capped at 100
- [ ] Cleaner with all-negative events: score floored at 0
- [ ] One `reliability_score_snapshots` row per cleaner per night
- [ ] Snapshot includes all 6 factor scores

### Tier engine + transitions

- [ ] Cron runs at 4 AM Pacific successfully every night for 14 consecutive nights post-deploy
- [ ] Tier band evaluation matches locked thresholds (Rising Pro 0-59, Proven 60-74, Top 75-89, All-Star 90+)
- [ ] 14-day standard gate enforced: tier doesn't move until 14 consecutive days at different band
- [ ] 30-day veteran cushion enforced: cleaners with 90+ completed jobs need 44 consecutive days
- [ ] Tier promotion: score crosses upward → 14 days → promote → notification fires (7b stub if not built)
- [ ] Tier drop pre-warning at day 13 (or 43 for veterans) fires correctly
- [ ] First-6-jobs tracking: `lifetime_completed_jobs` increments on `booking_completed`
- [ ] Each tier transition creates new `tier_assignments` row with old marked `ended_at`

### UI integration

- [ ] WF 2 cleaner dashboard score badge shows correct current score
- [ ] WF 2c score breakdown shows all 6 factors with current stats from latest snapshot
- [ ] WF 2c shows recent 20 reliability_events with descriptions
- [ ] WF 51 tier explainer highlights current tier; shows distance-to-next
- [ ] WF 51 current rate panel matches cleaner's configured rates
- [ ] WF 52 score explainer renders weakest-factor recommendation
- [ ] All UI surfaces use Phase 7a data sources, not stubs

### Commission engine

- [ ] At Phase 6f payment capture, commission rate looked up from current tier
- [ ] Rising Pro on first 5 jobs: 12% commission applied
- [ ] Rising Pro on 7th job: 15% commission applied
- [ ] Top Performer: 11% commission
- [ ] All-Star Expert: 10% commission
- [ ] Tip charges: 0% commission (100% to cleaner)
- [ ] Booking fee $9.99 always to platform regardless of tier
- [ ] `cleaner_payouts` row inserted with correct splits

### Cross-cutting

- [ ] All Phase 7a code has unit tests; coverage ≥80% on `lib/reliability/` files
- [ ] All cron jobs have monitoring + alerting on failure
- [ ] RLS: cleaner reads own `reliability_events`, `reliability_score_snapshots`, `tier_assignments` only
- [ ] Admin can read all Phase 7a tables for support

---

## 3. Database state required

### Existing tables (no changes)

B4 schema provides the bulk of Phase 7a's needs:

- `reliability_events` — append-only event log (already designed correctly for audit)
- `reliability_score_snapshots` — daily snapshots
- `tier_assignments` — current tier + history
- `cleaner_profiles.reliability_score` — current score column (verify exists; add if not)
- `cleaner_appeals` — appeals (used by 7b; schema sufficient now)

### New migrations (Phase 7a)

```sql
-- Phase 7a migration

-- Ensure first-6-jobs tracking column exists
ALTER TABLE cleaner_profiles
  ADD COLUMN IF NOT EXISTS lifetime_completed_jobs INTEGER NOT NULL DEFAULT 0;

-- Ensure reliability_score column exists with correct constraints
ALTER TABLE cleaner_profiles
  ADD COLUMN IF NOT EXISTS reliability_score INTEGER NOT NULL DEFAULT 50;
ALTER TABLE cleaner_profiles
  ADD CONSTRAINT IF NOT EXISTS reliability_score_range
  CHECK (reliability_score >= 0 AND reliability_score <= 100);

-- Tier assignment pending-drop tracking
ALTER TABLE tier_assignments
  ADD COLUMN IF NOT EXISTS pending_drop_warned_at TIMESTAMPTZ;
ALTER TABLE tier_assignments
  ADD COLUMN IF NOT EXISTS pending_drop_appeal_id UUID
  REFERENCES cleaner_appeals(id) ON DELETE SET NULL;

-- Idempotency partial unique index on reliability_events
-- (Some events should fire only once per booking)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reliability_events_idempotent
  ON reliability_events (booking_id, event_type)
  WHERE booking_id IS NOT NULL;

-- Performance index for 90-day window queries
CREATE INDEX IF NOT EXISTS idx_reliability_events_cleaner_recent
  ON reliability_events (cleaner_id, created_at DESC, is_overturned)
  WHERE is_overturned = FALSE;

-- Performance index for snapshot lookups
CREATE INDEX IF NOT EXISTS idx_score_snapshots_cleaner_date
  ON reliability_score_snapshots (cleaner_id, snapshot_date DESC);
```

### RLS policies

B4 already has appropriate RLS on `reliability_events` (cleaner reads own; admin reads all) and `tier_assignments` (cleaner reads own; public can read just current tier for badge display). Verify before Phase 7a — don't re-create.

---

## 4. Files to create

### App routes — Cleaner-facing trust surfaces (~3 files)

- `/app/cleaner/score-breakdown/page.tsx` — WF 2c drill-down
- `/app/cleaner/tiers/page.tsx` — WF 51 tier explainer
- `/app/cleaner/score/page.tsx` — WF 52 score explainer

### Feature module — Reliability UI (~6 files)

- `/features/reliability/components/ScoreFactorRow.tsx`
- `/features/reliability/components/RecentEventRow.tsx`
- `/features/reliability/components/TierBandCard.tsx`
- `/features/reliability/components/TierProgressIndicator.tsx`
- `/features/reliability/components/RecommendationPanel.tsx`
- `/features/reliability/components/RatePanelInline.tsx`

### Library code (~8 files — the math core of Phase 7a)

- `/lib/reliability/event_dispatcher.ts` — `recordReliabilityEvent()` function
- `/lib/reliability/event_types.ts` — type enums + delta lookups
- `/lib/reliability/event_grace_check.ts` — 30-day rolling grace logic
- `/lib/reliability/decline_budget_check.ts` — 7-day rolling decline budget
- `/lib/reliability/score_calculator.ts` — pure function: events → factor scores → composite
- `/lib/reliability/tier_calculator.ts` — pure function: score → tier band
- `/lib/reliability/transition_gate_checker.ts` — 14-day + veteran cushion
- `/lib/reliability/snapshot_writer.ts` — writes `reliability_score_snapshots` row

### Library code — Commission (~2 files)

- `/lib/payouts/commission_calculator.ts` — pure function: tier + apprenticeship + amount → splits
- `/lib/payouts/commission_lookup.ts` — given cleaner_id, return current commission rate

### Server actions / API routes (~4 files)

- `/app/api/reliability/score/[cleaner_id]/route.ts` — GET current score + breakdown
- `/app/api/reliability/tier/[cleaner_id]/route.ts` — GET current tier + distance
- `/app/api/reliability/events/[cleaner_id]/route.ts` — GET recent events (paginated)
- `/app/api/reliability/snapshot-history/[cleaner_id]/route.ts` — GET snapshots for graph

### Background jobs (3 files)

- `/jobs/reliability_score_recalc.ts` — nightly cron at 3 AM Pacific
- `/jobs/tier_evaluation.ts` — daily cron at 4 AM Pacific
- `/jobs/tier_drop_warning.ts` — daily check for pending drops at day 13/43

### Database migrations (1 file)

- `migrations/2026XXXXXX_phase_7a_schema.sql` — additions above

### Phase 6 integration changes

Modify Phase 6 code to call `recordReliabilityEvent()`:

- Phase 6a (booking lifecycle): cleaner accept, decline, cancel, reschedule
- Phase 6b (messaging): response time tracking
- Phase 6d (GPS): on-time arrival, late arrival, no-show
- Phase 6e (photos): photo compliance events
- Phase 6f (approve & pay): booking_completed, review events

These are **integration changes**, not new files. Phase 6 sub-phase code stubs the calls; Phase 7a wires them.

### Docs (3 files; this set)

- `phase-7-master-outline.md` — already created
- `phase-7a-spec.md` — this file
- `phase-7a-explainer.md` — plain-English walkthrough

---

## 5. Event types and point deltas (locked)

This is the canonical list. Phase 7a `event_types.ts` references this directly.

### On-time arrival category (25% weight)

| Event type | Point delta | Notes |
|---|---|---|
| `on_time_arrival` | +1 | Capped 5/week to prevent gaming |
| `late_arrival_with_notice_lt15min` | 0 | Free first late notice per booking |
| `late_arrival_with_notice_15_30min` | -1 | |
| `late_arrival_with_notice_30plus_min` | -3 | |
| `late_arrival_no_notice_15plus_min` | -5 | |
| `no_show` | -10 | Most severe |

### Job completion category (25% weight)

| Event type | Point delta | Notes |
|---|---|---|
| `booking_completed` | +2 | Per successful capture |
| `cleaner_cancellation_24h_plus` | -3 | |
| `cleaner_cancellation_under_24h` | -8 | |
| `cleaner_cancellation_under_2h` | -10 | Treated as no-show severity |
| `cleaner_decline_within_budget` | 0 | First 3 declines per rolling 7-day window |
| `cleaner_decline_over_budget` | -2 | 4th+ decline in 7-day window |

### Photo compliance category (15% weight)

| Event type | Point delta | Notes |
|---|---|---|
| `photos_complete_required_only` | 0 | Baseline expectation |
| `photos_complete_with_voluntary_extras` | +1 | Reward over-documentation |
| `photo_integrity_concern` | -3 | Admin reviews |
| `photos_missing_after_clockout_attempt` | -2 | Cleaner forced retry |

### Customer ratings category (15% weight)

| Event type | Point delta | Notes |
|---|---|---|
| `review_5_star` | +1 | |
| `review_4_star` | 0 | |
| `review_3_star` | -1 | |
| `review_2_star` | -3 | |
| `review_1_star` | -5 | |

### Communication category (10% weight)

| Event type | Point delta | Notes |
|---|---|---|
| `message_response_under_30min` | 0 | Baseline |
| `message_response_30min_to_2h` | 0 | Baseline |
| `message_response_2h_to_8h` | -1 | |
| `message_response_over_8h` | -2 | |
| `no_response_to_customer_in_24h` | -3 | |

### Reschedule frequency category (10% weight)

| Event type | Point delta | Notes |
|---|---|---|
| `customer_initiated_reschedule` | 0 | Always free |
| `cleaner_reschedule_48h_plus_first_per_month` | 0 | Grace |
| `cleaner_reschedule_48h_plus_subsequent` | -2 | |
| `cleaner_reschedule_under_48h_first_per_month` | -1 | Grace reduced |
| `cleaner_reschedule_under_48h_subsequent` | -5 | |

### Admin adjustments

| Event type | Point delta | Notes |
|---|---|---|
| `admin_manual_adjustment` | variable | Requires admin_id + reason in metadata |
| `admin_overturn_via_appeal` | reverses prior | Sets `is_overturned = TRUE` on target events |

---

## 6. Implementation order

### Sub-phase 7a-1 — Score event ingestion (~3 days)

**Day 1 — Event types + dispatcher.** Build `lib/reliability/event_types.ts` with the locked enum + delta lookups. Build `lib/reliability/event_dispatcher.ts`. Unit test extensively.

**Day 2 — Grace + budget logic.** Build `event_grace_check.ts` (30-day rolling cleaner-reschedule grace) and `decline_budget_check.ts` (7-day rolling decline budget). Edge cases: month boundary, exactly-at-window-edge.

**Day 3 — Phase 6 integration stubs.** Wire `recordReliabilityEvent()` into Phase 6 sub-phases. For sub-phases not yet built, add the call where the spec says (will activate when Phase 6 sub-phase ships). Test with mocked Phase 6 events.

### Sub-phase 7a-2 — Nightly score recalc (~3 days)

**Day 4 — Score calculator (pure function).** Build `lib/reliability/score_calculator.ts`. Unit test against hand-computed expectations on synthetic event sets.

**Day 5 — Snapshot writer + cron handler.** Build `lib/reliability/snapshot_writer.ts` and `jobs/reliability_score_recalc.ts`. Test cron handler locally.

**Day 6 — Cron deployment + monitoring.** Deploy cron to staging. Run for 3 days against staging cleaners. Verify snapshots created correctly. Monitor performance.

### Sub-phase 7a-3 — Tier engine (~4 days)

**Day 7 — Tier calculator (pure function).** Build `lib/reliability/tier_calculator.ts`. Map score → tier band per locked thresholds.

**Day 8 — Transition gate checker.** Build `lib/reliability/transition_gate_checker.ts`. Implements 14-day standard gate + 30-day veteran cushion. Reads `reliability_score_snapshots` for consecutive-day check. Veteran flag = `lifetime_completed_jobs >= 90`.

**Day 9 — Tier evaluation cron.** Build `jobs/tier_evaluation.ts`. Calls gate checker per cleaner; triggers transitions; creates new `tier_assignments` rows; calls Phase 7b notification dispatcher (stub if 7b not built).

**Day 10 — Tier drop warning logic.** Build `jobs/tier_drop_warning.ts`. Daily cron flagging cleaners at day 13/43 of pending drop. Sets `tier_assignments.pending_drop_warned_at`. Triggers warning notification (7b stub).

### Sub-phase 7a-4 — UI integration (~3 days)

**Day 11 — WF 2c score breakdown.** Build `/cleaner/score-breakdown` route. Components: `ScoreFactorRow`, `RecentEventRow`, `RecommendationPanel`. Wire to Phase 7a data sources.

**Day 12 — WF 51 tier explainer.** Build `/cleaner/tiers` route. Components: `TierBandCard`, `TierProgressIndicator`, `RatePanelInline`. Locked rate ranges + commissions.

**Day 13 — WF 52 score explainer + WF 2 dashboard wiring.** Build `/cleaner/score` route (WF 52). Verify WF 2 cleaner dashboard already shows current score (Phase 4-5 should have done this; if not, fix).

### Sub-phase 7a-5 — Commission engine (~2 days)

**Day 14 — Commission calculator.** Build `lib/payouts/commission_calculator.ts`. Tier-aware. Apprenticeship-aware (Rising Pro `lifetime_completed_jobs < 6` → 12%, else 15%). Pure function.

**Day 15 — Phase 6f integration + closeout.** Wire commission calculator into Phase 6f payment capture flow. Test with all 4 tiers. Verify `cleaner_payouts` rows have correct splits. Run full E2E: book → cleaner accept → complete → approve → capture → cleaner balance correct.

---

## 7. Specific gotchas

### Gotcha A — Score recalc race with concurrent events

**The problem:** Cron starts recalc for cleaner at 3:00 AM. At 3:01 AM, a delayed Phase 6f event fires (e.g., review submitted). New `reliability_events` row inserted. Recalc may have already read events; new event missed in this snapshot.

**The fix:** Recalc is idempotent and runs again next night anyway. The "missed" event applies in the next-night recalc. Don't try to lock during recalc — too much contention. The 24-hour cycle is forgiving enough.

### Gotcha B — 90-day window edge cases

**The problem:** Event from exactly 90 days ago at 3 AM. Recalc at 3 AM tonight: is it in window or out? Boundary issues cause off-by-one bugs.

**The fix:** Define window precisely: `created_at >= NOW() - INTERVAL '90 days'`. Inclusive on lower bound. Document in spec.

### Gotcha C — Veteran cushion gaming via decline-then-rebuild

**The problem:** Cleaner has 90 completed jobs (veteran). Their score crashes to 30. Standard gate would drop them in 14 days; veteran cushion gives 44. They've taken a vacation but want to come back without tier drop. They could deliberately decline jobs to keep cushion active.

**The fix:** Veteran cushion only applies to drops, not promotions. And cleaners declining 4+ jobs in 7 days take penalty events that hurt their score. Net effect: cushion is hard to game intentionally.

### Gotcha D — Tier promotion celebrating on first day

**The problem:** Cleaner crosses score 90 today. 14-day gate says wait. But cleaner sees their score and expects something. Without notification, they might think system is broken.

**The fix:** Phase 7b adds "approaching tier promotion" pre-notification at day 7 of consecutive run. Phase 7a doesn't fire celebration until day 14 confirmed. The wait is intentional; Phase 7b explainer notification reduces confusion.

### Gotcha E — Apprenticeship rate timing on long bookings

**The problem:** Rising Pro cleaner books their 6th job. Customer reschedules to 3 weeks out. By the time it captures, cleaner has completed 8 jobs from other bookings. Which rate applies — 12% or 15%?

**The fix:** Lock at capture time, not booking time. `lifetime_completed_jobs` at capture moment determines rate. Document this in commission_calculator.ts.

### Gotcha F — Cron job overlap

**The problem:** 3 AM score recalc cron takes longer than expected (slow night). 4 AM tier eval cron starts before 3 AM finishes. Tier eval reads stale scores.

**The fix:** Tier eval cron checks for "score recalc completed today" flag before running. If recalc still in progress, tier eval waits or skips that cleaner. Use a simple `last_recalc_at` timestamp on `cleaner_profiles`.

### Gotcha G — New cleaner default score = 50 vs computed from 0 events

**The problem:** New cleaner has 0 events. Score formula on 0 events = 100 (no penalties). But that promotes them straight to All-Star, which is wrong.

**The fix:** New cleaners start with `reliability_score = 50` (set at approval). Score recalc respects this until cleaner accumulates ≥5 completed bookings. After 5 completed bookings, recalc fully overrides starting value. Document in score_calculator.ts.

### Gotcha H — Commission rate change mid-payout cycle

**The problem:** Cleaner promoted from Top Performer (11%) to All-Star (10%) on Wednesday. Friday payout includes Tuesday's capture (11%) and Thursday's capture (10%). Different rates per booking.

**The fix:** Each `cleaner_payouts` row stores its own commission_rate (snapshot at capture). Friday payout aggregates by summing pre-computed cleaner_amount_cents. No retroactive recompute.

---

## 8. Testing strategy

### Unit tests

- `lib/reliability/score_calculator.ts`: 30+ test cases covering each factor, edge cases (0 events, all-positive, all-negative, exactly-at-threshold)
- `lib/reliability/tier_calculator.ts`: boundary tests (score 59 vs 60, 89 vs 90)
- `lib/reliability/transition_gate_checker.ts`: 14-day exact, 13-day partial, veteran 44-day, mixed scenarios
- `lib/reliability/event_grace_check.ts`: month boundary, multiple events same month
- `lib/reliability/decline_budget_check.ts`: 7-day rolling window edge cases
- `lib/payouts/commission_calculator.ts`: all 4 tiers + Rising Pro apprenticeship + tip pass-through

### Integration tests

- Full nightly recalc on synthetic 100-cleaner dataset; verify scores match expected
- Tier evaluation: simulate 14 days of consistent score → promotion fires
- Commission engine integration with mock Phase 6f capture event

### Manual QA

- Run cron in staging for 7 nights; review snapshots and tier transitions
- Test with real cleaners on staging: ratings, late arrivals, cancellations, reviews — verify scores update overnight
- WF 2c: verify renders correctly for cleaner with rich event history
- WF 51: verify rates match cleaner profile config; tier highlighted correctly

---

## 9. Deployment plan

### Pre-deploy checklist

- [ ] All migrations applied to production Supabase
- [ ] Cron jobs scheduled in production environment
- [ ] Monitoring + alerting on cron failures
- [ ] Phase 6 sub-phases firing real events (verify in staging logs)
- [ ] At least 10 cleaners in production with completed bookings
- [ ] Lock-in decisions documented; team aligned

### Deployment order

1. Migrations
2. Application code (event dispatcher first, then UI)
3. Cron jobs activated (score recalc first, then tier eval)
4. Phase 6 integration calls activated (replace stubs with real dispatcher calls)
5. Soft launch: monitor for 7 nights before announcing tier system to cleaners

### Rollback plan

- App code revert if UI bugs surface
- Cron jobs can be paused independently (don't roll back schema)
- If tier transitions fire incorrectly, mark affected `tier_assignments` rows for admin review

---

## 10. Phase 7a → Phase 7b/7c handoff

Phase 7a output ready for Phase 7b (notifications + appeals):
- Score events flowing → 7b can listen for thresholds and dispatch notifications
- Tier transitions firing → 7b can render tier promotion / drop warning notifications
- Tier drop pre-warning at day 13/43 → 7b implements 48-hour appeal window
- `cleaner_appeals` table ready → 7b implements submission + admin review

Phase 7a output ready for Phase 7c (badges):
- `lifetime_completed_jobs` tracked → 7c uses for ZIP badge eligibility
- Score data → 7c can filter cleaners by score for badge thresholds
- Tier data → 7c can use tier as a Match Score multiplier (Phase 5 already consumes)

---

## 11. Open questions for Phase 7b/7c lock-in

These don't block 7a but should resolve before 7b/7c:

1. **Notification batching threshold for small score changes.** Spec says batch 5 same-direction events into one notification. Confirm the threshold; might be 3 or 7 depending on cleaner feedback.

2. **Appeal admin review SLA.** How fast must admin review appeals? Recommendation: 48 hours from submission. Phase 7b implements; lock here.

3. **Veteran threshold of 90 jobs.** Recommendation locked in master outline. Re-confirm before 7b ships in case data suggests different number.

4. **Apprenticeship counter at 6 jobs.** Lock confirmed. Document in WF 51 update.

---

This spec is the canonical Phase 7a build reference. Plain-English walkthrough lives in `phase-7a-explainer.md`. High-level navigation across all of Phase 7 lives in `phase-7-master-outline.md`.
