# Phase 6g — Plain-English Breakdown

This document walks through `phase-6g-recurring-bookings-spec.md` in plain English.

Phase 6g is **the recurring relationship layer.** Before Phase 6g, every booking is one-off. Customer who loves their cleaner has to manually rebook each time. After Phase 6g, recurring (weekly/biweekly/monthly) cleanings auto-generate, auto-charge, and feel like a subscription. This is the path to platform stickiness — recurring customers churn less, generate predictable revenue, and become long-term cleaner relationships.

The hardest part is **state management.** Pause, skip, modify, end — each can happen from customer or cleaner side. Each has different downstream effects. Get the state machine right.

---

# Section 0 — External account prerequisites

## What it means in plain English

Phase 6g has **no new vendors.** Stripe configured (Phase 4 + 6a + 6f). What 6g exercises is **Stripe customer's saved payment method** — re-using the same card across multiple recurring instances.

## Why "verify card persistence"

If Phase 6a's Stripe customer + payment method save failed, recurring auth fails on every instance. Catch this before launch.

## Beginner traps

- **Don't try to authorize without saved payment method.** Re-authorizing fresh card every instance = poor UX.
- **Don't skip card expiration warnings.** Customer card expires; recurring fails silently.

---

# Section 1 — Summary

## What it means in plain English

Seven things will work after Phase 6g:

1. Customer post-completion can opt-in to recurring
2. Cleaner consents on first instance (= series consent)
3. Daily cron generates next 7 days of instances
4. Hourly T-24h cron authorizes Stripe per instance
5. Customer + cleaner can pause/skip/modify/end
6. Rebook same address (different from recurring — single shot)
7. NOT tier-gated (all tiers can have recurring)

## Why "cleaner consents on first instance"

Don't ambush cleaners with auto-recurring. Customer requests recurring → first instance acts as cleaner accept gate → if cleaner accepts first, series is consented.

This means cleaner can decline recurring without declining individual bookings. They're separate decisions.

## Why "rebook is different from recurring"

Customer might want to book this cleaner again, but not on a fixed schedule. WF 69 rebook = single shot. WF 21 recurring = subscription. Different mental models, different data.

## Why "NOT tier-gated"

Phase 7 Lock 3 resolved this inconsistency. Original WF 51 implied recurring requires Proven Specialist tier. That would have blocked Rising Pros from earning recurring relationships — a self-defeating loop.

Locked: all tiers can have recurring. Edit WF 51 copy.

## Beginner traps

- **Don't auto-accept recurring on cleaner side.** Consent matters.
- **Don't conflate rebook with recurring.** Different.
- **Don't gate recurring by tier.** Phase 7 lock.

---

# Section 2 — Acceptance criteria

## What it means in plain English

Four groups: setup, generation+auth, management, rebook.

### Setup

Post-completion prompt = right time to ask. Customer just had a great experience. "Want this every two weeks?" = natural.

8 future instances generated upfront = customer sees the schedule. Concrete.

### Generation + auth

Daily generation cron + hourly T-24h auth cron. Two separate jobs because cadences differ.

Availability re-check matters. Cleaner narrows availability after recurring set up. Future instances might conflict. Re-check on each instance gen.

T-24h auth handles Stripe authorization. Failure modes: card expired, declined, etc. Customer notified, retry available, skip if 12h still failed.

### Management

Customer-side: pause, resume, skip next, modify time/cleaner, end series. Cleaner-side: pause (different state), end series.

Modify cleaner = end + start new. Don't try to swap cleaners on existing schedule — too many edge cases.

### Rebook

WF 69 = one-tap rebook with pre-fill. 30 days post-completion = primary surfacing window. Past 30 days = still possible but not surfaced.

### Cross-cutting

80% test coverage. State management complexity = thorough tests.

## Beginner traps

- **Don't auto-charge without auth success.** Failed auths cause real customer service issues.
- **Don't allow simultaneous pause + skip.** UI gates prevent confusion.

---

# Section 3 — Database state required

## What it means in plain English

B2 has `recurring_schedules` + `recurring_occurrences`. Phase 6g adds:
- Frequency, preferred day/time on schedule
- State machine on schedule (active / paused_by_X / ended_by_X)
- State machine on occurrence (pending_auth / confirmed / charged / completed / etc.)
- Booking_id reference on occurrence (set when occurrence becomes a real booking)

### Why occurrence has its own state

An occurrence isn't a booking until it's authorized + scheduled. Before that, it's a placeholder. Different state machine.

When occurrence transitions to real booking (T-24h auth success), we link to `bookings.id` and the booking's state machine takes over.

## Beginner traps

- **Don't conflate occurrence states with booking states.** Different.
- **Don't UPDATE occurrences silently.** State transitions logged.

---

# Section 4 — Files to create

## What it means in plain English

~30 files. Heavy on UI (11 components) because management has lots of actions.

### Why so many components

Pause, resume, skip, modify time, modify cleaner, end series = each gets its own confirm flow. UX matters here — these actions are reversible (mostly) but should feel intentional.

### Why two crons

Different cadences:
- Instance generator: daily 1 AM (low frequency, generates ahead)
- T-24h auth: hourly (catches all upcoming instances within window)

Combining = either over-generating or missing auths.

## Beginner traps

- **Don't combine the crons.** Different rhythms.
- **Don't skip confirm flows on destructive actions.** End series = can't undo (mostly).

---

# Section 5 — Implementation order

## What it means in plain English

10 days. Sequential:
- Days 1-3: schedule creation
- Days 4-6: generation + auth crons
- Days 7-8: management UI + state transitions
- Day 9: rebook
- Day 10: closeout

## Why this order

Schedule must exist before instances generate. Instances must generate before management actions matter. Rebook is independent (different flow), comes last.

## Beginner traps

- **Don't try to build management UI before crons exist.** No data to manage.
- **Don't skip Day 10 multi-instance E2E.** State transitions matter.

---

# Section 6 — Specific gotchas

## What it means in plain English

8 gotchas:

### A — DST on weekly recurring
Local time changes UTC. **Fix:** store local time; compute UTC per instance.

### B — Card expires mid-recurring
Silent failure. **Fix:** 60/30/7-day expiration warnings.

### C — Cleaner availability narrows
Future instances orphaned. **Fix:** rule changes don't affect existing recurring.

### D — Cleaner vacation conflicts
Time-off overlaps recurring. **Fix:** time-off detection during instance generation.

### E — Monthly math
"First Tuesday" varies. **Fix:** every 4 weeks definition.

### F — Pause + skip combo
Confusing state. **Fix:** UI grays out skip when paused.

### G — Cleaner ends mid-week
Already-authorized instance pending. **Fix:** authorized instances execute; subsequent cancelled.

### H — Modify cleaner mid-recurring
Time conflict. **Fix:** end + new schedule (two-step).

## Why these matter

Recurring has many edges. Test extensively.

## Beginner traps

- **Don't trust DST math at face value.** Real test in late October.
- **Don't allow modifications without explicit confirmation.** Customers regret.

---

# Section 7 — Testing strategy

Standard layers. DST transition test critical (test late October / early November). Multi-instance E2E essential.

## Beginner traps

- **Don't skip DST testing.** Twice-yearly bugs.

---

# Section 8 — Deployment plan

Standard. **Soft launch 14 days** (longer than other phases) because recurring is long-running — bugs surface over weeks, not days.

## Beginner traps

- **Don't shorten soft launch.** Recurring bugs hide.

---

# Section 9 — Handoff

Phase 6g output for:
- Phase 7c — recurring relationship counts → "Customer favorite in ZIP" badge
- Phase 9b Friday payouts — recurring captures aggregate
- Phase 5 Match Score — active recurring boost

Phase 6g closes out Phase 6 sub-phases entirely.

---

# Section 10 — Open questions

1. Monthly = every 4 weeks (recommended)
2. Cancel fees? No (recommend; flexibility)
3. Cleaner pause SLA (14 days max)

---

# Notes on what comes next

After Phase 6g, **Phase 6 fully complete.** Six sub-phases shipped: 6a, 6b, 6c, 6d, 6e, 6f, 6g. Booking lifecycle end-to-end works.

Next: Phase 7 sub-phases (7b notifications + appeals, 7c badges).

---

This walkthrough is the Phase 6g learning document.
