# Phase 8a — Plain-English Breakdown

This document walks through every section of `phase-8a-spec.md` and explains:
- What each thing means in plain English
- What needs to be designed (decisions to make)
- What needs to be built (actual files)
- Why each decision matters
- Beginner-trap warnings where they apply

Phase 8a is **the first sub-phase of dispute resolution** — the user-facing layer. Before Phase 8a, when a customer is unhappy with a cleaning, they have nowhere to go. After Phase 8a, they have a structured 48-hour window to open a dispute, the cleaner has 48 hours to respond with one of four offer types, and the customer can accept or reject. Stalemates auto-escalate to Phase 8b admin mediation. Read section by section.

---

# Section 0 — External account prerequisites

## What it means in plain English

Phase 8a has **no new external services to set up**. Photo storage uses Supabase Storage (Phase 6e). Notifications use existing infrastructure (Phase 10). Stripe is needed for partial refunds, but the actual refund execution is Phase 9 territory.

What 8a needs from upstream phases:

1. **Phase 6f set the dispute window column.** When a booking is approved (manual or auto), Phase 6f writes `bookings.dispute_window_expires_at = approved_at + 48 hours`. Phase 8a reads this column when deciding whether to allow a customer to open a dispute. **Verify before 8a starts.**

2. **Phase 7a `recordReliabilityEvent()` dispatcher.** Phase 8a fires score events when disputes resolve. The Phase 7a dispatcher needs to be operational.

3. **Phase 6e photos exist.** Cleaner clock-out photos auto-attach to disputes as initial evidence. If Phase 6e is incomplete, Phase 8a has thin evidence.

## Why "start the insurance partner conversation now"

Phase 8c (Tier 3) needs an insurance partner. Insurance contract negotiation takes 4-8 weeks. Don't wait until you're building 8c to start. **Start the partner conversation during Phase 8a build** so the partner is ready when 8c is ready.

## Beginner traps

- **Don't assume Phase 6f has set the dispute window.** Verify in production database. If column is null on existing approved bookings, you'll get unexpected errors.
- **Don't try to build dispute resolution without Phase 7a in place.** Score events fire on resolution. Without the dispatcher, you have no integration; events don't track.

---

# Section 1 — Summary

## What it means in plain English

The summary promises seven things will work by end of Phase 8a:

1. **Customer can open a dispute within 48 hours.** Server-side window enforcement. Past 48h = 410 Gone with link to support.

2. **Cleaner sees dispute in inbox immediately.** Real-time notification + push + email.

3. **Cleaner has 4 response options:** re-clean (propose new time), partial refund (specify amount), stand by work (no refund), escalate to admin (jumps Tier 1).

4. **Customer accepts or rejects offer.** Acceptance triggers resolution; rejection allows one counter-proposal.

5. **Dispute message thread runs throughout.** Separate from booking messages because admin needs read access at escalation.

6. **Auto-escalation handles stalemates.** Three triggers: 48h cleaner non-response, two customer rejections, explicit escalation request.

7. **Score events fire on resolution.** Phase 7a integration: cleaner stands = no impact; partial refund = -1; re-clean = 0 (good faith).

## Why this is one sub-phase, not five

Customer initiation, cleaner response, customer accept/reject, message thread, and auto-escalation are all interdependent. You can't ship "customer can open dispute" without "cleaner can respond" — the feature would dead-end. The five components together produce a coherent Tier 1 resolution flow. Splitting them into separate sub-phases would multiply integration risk.

## Why Tier 1 design matters

**Most disputes resolve at Tier 1.** If Tier 1 works well — clear, fast, fair — most cases never escalate. Cleaners offer reasonable fixes. Customers accept reasonable fixes. The platform doesn't pay the cost of admin mediation for every dispute.

A bad Tier 1 design causes:
- Cleaners ghost (don't respond) → escalation
- Cleaners always offer minimum → customer always escalates
- Customers always reject → multiple rounds before escalation

A good Tier 1 design surfaces fairness expectations and lets both parties land on agreement quickly.

## Beginner traps

- **Don't make Tier 1 friction-heavy.** Customer should be able to open a dispute in under 2 minutes. Long forms = customers give up + escalate to support directly.
- **Don't bake too much logic into UI.** State transitions, escalation triggers, and resolution flows live in `lib/disputes/`. Components dispatch.
- **Don't forget the 48-hour deadline visualization.** Customer needs to see "you have 36 hours remaining to dispute." Make the deadline visible and fair.

---

# Section 2 — Acceptance criteria

## What it means in plain English

Six groups of acceptance criteria. Don't ship until every box checks.

### Customer dispute initiation

The 48-hour window enforcement matters. **Server-side check** — don't trust client. If `dispute_window_expires_at < NOW()`, return 410 Gone (HTTP "Gone"). Don't return 400 — that implies bad request. 410 specifically means "this used to be available."

The 6 categories cover the spectrum: quality (most common), damage, missing item, no-show or partial, safety, other. Map to B3 enum.

5 photos max for evidence. More than 5 is overkill; less than 5 limits cleaner-side defense.

50-2000 characters for description. Shorter than 50 = insufficient detail. Longer than 2000 = customer venting; admin will summarize anyway.

### Cleaner dispute response

The 4 response options give cleaner agency. Re-clean is the **good-faith first option** — cleaner says "let me make it right." Partial refund is the **negotiation option**. Stand by work is the **defense option** when cleaner is confident their work was correct. Escalate is the **bypass option** when cleaner doesn't want to negotiate.

48-hour cleaner response window matches customer's. Symmetric.

Auto-attached clock-out photos. The cleaner shouldn't have to dig up evidence — the platform has it from Phase 6e.

### Customer accept/reject + resolution

The acceptance flow is the **resolution branching point**:
- Re-clean accepted → Phase 6a creates new booking
- Partial refund accepted → Phase 9 processes refund
- Stand by work accepted → no money moves; dispute closes (rare; means customer wanted documentation more than refund)

Two-rejection auto-escalation is the **stalemate detector**. If customer rejects 2 different cleaner offers, customer + cleaner can't agree → admin needs to step in.

Counter-propose limited to 1 use. Without limit, customer + cleaner can volley counter-proposals indefinitely. With 1-use limit, conversation moves toward decision.

### Dispute message thread

Separate from booking messages because **admin needs read access at escalation**. Booking messages are private (per WF 64); dispute messages are admin-readable post-escalation. This visibility distinction matters.

### Auto-escalation

15-minute cron cadence is **fast enough for fairness, not so fast it overwhelms admin queue**. 48h cleaner non-response triggers within 15 min of threshold = customer doesn't wait extra hours.

### Cross-cutting

Coverage ≥80% on `lib/disputes/` because dispute logic determines real money + score impact. Bugs cause real customer/cleaner harm.

## Beginner traps

- **Don't return 400 for past-window disputes.** Use 410 Gone semantically.
- **Don't auto-escalate after just 1 customer rejection.** Two rejections is the rule. One rejection still gives cleaner one more chance.
- **Don't skip the auto-escalation cron tests.** Hard to test wall-clock-driven cron in unit tests; use staging with mocked time.

---

# Section 3 — Database state required

## What it means in plain English

You're adding **2 new tables** to support Phase 8a (`dispute_photos`, `dispute_escalation_events`) plus columns on existing B3 tables.

### `dispute_photos`

Separate from `booking_photos` because retention differs. Booking photos live 30 days (per WF 29 customer privacy). Dispute photos live 7 years (per Lock 5 legal retention).

When a dispute opens, relevant clock-out photos get **copied** from `booking_photos` to `dispute_photos`. The originals continue their 30-day deletion. The copies survive 7 years.

### `dispute_escalation_events`

Audit trail for state transitions. Why a dispute moved from Tier 1 to Tier 2: was it cleaner non-response? Two rejections? Explicit request? Important for admin context + bias monitoring.

### Column additions

- `disputes.cleaner_response_deadline` — set at creation = NOW() + 48h
- `disputes.escalated_at` — set on Tier 2 transition
- `disputes.resolved_at` — set on final resolution
- `disputes.resolution_outcome` — final outcome enum
- `dispute_resolutions.customer_rejection_count` — for two-rejection detection

### Why RLS matters

RLS prevents cross-customer dispute snooping. The pattern: customer + cleaner of the booking can read; admin bypasses. Don't ship without RLS — privacy bug.

The dispute thread visibility is the trickiest: customer + cleaner during Tier 1; admin added at Tier 2. Solution: admin always has access via `admin_users` check OR'd with party check. Don't gate by dispute state — too brittle.

## Beginner traps

- **Don't store photos in `booking_photos` for disputes.** Use separate `dispute_photos` table. Retention policies differ.
- **Don't forget to copy photos at dispute creation.** Customer might dispute on day 29 of booking_photos retention. By day 30, originals delete. If dispute references them via foreign key without copy, they're gone.
- **Don't add NOT NULL columns without DEFAULT.** Existing dispute rows will error.

---

# Section 4 — Files to create

## What it means in plain English

The spec lists ~40 files. Spread across:

### Customer-facing routes (3 files)

The dispute flow surfaces. Open, view, respond.

### Cleaner-facing routes (2 files)

Inbox + per-dispute response.

### Components (~18 files across initiation, response, accept/reject, thread)

Lots of small focused components. Each does one thing. Composable.

### Library code (~6 files)

Pure logic separable from React:
- `dispute_creator.ts` — window enforcement + photo coordination
- `dispute_response_handler.ts` — cleaner response logic
- `dispute_resolution_handler.ts` — customer accept/reject
- `escalation_logic.ts` — 3 trigger conditions
- `dispute_state_machine.ts` — transitions
- `photo_uploader.ts` — 5-photo limit + retention

These deserve **extensive unit tests**. The escalation logic specifically: every edge case (boundary, race, partial state) covered.

### Server actions (~6 files)

Thin handlers calling lib code.

### Background jobs (1 file)

The 15-min auto-escalation cron.

### Phase 7a integration

Phase 7a doesn't change; you call its dispatcher from new Phase 8a code. Specifically: `recordReliabilityEvent()` calls on dispute opening (no immediate impact, just rate tracking) and on resolution (per outcome score impact).

## Why so much UI code

Phase 8a is **heavy on UX surfaces** because dispute resolution is sensitive — customer is upset, cleaner is defensive. The UX must be:

- **Calming for customer** — clear paths, expected timelines, fair process
- **Respectful for cleaner** — defense options, time to think, evidence available
- **Transparent for both** — see what the other party submitted, see why decisions made

Bad UX here causes premature escalation (customer skips Tier 1 directly to support) or chronic stalemates (parties don't trust the system).

## Beginner traps

- **Don't put dispute logic in components.** Components dispatch + render. Logic in `lib/`.
- **Don't write the cron job last.** Test it early because debugging cron at end blocks shipping.
- **Don't forget the auto-attached clock-out photos.** Cleaner expects them; if missing, they have to manually attach for every dispute. Annoying.

---

# Section 5 — Implementation order

## What it means in plain English

15 working days. Order matters.

### Days 1-3: Customer initiation

Build the entry point first. Get the dispute creator + window enforcement + photo upload + cleaner notification working. By day 3, customer can open a dispute and cleaner is notified.

### Days 4-6: Cleaner response

Now the cleaner needs to respond. Build the inbox + 4-option response form + customer notification. By day 6, full request-response cycle works.

### Days 7-9: Customer accept/reject + resolution

Now the customer reviews offers. Build accept paths (each triggers different downstream). Counter-propose. Two-rejection auto-escalation. By day 9, full Tier 1 resolution loop works.

### Days 10-11: Dispute message thread

Layer in messaging. Real-time + read receipts. Both parties can communicate throughout.

### Days 12-13: Auto-escalation cron

Build the cron + escalation logic. Test all 3 trigger paths in staging.

### Days 14-15: Closeout

End-to-end testing. Edge cases. Polish.

## Why this order

Sequential. Each sub-phase builds on the previous. You can't test cleaner response without dispute creation. You can't test customer accept without cleaner response. You can't test auto-escalation without the full state machine.

## Why some days might extend

Realistic: any day might extend by 50%. The likely time sinks:

- **Day 3 server action.** Stripe integration, photo upload coordination, notification dispatch — lots of integration points.
- **Day 7 acceptance paths.** Three different acceptance paths each touch different downstream phases (Phase 6a re-clean, Phase 9 refund, simple close). Each has edge cases.
- **Day 13 cron testing.** Wall-clock testing always slower than expected.

Build buffer.

## Beginner traps

- **Don't try to build all 5 sub-phases in parallel.** Sequential focus produces correct code.
- **Don't skip the acceptance path edge cases.** "What if cleaner accepted another booking in the slot they proposed?" needs handling.

---

# Section 6 — Specific gotchas

## What it means in plain English

The spec lists 8 gotchas. Real production issues.

### Gotcha A — Window enforcement race

Customer opens dispute at 47:59:55. Server checks at 48:00:05. Past window. **The fix: 5-minute grace period server-side.** Acknowledges client-server time variance.

### Gotcha B — Photo upload partial failure

5 photos uploaded; 1 fails. Don't lose customer's typed description. **The fix: photo upload completes BEFORE dispute creation.** If incomplete, prompt to retry without losing form state.

### Gotcha C — Re-clean booking creation race

Customer accepts cleaner's "Friday 11 AM" re-clean. Cleaner accepted another booking in those 2 minutes. **The fix: 5-minute booking hold** when customer accepts. If cleaner accepted another (rare), surface conflict and propose alternative.

### Gotcha D — Counter-propose loops

Customer counters; cleaner counter-counters; infinite. **The fix: one counter per side per dispute.** After both used, only accept/reject/escalate.

### Gotcha E — Cron firing during cleaner response in progress

Cleaner typing at 47:55. Cron fires at 48:00. Cleaner submits at 48:01; error. **The fix: auto-save cleaner draft every 30 seconds.** If escalation fires, cleaner sees "escalated; your draft is saved for admin context."

### Gotcha F — Two-rejection counter race

Customer rejects offer #1, cleaner re-offers, customer rejects #2 in 30 seconds. Counter increments to 2 but check fires too early. **The fix: customer rejection is synchronous.** Increment, check, escalate-or-not, return updated state. No cron involvement.

### Gotcha G — Photo retention drift

Dispute photos live 7 years. Job photos live 30 days. Dispute references job photos via foreign key. Job photos delete at 30 days; dispute reference dangles. **The fix: copy photos at dispute creation** to `dispute_photos`. Originals delete on schedule; dispute copies survive 7 years.

### Gotcha H — Dispute message thread visibility transition

Tier 1 messages: customer + cleaner only. Tier 2: admin needs access. **The fix: RLS policy includes admin always** via `admin_users` check OR'd with party check. Don't gate by dispute state.

## Why these matter

Each gotcha, missed, surfaces as production incident. Read defensively.

## Beginner traps

- **Don't trust local testing for cron.** Test in staging with mocked time.
- **Don't assume gotchas are exhaustive.** Real customers find new edges.

---

# Section 7 — Testing strategy

## What it means in plain English

Three layers:

### Unit tests

Pure-function libraries. Window enforcement edges. Each cleaner response type. Each customer acceptance path. Two-rejection threshold. State machine transitions.

### Integration tests

Full Tier 1 flow E2E for each resolution path. Auto-escalation simulation. Concurrent customer + cleaner activity.

### Manual QA

Real flows on staging. 48h window expiry. Notification delivery. Realtime threads on multi-device.

## Beginner traps

- **Don't rely solely on unit tests.** They miss integration issues.
- **Don't skip multi-device realtime testing.** Customer on iPhone + cleaner on Android — must work for both.

---

# Section 8 — Deployment plan

## What it means in plain English

Pre-deploy checklist, deployment order, rollback. Standard.

The unique-to-Phase-8a element: **soft launch for 7 days.** Real disputes are sensitive. Bugs visible to customers + cleaners. Soft launch = small subset of users + close monitoring.

## Why "soft launch"

Disputes are emotional. A bug in dispute UX = customer feels unheard, cleaner feels attacked. 7 days monitoring catches surface-able bugs before announcing widely.

## Beginner traps

- **Don't announce dispute system before 7 days clean operation.** Communications team wants to celebrate; engineering needs to verify first.
- **Don't roll back schema migrations.** Forward-only.

---

# Section 9 — Phase 8a → 8b/8c handoff

## What it means in plain English

Phase 8a output ready for Phase 8b (admin mediation):
- Disputes flowing to escalation queue
- Tier 2 escalated state populated
- Full evidence + thread → 8b mediation interface renders

Phase 8a output ready for Phase 8c (Tier 3):
- Categories include damage/safety/theft → 8c uses for triggers
- 7-year photo retention → satisfies legal
- Audit trail complete → satisfies insurance partner

## Why the decoupling

8a, 8b, 8c are intentionally decoupled. 8a produces disputes; 8b consumes from queue; 8c handles severe cases. Each can ship and operate independently of subsequent sub-phases (8a runs without 8b; 8b runs without 8c).

## What 8a doesn't do

- 8a doesn't render admin mediation UI (8b)
- 8a doesn't trigger insurance flows (8c)
- 8a doesn't handle legal review (8c)

8a stubs the trigger points; 8b/8c fill in.

---

# Section 10 — Open questions

## What it means in plain English

Four questions don't block 8a but should resolve before 8b/8c:

1. **Tier 2 SLA exact business hours.** Recommendation: 9 AM - 6 PM Pacific weekdays.
2. **Insurance partner identified.** Pre-launch task. Start during 8a build.
3. **Tier 3 legal review counsel.** Continue Phase 4 lawyer relationship.
4. **Anti-abuse threshold.** Verify with real data before 8b admin dashboard.

## Why this is okay

8a is well-defined. Open questions affect 8b/8c, not 8a.

---

# Notes on what comes next

After Phase 8a:

- **Phase 8b** (1.5 weeks) — Tier 2 admin mediation
- **Phase 8c** (1 week) — Tier 3 escalation + closeout

Total Phase 8: 5-6 weeks. Phase 8a is the foundation; everything else escalates from it.

After Phase 8:

- **Phase 9** — money operations + payouts (3 weeks; depends on 7a commission engine + 8a/b refund mechanics)
- **Phase 10** — notifications + polish (4 weeks; integrates everything)

---

This explainer is the canonical Phase 8a learning document. The spec (`phase-8a-spec.md`) is for execution; this is for understanding. The master outline (`phase-8-master-outline.md`) is for navigation across all of Phase 8.
