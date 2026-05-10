# Phase 6a — Booking Creation, Pricing, Reschedule, and Cancellation Specification

> **Author note (transparency):** This spec is being written ahead of when Phase 6a will actually be built — minimum 4-5 weeks from now (after Phase 5 verified end-to-end with real cleaners). The spec is correct as of the current date but will need a refresh when implementation actually starts, particularly for: Stripe Payment Intent setup specifics (API may evolve), exact 4-hour SLA cron behavior under load, and the 10-minute booking hold mechanism's edge cases (which only surface with real concurrent customers). Treat this document as an **aggressive draft**.

**Phase goal:** A customer who picked a cleaner in Phase 5 can complete a booking — pick a date+time, confirm address+service+duration, type entry instructions, see itemized pricing, authorize payment via Stripe. The booking persists in `bookings` table moving from `pending_payment_authorization → booking_requested`. Cleaner sees the request in their inbox (WF 3) and accepts within 4-hour SLA. Reschedule (WF 14a/14b) and cancel (WF 15) flows work end-to-end with correct money handling.

**Estimated duration:** ~3 weeks of focused engineering (15 working days).

**Depends on:**
- Phase 5 verified end-to-end on production (customer can browse, view profile, pick cleaner)
- Phase 4 cleaner Stripe Connect verified for at least 5 test cleaners
- Phase 3a customer profile + at least one default address
- B2 schema deployed (bookings, booking_state_events tables exist)
- Stripe API keys configured (test + production)

**Wireframes covered:** WF 6 (customer booking flow — the primary screen), WF 6b (cleaner request inbox row variant), WF 14a (reschedule entry), WF 14b (reschedule confirm), WF 15 (cancel), WF 39 (booking conflict + payment failed error states).

**Phase 6a sub-sections (sequential, but some natural overlap):**

- **6a-1** — Booking creation flow (~7 days) — the bulk
- **6a-2** — Cleaner accept/decline + 4-hour SLA (~3 days)
- **6a-3** — Reschedule flow (~3 days)
- **6a-4** — Cancellation flow (~2 days)

---

## 0. External account prerequisites

Lighter than Phase 4. Two services need active configuration:

### 0.1 Stripe — already set up; verify capabilities

**Verify before start:**
- Stripe API keys (test + production) configured in Vercel env vars
- Stripe Connect platform account active
- Stripe Connect Express used in Phase 4 (cleaner accounts already provisioned)
- Webhook endpoint configured: `/api/webhooks/stripe` registered with Stripe
- Webhook events subscribed: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`, `charge.refunded`, `charge.captured`

**Test before building:**
- Create test PaymentIntent with `capture_method: 'manual'`
- Confirm authorization via test card 4242 4242 4242 4242
- Capture authorization separately
- Cancel uncaptured authorization
- Refund a captured charge

If any of these don't work cleanly in test, **fix Stripe setup before writing application code**. Most Phase 6a debugging time is in Stripe state mismatches.

### 0.2 Lawyer items

Phase 6a triggers two lawyer review items that should clear before production:

1. **Cancellation policy copy** (WF 15) — exact wording on customer-side cancellation flow regarding refund timing, partial cleaner compensation, score impact framing.
2. **Booking authorization disclosure** (WF 6 step 4) — language explaining that authorization holds card balance for up to 7 days.

Phase 6a can build with placeholder copy; copy must be lawyer-reviewed before user-facing production deploy.

### 0.3 No third party API integrations beyond Stripe

Phase 6a doesn't introduce new third parties. Phase 6d (GPS) adds Mapbox/Google Maps Directions; Phase 6e (photos) uses Supabase Storage; both deferred.

---

## 1. Summary

After Phase 5 produces discoverable cleaners, Phase 6a is the bridge that turns "customer who picked Maria" into "customer with a booking on the calendar that Maria has accepted."

Concretely, by the end of Phase 6a:

1. **Customer can complete a booking from a cleaner's profile.** WF 6 flow: date+time → address+service+duration → entry instructions → payment confirm → Stripe authorization → confirmation screen.
2. **Booking creation is race-safe.** Two customers attempting the same slot simultaneously: one succeeds, the other gets WF 39.2 conflict screen with the next available alternative. The 10-minute hold mechanism prevents the rarer race where customer A has authorized but customer B is mid-flow.
3. **Pricing snapshot is immutable.** Booking captures cleaner's hourly rate × duration + $9.99 booking fee at creation. If cleaner changes rate later, this booking's pricing is unaffected. Already enforced by B2 audit Issue 2.2.
4. **Cleaner sees request in inbox.** WF 3 (cleaner job inbox) shows new request with 4-hour SLA visible. Accept transitions `booking_requested → confirmed` and notifies customer. Decline returns slot.
5. **Reschedule works.** Customer or cleaner can propose new time; other accepts/declines. Initiator role is stored for downstream Phase 7 score impact (cleaner-initiated penalized with first-per-month grace).
6. **Cancellation works with correct money mechanics.** Cancel ≥24h = void authorization (no money moves). Cancel <24h customer-initiated = 50% partial capture for cleaner compensation. Cleaner cancel = full void + score penalty (Phase 7 stub fires).
7. **Stripe authorization 7-day re-auth.** Bookings >7 days out get re-authorized at T-24h via daily cron.

---

## 2. Acceptance criteria

### Booking creation flow (WF 6)

- [ ] Customer on cleaner profile (WF 7) taps "Book" → `/book/[cleaner_id]` opens
- [ ] 4-step flow renders: date+time, address+service+duration, entry instructions, payment confirm
- [ ] Date+time picker shows only available 30-minute slots (queries `availability_rules` + `time_off_blocks` + existing bookings)
- [ ] Buffer time (default 30 min) between consecutive bookings respected
- [ ] Address step shows customer's default address pre-selected; "Use different address" reveals other saved addresses
- [ ] Service step defaults to cleaner's primary offered service; allows override to any service cleaner offers
- [ ] Duration default is `services.typical_duration_hours`; customer can adjust ±1 hr
- [ ] Entry instructions field accepts free text up to 500 chars
- [ ] Pricing summary displays itemized: cleaner rate × hours, booking fee $9.99, total
- [ ] Total amount in cents stored on booking row (`bookings.total_cents`)
- [ ] Pricing snapshot includes: cleaner_rate_at_booking, booking_fee_cents, duration_hours
- [ ] Stripe PaymentIntent created with `capture_method: 'manual'` and full total amount
- [ ] On Stripe auth success: booking row inserted, state = `booking_requested`, `booking_state_events` row inserted with transition
- [ ] On Stripe auth failure: WF 39.1 payment-declined screen shows; booking_hold persists 10 min for customer to update card
- [ ] On 10-min hold expiry without successful auth: hold released, slot returned to availability

### Race condition handling (WF 39.2)

- [ ] EXCLUSION CONSTRAINT on `bookings (cleaner_user_id, scheduled_start, scheduled_end)` rejects double-bookings at DB level
- [ ] Application-level: when customer reaches payment step, slot is held (booking_holds row, 10-min expiry)
- [ ] Customer B attempting same held slot: WF 39.2 conflict screen with cleaner's next available time
- [ ] Booking hold expiry cron releases holds older than 10 minutes

### Cleaner accept/decline (WF 3, 6b)

- [ ] New `booking_requested` rows appear in cleaner's `/cleaner/inbox` immediately (Realtime)
- [ ] Each request shows 4-hour SLA countdown
- [ ] Accept: state `booking_requested → confirmed`; customer notification fires
- [ ] Decline: state `booking_requested → cleaner_declined`; slot returns to availability; customer notified with apology + suggested alternative
- [ ] 4-hour SLA cron auto-declines unresponded requests; treats as cleaner_declined for score (stub for Phase 7)
- [ ] Decline budget: cleaner sees current count (X/3 this week); 4th+ flagged for score impact

### Reschedule (WF 14a, 14b)

- [ ] Customer or cleaner can initiate reschedule from booking detail
- [ ] Proposed slot validated against cleaner availability (same query as creation)
- [ ] Other party sees proposal as pending notification + email
- [ ] Accept: booking's scheduled_start/end updated; original slot freed; notification fires
- [ ] Decline: booking unchanged; initiator notified
- [ ] 24h auto-expire: pending reschedules without response auto-decline
- [ ] `reschedule_requests` row records initiator_role for Phase 7 score calc downstream

### Cancellation (WF 15)

- [ ] Customer or cleaner can cancel from booking detail
- [ ] Cancel timing computed: hours_before_start = (scheduled_start - NOW()) / 3600
- [ ] Customer cancel ≥24h: `cancellations` row, refund_amount = full, cleaner_compensation = 0; Stripe authorization voided
- [ ] Customer cancel <24h: `cancellations` row, refund_amount = 50%, cleaner_compensation = 50%; Stripe partial capture for cleaner amount; cleaner balance updated
- [ ] Cleaner cancel: full refund regardless of timing; Phase 7 score event triggered (stub); customer notified with apology
- [ ] State transition: `confirmed → cancelled_by_customer` or `confirmed → cancelled_by_cleaner`
- [ ] Customer notification on cleaner cancel includes link to suggested alternative cleaners (Phase 5 reuse)

### Cross-cutting

- [ ] All state transitions logged in `booking_state_events` with actor + timestamp
- [ ] All money-impacting actions have admin audit trail
- [ ] RLS: customer can only see their own bookings; cleaner can only see their own; admin bypass for support
- [ ] Notifications fire on every state change (Phase 10 integration; minimum email + push)

---

## 3. Database state required

### Existing tables (no changes)

- `bookings` — primary table; B2 schema sufficient
- `booking_state_events` — append-only state log; B2 sufficient
- `services` — service catalog; B2 sufficient
- `availability_rules` — cleaner weekly availability; B2 sufficient (read-only in 6a)
- `time_off_blocks` — cleaner time-off; B2 sufficient (read-only in 6a)
- `cleaner_profiles` — for hourly rate lookup; B1 sufficient
- `addresses` — customer addresses; B1 sufficient
- `charges` — Stripe charge tracking; B5 sufficient

### New migrations (Phase 6a)

```sql
-- Booking holds (10-minute reservation during payment)
CREATE TABLE booking_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cleaner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT booking_holds_time_check CHECK (scheduled_end > scheduled_start),
  CONSTRAINT booking_holds_expiry_check CHECK (expires_at > created_at)
);
CREATE INDEX idx_booking_holds_active ON booking_holds (cleaner_user_id, scheduled_start)
  WHERE released_at IS NULL;
CREATE INDEX idx_booking_holds_expiring ON booking_holds (expires_at)
  WHERE released_at IS NULL;

-- Reschedule requests
CREATE TABLE reschedule_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  initiated_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  initiator_role TEXT NOT NULL CHECK (initiator_role IN ('customer', 'cleaner')),
  proposed_start_at TIMESTAMPTZ NOT NULL,
  proposed_end_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  state TEXT NOT NULL DEFAULT 'pending'
    CHECK (state IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reschedule_pending ON reschedule_requests (booking_id, state);
CREATE INDEX idx_reschedule_expiring ON reschedule_requests (expires_at)
  WHERE state = 'pending';

-- Cancellations (audit trail; the bookings table already tracks cancelled state)
CREATE TABLE cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
  cancelled_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  canceller_role TEXT NOT NULL CHECK (canceller_role IN ('customer', 'cleaner', 'admin')),
  reason TEXT,
  reason_category TEXT,
  hours_before_start NUMERIC(5,2) NOT NULL,
  refund_amount_cents INTEGER NOT NULL CHECK (refund_amount_cents >= 0),
  cleaner_compensation_cents INTEGER NOT NULL DEFAULT 0
    CHECK (cleaner_compensation_cents >= 0),
  stripe_action TEXT CHECK (stripe_action IN ('void', 'partial_capture', 'refund')),
  cancelled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cancellations_booking ON cancellations (booking_id);

-- Cleaner decline events (for budget tracking)
CREATE TABLE cleaner_decline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  decline_reason_category TEXT,
  decline_message TEXT,
  declined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_decline_events_cleaner ON cleaner_decline_events (cleaner_user_id, declined_at DESC);
```

### RLS policies

```sql
-- Booking holds: only customer who holds can see
ALTER TABLE booking_holds ENABLE ROW LEVEL SECURITY;
CREATE POLICY booking_holds_owner ON booking_holds
  FOR ALL USING (customer_user_id = auth.uid());

-- Reschedule requests: customer or cleaner of the booking can see
ALTER TABLE reschedule_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY reschedule_requests_parties ON reschedule_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = reschedule_requests.booking_id
      AND (b.customer_user_id = auth.uid() OR b.cleaner_user_id = auth.uid())
    )
  );

-- Cancellations: parties of the cancelled booking
ALTER TABLE cancellations ENABLE ROW LEVEL SECURITY;
CREATE POLICY cancellations_parties ON cancellations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = cancellations.booking_id
      AND (b.customer_user_id = auth.uid() OR b.cleaner_user_id = auth.uid())
    )
  );

-- Decline events: cleaner sees own
ALTER TABLE cleaner_decline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY decline_events_owner ON cleaner_decline_events
  FOR SELECT USING (cleaner_user_id = auth.uid());
```

---

## 4. Files to create

### App routes — Customer-facing booking (~6 files)

- `/app/book/[cleaner_id]/page.tsx` — booking flow shell (Phase 6a-1)
- `/app/book/[cleaner_id]/confirmation/page.tsx` — post-success
- `/app/booking/[id]/page.tsx` — booking detail (used post-creation)
- `/app/booking/[id]/reschedule/page.tsx` — reschedule flow (Phase 6a-3)
- `/app/booking/[id]/cancel/page.tsx` — cancel flow (Phase 6a-4)
- `/app/booking/[id]/error/page.tsx` — error fallback (WF 39 variants)

### App routes — Cleaner-facing inbox (~2 files)

- `/app/cleaner/inbox/page.tsx` — request list (Phase 6a-2)
- `/app/cleaner/inbox/[booking_id]/page.tsx` — request detail with accept/decline

### Feature module — Booking flow (~10 files)

- `/features/booking/components/BookingFlowShell.tsx` — manages step state
- `/features/booking/components/DateTimePicker.tsx`
- `/features/booking/components/AddressConfirmationStep.tsx`
- `/features/booking/components/ServiceDurationStep.tsx`
- `/features/booking/components/EntryInstructionsStep.tsx`
- `/features/booking/components/PricingSummary.tsx`
- `/features/booking/components/PaymentAuthorizationStep.tsx`
- `/features/booking/components/BookingHoldTimer.tsx` — 10-min countdown
- `/features/booking/components/BookingConfirmation.tsx`
- `/features/booking/components/BookingConflictRecovery.tsx` — WF 39.2

### Feature module — Cleaner inbox (~4 files)

- `/features/cleaner_inbox/components/RequestsList.tsx`
- `/features/cleaner_inbox/components/RequestRow.tsx`
- `/features/cleaner_inbox/components/AcceptDeclineActions.tsx`
- `/features/cleaner_inbox/components/DeclineReasonModal.tsx`

### Feature module — Reschedule (~3 files)

- `/features/reschedule/components/RescheduleProposeForm.tsx`
- `/features/reschedule/components/RescheduleResponse.tsx`
- `/features/reschedule/components/RescheduleStatus.tsx`

### Feature module — Cancel (~3 files)

- `/features/cancellation/components/CancelForm.tsx`
- `/features/cancellation/components/CancelPolicyDisplay.tsx`
- `/features/cancellation/components/CancelConfirmation.tsx`

### Library code (~5 files)

- `/lib/booking/availability.ts` — `getCleanerAvailability(cleaner_id, date_range)` composite query (shared with 6c, 6g)
- `/lib/booking/pricing.ts` — `computeBookingPricing(cleaner_rate, service, duration)` + immutable snapshot
- `/lib/booking/holds.ts` — booking_holds CRUD + 10-min reservation logic
- `/lib/booking/state_machine.ts` — state transition validators + emitters
- `/lib/booking/cancellation_policy.ts` — refund + compensation calc per timing

### Server actions / API routes (~8 files)

- `/app/api/booking/availability/route.ts` — GET cleaner availability
- `/app/api/booking/hold/route.ts` — POST create hold; DELETE release
- `/app/api/booking/create/route.ts` — POST final booking creation
- `/app/api/booking/[id]/accept/route.ts` — cleaner accept
- `/app/api/booking/[id]/decline/route.ts` — cleaner decline
- `/app/api/booking/[id]/reschedule/route.ts` — propose reschedule
- `/app/api/booking/[id]/cancel/route.ts` — cancel
- `/app/api/webhooks/stripe/route.ts` — webhook handler (extends existing)

### Background jobs (3 files)

- `/jobs/booking_hold_expiry.ts` — releases expired holds (every 1 minute)
- `/jobs/cleaner_response_sla.ts` — auto-decline at 4-hour SLA breach (every 5 min)
- `/jobs/reschedule_request_expiry.ts` — auto-decline at 24h (every 1 hour)
- `/jobs/stripe_reauth_24h_before.ts` — re-authorize bookings 24h out (daily at 9 AM Pacific)

### Database migrations (1 file)

- `migrations/2026XXXXXX_phase_6a_schema.sql` — all 4 new tables + RLS

### Types (regenerated)

- Run Supabase type generation post-migration; commit `database.types.ts`

### Docs (3 files; this set)

- `phase-6-master-outline.md` — already created
- `phase-6a-spec.md` — this file
- `phase-6a-explainer.md` — plain-English walkthrough

---

## 5. Implementation order

### Sub-phase 6a-1 — Booking creation flow (~7 days)

**Day 1 — Schema + Stripe verification.** Run migrations; verify Stripe test PaymentIntent creation with `capture_method: 'manual'`; verify webhook delivery in test environment.

**Day 2 — Availability lookup + pricing engine.** Build `lib/booking/availability.ts` and `lib/booking/pricing.ts`. Unit test extensively. Both used by every downstream booking screen.

**Day 3 — Booking flow shell + step 1 (date+time).** `/app/book/[cleaner_id]` route with `BookingFlowShell`. Step 1 renders `DateTimePicker` calling availability lookup. Verify slots match cleaner's actual availability.

**Day 4 — Steps 2 + 3 (address+service+duration; entry instructions).** Wire up to customer's addresses. Pricing recomputes on duration change.

**Day 5 — Step 4 (payment authorization) + Stripe integration.** `PaymentAuthorizationStep` with Stripe Elements. Create PaymentIntent server-side. Confirm client-side. Handle success → booking creation.

**Day 6 — 10-min booking hold mechanism + race protection.** Implement `lib/booking/holds.ts`. Wire into payment flow. Test concurrent customers attempting same slot. Booking hold expiry cron.

**Day 7 — Confirmation screen + WF 39 error states + integration test.** Confirmation page; WF 39.1 payment failed; WF 39.2 conflict; WF 39.3 network error. Full E2E test from cleaner profile → booking confirmed.

### Sub-phase 6a-2 — Cleaner accept/decline + 4-hour SLA (~3 days)

**Day 8 — Cleaner inbox + Realtime new request notifications.** `/cleaner/inbox` route with Supabase Realtime subscription on bookings WHERE cleaner_user_id = self AND state = 'booking_requested'. Push notifications on new request.

**Day 9 — Accept + decline actions + state transitions.** Accept handler: state transition + customer notification + Stripe finalization. Decline handler: state + return slot + customer notification + decline budget tracking.

**Day 10 — 4-hour SLA cron + decline budget UI.** Cron: every 5 minutes scan `booking_requested` past 4-hour SLA → auto-decline + notify customer with apology. Cleaner inbox shows weekly decline count (X/3).

### Sub-phase 6a-3 — Reschedule flow (~3 days)

**Day 11 — Reschedule propose UI + server action.** `/booking/[id]/reschedule` route. Initiator picks new slot (uses same availability lookup). `reschedule_requests` row inserted.

**Day 12 — Reschedule response (accept/decline) + state transitions.** Other party sees pending request notification. Accept: booking's scheduled_start/end updated atomically with reschedule_request state change. Decline: notification fires.

**Day 13 — Reschedule expiry cron + edge cases.** 24h auto-decline cron. Edge case: original booking is already past start time — block reschedule. Test with mocked time.

### Sub-phase 6a-4 — Cancellation flow (~2 days)

**Day 14 — Cancel form + cancellation policy display + server action.** WF 15 form. Display refund preview based on timing. Server: insert `cancellations` row; trigger Stripe void/partial-capture/refund based on policy.

**Day 15 — Cleaner cancel path + closeout + verification.** Cleaner-side cancel triggers full refund regardless of timing + Phase 7 score stub. End-to-end verification of all 4 sub-phases working together: book → cleaner accept → reschedule → cancel.

---

## 6. Specific gotchas

### Gotcha A — Stripe PaymentIntent state vs booking state can desync

**The problem:** Stripe is the source of truth for payment state but lives outside your DB. Webhook delivery can be delayed (up to several seconds) or fail. If a customer creates a booking but the webhook for `payment_intent.succeeded` arrives 30 seconds later, you have a window where booking is `pending_payment_authorization` even though Stripe says succeeded.

**The fix:** Treat Stripe API as truth. On any booking state-sensitive operation, fetch latest from Stripe before acting. Webhook is for async notifications; don't gate critical operations on webhook receipt alone. Implement webhook idempotency via `stripe_event.id` deduplication so retries don't double-process.

### Gotcha B — 10-minute booking hold edge cases

**The problem:** Customer A reaches payment step → hold created. Customer B simultaneously reaches payment step → second hold attempted on same slot. Without serialization, both holds insert.

**The fix:** Use SERIALIZABLE transaction or row-level lock via SELECT FOR UPDATE on cleaner_id + slot. Reject second hold attempt with WF 39.2 conflict screen. Even with EXCLUSION CONSTRAINT on `bookings`, the constraint doesn't apply to `booking_holds` so explicit serialization is needed.

### Gotcha C — Authorization expires at 7 days; recurring bookings break

**The problem:** Stripe authorizations expire at 7 days. Booking 8 days out: authorization will expire before booking time. Recurring bookings (Phase 6g) often have this issue.

**The fix:** Daily cron at 9 AM Pacific scans bookings where `scheduled_start - NOW() <= 24h AND state = 'confirmed' AND last_authorized_at < NOW() - INTERVAL '6 days'`. For each: re-authorize via Stripe. On success, update `last_authorized_at`. On failure: notify customer; allow retry; if T-12h still failed, transition to `cleaner_declined` equivalent state and notify cleaner.

### Gotcha D — Cancellation policy edge case: booking just started

**The problem:** Customer cancels at scheduled_start - 5 minutes. Cleaner is en route. Hours_before_start = 0.083. Per policy: 50% cleaner compensation. But cleaner has actually committed time/travel.

**The fix:** Add a category for "cancellation during cleaner transit." If booking is in `imminent` or `in_transit` state, full capture for cleaner regardless of customer-stated reason. Customer sees: "This booking has already started — 100% goes to your cleaner. Open a dispute if there's a quality concern."

### Gotcha E — Reschedule chains can cycle

**The problem:** Customer reschedules to T2. Cleaner counter-proposes T3. Customer counter-proposes T4. Reschedule chain loop.

**The fix:** One pending reschedule_request per booking at a time. New proposal requires existing pending to expire/decline first. Surface clearly: "You have a pending reschedule already; respond before proposing another."

### Gotcha F — Decline budget gaming

**The problem:** Cleaner declines 4 in a week, gets penalty. Cleaner waits 6 days, declines 3 more. Reset gaming.

**The fix:** Use rolling 7-day window for budget calculation, not calendar week. Prevents reset-day gaming.

### Gotcha G — Time zone gotchas at slot boundaries

**The problem:** Cleaner in Sacramento (Pacific). Customer in Reno (also Pacific now, but DST transitions differ). Slot at "10 AM Sunday" — DST spring-forward day means 10 AM doesn't exist locally.

**The fix:** Store all times in UTC. Display in cleaner's local time on cleaner side, customer's local time on customer side. For DST nonexistent times: skip those slots in availability lookup. For DST repeated times: pick first occurrence.

### Gotcha H — Booking hold counts against cleaner availability

**The problem:** Customer A holds slot. Customer B tries to book same slot. Availability lookup must exclude held slots.

**The fix:** `getCleanerAvailability` query subtracts both confirmed bookings AND active (non-released, non-expired) booking_holds. Add this to the composite query in 6a-1 day 2.

---

## 7. Testing strategy

### Unit tests

- `lib/booking/pricing.ts`: edge cases (0 duration, fractional hours, free 0% commission case)
- `lib/booking/availability.ts`: empty week, fully booked, time-off overlap, hold overlap, buffer time
- `lib/booking/cancellation_policy.ts`: timing buckets, refund math
- `lib/booking/state_machine.ts`: invalid transitions rejected

### Integration tests

- Full booking flow E2E with Stripe test card
- Race condition: 5 concurrent attempts on same slot → 1 succeeds
- Cancellation refund flow: void at 25h before; partial capture at 12h; full void cleaner-cancel
- Reschedule: customer initiates → cleaner accepts → original slot freed
- Reschedule expiry: pending past 24h → auto-decline

### Manual QA

- Stripe webhook delay simulation (delay 30s) — booking still completes correctly
- Network drop during step 4 — form state preserved
- Browser back button during flow — state preserved
- Customer with no addresses — clear path to add address mid-flow
- Customer with declined card — WF 39.1 error + recovery

---

## 8. Deployment plan

### Pre-deploy checklist

- [ ] All migrations applied to production Supabase
- [ ] Stripe webhook endpoint verified in Stripe dashboard
- [ ] Background job scheduler running (Vercel Cron or Supabase pg_cron)
- [ ] At least 5 test bookings completed in production-like environment
- [ ] Lawyer-reviewed cancellation policy copy in place
- [ ] Stripe API keys rotated to production

### Deployment order

1. Migrations
2. Application code
3. Background jobs activated
4. Stripe webhook endpoint pointed to production
5. Soft launch: invite 10 customers + 5 cleaners to test bookings
6. Monitor for 48 hours
7. Public launch

### Rollback plan

If critical issue: revert application code (migrations are forward-only — don't roll back schema). Disable booking creation via feature flag while debugging.

---

## 9. Phase 6a → Phase 6b/c handoff

Phase 6a output ready for Phase 6b (messaging):
- Booking IDs exist with both customer + cleaner identified
- Booking state can transition to `confirmed` (pre-message context)
- Notification infrastructure in place (basic; Phase 10 enhances)

Phase 6a output ready for Phase 6c (availability):
- `availability_rules` + `time_off_blocks` queried by 6a's availability lookup
- Phase 6c is the editor; 6a is the reader
- Shared library `lib/booking/availability.ts` is canonical query

Phase 6a output ready for Phase 6d (GPS):
- Bookings have `confirmed` state from which "On my way" transitions
- Address + entry instructions stored; Phase 6d reveals at "On my way" tap

---

## 10. Open questions for Phase 6 lock-in (before Phase 7)

These don't block Phase 6a but should resolve before Phase 7 score impact wiring:

1. **Reschedule scoring:** Customer-initiated free; cleaner-initiated penalized with first-per-month grace. Confirmed in Phase 8 deep dive (Batch 8). Lock at Phase 7 spec.
2. **Cancellation cleaner-side score impact:** What threshold counts as "no-show"? Recommendation: cleaner cancel <2h before = no-show; otherwise standard cancel penalty.
3. **Decline penalty severity:** 4th+ decline within 7-day window — exact score delta? Defer to Phase 7 spec.
4. **Reschedule + cancel interaction:** Customer reschedules then cancels — which timing applies? Recommendation: cancellation timing measured against current scheduled_start (post-reschedule).

---

This spec is the canonical Phase 6a build reference. Plain-English walkthrough lives in `phase-6a-explainer.md`. High-level navigation across all of Phase 6 lives in `phase-6-master-outline.md`.
