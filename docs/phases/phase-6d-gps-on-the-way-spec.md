# Phase 6d — GPS / On-the-Way / Lateness Specification

> **Author note (transparency):** This spec is being written ahead of when Phase 6d will actually be built. The spec is correct as of the current date but will need a refresh when implementation actually starts, particularly for: GPS accuracy patterns observed at scale, ETA calculation tuning based on traffic, mobile battery profile of 3-min ping cadence in real-world use, and Mapbox vs Google Maps cost comparison once volume is real. Treat this as an aggressive draft.

**Phase goal:** When booking start approaches, cleaner taps "On my way" → customer address + entry instructions reveal → 3-minute GPS pings during transit → geofence detection at 100m → clock-in available. Customer sees an ETA on a moving-marker map (WF 9), never raw GPS coordinates. Late notice flow (WF 68) integrates with score system. Privacy guarantee from WF 64 ("We don't track GPS during the cleaning") enforced — pings stop when cleaner enters geofence.

**Estimated duration:** ~2 weeks of focused engineering (10 working days).

**Depends on:**
- Phase 6a complete (bookings exist with confirmed state and scheduled_start)
- Phase 6b complete (cleaner can message customer from on-the-way screen)
- Phase 7a `recordReliabilityEvent()` dispatcher available (Phase 6d fires on-time/late events)
- Phase 10a notification dispatcher available (or stubbed)
- Mapbox or Google Maps Directions API account
- B2 schema deployed (bookings.actual_start_at, last_gps_lat, last_gps_lng, last_gps_at fields)

**Wireframes covered:** WF 4 (cleaner job detail), WF 4b (clock-in available), WF 9 (customer ETA tracker), WF 61 (cleaner detail with address reveal), WF 68 (running late form).

**Phase 6d sub-sections (sequential):**

- **6d-1** — "On my way" state + address reveal (~2 days)
- **6d-2** — GPS ping cycle + customer ETA computation (~3 days)
- **6d-3** — Geofence detection + clock-in (~2 days)
- **6d-4** — Late notice flow WF 68 (~2 days)
- **Closeout + integration testing** (~1 day)

---

## 0. External account prerequisites

### 0.1 Maps / Directions API

**Required actions:**

1. **Choose provider.** Options: Mapbox Directions API, Google Maps Directions API, OpenRouteService (free but lower quality).

   **Recommendation:** **Mapbox** for v1.
   - Mapbox: $0.50 per 1000 directions requests. ETA refresh every 3 min × ~50 active in-transit bookings/day × 30 days = ~22,500 requests/month = ~$11/month.
   - Google: $5 per 1000 directions requests. Same volume = ~$112/month.
   - Mapbox 10x cheaper at this scale. Switch later if Google's data quality matters.

2. **Account setup.** Create Mapbox account. Generate access token. Store in environment variables.

3. **API key restrictions.** Restrict token to Directions API + your domain. Don't allow unrestricted token in production.

4. **Test directions request.** Hello-world: get directions from SF to Oakland. Verify ETA returned.

### 0.2 Mobile GPS permissions

If using React Native or Expo:
- iOS: `NSLocationWhenInUseUsageDescription` in Info.plist
- Android: `ACCESS_FINE_LOCATION` permission
- iOS: also need "Always" permission for background pings (Info.plist `NSLocationAlwaysAndWhenInUseUsageDescription`)

Background location is sensitive on iOS — App Store review can reject if usage isn't justified. Document use case clearly: "Used during your scheduled cleaning trips so customers know your ETA."

### 0.3 No lawyer items

Phase 6d inherits WF 64 lawyer-reviewed copy ("We don't track GPS during the cleaning itself"). No new lawyer items.

---

## 1. Summary

Phase 6d is **the live transit + arrival layer.** Concretely, by the end of Phase 6d:

1. **Cleaner can tap "On my way" on WF 4.** Address + entry instructions reveal (privacy until commit). State transitions `confirmed → in_transit`. Customer notified.

2. **GPS pings every 3 minutes during transit.** Server computes ETA. Customer sees moving-marker map (WF 9) with ETA. Cleaner's exact coordinates never leave the server.

3. **Geofence detection at 100m radius around customer address.** Cleaner within geofence sees "Clock in" CTA. State transitions `in_transit → arrived → in_progress`.

4. **Pings STOP when cleaner clocks in.** Per WF 64 privacy guarantee. No GPS during cleaning itself.

5. **Late notice flow (WF 68) works.** Cleaner can flag running late with duration + reason. Customer sees notice + can request reschedule if 30+ min late. Phase 7a score event fires per timing rules.

6. **Score events fire correctly.** On-time arrival = +1. Late <15 min with notice = 0. Late 15-30 min with notice = -1. Late 30+ min with notice = -3. No notice + 15+ late = -5. No-show = -10.

What Phase 6d does NOT do:
- Photo capture during job (Phase 6e)
- Clock-out flow (Phase 6e enforces required photos)
- Approval + payment (Phase 6f)

---

## 2. Acceptance criteria

### 6d-1 "On my way" state + reveal

- [ ] WF 4 cleaner job detail shows "On my way" button when booking enters `imminent` state (T-24h)
- [ ] Tap → address fully reveals + entry instructions visible
- [ ] State transitions to `in_transit` with `actual_start_at = NOW()`
- [ ] Customer push + email notification fires within 5 seconds
- [ ] Customer can call/message cleaner from notification deep link (Phase 6b integration)
- [ ] Address NOT visible to cleaner before "On my way" tap (privacy until commit)
- [ ] T-24h cron transitions `confirmed → imminent`

### 6d-2 GPS ping cycle + ETA

- [ ] Mobile app pings cleaner GPS every 3 minutes during `in_transit`
- [ ] Server stores only most recent coords on `bookings.last_gps_lat / last_gps_lng / last_gps_at`
- [ ] No historical GPS storage (privacy)
- [ ] ETA computed via Mapbox Directions API; refreshed per ping
- [ ] Customer-side endpoint returns ETA ONLY — no raw lat/lng
- [ ] WF 9 map shows moving marker animated between positions
- [ ] Battery-aware: backoff to 5-min cadence beyond 30-min trips
- [ ] Network drop: queue pings locally; flush on reconnect

### 6d-3 Geofence + clock-in

- [ ] 100m geofence around customer address coordinates
- [ ] Cleaner inside geofence: "Clock in" CTA enabled
- [ ] Cleaner outside geofence: "Clock in" disabled with hint "Move closer to the address"
- [ ] Tolerance: GPS accuracy >50m allows fallback 150m geofence
- [ ] Clock-in tap → state transition `in_transit → arrived → in_progress`
- [ ] Clock-in stops GPS pings (privacy guarantee)
- [ ] `bookings.cleaner_arrived_at` and `bookings.cleaner_clocked_in_at` set

### 6d-4 Late notice flow (WF 68)

- [ ] Cleaner from "On my way" screen can flag running late
- [ ] WF 68 form: late duration (5/10/15/30/60 min picker) + reason category + optional message
- [ ] Submit → `late_notices` row inserted; customer notified
- [ ] Customer notification: "Maria running 15 min late. Reason: traffic"
- [ ] If 30+ min late: customer sees "Request reschedule (no charge)" option
- [ ] Phase 7a score event fires per locked timing rules (Phase 7 master outline)
- [ ] First late notice per booking: free; subsequent: full penalty

### Cross-cutting

- [ ] All Phase 6d code has unit tests; coverage ≥80%
- [ ] Privacy: customer never receives raw GPS coords (verify network responses)
- [ ] RLS: cleaner reads/writes own booking's GPS; customer reads ETA only; admin all
- [ ] Performance: ETA computation <500ms p95
- [ ] Mobile battery impact <10% per booking (test on real devices)

---

## 3. Database state required

### Existing tables (no changes)

- `bookings` (B2) — has `actual_start_at`, `last_gps_lat`, `last_gps_lng`, `last_gps_at`, `cleaner_arrived_at`, `cleaner_clocked_in_at` columns

### New migrations (Phase 6d)

```sql
-- Phase 6d migration

-- Late notices
CREATE TABLE late_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  cleaner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  estimated_late_minutes INTEGER NOT NULL CHECK (estimated_late_minutes BETWEEN 1 AND 240),
  reason_category TEXT NOT NULL CHECK (reason_category IN (
    'traffic', 'previous_booking_overran', 'vehicle_issue', 'personal_emergency', 'other'
  )),
  message_to_customer TEXT,
  customer_acknowledged_at TIMESTAMPTZ,
  customer_requested_reschedule BOOLEAN NOT NULL DEFAULT FALSE,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_late_notices_booking ON late_notices (booking_id, reported_at DESC);

-- Geofence config (per cleaner, optional override)
ALTER TABLE cleaner_profiles
  ADD COLUMN IF NOT EXISTS geofence_radius_meters INTEGER NOT NULL DEFAULT 100
  CHECK (geofence_radius_meters BETWEEN 50 AND 500);

-- Booking GPS accuracy tracking (latest only — no history)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS last_gps_accuracy_meters INTEGER;
```

### RLS policies

```sql
-- late_notices: cleaner reads/writes own; customer reads own bookings'; admin all
ALTER TABLE late_notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY late_notices_parties ON late_notices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = late_notices.booking_id
      AND (b.customer_user_id = auth.uid() OR b.cleaner_user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY late_notices_cleaner_write ON late_notices
  FOR INSERT WITH CHECK (cleaner_user_id = auth.uid());

CREATE POLICY late_notices_customer_ack ON late_notices
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = late_notices.booking_id
      AND b.customer_user_id = auth.uid()
    )
  );
```

---

## 4. Files to create

### App routes (~3 files)

- `/app/cleaner/job/[booking_id]/page.tsx` — WF 4 job detail (extends Phase 6a; adds on-the-way + clock-in)
- `/app/cleaner/job/[booking_id]/late-notice/page.tsx` — WF 68
- `/app/booking/[booking_id]/track/page.tsx` — WF 9 customer ETA map

### Components — Cleaner side (~5 files)

- `/features/transit/components/OnMyWayButton.tsx`
- `/features/transit/components/AddressRevealCard.tsx` — WF 61
- `/features/transit/components/GpsPingManager.tsx` — manages mobile ping cycle
- `/features/transit/components/ClockInButton.tsx`
- `/features/transit/components/LateNoticeForm.tsx` — WF 68

### Components — Customer side (~3 files)

- `/features/transit/components/EtaMapView.tsx` — WF 9 with Mapbox map widget
- `/features/transit/components/EtaStatusBar.tsx` — "Maria · ETA 11:02 AM · 4.2 mi away"
- `/features/transit/components/LateNoticeAck.tsx` — customer-side notice display

### Library code (~7 files)

- `/lib/transit/state_transitions.ts` — confirmed→imminent→in_transit→arrived→in_progress
- `/lib/transit/gps_ping_handler.ts` — server-side ping ingestion + ETA refresh
- `/lib/transit/eta_calculator.ts` — Mapbox Directions wrapper
- `/lib/transit/geofence_detector.ts` — Haversine distance + accuracy tolerance
- `/lib/transit/late_notice_processor.ts` — late notice + Phase 7a score event
- `/lib/transit/imminent_cron_handler.ts` — T-24h state transition cron
- `/lib/transit/privacy_filter.ts` — strips coords from customer-facing responses

### Server actions / API routes (~5 files)

- `/app/api/transit/on-my-way/route.ts` — POST cleaner taps
- `/app/api/transit/gps-ping/route.ts` — POST ping from mobile
- `/app/api/transit/eta/[booking_id]/route.ts` — GET customer-side ETA only
- `/app/api/transit/clock-in/route.ts` — POST clock-in
- `/app/api/transit/late-notice/route.ts` — POST send late notice

### Background jobs (1 file)

- `/jobs/booking_imminent_cron.ts` — T-24h hourly cron transitions confirmed→imminent

### Database migrations (1 file)

- `migrations/2026XXXXXX_phase_6d_schema.sql`

### Phase 7a integration

Modify `lib/transit/late_notice_processor.ts` and clock-in handler to call `recordReliabilityEvent()`:
- On-time arrival (within 15 min of scheduled_start) → `on_time_arrival` event
- Late with notice 15-30 min → `late_arrival_with_notice_15_30min`
- Late with notice 30+ min → `late_arrival_with_notice_30plus_min`
- Late no notice 15+ min → `late_arrival_no_notice_15plus_min`
- No clock-in by 60 min past scheduled_start → `no_show`

### Docs (3 files)

- (Phase 6 overview already exists)
- `phase-6d-gps-on-the-way-spec.md` — this file
- `phase-6d-gps-on-the-way-walkthrough.md`

---

## 5. Implementation order

### 6d-1 — "On my way" state + reveal (~2 days)

**Day 1 — State transitions library + cron.** Build `lib/transit/state_transitions.ts`. Build T-24h imminent cron. Test state machine.

**Day 2 — UI: button + reveal.** `OnMyWayButton`, `AddressRevealCard` (WF 61). Wire to state transition. Test address visibility before/after tap.

### 6d-2 — GPS ping cycle + ETA (~3 days)

**Day 3 — Mapbox setup + ETA calculator.** Mapbox account. Test API. Build `lib/transit/eta_calculator.ts`.

**Day 4 — GPS ping handler.** Mobile-side `GpsPingManager` (3-min cadence, battery aware). Server-side ingestion endpoint. Store latest coords only.

**Day 5 — Customer ETA endpoint + map UI.** `/api/transit/eta/[booking_id]` returns ETA only (no coords). `EtaMapView` with Mapbox map widget. Verify network response contains no lat/lng.

### 6d-3 — Geofence + clock-in (~2 days)

**Day 6 — Geofence detection.** `lib/transit/geofence_detector.ts`. Haversine math. Accuracy tolerance fallback. Test at 50m, 100m, 150m, 200m.

**Day 7 — Clock-in flow + ping stop.** `ClockInButton` conditional on geofence. Clock-in stops GPS pings. State transition. Test privacy guarantee enforced.

### 6d-4 — Late notice flow (~2 days)

**Day 8 — WF 68 form + submission.** `LateNoticeForm`. Server action. `late_notices` row inserted. Customer notification fires.

**Day 9 — Score event integration + customer ack.** Phase 7a score event firing per timing rules. Customer-side ack with reschedule-if-30+min option.

### Closeout (~1 day)

**Day 10 — End-to-end + edge cases.** Real device testing. Network drops. Battery profile. Multi-leg trips (cleaner has back-to-back bookings).

---

## 6. Specific gotchas

### Gotcha A — GPS accuracy varies wildly

**The problem:** Indoor cleaner shows 100m accuracy. Outdoor 5m. Geofence detection at 100m fails for indoor cleaner who's actually at the front door.

**The fix:** Accuracy tolerance fallback. If `last_gps_accuracy_meters > 50`, expand effective geofence to 150m. Document accuracy in clock-in audit.

### Gotcha B — Customer Mapbox API key exposure

**The problem:** Customer-side WF 9 map widget needs Mapbox token to render. If exposed in client JS, anyone can use the token.

**The fix:** Use Mapbox URL-based access token restricted to your domain. Or proxy through your backend. Don't issue full-permission tokens client-side.

### Gotcha C — GPS spoofing

**The problem:** Cleaner uses GPS spoofing app to fake arrival without actually being there. Clocks in remotely. No work happens. Customer disputes.

**The fix:** v1 = trust + dispute-driven detection. If patterns emerge (spoofing common), Phase 11 adds device integrity attestation (iOS DeviceCheck, Android Play Integrity). Don't over-engineer v1.

### Gotcha D — Battery drain from 3-min pings

**The problem:** 3-min pings drain battery. Cleaner's phone dies mid-route. App can't ping. Customer sees stale ETA.

**The fix:** Battery-aware backoff: 3-min cadence first 30 min; 5-min cadence after. Pause pings if battery <15%. Surface battery warning to cleaner: "Your phone battery is low; ETA updates may pause."

### Gotcha E — Customer expects raw GPS

**The problem:** Customer sees ETA on map but no exact pin. Asks "where is she?" Wants raw coords.

**The fix:** Lawyer-reviewed copy in WF 64 + WF 9 explains: "We show you Maria's progress and ETA but not her exact GPS location. This protects her privacy." Don't cave to customer requests.

### Gotcha F — Multi-leg back-to-back bookings

**The problem:** Cleaner finishes 9 AM booking at 11 AM. Has 11:30 booking 5 miles away. They're "in transit" between two bookings — but state machine has them `completed` then `confirmed`.

**The fix:** State machine transitions correctly: previous booking goes to `completed`; next booking auto-transitions `confirmed → imminent` if scheduled_start within 30 min. Cleaner taps "On my way" for next booking; new GPS cycle starts.

### Gotcha G — T-24h cron firing during cleaner sleep

**The problem:** T-24h cron fires at 3 AM Pacific because booking is at 3 AM next day. State transitions to imminent. Cleaner wakes up to 12 imminent notifications.

**The fix:** Imminent state transition is silent (no notification). Notification only fires when cleaner actually engages with the job (e.g., opens the app). Or use quiet hours respecting Phase 10a settings.

### Gotcha H — Customer requests reschedule for 35-min late

**The problem:** Cleaner is 35 min late with notice. Customer requests reschedule (allowed per WF 68 rules). Cleaner is already on the way — 5 min from address.

**The fix:** Customer reschedule request triggers cleaner notification: "Customer requested reschedule. Are you nearly there? Confirm or accept reschedule." Cleaner can decline reschedule if minutes from arrival.

---

## 7. Testing strategy

### Unit tests

- `lib/transit/eta_calculator.ts`: mocked Mapbox responses
- `lib/transit/geofence_detector.ts`: distance + accuracy edge cases (50m, 100m, 150m, 200m, varying accuracy)
- `lib/transit/late_notice_processor.ts`: each timing tier
- `lib/transit/state_transitions.ts`: invalid transitions rejected

### Integration tests

- Full transit flow: tap "On my way" → pings → ETA updates → geofence → clock-in
- Late notice → customer notification → score event
- Privacy: customer-side response contains no lat/lng

### Manual QA

- Real device testing (iOS + Android)
- Driving from staging cleaner home to staging customer address (real GPS)
- Battery profile measurement during 30-min trip
- Multi-leg back-to-back

---

## 8. Deployment plan

### Pre-deploy checklist

- [ ] Migrations applied
- [ ] Mapbox account active + token restricted to domain
- [ ] iOS APNs background location permission documented for App Store review
- [ ] Privacy copy lawyer-reviewed (WF 64 + WF 9)
- [ ] Phase 7a integration ready (or stubbed)

### Deployment order

1. Migrations
2. Library code (state machine, ETA calc)
3. Mobile app GPS ping integration
4. Server endpoints
5. UI (cleaner + customer)
6. T-24h cron activation
7. Soft launch: 7 days monitoring

### Rollback

- App code revert if bugs surface
- Schema migrations forward-only
- Mapbox key can be rotated independently

---

## 9. Phase 6d → Phase 6e/6f handoff

Phase 6d output ready for:
- **Phase 6e** (active job photos) — clock-in transitions to `in_progress`; photo capture available
- **Phase 6f** (approve & pay) — `actual_start_at` recorded for "completed on time" tracking
- **Phase 7a** (score events) — late/on-time events firing

---

## 10. Open questions

1. **Geofence radius per metro.** Urban dense (50m) vs rural (200m)? Recommend default 100m + per-cleaner override.
2. **Mapbox vs Google Maps long-term.** Re-evaluate at 100K+ requests/month. Recommend Mapbox for v1.
3. **GPS spoofing detection.** Defer to Phase 11 unless patterns emerge.
4. **Background location iOS App Store review.** Document use case clearly in submission notes.

---

This spec is the canonical Phase 6d build reference. Walkthrough lives in `phase-6d-gps-on-the-way-walkthrough.md`.
