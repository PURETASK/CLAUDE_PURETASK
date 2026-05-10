# PureTask — Phase 6 Master Outline

**Purpose:** A single navigation document for everything in Phase 6 (booking lifecycle, end-to-end), organized by sub-phase. Goal / Design / Build / Verify format for each section.

**Status:** Outline-level navigation. Detailed acceptance criteria, specific code, and gotchas live in `phase-6a-spec.md` (and future per-sub-phase specs). The why-behind-every-decision lives in `phase-6a-explainer.md` (and future).

**Phase scope:** Phase 6 is the **core product loop**. After Phase 5 makes cleaners discoverable, Phase 6 makes them bookable, executable, and payable. This is where PureTask becomes a transacting marketplace. By the end of Phase 6, a customer can book a cleaning, the cleaner can run it (GPS, photos, communication), the customer can approve and pay, and the system can carry recurring relationships.

**Phase duration estimate:** 13-16 weeks of focused engineering across 7 sub-phases. Some natural parallelism between sub-phases (6b messaging can build alongside 6c availability, etc.).

**Phase depends on:**
- Phase 1 deployed (foundation, auth shell)
- Phase 2 verified (auth end-to-end working)
- Phase 3a complete (customers have profiles + addresses + photo policy)
- Phase 4 complete (approved cleaners exist with hourly rates, service ZIPs, availability rules, photo training acknowledgment, Stripe Connect verified)
- Phase 5 complete (customers can browse and pick a cleaner)
- B1-B8 schema deployed in production Supabase

**Wireframes covered by Phase 6:**

| Sub-phase | Primary wireframes | Theme |
|---|---|---|
| 6a | WF 6, 6b (cleaner side), 14a, 14b, 15, 39 | Booking creation + pricing + reschedule + cancel |
| 6b | WF 18 | Messaging |
| 6c | WF 27 | Cleaner availability calendar |
| 6d | WF 4, 4b, 9, 61, 68 | "On my way" + GPS + lateness |
| 6e | WF 5, 5b | Active job photo system |
| 6f | WF 10, 20, 23 | Approve & pay + review + tip |
| 6g | WF 21, 22, 69 | Recurring + rebook |

---

## How to read this document

Each sub-phase has the four-heading format:
- **Goal** — what this sub-phase accomplishes in plain English
- **Design** — decisions to make before writing code (UX, business rules, ambiguities to resolve)
- **Build** — concrete files, components, migrations, integrations
- **Verify** — how you know it works (tests, end-to-end checks)

The **Goal** is the "why." The **Design** is the "what to think about." The **Build** is the "what to write." The **Verify** is the "how to know it's done."

If a section doesn't list a Design step, that means decisions are settled in the schema or wireframes — just build to spec.

---

## Phase 6 sub-phase overview

| Sub-phase | Title | Estimated weeks | Critical dependencies |
|---|---|---|---|
| **6a** | Booking creation + pricing + cancel/reschedule | 3 | Phase 5 complete + Stripe Connect verified |
| **6b** | Messaging | 1.5 | Phase 6a (booking IDs to scope to) |
| **6c** | Availability calendar | 2 | Phase 6a (so reschedule can use it) |
| **6d** | GPS / "On my way" / lateness | 2 | Phase 6a + Phase 6b (notice-as-message) |
| **6e** | Active job photo system | 2-3 | Phase 6a + Phase 4 photo training acknowledged |
| **6f** | Approve & pay + review + tip | 1.5 | Phase 6e (photos must be done) + Stripe capture flow |
| **6g** | Recurring booking | 2 | Phase 6a + Phase 6c + Phase 6f |

**Critical ordering rule:** 6a must ship before everything else. 6c must ship before 6g (recurring relies on availability lookup). 6f must ship before any standalone tip flow. 6e must ship before 6f (can't approve without photos).

---

# Phase 6a — Booking creation + pricing + cancel/reschedule (3 weeks)

**Phase 6a goal:** A customer who picked a cleaner in Phase 5 can complete a booking — pick a date/time, confirm address + service + duration + entry instructions, see exact pricing including booking fee, and authorize a Stripe payment. The booking persists in `bookings` table with `pending_payment_authorization → booking_requested` state. Cleaner sees the request in their inbox (WF 3) and accepts within 4-hour SLA. Both cancel (WF 15) and reschedule (WF 14a/14b) flows work end-to-end with the correct state transitions and policy enforcement.

**Phase 6a depends on:**
- Phase 5 cleaner browse + profile complete
- B2 booking_state_machine enum deployed (22 states)
- Phase 4 cleaner Stripe Connect verified (so authorization can split)
- Customer has at least one default address (Phase 3a)

**Wireframes:** WF 6 (customer booking flow), WF 6b (cleaner request inbox row receive), WF 14a (reschedule entry), WF 14b (reschedule confirm), WF 15 (cancel), WF 39 (booking conflict + payment failed error states).

**Sub-sections of 6a:**

## 6a-1 — Booking creation flow (WF 6)

### Goal
A customer on a cleaner's profile can tap "Book" and walk through a 4-step form (date+time, address+service+duration, entry instructions, payment confirm) culminating in a Stripe authorization.

### Design

**Decisions to make:**

1. **4-step flow as 4 routes vs 1 route with state.** Recommendation: 1 route (`/book/[cleaner_id]`) with internal step state. URL stays simple; refresh recovers via local form state (Phase 6a-1 also fixes WF 39.3 form state preservation).

2. **Time slot selection mechanism.** Cleaner availability comes from `availability_rules` (weekly recurrence) + `time_off_blocks` (date overrides) + existing bookings (busy slots). Phase 6a needs an availability lookup query that combines these. **This query is reused by 6c (calendar editor) and 6g (recurring instance generation).** Spec it once in 6a; reference everywhere.

3. **Pricing display.** Per WF 42 + WF 6: cleaner's hourly rate × duration + $9.99 booking fee. Display itemized line items. **Pricing snapshot is captured into `bookings` row at creation** (already enforced by B2 audit Issue 2.2). Even if cleaner changes rate later, this booking stays at original price.

4. **Duration selection.** Per WF 6: customer picks an estimated duration. Based on cleaner's typical for the service (`services.typical_duration_hours`). Default to typical; allow override.

5. **Address confirmation step.** Show default address + "Use different address" link. Selected address is associated with booking via `bookings.address_id`. Address details (entry, parking notes) come from `addresses` table fields.

6. **Entry instructions.** Per WF 6 + WF 4: customer types entry instructions per booking. Stored on `bookings.entry_instructions JSONB`. Cleaner sees these post-acceptance + at "On my way" reveal.

7. **Booking fee tax handling.** Per WF 42: "Sales tax doesn't apply to residential cleaning services in California." So the $9.99 booking fee + cleaner rate × duration = total. No tax line item in California. Lock this CA-specific. Phase 11 if expanding to other states.

8. **Stripe authorization (not capture).** Authorize the full amount at booking. Capture happens at WF 10 approval (Phase 6f). Stripe authorizations expire after 7 days by default; bookings >7 days out need re-authorization. **Spec the re-auth window:** 24h before scheduled start, re-authorize. If re-auth fails, customer notified to update payment.

9. **Race condition: 10-min booking hold.** Per WF 39.1 + WF 39.2: when customer is at payment step, hold the slot for 10 minutes. If they fail Stripe auth, slot stays held while they update card. After 10 min without successful auth, release slot. **B2 has EXCLUSION CONSTRAINT on bookings preventing same-cleaner-same-time** but the 10-min hold needs application-level logic since the booking row doesn't exist yet during the customer's payment attempt.

10. **First-100-per-ZIP perk redemption (WF 70).** If customer was on the waitlist for their ZIP and is in the first 100, apply $25 credit at first booking. **Defer to Phase 9** if scope tight; minimum-viable version is a coupon code customer enters.

### Build

**Routes / Pages:**
- `/book/[cleaner_id]` — booking flow (4 internal steps)
- `/book/[cleaner_id]/confirmation` — post-success confirmation

**Components:**
- `BookingFlowShell` — manages step state
- `DateTimePicker` — uses availability lookup query
- `AddressConfirmationStep`
- `EntryInstructionsStep`
- `PricingSummary` — itemized
- `PaymentAuthorizationStep` — Stripe Elements
- `BookingHoldTimer` — 10-min countdown UI when payment retrying

**Server actions / API routes:**
- `getCleanerAvailability(cleaner_id, date_range)` — composite query
- `createBookingHold(cleaner_id, slot, customer_id)` — 10-min reservation
- `releaseBookingHold(hold_id)` — explicit release
- `createBooking(...)` — final creation post-Stripe auth
- `getBookingPricing(cleaner_id, service, duration)` — pricing calculator

**Database:**
- `booking_holds` table (new from wireframe deep dive — 10-min slot reservation)
- Use existing B2 `bookings` + `booking_state_events`
- Add `bookings.payment_hold_expires_at` column (from Batch 6 schema)

**Stripe:**
- Stripe PaymentIntent creation with `capture_method: 'manual'`
- Webhook handler for `payment_intent.succeeded` / `payment_intent.payment_failed`
- 7-day re-auth cron (Phase 6a infrastructure; runs daily)

**State transitions:**
- `pending_payment_authorization` → `booking_requested` (Stripe auth succeeded)
- `pending_payment_authorization` → expired/cancelled (auth failed + 10-min hold expired)

### Verify

- E2E: customer books cleaner; payment authorizes; row exists in `bookings`; cleaner sees row in their inbox query
- Race: two customers attempt same slot simultaneously; one succeeds, other gets WF 39.2 conflict screen with alternative
- 10-min hold: simulate payment failure; verify slot held 10 min; verify slot released after 10 min if no retry
- Re-auth: book a slot 8 days out; verify re-auth cron runs at 24h-before; verify customer notified if fails
- Pricing: book at $55/hr × 2hr; total = $119.99; pricing snapshot stored on booking immutably

## 6a-2 — Cleaner request inbox + accept/decline (WF 3, WF 6b)

### Goal
A cleaner sees newly-requested bookings in their inbox (WF 3) and can accept or decline within 4-hour SLA. Accept triggers Stripe finalization + `booking_requested → confirmed` transition. Decline returns the slot to availability.

### Design

1. **4-hour SLA enforcement.** Per WF 3 + Phase 7 score system: cleaners have 4 hours to respond to new requests. After 4 hours of no response, request auto-routes back to customer with apology + suggested alternative. Track via cron + `bookings.expires_at`.

2. **Decline budget.** Per WF 3 + WF 51: cleaners get 3 declines per week without score penalty. 4th+ decline counts negatively. Track via `cleaner_decline_events`.

3. **Cleaner sees customer entry instructions on accept** (not before — customer privacy until cleaner committed).

4. **Push notification to customer on accept.** "Maria accepted your booking" → links to booking detail.

5. **Decline reason.** Per WF 3b: cleaner provides brief decline reason. Stored for analytics; not shown to customer (just shows "couldn't accept").

### Build

- `/cleaner/inbox` — pending requests list
- Accept/Decline server actions
- 4-hour SLA cron job (`pg_cron` or external)
- Decline budget tracker

### Verify

- Accept transitions state correctly + notifies customer
- Decline returns slot + tracks against budget
- 4-hour SLA: simulate; verify auto-decline + customer notification

## 6a-3 — Reschedule flow (WF 14a, WF 14b)

### Goal
Customer or cleaner can request reschedule. Other party accepts/declines. State machine handles the transition without losing booking history.

### Design

1. **Customer-initiated vs cleaner-initiated have different score impact.** Per Phase 7 + WF 52: customer-initiated = no score impact for cleaner. Cleaner-initiated = penalty (with first-per-month grace). Lock this in Phase 7 spec; Phase 6a stores the initiator on `reschedule_requests` for downstream score calc.

2. **Time-window restrictions.** Per WF 14a/15: cleaner-initiated reschedule within 48h of scheduled start = score deduction even with notice. Customer-initiated 24h+ before = free.

3. **Reschedule_requests table** (from wireframe deep dive — needs to be added; not in B2):
   ```sql
   CREATE TABLE reschedule_requests (
     id UUID PRIMARY KEY,
     booking_id UUID NOT NULL REFERENCES bookings(id),
     initiated_by_user_id UUID NOT NULL,
     initiator_role TEXT CHECK (initiator_role IN ('customer','cleaner')),
     proposed_start_at TIMESTAMPTZ NOT NULL,
     proposed_end_at TIMESTAMPTZ NOT NULL,
     state TEXT CHECK (state IN ('pending','accepted','declined','expired')),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     responded_at TIMESTAMPTZ
   );
   ```

4. **Slot availability check.** Use the same availability lookup as 6a-1. Don't allow proposing a slot that's already busy.

5. **Auto-expire reschedule requests.** 24-hour response window; auto-decline if no response.

### Build

- `/booking/[id]/reschedule` — reschedule request flow
- `reschedule_requests` migration
- Accept/decline actions
- Notification triggers
- Auto-expire cron

### Verify

- Customer reschedules; cleaner accepts; booking moves; original slot freed
- Cleaner reschedules within 48h; verify score event triggered (Phase 7 wiring; stub for now)
- Mutual conflict: cleaner declines; original booking stays as-is

## 6a-4 — Cancellation flow (WF 15)

### Goal
Customer or cleaner can cancel a booking. Cancellation policy applies (refund or no-refund based on timing). Money mechanics correctly route refunds and any cleaner compensation.

### Design

1. **Cancellation policy.** Per WF 15 + Master Guide:
   - Customer cancel ≥24h before = full refund, no cleaner compensation
   - Customer cancel <24h before = 50% to cleaner (compensation for blocked slot), 50% refund to customer
   - Cleaner cancel = full refund to customer + score penalty + customer credit if pattern
   - No-show by cleaner (per WF 68 + Phase 7) = full refund + significant score deduction

2. **Cancellations table** (from wireframe deep dive — needs to be added):
   ```sql
   CREATE TABLE cancellations (
     id UUID PRIMARY KEY,
     booking_id UUID NOT NULL REFERENCES bookings(id),
     cancelled_by_user_id UUID NOT NULL,
     canceller_role TEXT CHECK (canceller_role IN ('customer','cleaner','admin')),
     reason TEXT,
     reason_category TEXT,
     refund_amount_cents INTEGER NOT NULL,
     cleaner_compensation_cents INTEGER NOT NULL DEFAULT 0,
     hours_before_start INTEGER NOT NULL,
     cancelled_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. **Stripe refund flow.** Authorization not yet captured = void authorization (no actual money moved; instant). If captured (rare for cancel; more common for dispute) = Stripe refund.

4. **Late-cancel cleaner compensation.** Customer's authorization splits: half refunded, half captured + paid out to cleaner on next Friday payout. Implement via partial Stripe capture.

### Build

- `/booking/[id]/cancel` — cancel flow
- `cancellations` migration
- Refund/partial-capture logic
- Notification triggers

### Verify

- Cancel ≥24h: full void, no money moved, both notified
- Cancel <24h customer: 50% capture + cleaner gets 50% on next payout
- Cleaner cancel: full void + score event triggered (Phase 7 stub)

---

# Phase 6b — Messaging (1.5 weeks)

**Phase 6b goal:** Customer and cleaner can exchange messages scoped to a specific booking. Real-time delivery. Read receipts. Admin can read for dispute mediation. Notifications fire on new messages.

**Wireframes:** WF 18 (messaging thread).

## 6b-1 — Per-booking message thread

### Goal
Both customer and cleaner can view + send messages in the context of a confirmed booking. Threads are booking-scoped (no platform-wide DM system).

### Design

1. **Booking-scoped only.** No DMs outside a booking context. This intentionally limits abuse and simplifies admin dispute access (per WF 64 "We don't read your messages" qualified by dispute mediation).

2. **Real-time delivery.** Use Supabase Realtime channels filtered by booking_id. Each booking is a private channel; only customer + cleaner + admins (via RLS bypass) can subscribe.

3. **Messages table** (new — not in B2):
   ```sql
   CREATE TABLE messages (
     id UUID PRIMARY KEY,
     booking_id UUID NOT NULL REFERENCES bookings(id),
     sender_user_id UUID NOT NULL,
     body TEXT NOT NULL,
     sent_at TIMESTAMPTZ DEFAULT NOW(),
     read_at TIMESTAMPTZ,
     edited_at TIMESTAMPTZ,
     deleted_at TIMESTAMPTZ
   );
   CREATE INDEX idx_messages_booking ON messages (booking_id, sent_at);
   ```

4. **Read receipts.** Set `read_at` on first view by recipient. Display "Read" on sender's side.

5. **Admin dispute access.** Per WF 64 + WF 57: admins reading a dispute can see full message thread. RLS policy: admins bypass; users see only their bookings.

6. **No edit / no delete.** Per WF 18: messages are append-only (immutability for dispute evidence). Add columns for future flexibility but don't expose UI for v1.

### Build

- `/booking/[id]/messages` route
- `MessageThread` component (Realtime subscription)
- `MessageInput` component
- `messages` migration + RLS
- Notification trigger on new message (Phase 10 hook; stub for now)

### Verify

- Customer sends message; cleaner sees in real-time on their open thread
- Read receipts update on view
- RLS: another customer can't read this booking's messages
- Admin can read via admin tooling (Phase 4 admin auth)

## 6b-2 — Message notifications

### Goal
New messages trigger push + email notifications to recipient (respecting their preferences).

### Design

1. **Notification cadence.** First message per thread = immediate push. Subsequent messages within 5 minutes = batched (1 push for "New messages from Maria").

2. **Notification preferences.** Per WF 28: respect customer/cleaner notification settings (`users.notification_prefs JSONB`).

3. **Notifications table** (new — surfaced in Batch 3):
   ```sql
   CREATE TABLE notifications (
     id UUID PRIMARY KEY,
     user_id UUID NOT NULL,
     category TEXT NOT NULL,
     subject TEXT NOT NULL,
     body TEXT,
     related_booking_id UUID,
     related_message_id UUID,
     state TEXT CHECK (state IN ('unread','read','dismissed')),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     read_at TIMESTAMPTZ
   );
   ```

### Build

- Notification dispatcher service (Phase 10 will absorb this; minimum here is push + email per message)
- Push token handling (Phase 2 should already have)

### Verify

- Send message; recipient gets push within seconds
- Recipient with push disabled: only email
- 5 messages in 30 seconds: 1 batched push

---

# Phase 6c — Availability calendar (2 weeks)

**Phase 6c goal:** Cleaners can configure their weekly recurring availability + add date-specific time-off. Booking creation (6a) and recurring instance generation (6g) read from this same source. Calendar is editable, savable, and queryable in <100ms for typical loads.

**Wireframes:** WF 27 (cleaner availability editor).

## 6c-1 — Weekly availability rules editor

### Goal
Cleaner sets recurring weekly availability (e.g., "Available Mon-Fri 9 AM - 5 PM, Sat 10 AM - 2 PM"). Stored in `availability_rules` (already in B2 schema).

### Design

1. **B2 schema is sufficient.** `availability_rules` table exists. Phase 6c is application logic.

2. **Time-block granularity.** 30-minute blocks (matches WF 27). Cleaner toggles 30-min blocks per day.

3. **Time zone handling.** All times stored in cleaner's local time (per `cleaner_profiles.timezone`). Convert to UTC at booking creation.

4. **At least one day required.** Don't let cleaner save zero availability (would never receive bookings).

5. **Availability change effect on existing bookings.** Existing bookings keep their slots even if cleaner narrows availability. New rule applies only to new bookings.

### Build

- `/cleaner/settings/availability` (WF 27)
- `WeeklyCalendarEditor` component
- Save/update server action
- Validation: min 1 day; valid time ranges

### Verify

- Set Mon 9-5; save; reload; persists
- Customer browse: only see this cleaner during their available windows
- Edit existing rule; previously-confirmed bookings unaffected

## 6c-2 — Time-off blocks

### Goal
Cleaner can mark specific date ranges as time off (vacation, sick days). Existing bookings within time-off auto-flag for reschedule.

### Design

1. **`time_off_blocks` table exists in B2.**

2. **Conflict with existing bookings.** When cleaner marks time off that overlaps an existing confirmed booking, prompt: "You have a confirmed booking with Sarah on Nov 15 within this time-off. Reschedule it?" Tap → reschedule flow (6a-3) with cleaner-initiated framing.

3. **Cleaner-initiated reschedule due to time-off.** Score impact policy: legitimate medical/emergency = no penalty (admin discretion); discretionary vacation = standard cleaner-initiated penalty if <48h.

### Build

- Time-off form on availability editor
- Conflict detection + prompt
- Auto-launch reschedule flow on conflict acknowledge

### Verify

- Add time off; no overlap = saves cleanly
- Add time off overlapping booking; conflict prompt; reschedule flow launches

## 6c-3 — Availability lookup query

### Goal
A single composite query takes (cleaner_id, date_range, optional service+duration) and returns available 30-min slots. Used by 6a (booking creation), 6a-3 (reschedule), 6g (recurring instance generation).

### Design

1. **Query composition:**
   ```
   available_slots = weekly_recurring_availability
                   - existing_confirmed_bookings
                   - time_off_blocks
                   - bookings_currently_on_hold (10-min)
   ```

2. **Performance.** Cache-friendly. For a typical cleaner with 5 bookings/week + standard rules: query should run <50ms. Index `bookings (cleaner_user_id, scheduled_start, scheduled_end)` already in B2.

3. **Buffer time.** Between bookings, cleaner needs travel time. Default 30-min buffer between consecutive bookings; configurable per cleaner.

### Build

- `getCleanerAvailability(cleaner_id, date_range, [service])` server function
- Unit tests covering: empty week, fully booked week, time-off overlap, hold overlap

### Verify

- Performance: query runs <100ms on cleaner with 50 historical bookings + 10 active
- Correctness: time-off slots excluded; hold slots excluded; existing bookings excluded

---

# Phase 6d — GPS / "On my way" / lateness (2 weeks)

**Phase 6d goal:** When booking start approaches, cleaner taps "On my way" → address + entry instructions reveal → 3-min GPS pings during transit → geofence detection at 100m → clock-in available. Customer sees ETA (not raw GPS coordinates). Late notice flow integrates with score system.

**Wireframes:** WF 4, 4b (cleaner side), WF 9 (customer ETA tracker), WF 61 (cleaner detail), WF 68 (running late).

## 6d-1 — "On my way" state + reveal

### Goal
Cleaner tap reveals customer address + entry instructions; transitions booking to `in_transit`; starts GPS ping cycle; notifies customer.

### Design

1. **Reveal timing.** Address visible to cleaner only after "On my way" tap (privacy until cleaner commits). Entry instructions on same tap.

2. **State transitions.** `confirmed → imminent` (T-24h cron) → `in_transit` (cleaner tap).

3. **Already in B2 schema.** `bookings.actual_start_at` etc. fields exist for tracking.

### Build

- "On my way" button on cleaner job detail (WF 4)
- State transition handler
- Customer notification trigger
- Address reveal UI (WF 61)

### Verify

- Tap → state transition + customer push within seconds
- Address visible to cleaner only post-tap
- Cleaner can call/message customer (Phase 6b integration)

## 6d-2 — GPS ping cycle + customer ETA

### Goal
While `in_transit`, cleaner's GPS coords ping every 3 minutes. Server computes ETA based on distance + average speed. Customer sees ETA (e.g., "Maria · ETA 11:02 AM · 4.2 mi away") but never raw coordinates.

### Design

1. **3-minute ping cadence.** Battery-aware: backoff to 5-min beyond 30-min trips.

2. **GPS storage.** Don't store every ping (privacy + storage). Store only most recent on `bookings.last_gps_lat / last_gps_lng / last_gps_at`. Override on each ping.

3. **ETA computation.** Use Mapbox Directions API or Google Maps Directions. Cache route per booking; refresh every 3 min.

4. **Customer-side rendering.** Map shows cleaner's progress as moving marker (per WF 9). Marker animates from previous to current position to smooth.

5. **Privacy guarantee.** Per WF 64 + WF 61: customer sees ETA derived from coords, never raw coords. Front-end never receives lat/lng.

6. **Pre-arrival reveal stop.** When cleaner enters geofence, stop GPS pings (battery + privacy). Per WF 64: "We don't track cleaners' GPS during the cleaning itself."

### Build

- GPS ping endpoint (mobile uploads coords; server computes ETA)
- Geofence detection (100m radius around address coords)
- Customer ETA endpoint (returns ETA only)
- Map widget on customer side (WF 9)

### Verify

- 3-min ping cadence working
- ETA updates as cleaner moves
- Customer never receives lat/lng (verify network response)
- Geofence stops pings on arrival

## 6d-3 — Geofence + clock-in

### Goal
Cleaner within 100m of address geofence sees "Clock in" button. Clock-in transitions to `arrived → in_progress`. Photo system (Phase 6e) starts.

### Design

1. **Geofence radius.** 100m default. Per WF 4b ("Clock-in available within 100m of her address"). Larger radii (200m) for rural/large properties — configurable per cleaner profile if Phase 11.

2. **Tolerance for inaccurate GPS.** If accuracy >50m, allow clock-in within 150m as fallback. Log accuracy reading.

### Build

- Geofence detection (Haversine distance)
- "Clock in" CTA conditional on geofence
- State transition

### Verify

- Mock cleaner at 50m → clock-in available
- Mock cleaner at 200m → clock-in unavailable
- Mock cleaner with 80m accuracy → fallback geofence

## 6d-4 — Late notice flow (WF 68)

### Goal
Cleaner running late can flag from "On my way" screen → notice pre-fills duration + reason + customer message → sends. Customer notified. Score impact mitigated.

### Design

1. **Score impact rules** (locked from Phase 7 spec, surfaced in deep dive):
   - <15 min late + notice = no penalty
   - 15-30 min late + notice = small penalty
   - 30+ min late no notice = no-show penalty
   - First late notice per booking = free; subsequent = full penalty

2. **`late_notices` table** (from Batch 10 schema additions).

3. **Customer-side ack.** Customer sees notice + can request reschedule for free if 30+ min late. Customer agency.

### Build

- WF 68 form
- `late_notices` migration
- Customer notification + ack flow
- Phase 7 score event trigger (stub if Phase 7 not yet built)

### Verify

- Send 5-min notice → customer sees "Maria running 5 min late"; no score impact
- Send 20-min notice → score impact stub fires correctly
- 30-min late no notice → no-show flag triggered

---

# Phase 6e — Active job photo system (2-3 weeks)

**Phase 6e goal:** Cleaner can capture per-room before/after photos during the active job. Required rooms must be photographed before clock-out. Photos upload in background with retry. Customer sees them at approval (WF 10). Photo training acknowledgment (WF 49) gates this in Phase 4 — Phase 6e enforces.

**Wireframes:** WF 5 (active job photo capture), WF 5b (clock-out blocked), WF 49 (photo etiquette training, Phase 4-gated).

**Critical:** This is the most-photo-intensive phase. Storage costs + privacy compliance + integrity controls all apply.

## 6e-1 — Photo capture flow

### Goal
Cleaner during `in_progress` state can take photos per room. Each room has before/after pair requirement. Photos labeled by room. Camera UI per WF 5.

### Design

1. **B2 has `booking_photos` table.** Phase 6e wires application.

2. **Room categorization.** Per booking creation (6a-1), customer specifies rooms. Cleaner takes photos labeled per room.

3. **Before/after pairing.** UI hint to take pairs. System doesn't enforce pairing (cleaner might forget pre-photo); flags for admin if missing.

4. **EXIF stripping.** Strip GPS coords, device identifiers, timestamps from EXIF before storage. Privacy + integrity. Use sharp / image processing pipeline.

5. **Image dimensions.** Resize to max 2000px on long edge. Preserves quality without storage bloat.

### Build

- `/cleaner/job/[booking_id]/photos` route
- Camera UI component
- Per-room photo grouping
- Image processing pipeline (resize + EXIF strip)
- Upload queue

### Verify

- Take photo; uploads in background; appears in booking's photos list
- EXIF coords stripped (verify metadata)
- Network drop during upload; retry queue persists; uploads on reconnect

## 6e-2 — Required-rooms enforcement (WF 5b)

### Goal
Per WF 5b: cleaner can't tap "Clock out" until all required rooms have photos. UI surfaces missing rooms.

### Design

1. **"Required" definition.** Per WF 5: customer specified at booking; default = kitchen, all bathrooms, all bedrooms, common areas (skip rooms excluded per customer skip-room policy from WF 29).

2. **Skip-room enforcement.** Customer-flagged skip rooms (WF 29.3.2) NOT photographed by cleaner. Per WF 49 photo training.

3. **Voluntary extra rooms.** Cleaner can add extra rooms beyond required (per WF 49.3.4).

### Build

- Required-rooms checklist on active job UI
- Clock-out button gated on all required rooms photographed
- Skip-room respect logic

### Verify

- All required rooms photographed → clock-out enabled
- Missing room → button disabled with "Need photos for: [room]"
- Skip room: not in required list; cleaner can't add even voluntarily

## 6e-3 — Photo storage + integrity

### Goal
Photos stored securely. Customer-accessible at approval. Admin-accessible at dispute. Privacy preserved.

### Design

1. **Storage choice.** Supabase Storage (bucket per environment). Images served via signed URLs.

2. **Photo retention policy.** Per WF 29: photos auto-delete after 30 days post-completion (default) or earlier per customer policy. Implement deletion cron.

3. **Photo metadata.** Each photo: cleaner_user_id, booking_id, room_label, before_or_after enum, captured_at, uploaded_at, file_path.

4. **Integrity flag.** Per WF 49: raw photos only. If image processing detects evidence of manipulation (e.g., cropped to suspicious aspect ratio, or EXIF shows edit history despite stripping), flag photo with `integrity_concern` boolean. Admin reviews in dispute.

5. **Signed URLs.** Customer/cleaner access photos via short-lived signed URLs (1-hour expiry). Prevents URL sharing.

### Build

- Supabase Storage bucket setup
- Signed URL generator
- Retention deletion cron
- Integrity scanner

### Verify

- Photo accessible via signed URL; not via raw URL
- 30 days post-completion: photos auto-deleted
- Edited image: integrity flag triggered

---

# Phase 6f — Approve & pay + review + tip (1.5 weeks)

**Phase 6f goal:** After cleaner clocks out + photos uploaded, booking enters `awaiting_approval`. Customer has 24h to review photos and approve. Approval triggers Stripe capture + cleaner payout queueing. Auto-approval at 24h. Review submission with traits + rating. Tip flow as separate Stripe charge.

**Wireframes:** WF 10 (approve & pay), WF 20 (review prompt + tip), WF 23 (standalone tip — separate flow).

## 6f-1 — 24-hour auto-approval + customer manual approval (WF 10)

### Goal
Customer sees photos, taps "Looks good — approve and pay" → Stripe capture fires → state moves to `approved`. Or 24h passes silently → auto-approval → same outcome. 48h dispute window opens post-approval.

### Design

1. **State transitions.** `awaiting_approval → approved` (manual) or `auto_approved` (cron). Both trigger capture.

2. **24-hour timer starts at clock-out + photos complete.** Not at booking start. Per WF 10.

3. **48-hour dispute window post-approval.** During this window, customer can open dispute (WF 16). Phase 8 territory; Phase 6f sets the window timer.

4. **Stripe capture.** Capture full authorized amount. Record `bookings.captured_at`.

5. **Cleaner payout queueing.** Captured charges accrue to cleaner's balance. Friday payout cron (Phase 9) processes.

### Build

- WF 10 approval UI
- Approval server action (Stripe capture + state transition)
- Auto-approval cron (every 5 min, scan `awaiting_approval` past 24h)
- Dispute window timer

### Verify

- Manual approve → capture fires, cleaner balance updates
- 24h passes silently → auto-approval; same outcome
- Photos missing post-clock-out → no auto-approval (cleaner can't clock out without photos per 6e-2)

## 6f-2 — Review submission (WF 20)

### Goal
Customer post-approval can submit star rating + trait tags + optional comment. Review affects cleaner's score (Phase 7 wiring; stub for now). 4+ star review unlocks tip prompt.

### Design

1. **Reviews table** (new — surfaced in Batch 3):
   ```sql
   CREATE TABLE reviews (
     id UUID PRIMARY KEY,
     booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
     customer_user_id UUID NOT NULL,
     cleaner_user_id UUID NOT NULL,
     rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
     traits JSONB DEFAULT '[]', -- array of trait tags
     comment TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Trait tags.** Per WF 20.4: 6 specialty traits + general positive traits. Customer can tap multiple. Feeds Phase 7 specialty badge calc.

3. **Review optional.** Per WF 20: customer can skip. Don't gate approval on review.

4. **Tip prompt gating.** Per WF 20.5: tip prompt appears only if rating ≥4. Reduces awkwardness on poor experience.

### Build

- WF 20 review form (post-approval)
- `reviews` migration
- Trait tag UI

### Verify

- Submit 5-star + traits → review row exists; cleaner score event triggered (stub)
- Submit 3-star → no tip prompt
- Skip review → no review row; approval already done

## 6f-3 — Tip flow

### Goal
Customer can tip cleaner (separate Stripe charge, 100% pass-through to cleaner). Either at review (WF 20) or standalone post-approval (WF 23).

### Design

1. **Separate Stripe charge.** Tip is its own PaymentIntent + immediate capture. Not part of booking authorization. Allows tipping any time.

2. **100% pass-through.** Per WF 42 + WF 20: PureTask takes 0% of tips. Cleaner receives full tip via next payout.

3. **Tips table** (new):
   ```sql
   CREATE TABLE tips (
     id UUID PRIMARY KEY,
     booking_id UUID NOT NULL REFERENCES bookings(id),
     customer_user_id UUID NOT NULL,
     cleaner_user_id UUID NOT NULL,
     amount_cents INTEGER NOT NULL,
     stripe_charge_id TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

4. **Standalone tip flow (WF 23).** Customer can tip up to 30 days post-approval. After 30 days: tip flow closes for that booking.

### Build

- Tip selector UI on WF 20
- Standalone WF 23 flow accessible from booking detail
- Tip Stripe handler
- Cleaner balance update on tip

### Verify

- Tip $10 → Stripe charge $10; cleaner balance + $10 (no commission)
- 30 days later: standalone tip flow disabled

---

# Phase 6g — Recurring booking (2 weeks)

**Phase 6g goal:** Customer can set up recurring (weekly/biweekly/monthly) cleanings with same cleaner. Recurring instances auto-charge 24h before scheduled start. Customer can pause, skip, modify, or cancel. Cleaner sees recurring relationships in their schedule.

**Wireframes:** WF 21 (recurring setup), WF 22 (recurring management), WF 69 (rebook same address — adjacent).

## 6g-1 — Recurring schedule creation (WF 21)

### Goal
Post-completion of a successful booking, prompt customer to set up recurring with same cleaner + same setup. Customer picks frequency (weekly / biweekly / monthly).

### Design

1. **B2 has `recurring_schedules` + `recurring_occurrences`.** Phase 6g wires application.

2. **NOT tier-gated.** Per Phase 7 inconsistency resolution (Batch 8 deep dive): all tiers can have recurring. Edit WF 51 copy.

3. **Frequency options.** Weekly / Biweekly (every 2 weeks) / Monthly (same day each month, or "every 4 weeks").

4. **End condition.** Customer can set "until canceled" (default) or specific end date.

5. **Cleaner consent.** Cleaner must accept recurring relationship. First instance acceptance = consent for series; cleaner can pause/end at any time.

### Build

- WF 21 setup flow (post-completion prompt)
- `recurring_schedules` activation
- Cleaner accept on first instance

### Verify

- Customer sets weekly recurring → schedule row + first 8 occurrence rows generated
- Cleaner accepts first instance → series confirmed

## 6g-2 — Instance generation + 24h-before charge

### Goal
For each recurring instance, generate booking row 7 days before scheduled start. 24h before, attempt Stripe authorization (re-auth pattern from 6a). On success, instance fires normally.

### Design

1. **Instance generation cron.** Daily cron generates next 7 days of `recurring_occurrences` rows with `pending_authorization` state.

2. **24h-before authorization.** Daily cron at T-24h authorizes. On success → `confirmed`. On failure → notify customer; allow retry; if 12h before still failed, skip instance + notify.

3. **Skipped instances.** Customer or cleaner can skip a single instance. Skipped occurrences don't generate bookings.

4. **Cleaner availability check.** Each instance generation re-checks cleaner availability (use 6c-3 query). If cleaner now unavailable for that slot, propose reschedule or skip.

### Build

- Instance generation cron
- 24h-before charge cron
- Skip mechanism
- Availability re-check on generation

### Verify

- Set weekly recurring; verify 7 instances generated 7 days out
- 24h before: authorization attempted; succeeds → confirmed
- Force auth fail → customer notified + retry available

## 6g-3 — Recurring management (WF 22)

### Goal
Customer can pause, skip next instance, modify cleaner/time, or end recurring entirely. Cleaner can pause from their side too.

### Design

1. **Pause states.** Customer pause = customer-initiated; cleaner pause = cleaner-initiated. Both pause future instance generation. Customer can resume.

2. **Cleaner pause.** Cleaner pausing offers customer alternatives or end-of-recurring.

3. **Modification.** Change cleaner = end current series, start new series. Change time = update schedule's preferred time.

4. **End conditions.** Customer ends → all future instances removed. Cleaner ends → customer notified + alternatives offered.

### Build

- WF 22 management UI
- Pause/resume/end actions
- Customer + cleaner notifications on cleaner-side actions

### Verify

- Pause; next 7 days of instances don't fire
- Resume; next instance generates
- Cleaner pauses; customer notified with alternatives

---

# Phase 6 verification + closeout (Phase 6h)

**Phase 6h goal:** All sub-phases verified end-to-end with real test data. Schema matches. Performance targets met.

### Acceptance criteria

- [ ] Customer can book a cleaner end-to-end with real Stripe authorization
- [ ] Cleaner accepts request within 4-hour SLA
- [ ] Reschedule + cancel flows working with correct money handling
- [ ] Customer + cleaner can message in real-time
- [ ] Cleaner availability fully editable; integrates with booking
- [ ] "On my way" GPS works with 3-min ping cadence
- [ ] Geofence + clock-in working at 100m
- [ ] Photo capture + required-rooms enforcement at clock-out
- [ ] 24h auto-approval triggers Stripe capture
- [ ] Review + traits + tip flows working
- [ ] Recurring schedule generates instances and charges 24h before
- [ ] All state transitions logged in `booking_state_events`
- [ ] EXCLUSION CONSTRAINT prevents double-booking at DB level

### Performance targets

- Cleaner availability lookup: <100ms p95
- Booking creation flow (excluding Stripe): <500ms p95
- Photo upload: <2s p95 per photo on 4G
- GPS ping → ETA computation: <500ms p95

### Phase 7 inconsistency resolution required before any score-impacting flow ships

The following must be locked in Phase 7 spec before Phase 6 score events fire:
1. Rising Pro commission (12% vs 15%+12%-first-6) — recommend WF 51 authoritative
2. Background check renewal cadence (12 vs 24 months) — recommend 12 months
3. Recurring tier gating — recommend not gated; edit WF 51 copy
4. 14-day vs 30-day veteran cushion — both, additive
5. Reschedule scoring rules — customer-initiated free; cleaner-initiated penalized with first-per-month grace

---

# Schema additions consolidated (from wireframe deep dive)

Tables to add during Phase 6 (some per sub-phase, some shared):

- `booking_holds` (6a — 10-min reservation)
- `reschedule_requests` (6a-3)
- `cancellations` (6a-4)
- `messages` (6b)
- `notifications` (6b — shared with Phase 10)
- `late_notices` (6d)
- `reviews` (6f)
- `tips` (6f)

Columns to add to existing tables:

- `bookings.payment_hold_expires_at` (6a)
- `bookings.last_gps_lat / lng / at` (6d)

All schemas finalized in `phase-6a-spec.md` (current sub-phase) and per-sub-phase specs as written.

---

# Recommended build order

1. **Phase 6a** (3 weeks) — booking creation. **Critical path; nothing else ships without it.**
2. **Phase 6c** (2 weeks) — availability calendar. Can start in parallel with 6a-3 reschedule.
3. **Phase 6b** (1.5 weeks) — messaging. Can start once 6a confirms booking IDs exist.
4. **Phase 6e** (2-3 weeks) — photo system. Can start in parallel with 6d.
5. **Phase 6d** (2 weeks) — GPS / "On my way".
6. **Phase 6f** (1.5 weeks) — approve & pay. Sequential after 6e + 6d.
7. **Phase 6g** (2 weeks) — recurring. Sequential after 6c + 6f.

**Total estimated wall time:** 13-16 weeks.

**Parallel opportunities:**
- 6a + 6c can run in parallel after 6a-1 (booking creation core) is done
- 6b can run in parallel with 6c after 6a-1 done
- 6d + 6e can run in parallel after 6a complete

This document is the canonical Phase 6 navigation reference. Detailed acceptance criteria + code structure live in per-sub-phase spec files. Plain-English walkthroughs live in per-sub-phase explainer files.
