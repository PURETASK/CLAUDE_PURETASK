# Phase 6d — Plain-English Breakdown

This document walks through `phase-6d-gps-on-the-way-spec.md` and explains each section in plain English.

Phase 6d is **the live transit + arrival layer.** Before Phase 6d, when a booking time approaches, customer just waits and hopes the cleaner shows up. After Phase 6d, customer sees a live ETA on a map (without raw GPS coords), gets notified when the cleaner is on the way, and can request a free reschedule if cleaner is 30+ min late.

The privacy guarantee from WF 64 is critical: **"We don't track GPS during the cleaning."** Phase 6d enforces this — pings stop the moment cleaner clocks in. This is a real differentiator vs competitors who track location continuously.

---

# Section 0 — External account prerequisites

## What it means in plain English

Phase 6d needs **one new vendor: a maps/directions API.** Two real options:

- **Mapbox** — $0.50 per 1000 directions requests. ~$11/month at expected scale.
- **Google Maps** — $5 per 1000 requests. ~$112/month at same scale.

Mapbox 10x cheaper. Recommendation: Mapbox for v1.

## Why mobile GPS permissions are subtle

iOS distinguishes between:
- **"When in use"** — GPS only while app is open
- **"Always"** — GPS even when app is backgrounded

Phase 6d needs "Always" because cleaner navigates with another app (Google Maps) while PureTask sends pings in background.

App Store review can REJECT apps requesting "Always" without strong justification. Document use case in submission notes: "Used during scheduled cleaning trips so customers know your ETA."

## Beginner traps

- **Don't pick Google Maps because it's familiar.** Mapbox is better for marketplace ETAs at startup scale.
- **Don't request "Always" location without solid justification.** App Store rejection costs weeks.
- **Don't expose Mapbox token unrestricted.** Restrict to your domain.

---

# Section 1 — Summary

## What it means in plain English

Six things will work after Phase 6d:

1. Cleaner taps "On my way" → address reveals + state transitions
2. GPS pings every 3 min → server computes ETA
3. Customer sees moving-marker map (WF 9) with ETA
4. Geofence at 100m enables clock-in
5. Pings STOP at clock-in (privacy guarantee)
6. Late notice flow with score-system integration

## Why "address reveals only after On my way tap"

Privacy until commit. Before tap, cleaner sees neighborhood + general info. After tap (cleaner committing to the trip), full address + entry instructions reveal.

This protects against:
- Cleaner browsing addresses they're not booked for
- Address leaking from a leaked cleaner phone
- Customer privacy until cleaner has actually committed

## Why pings stop at clock-in

WF 64 is a real selling point. "We don't track cleaners' GPS during the cleaning itself." Customers worried about surveillance breathing down their cleaners' necks. Cleaners worried about being tracked into customers' houses.

Both groups happier with privacy guarantee. Phase 6d enforces.

## Beginner traps

- **Don't reveal address before tap.** Privacy bug.
- **Don't send GPS coords to customer.** Privacy bug.
- **Don't keep GPS pinging during cleaning.** Privacy bug + battery drain + WF 64 violation.

---

# Section 2 — Acceptance criteria

## What it means in plain English

Five groups of criteria.

### "On my way" + reveal

The address visibility before/after tap matters. Test both states. Privacy regression bug here = trust collapse.

T-24h cron transitions confirmed→imminent silently. The actual notification fires when cleaner engages.

### GPS ping cycle

The "no historical GPS storage" rule matters. Store latest only on `bookings.last_gps_*`. Don't accumulate a GPS history table. Privacy + storage cost.

Battery awareness matters because cleaner phones die otherwise. Backoff to 5-min cadence beyond 30-min trips. Pause if battery <15%.

### Geofence

100m default radius matches WF 4b. Tolerance for inaccurate GPS prevents false negatives — cleaner indoors at front door but GPS shows 80m accuracy = fallback to 150m geofence.

### Late notice

The score event timing tiers locked in Phase 7 master outline. First notice per booking is free; subsequent penalize. This prevents abuse (cleaner ghost-noticing every booking).

### Cross-cutting

Coverage 80% on 6d code. Privacy verification in network responses (no lat/lng to customer side).

## Beginner traps

- **Don't store GPS history.** Latest-only on bookings.
- **Don't trust GPS accuracy.** Tolerance fallback essential.
- **Don't skip privacy verification.** Inspect network responses with DevTools.

---

# Section 3 — Database state required

## What it means in plain English

B2 already has the GPS columns on `bookings`. Phase 6d adds:
- `late_notices` table (new — stores late notices per booking)
- `cleaner_profiles.geofence_radius_meters` (configurable per cleaner, 50-500m)
- `bookings.last_gps_accuracy_meters` (track accuracy)

### Why latest-only GPS

Privacy. Storing every ping = location history = potential subpoena target. Latest-only minimizes data exposure.

### Why per-cleaner geofence radius

Rural cleaner serves large properties (200m radius). Urban cleaner in dense building (50m). One size doesn't fit all. Default 100m, override allowed.

## Beginner traps

- **Don't add GPS history table.** Latest only.
- **Don't hardcode 100m.** Configurable.

---

# Section 4 — Files to create

## What it means in plain English

~25 files. Spread:
- 3 routes (cleaner job detail, late notice, customer track)
- 8 components (cleaner side + customer side)
- 7 library files
- 5 server actions / API routes
- 1 cron
- 1 migration

### Why heavy library code

GPS, ETA, geofence, state transitions = lots of pure logic. Pure functions = testable. Critical for Phase 6d because real GPS is hard to test.

### Why Mapbox integration in library, not component

Mapbox API key + ETA computation is server-side. Component just renders map widget with ETA value. Don't expose Mapbox secrets in components.

## Beginner traps

- **Don't compute ETA client-side.** Server only.
- **Don't expose lat/lng to customer-side.** Privacy.

---

# Section 5 — Implementation order

## What it means in plain English

10 days. Sequential.

### Days 1-2: On my way + reveal

Foundation. State machine first; UI consumes.

### Days 3-5: GPS + ETA

Mapbox setup → ETA calculator → ping handler → customer ETA endpoint + map. By Day 5, ETA flows end-to-end.

### Days 6-7: Geofence + clock-in

Geofence detection. Clock-in conditional. Stop pings.

### Days 8-9: Late notice

WF 68 form. Score event integration.

### Day 10: Closeout

Real device testing. Multi-leg trips. Battery profile.

## Why this order

Foundation first. Can't test ETA without state machine. Can't test geofence without GPS pings. Can't test late notice without all of above.

## Beginner traps

- **Don't build customer side first.** Cleaner side must work before customer side renders anything.
- **Don't skip Day 10 real device testing.** Simulators don't expose battery + GPS edge cases.

---

# Section 6 — Specific gotchas

## What it means in plain English

8 gotchas:

### A — GPS accuracy varies wildly
Indoor 100m, outdoor 5m. **Fix:** accuracy tolerance fallback to 150m geofence.

### B — Mapbox API key exposure
Client-side token = anyone uses. **Fix:** restrict token to domain, or proxy through backend.

### C — GPS spoofing
Fake arrival without being there. **Fix:** trust + dispute-driven v1; device integrity in Phase 11.

### D — Battery drain
3-min pings kill battery. **Fix:** backoff after 30 min; pause if <15% battery.

### E — Customer wants raw GPS
"Where exactly is she?" **Fix:** lawyer-reviewed copy in WF 64 explains.

### F — Multi-leg bookings
Back-to-back bookings 5 miles apart. **Fix:** state machine handles auto-transition.

### G — T-24h cron at 3 AM
Cleaner gets imminent notification at 3 AM. **Fix:** imminent transition silent; notification on engagement.

### H — Customer requests reschedule when cleaner near
Cleaner 5 min away when customer requests reschedule. **Fix:** cleaner can decline if minutes from arrival.

## Why these matter

GPS is hard. Real-world testing exposes more edges. Read defensively.

## Beginner traps

- **Don't trust GPS accuracy at face value.** Always use tolerance.
- **Don't skip battery testing.** Real cleaners use real phones.

---

# Section 7 — Testing strategy

Standard layers. Real device testing matters here. Drive from staging cleaner home to customer address. Verify ETA updates. Verify geofence at correct distance. Verify pings stop at clock-in.

## Beginner traps

- **Don't simulate GPS only.** Real device, real driving.

---

# Section 8 — Deployment plan

Standard. Mapbox token restriction critical pre-deploy.

## Beginner traps

- **Don't deploy with unrestricted Mapbox token.** Cost explosion possible.

---

# Section 9 — Handoff

Phase 6d output for:
- Phase 6e (photos) — clock-in transitions to in_progress
- Phase 6f (approve & pay) — actual_start_at tracked
- Phase 7a (score events) — late/on-time firing

---

# Section 10 — Open questions

1. Geofence radius per metro (default 100m + override)
2. Mapbox vs Google long-term (Mapbox for v1)
3. GPS spoofing detection (defer)
4. Background location iOS submission docs

---

# Notes on what comes next

Phase 6e (photos) — depends on 6d clock-in.

Phase 6e is the most photo-intensive phase. Storage costs + privacy + integrity controls all apply.

---

This walkthrough is the Phase 6d learning document.
