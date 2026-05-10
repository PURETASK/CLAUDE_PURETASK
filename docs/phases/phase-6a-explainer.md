# Phase 6a — Plain-English Breakdown

This document walks through every section of `phase-6a-spec.md` and explains:
- What each thing means in plain English
- What needs to be designed (decisions to make)
- What needs to be built (actual files)
- Why each decision matters
- Beginner-trap warnings where they apply

Phase 6a is **the most consequential single sub-phase in Phase 6** because it's the moment your platform stops being a directory and starts being a marketplace. Before Phase 6a, customers can browse but not book. After Phase 6a, customers can book and cleaners can accept. Money authorizes (though doesn't yet capture — that's Phase 6f). Read section by section.

---

# Section 0 — External account prerequisites

## What it means in plain English

Phase 6a leans almost entirely on **Stripe**, which Phase 4 already set up. There's nothing new to sign up for. But there's plenty to verify before you write code.

The big concept here is that Stripe handles "authorization" and "capture" as two separate steps. When a customer books, you don't actually charge their card yet — you just put a hold on the funds (authorization). The actual charge (capture) happens later, after the cleaning is done and the customer approves it (Phase 6f). This two-step flow is what makes "pay only when satisfied" work.

If you've used Stripe before for one-shot purchases, this two-step pattern requires a slightly different setup. You create a `PaymentIntent` with `capture_method: 'manual'` instead of `'automatic'`. Phase 6a builds on top of that pattern.

## What "verify before you build" means here

Before writing any application code, run through the four-step Stripe test:

1. Create a PaymentIntent with `capture_method: 'manual'`
2. Confirm the authorization with test card 4242 4242 4242 4242
3. Capture the authorization separately later
4. Cancel an uncaptured authorization

If any of these fail in your Stripe test environment, **fix Stripe before writing app code**. Most of the painful debugging in Phase 6a comes from app code being correct but Stripe state being out of sync. Verify the foundation first.

## Why this is much simpler than Phase 4's prerequisites

Phase 4 introduced Stripe Connect, Checkr (background checks), and lawyer engagement. Phase 6a doesn't introduce any new external services. The 7-day authorization expiration matters for Phase 6g (recurring), but that's handled inside Phase 6a's re-authorization cron.

## Beginner traps

- **Don't skip the manual capture pattern.** It's tempting to do automatic capture and "refund if customer disputes," but that's a much worse customer experience and harder to reverse.
- **Stripe webhooks can be late.** Don't trust webhook receipt as the canonical source. Always fetch latest from Stripe API for state-critical operations.
- **Stripe test environment != production.** Idempotency keys, webhook signing secrets, and rate limits behave differently. Test on production-equivalent volumes before launch.

---

# Section 1 — Summary

## What it means in plain English

The summary section of the spec promises seven things will work by end of Phase 6a:

1. **Customer can complete a booking.** That's the WF 6 flow end-to-end. Date, time, address, service, duration, instructions, payment.
2. **Booking creation is race-safe.** When two customers try to book Maria for the same Friday 11 AM slot at literally the same moment, exactly one wins. The other sees the WF 39.2 conflict screen with a suggested alternative.
3. **Pricing is immutable on each booking.** The total amount stored on the booking row is final. If Maria raises her rate from $55/hr to $60/hr next week, this Friday's booking still costs what it cost when booked.
4. **Cleaner inbox works.** Maria sees the request in her `/cleaner/inbox` instantly (Realtime). She has 4 hours to accept or decline. Her inbox shows her current decline budget (X/3 this rolling 7-day window).
5. **Reschedule works for both sides.** Customer or cleaner can propose a new time. The other accepts or declines. If accepted, the booking moves; the original slot returns to availability.
6. **Cancellation handles money correctly.** Cancel ≥24h before? No money moves (Stripe void). Cancel <24h before as customer? Cleaner gets 50% of the authorized amount (Stripe partial capture). Cleaner-side cancel? Full void to customer + Phase 7 score event triggered.
7. **7-day authorization re-auth works.** For bookings further than 7 days out, a daily cron re-authorizes 24 hours before scheduled start. If re-auth fails, customer gets a heads-up and can update payment.

## Why this is one sub-phase, not five

You might wonder why booking creation, cleaner accept, reschedule, and cancel are all in one sub-phase. They're related because they all manipulate the same `bookings` table state machine and they all interact with Stripe.

You can't ship booking creation alone in production — once a customer can book, they immediately need a way to cancel or reschedule. Cleaner accept is what makes a booking actually happen (without it, customer pays for a "request" that never resolves). All four are interdependent for a launchable platform.

## Why this matters

Phase 6a is the moment you can charge customers real money. Everything before this was preparation. Everything after this depends on bookings actually existing. The schema is well-formed (B2 has the 22-state machine and EXCLUSION CONSTRAINT), but the application logic on top is what makes it work.

---

# Section 2 — Acceptance criteria

## What it means in plain English

Acceptance criteria are the binary pass/fail checklist. If any one of them is broken, Phase 6a isn't done. Don't ship Phase 6a until every box checks.

The criteria break into five groups:

### Booking creation flow

This is the WF 6 customer experience. The 4-step flow (date+time, address+service+duration, entry instructions, payment) must produce a `bookings` row with the right state, the right pricing snapshot, and a valid Stripe authorization. Critically: **the pricing snapshot is captured at creation and never recomputed.** Even if the cleaner changes their hourly rate next week, this booking stays at the original price.

### Race condition handling

Two customers try to book Maria's Friday 11 AM slot simultaneously. The database's EXCLUSION CONSTRAINT (already in B2 schema) prevents two `bookings` rows from existing for the same cleaner at the same time. But there's a second layer: the 10-minute booking hold. This protects the slot during a customer's payment retry window. Without the hold, customer A's payment failure could free the slot to customer B mid-flow.

### Cleaner accept/decline

When Maria opens her inbox, new requests appear in real-time. She can accept (booking moves to `confirmed`) or decline (slot returns; budget decrements). The 4-hour SLA cron auto-declines unresponded requests so customers aren't left hanging.

### Reschedule

Customer or cleaner proposes a new time. Other side responds. State transitions handle correctly. Initiator is recorded for downstream Phase 7 score impact.

### Cancellation

Cancellation is the most money-sensitive flow. The cancel form must show the customer their refund preview before they confirm. Behind the scenes, the right Stripe action fires: void (no money moves yet), partial capture (cleaner compensation), or refund (post-capture, rare for cancel).

## Beginner traps

- **Don't gate booking creation on cleaner accept.** The booking is created at customer authorization and exists in `booking_requested` state. Cleaner accept transitions it; doesn't create it. This matters for refund mechanics if cleaner declines.
- **Don't recompute pricing at any point post-creation.** The snapshot is final. Recomputing breaks audit and can cause real money mismatches if a cleaner adjusts rates mid-booking.
- **Don't skip the reschedule expiry cron.** Without it, pending reschedules sit forever; both parties get confused. 24-hour auto-decline is the cleanest default.

---

# Section 3 — Database state required

## What it means in plain English

You're adding **4 new tables** to support Phase 6a. The B2 schema is structurally sufficient for the booking lifecycle itself; you don't need to change `bookings` or `booking_state_events`. The 4 new tables track ancillary state.

### `booking_holds`

The 10-minute slot reservation during customer payment. This is application-level concurrency control. It exists to prevent the race where customer A is filling in their card details and customer B grabs the slot.

**Important:** the EXCLUSION CONSTRAINT on `bookings` only kicks in once a booking row exists. Before that, while customer A is mid-flow, you need separate protection. That's `booking_holds`.

### `reschedule_requests`

Tracks pending reschedule proposals. State machine: pending → accepted/declined/expired. The `initiator_role` column matters because Phase 7 score impact differs by initiator.

### `cancellations`

Audit trail for cancellations. The `bookings` table tracks cancelled state, but this table tracks the why and how — refund amount, cleaner compensation, hours_before_start (for policy enforcement audit). Required for support and disputes.

### `cleaner_decline_events`

Tracks each cleaner decline for budget enforcement. Rolling 7-day window: count declines; if >3, future declines have score impact (Phase 7).

## Why these aren't in B2

B2 was built before the wireframe deep dive surfaced these specific needs. They're correctly scoped as "adjacent state to bookings" rather than "core booking columns." Putting them on the `bookings` table would clutter; separate tables are cleaner.

## Why RLS matters

Row Level Security is what prevents Customer A from seeing Customer B's booking holds, reschedule requests, or cancellations. Phase 6a's RLS policies follow the standard pattern: parties of the booking can see; admin bypasses. Don't ship without RLS — it's a privacy bug waiting to happen.

## Beginner traps

- **Don't forget to ENABLE row level security.** A common mistake: write the policies but forget the `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. Policies without ENABLE do nothing.
- **Don't write RLS policies that allow public reads on booking_holds.** Only the owning customer should ever see them.

---

# Section 4 — Files to create

## What it means in plain English

The spec lists ~35 files across routes, components, library code, server actions, background jobs, migrations, and types. This sounds like a lot. It's actually about average for a sub-phase of Phase 6a's complexity. Phase 5 had ~30 files; Phase 4 had ~40.

The files break into clusters:

### Customer-facing routes (~6 files)

The booking flow (`/book/[cleaner_id]`), the post-booking confirmation, the booking detail screen, reschedule, cancel, and the error fallback. These are pages the customer sees.

### Cleaner-facing routes (~2 files)

Just the inbox + per-request detail. Cleaner doesn't have many surfaces in 6a — most cleaner UI is in Phase 6d/6e.

### Feature modules (~20 components)

This is where the bulk of the work lives. Booking flow shell, date+time picker, address step, service+duration step, entry instructions, pricing summary, payment authorization, booking hold timer (countdown UI), confirmation, conflict recovery, cleaner inbox list/row, accept/decline actions, decline reason modal, reschedule propose form, reschedule response, reschedule status, cancel form, cancel policy display, cancel confirmation.

The pattern: small, focused components per step + per action. Composing these is what builds the flow.

### Library code (~5 files)

These are the **core of Phase 6a's correctness.** They contain pure logic separable from React:

- `availability.ts` — composite query reused by 6a, 6c, 6g. Get this right and downstream phases get cheap correctness.
- `pricing.ts` — pricing snapshot logic. Pure function: inputs → output. No React.
- `holds.ts` — booking hold CRUD with the 10-min expiry semantics
- `state_machine.ts` — validates state transitions
- `cancellation_policy.ts` — refund + compensation calc per timing

**Pure functions are what you unit test.** Spend time on these. Get them right.

### Server actions / API routes (~8 files)

These are the request handlers. They're thin: receive validated input, call library code, write to DB, return. Don't put business logic here — put it in `lib/`.

### Background jobs (4 files)

- Booking hold expiry (every 1 minute)
- Cleaner SLA auto-decline (every 5 minutes)
- Reschedule expiry (every 1 hour)
- Stripe re-auth 24h-before (daily)

These are the time-driven side of the system. They're what makes the 10-minute hold actually expire, the 4-hour SLA actually trigger.

### Migrations (1 file)

All 4 new tables + RLS in one migration. Run once. Can't be undone (don't write down migrations for Phase 6a; if something's wrong, write a new forward migration).

## Why so many components

You might wonder why not just one big `BookingFlow.tsx`. The answer: testability and maintenance. Small focused components mean you can unit-test pricing logic without rendering the whole flow. They also mean future engineers (or future-you) can change one piece without understanding everything.

## Beginner traps

- **Don't put business logic in components.** Components render and dispatch. Logic lives in `lib/`. This separation pays off enormously when you write tests or change UX.
- **Don't make components do data fetching directly.** Server actions + props pattern. Components receive data as props from the route handler. (App Router makes this natural.)

---

# Section 5 — Implementation order

## What it means in plain English

Phase 6a is 15 working days. The order matters because some pieces unblock others.

### Day 1 — Foundation

Migrations + Stripe verification. Don't write app code on Day 1; verify the foundations work. If Stripe test PaymentIntent isn't behaving, fix Stripe before writing booking code.

### Day 2 — Pure functions

Build `availability.ts` and `pricing.ts` with extensive unit tests. These are the core libraries that everything else uses. **If these are wrong, everything downstream is wrong.** Spend the time.

### Day 3-4 — Booking flow steps

Build the four steps of the customer booking flow. Each step is a component; the shell composes them. By end of Day 4, customer can navigate the flow even if payment isn't wired yet.

### Day 5 — Stripe integration

Wire payment authorization. This is the moment the flow becomes real. Test with Stripe test card. Verify the booking row gets created with correct state.

### Day 6 — Race protection

Booking holds + concurrent customer simulation. Test thoroughly. This is the hardest correctness work in Phase 6a. The 10-minute hold mechanism + serializable transactions for hold creation = race-safe.

### Day 7 — Confirmation + error states

Polish the customer experience. WF 39 error states (payment failed, conflict, network error). End-to-end E2E test from cleaner profile through booking confirmed.

### Day 8-10 — Cleaner accept/decline

Inbox UI, accept/decline actions, 4-hour SLA cron. Cleaner's side of the booking lifecycle.

### Day 11-13 — Reschedule

Propose form, response handling, expiry cron. The most complex of the four sub-flows because it has more states and edge cases.

### Day 14-15 — Cancel + closeout

Cancel form, cancellation policy enforcement, cleaner-side cancel path, full E2E verification.

## Why this order matters

The sequence is dictated by dependencies. You can't test cleaner accept without bookings existing. You can't test reschedule without accept working. You can't test cancel until reschedule + accept are stable.

## Why some days might extend

Realistic planning: any day might extend by 50%. Stripe integration debugging is the most common time sink. The 10-minute hold mechanism's edge cases also tend to surface late in testing. Build buffer into the schedule.

## Beginner traps

- **Don't try to build everything in parallel.** Focus on each sub-phase's day plan. Reschedule edge cases are different from cancel edge cases.
- **Don't skip Day 2's pure-function unit tests.** Bugs in availability or pricing surface as production bugs much later. Catch them in unit tests now.

---

# Section 6 — Specific gotchas

## What it means in plain English

The spec lists 8 gotchas. These are not theoretical — they're real production issues that will surface in Phase 6a. Read them before building, then re-read them before shipping.

### Gotcha A — Stripe state vs booking state desync

Stripe is the source of truth for payment. Your DB tracks what you THINK Stripe says. These can drift. Always re-fetch Stripe state for state-sensitive operations. Webhook receipt is async and can be delayed — don't gate critical operations on webhooks alone.

### Gotcha B — 10-minute booking hold edge cases

Two customers reaching payment step simultaneously: without serialization, both get holds on the same slot. Use SERIALIZABLE transactions or row-level locks (`SELECT ... FOR UPDATE`). This is the most subtle concurrency bug in Phase 6a.

### Gotcha C — 7-day authorization expiration

Stripe authorizations expire at 7 days. Bookings further out break unless re-authorized at T-24h. The daily cron handles this. If re-auth fails, surface to customer immediately so they can update payment before scheduled start.

### Gotcha D — Cancellation during cleaner transit

Customer cancels at scheduled_start - 5 minutes when cleaner is en route. Standard policy says 50% cleaner compensation (because <24h). But cleaner has actually committed travel time. **Add a "transit cancel" category** for cancellations during `imminent` or `in_transit` states: 100% to cleaner.

### Gotcha E — Reschedule chain cycles

Customer reschedules to T2; cleaner counter-proposes T3; customer counter-proposes T4. Without limits, this loops forever. **One pending reschedule_request per booking at a time.** New proposal requires existing pending to expire/decline first.

### Gotcha F — Decline budget gaming

Cleaner declines 4 in a calendar week, gets penalized. Cleaner waits for week reset, declines 3 more. Game over. **Use rolling 7-day window, not calendar week.** Prevents reset gaming.

### Gotcha G — Time zone gotchas

DST transitions create nonexistent times (spring forward) and repeated times (fall back). Store everything in UTC. Display in local time. For nonexistent times: skip in availability. For repeated times: pick first occurrence. **This will bite you on March DST and November DST.** Test specifically.

### Gotcha H — Booking hold counts against availability

Customer A's hold needs to make the slot unavailable to Customer B's availability lookup. The composite query in `lib/booking/availability.ts` must subtract booking_holds (not just confirmed bookings). Easy to forget.

## Why these matter

Each of these gotchas, if missed, surfaces as a production incident. You'll find some of them in testing. Others surface only with real customer concurrency. Read them, write defensive code, and write the tests that exercise the edge cases.

## Beginner traps

- **Don't trust your local testing for race conditions.** Concurrency bugs require deliberate parallel test setup. Tools like `pgbench` or scripted curl loops can simulate concurrent requests.
- **Don't assume Stripe webhooks arrive in order.** Sometimes they don't. Idempotency keys + state checks before acting.

---

# Section 7 — Testing strategy

## What it means in plain English

Three layers:

### Unit tests

Pure-function libraries. Your `lib/booking/*.ts` files. These should have ≥90% coverage. Edge cases for pricing (zero duration, fractional hours), availability (full week, time-off, hold overlap), cancellation (timing buckets), state machine (invalid transitions).

### Integration tests

Stripe + DB + flow. Run against a Stripe test environment + test Supabase. Full booking flow E2E with test card. Race condition simulation. Cancellation refund flow.

### Manual QA

Human testing. Network drops mid-flow. Browser back button. Customer with no addresses. Customer with declined card. These are the edge cases unit tests miss.

## Why all three

Unit tests catch logic bugs cheaply. Integration tests catch system-interaction bugs. Manual QA catches UX bugs. None of them alone is sufficient. All three together = launchable.

## Beginner traps

- **Don't rely solely on unit tests.** They miss integration issues like Stripe state desync.
- **Don't skip manual QA before launch.** Real human flows surface real human bugs.

---

# Section 8 — Deployment plan

## What it means in plain English

Pre-deploy checklist, deployment order, rollback plan.

The pre-deploy checklist is non-negotiable. **Don't deploy with any of the boxes unchecked.** Every one is there because skipping it has caused launch issues at other companies.

The deployment order matters: schema first (migrations), then code, then jobs, then external integration (Stripe webhook). Each step waits for the previous to succeed.

The soft launch is critical: 10 customers + 5 cleaners testing for 48 hours catches most surfaceable issues before public launch. **Don't skip the soft launch.** It's the cheapest way to catch real bugs.

The rollback plan: revert app code, but never roll back schema. Migrations are forward-only. If schema is broken, write a new forward migration to fix.

## Why this is sequential

Migration → code → jobs → integration is the only safe order. Code referencing tables that don't exist = errors. Jobs running before code stable = mishandled state. External integrations active before app stable = customer-facing failures.

## Beginner traps

- **Don't run migrations after code deploy.** Schema must precede code that uses it.
- **Don't enable cron jobs immediately on launch.** Verify app works first. Enable jobs explicitly via feature flag if possible.

---

# Section 9 — Phase 6a → Phase 6b/c handoff

## What it means in plain English

Phase 6a output is ready for downstream phases. Specifically:

- **Phase 6b (messaging)** can use booking IDs to scope conversations. Bookings exist with both customer and cleaner identified.
- **Phase 6c (availability calendar)** is the editor for `availability_rules` + `time_off_blocks`. Phase 6a is the reader. Both share `lib/booking/availability.ts`.
- **Phase 6d (GPS / On my way)** transitions from `confirmed` state. Address + entry instructions stored on bookings; Phase 6d reveals at "On my way" tap.

## Why this matters

Phase 6a unblocks the rest of Phase 6. After Phase 6a ships, Phase 6b/c/d can build in parallel because their dependencies on 6a are satisfied.

## What 6a doesn't do

- 6a doesn't capture payment (that's 6f)
- 6a doesn't enforce photo uploads (6e)
- 6a doesn't run GPS pings (6d)
- 6a doesn't generate recurring instances (6g)
- 6a doesn't apply Phase 7 score impact (Phase 7 — Phase 6a stubs the trigger points)

---

# Section 10 — Open questions for Phase 6 lock-in

## What it means in plain English

The deep dive surfaced four lock-in items affecting Phase 6/7 wiring:

1. **Reschedule scoring rules** — customer-initiated free, cleaner-initiated penalized with first-per-month grace
2. **Cleaner cancellation no-show threshold** — recommend <2h before = no-show
3. **Decline penalty severity** — 4th+ decline in 7-day window
4. **Reschedule + cancel interaction** — cancellation timing measured against current scheduled_start

These don't block Phase 6a. They block Phase 7. Phase 6a can stub the trigger points (`emit_score_event(...)`) without knowing exact deltas. Phase 7 fills in the deltas.

## Why this is okay

Decoupling Phase 6 from Phase 7 means you don't block Phase 6a on Phase 7 spec decisions. The contract is: Phase 6a fires events; Phase 7 listens. Decisions on score deltas can come later.

## Why this matters for Phase 7 implementation

When Phase 7 is built, the spec writer should treat these four items as primary inputs. Don't lock them at lower confidence than warranted; they affect cleaner livelihoods.

---

# Notes on what comes next

After Phase 6a:

- **Phase 6b (messaging)** — 1.5 weeks. Booking-scoped real-time chat.
- **Phase 6c (availability calendar)** — 2 weeks. Cleaner edits weekly recurring availability + time off.
- **Phase 6d (GPS / On my way)** — 2 weeks. 3-min pings + geofence.
- **Phase 6e (photo system)** — 2-3 weeks. Most complex remaining sub-phase.
- **Phase 6f (approve & pay + review + tip)** — 1.5 weeks. Where Stripe finally captures.
- **Phase 6g (recurring)** — 2 weeks. Builds on top of all of the above.

Total Phase 6 is 13-16 weeks. Phase 6a is the foundation; everything else depends on it being right.

---

This explainer is the canonical Phase 6a learning document. The spec (`phase-6a-spec.md`) is for execution; this is for understanding. The master outline (`phase-6-master-outline.md`) is for navigation across all of Phase 6.
