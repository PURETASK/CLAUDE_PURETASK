# Phase 6g — Recurring Booking Specification

> **Author note (transparency):** This spec is being written ahead of when Phase 6g will actually be built. The spec is correct as of the current date but will need a refresh when implementation actually starts, particularly for: customer recurring acceptance rates after launch, cleaner pause patterns, edge cases in instance generation, and rebook same-address flow tuning. Treat this as an aggressive draft.

**Phase goal:** Customer post-completion can set up recurring (weekly/biweekly/monthly) cleanings with same cleaner. Recurring instances auto-generate 7 days out, auto-charge 24h before scheduled start. Customer + cleaner can pause, skip, modify, or cancel. Cleaner sees recurring relationships in their schedule. WF 21 setup, WF 22 management, WF 69 rebook same address.

**Estimated duration:** ~2 weeks of focused engineering (10 working days).

**Depends on:**
- Phase 6a complete (one-off bookings work; recurring builds on this)
- Phase 6c complete (availability lookup query consumed by instance generation)
- Phase 6f complete (approve/pay/review flow runs per instance)
- B2 schema deployed (`recurring_schedules`, `recurring_occurrences` tables exist)
- Phase 9a operational (capture per recurring instance)
- Phase 10a notification dispatcher available

**Wireframes covered:** WF 21 (recurring setup), WF 22 (recurring management), WF 69 (rebook same address).

**Phase 6g sub-sections (sequential):**

- **6g-1** — Recurring schedule creation (WF 21) (~3 days)
- **6g-2** — Instance generation + 24h-before charge cron (~3 days)
- **6g-3** — Recurring management (WF 22) (~2 days)
- **6g-4** — Rebook same address (WF 69) (~1 day)
- **Closeout + integration testing** (~1 day)

---

## 0. External account prerequisites

Phase 6g has **no new external services.** Stripe configured (Phase 4 + 6a + 6f). Notifications via Phase 10a. Calendar via Phase 6c.

### 0.1 Verify Stripe customer payment method persistence

Recurring uses Stripe customer's saved payment method. Verify:
- Customer payment method saved during Phase 6a first booking (Phase 6a Lock)
- Re-using same payment method for subsequent bookings works
- Card expiration handling (cleaner notification if expired)

### 0.2 No lawyer items

Recurring inherits Phase 6f lawyer-reviewed copy. No new lawyer items.

---

## 1. Summary

Phase 6g is **the recurring relationship layer.** Concretely, by the end of Phase 6g:

1. **Customer post-completion can opt-in to recurring (WF 21).** Frequency: weekly / biweekly / monthly. Same cleaner + same setup.

2. **Cleaner consents to recurring on first instance.** Subsequent instances inherit consent. Cleaner can pause/end at any time.

3. **Instance generation cron runs daily.** Generates next 7 days of `recurring_occurrences` rows.

4. **24h-before authorization cron runs hourly.** Authorizes Stripe charge per recurring_occurrence row. Re-uses customer payment method.

5. **Customer + cleaner can manage recurring (WF 22).** Pause, skip next, modify time/cleaner, end series.

6. **Rebook same address (WF 69) accessible post-completion.** One-tap rebooking with same cleaner + same setup. Different from recurring — single rebook.

7. **NOT tier-gated** (per Phase 7 Lock 3) — all tiers can have recurring.

What Phase 6g does NOT do:
- Handle individual instance disputes (Phase 8a per-instance)
- Tax handling for recurring (Phase 9c)
- Recurring booking analytics (Phase 11+)

---

## 2. Acceptance criteria

### 6g-1 Recurring schedule creation (WF 21)

- [ ] Post-completion (after Phase 6f approval), customer sees "Set up recurring" prompt
- [ ] WF 21 form: frequency picker (weekly/biweekly/monthly) + start date + end condition
- [ ] End condition: "Until canceled" (default) or specific end date
- [ ] Submit → `recurring_schedules` row + 8 future `recurring_occurrences` generated
- [ ] Cleaner notification: "Sarah K. wants to set up recurring weekly cleanings"
- [ ] Cleaner accept on first instance = consent for series
- [ ] Cleaner decline first instance = recurring cancelled; customer notified

### 6g-2 Instance generation + 24h charge

- [ ] Daily cron at 1 AM Pacific generates `recurring_occurrences` for next 7 days
- [ ] Each occurrence checks availability via Phase 6c `getCleanerAvailability()`
- [ ] If cleaner unavailable for slot: occurrence flagged `needs_reschedule`; customer notified
- [ ] Hourly T-24h cron authorizes Stripe charge per `confirmed` occurrence
- [ ] Auth success: occurrence state → `charged_pending_execution`
- [ ] Auth failure: customer notified; retry available; if 12h-before still failed, skip + notify
- [ ] On scheduled_start date, occurrence acts as normal `bookings` row (Phase 6a-6f flow applies)

### 6g-3 Recurring management (WF 22)

- [ ] Customer sees recurring list with each schedule's frequency, next instance, total instances
- [ ] Pause action: customer-initiated; future instance generation paused; existing confirmed instances unaffected
- [ ] Resume action: customer can resume after pause
- [ ] Skip next: single instance skipped; subsequent instances continue
- [ ] Modify time: change preferred time on schedule; future instances use new time
- [ ] Modify cleaner: end current schedule + start new with different cleaner
- [ ] End series: customer ends; future instances removed
- [ ] Cleaner pause action: cleaner-initiated; customer notified with alternatives
- [ ] Cleaner end series: customer notified + offered alternatives

### 6g-4 Rebook same address (WF 69)

- [ ] Post-completion, "Rebook this cleaner" action available for 30 days
- [ ] Tap → opens Phase 6a booking flow with cleaner + address + service pre-filled
- [ ] Customer picks new date/time
- [ ] One-tap differs from recurring: single booking, no schedule
- [ ] Past 30 days: rebook still possible but not surfaced as primary action

### Cross-cutting

- [ ] All Phase 6g code has unit tests; coverage ≥80%
- [ ] RLS: customer reads/writes own schedules; cleaner reads/writes own
- [ ] Performance: instance generation <2s p95 per cleaner per day
- [ ] Notifications fire on all state changes (creation, pause, skip, end)

---

## 3. Database state required

### Existing tables

- `recurring_schedules` (B2)
- `recurring_occurrences` (B2)
- `bookings` (B2) — used for instance generation

### New migrations (Phase 6g)

```sql
-- Phase 6g migration

-- Recurring schedule additions
ALTER TABLE recurring_schedules
  ADD COLUMN IF NOT EXISTS frequency TEXT NOT NULL DEFAULT 'weekly'
  CHECK (frequency IN ('weekly', 'biweekly', 'monthly'));
ALTER TABLE recurring_schedules
  ADD COLUMN IF NOT EXISTS preferred_day_of_week INTEGER CHECK (preferred_day_of_week BETWEEN 0 AND 6);
ALTER TABLE recurring_schedules
  ADD COLUMN IF NOT EXISTS preferred_start_time TIME;
ALTER TABLE recurring_schedules
  ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'active'
  CHECK (state IN ('active', 'paused_by_customer', 'paused_by_cleaner', 'ended_by_customer', 'ended_by_cleaner'));
ALTER TABLE recurring_schedules
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;
ALTER TABLE recurring_schedules
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- Recurring occurrence additions  
ALTER TABLE recurring_occurrences
  ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'pending_authorization'
  CHECK (state IN (
    'pending_authorization',
    'authorization_failed',
    'confirmed',
    'charged_pending_execution',
    'skipped_by_customer',
    'skipped_by_cleaner',
    'needs_reschedule',
    'completed',
    'cancelled'
  ));
ALTER TABLE recurring_occurrences
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;
-- booking_id set when occurrence transitions to actual booking

-- Indexes for cron performance
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_active 
  ON recurring_schedules (cleaner_user_id) WHERE state = 'active';

CREATE INDEX IF NOT EXISTS idx_recurring_occurrences_charge_due
  ON recurring_occurrences (scheduled_start)
  WHERE state = 'confirmed';
```

### RLS policies

```sql
-- recurring_schedules: parties + admin
ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY recurring_parties ON recurring_schedules
  FOR ALL USING (
    customer_user_id = auth.uid()
    OR cleaner_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

ALTER TABLE recurring_occurrences ENABLE ROW LEVEL SECURITY;
CREATE POLICY occurrences_via_schedule ON recurring_occurrences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recurring_schedules rs
      WHERE rs.id = recurring_occurrences.schedule_id
      AND (rs.customer_user_id = auth.uid() OR rs.cleaner_user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
```

---

## 4. Files to create

### App routes (~3 files)

- `/app/customer/recurring/setup/[booking_id]/page.tsx` — WF 21
- `/app/customer/recurring/[schedule_id]/page.tsx` — WF 22 management
- `/app/booking/[id]/rebook/page.tsx` — WF 69

### Components — Setup (~4 files)

- `/features/recurring/components/RecurringSetupForm.tsx` — WF 21
- `/features/recurring/components/FrequencySelector.tsx`
- `/features/recurring/components/EndConditionSelector.tsx`
- `/features/recurring/components/RecurringPreview.tsx` — shows next 4 instances

### Components — Management (~5 files)

- `/features/recurring/components/RecurringScheduleList.tsx`
- `/features/recurring/components/ScheduleDetailCard.tsx`
- `/features/recurring/components/PauseResumeButton.tsx`
- `/features/recurring/components/SkipNextButton.tsx`
- `/features/recurring/components/EndSeriesConfirm.tsx`

### Components — Rebook (~2 files)

- `/features/recurring/components/RebookSameAddress.tsx` — WF 69
- `/features/recurring/components/RebookPrefilledFlow.tsx`

### Library code (~6 files)

- `/lib/recurring/schedule_creator.ts` — creates schedule + initial occurrences
- `/lib/recurring/instance_generator.ts` — daily cron handler
- `/lib/recurring/auth_charger.ts` — T-24h charge handler
- `/lib/recurring/state_manager.ts` — pause/resume/skip/end transitions
- `/lib/recurring/cleaner_consent_handler.ts` — first instance accept = series consent
- `/lib/recurring/availability_re_check.ts` — re-checks availability per instance gen

### Server actions / API routes (~6 files)

- `/app/api/recurring/create/route.ts` — POST schedule creation
- `/app/api/recurring/[id]/pause/route.ts` — POST pause
- `/app/api/recurring/[id]/resume/route.ts` — POST resume
- `/app/api/recurring/[id]/skip-next/route.ts` — POST skip next
- `/app/api/recurring/[id]/end/route.ts` — POST end series
- `/app/api/recurring/[id]/route.ts` — GET schedule detail

### Background jobs (~2 files)

- `/jobs/recurring_instance_generator.ts` — daily 1 AM Pacific
- `/jobs/recurring_24h_auth_charger.ts` — hourly

### Database migrations (1 file)

- `migrations/2026XXXXXX_phase_6g_schema.sql`

### Phase 6a/6c/6f integration

- Phase 6a: rebook flow reuses booking creation flow with pre-filled data
- Phase 6c: instance generator calls `getCleanerAvailability()`
- Phase 6f: each occurrence executes through normal Phase 6f approval

### Docs (3 files)

- (Phase 6 overview already exists)
- `phase-6g-recurring-bookings-spec.md` — this file
- `phase-6g-recurring-bookings-walkthrough.md`

---

## 5. Implementation order

### 6g-1 — Schedule creation (~3 days)

**Day 1 — Schema + creator library.** Migration. Build `lib/recurring/schedule_creator.ts`. Test 8-occurrence generation.

**Day 2 — WF 21 UI.** `RecurringSetupForm`, `FrequencySelector`, `EndConditionSelector`, `RecurringPreview`.

**Day 3 — Cleaner consent flow.** First instance acceptance = series consent. Decline = cancellation. Notification triggers.

### 6g-2 — Instance generation + auth (~3 days)

**Day 4 — Instance generator cron.** `jobs/recurring_instance_generator.ts`. Daily 1 AM. Generates next 7 days.

**Day 5 — Availability re-check.** `lib/recurring/availability_re_check.ts`. Each instance gen re-checks via Phase 6c. Flag `needs_reschedule` if unavailable.

**Day 6 — T-24h auth cron.** `jobs/recurring_24h_auth_charger.ts`. Hourly. Authorizes Stripe per occurrence. Failure handling.

### 6g-3 — Management (~2 days)

**Day 7 — WF 22 UI + actions.** `RecurringScheduleList`, `ScheduleDetailCard`. Pause/resume/skip/end buttons.

**Day 8 — State transitions + notifications.** `lib/recurring/state_manager.ts`. Cleaner pause notification with alternatives.

### 6g-4 — Rebook same address (~1 day)

**Day 9 — WF 69 flow.** `RebookSameAddress`. Pre-filled Phase 6a flow. 30-day surfacing window.

### Closeout (~1 day)

**Day 10 — End-to-end testing.** Full recurring lifecycle: create → instance gen → auth → execute → review → next instance. Edge cases: pause mid-cycle, customer card expires.

---

## 6. Specific gotchas

### Gotcha A — Daylight saving time on weekly recurring

**The problem:** Customer set recurring "Friday 10 AM Pacific." DST changes Pacific from PST to PDT. Local 10 AM is now different UTC. Recurring instance generates at wrong UTC.

**The fix:** Store schedule's preferred time in local timezone. Convert to UTC at instance generation, accounting for current DST state.

### Gotcha B — Customer card expires mid-recurring

**The problem:** Card expires month 3 of recurring. T-24h auth fails. Customer doesn't notice. Cleaner shows up to no booking.

**The fix:** Card expiration warning at 60 days + 30 days + 7 days before expiry. Force update before expiry. Block instance generation if no valid card.

### Gotcha C — Cleaner availability narrows mid-recurring

**The problem:** Recurring set Tuesday 2 PM. Month 4 cleaner removes Tuesday from availability. Future instances should... what?

**The fix:** Phase 6c rule changes don't affect recurring. Existing recurring continues until cleaner explicitly pauses. Document expectation.

### Gotcha D — Recurring during cleaner vacation

**The problem:** Cleaner vacations week 5. Recurring instance scheduled. Cleaner forgets to pause.

**The fix:** Cleaner's time-off blocks (Phase 6c) detected during instance generation. Auto-flag affected instances for `needs_reschedule`. Customer notified.

### Gotcha E — Frequency math edge cases

**The problem:** Monthly recurring "first Tuesday." Some months 4 Tuesdays, some 5. Which week?

**The fix:** Define monthly = "every 4 weeks" not "calendar month." Predictable. Document in WF 21.

### Gotcha F — Pause + skip combinations

**The problem:** Customer pauses recurring. While paused, also tries to skip "next instance." Confusing state.

**The fix:** UI grays out skip when paused. Skip only meaningful when active.

### Gotcha G — Cleaner ends series mid-week

**The problem:** Cleaner ends recurring Wednesday. Friday instance already authorized. What happens?

**The fix:** Friday instance still executes (already authorized). Subsequent instances cancelled. Customer notified.

### Gotcha H — Customer modifies cleaner mid-recurring

**The problem:** Customer wants to switch cleaners. New cleaner availability differs. Time slot conflicts.

**The fix:** "Modify cleaner" = end current schedule + create new schedule with new cleaner. Two-step flow. Customer chooses new time within new cleaner's availability.

---

## 7. Testing strategy

### Unit tests
- `lib/recurring/schedule_creator.ts`: occurrence generation for each frequency
- `lib/recurring/availability_re_check.ts`: conflict scenarios
- `lib/recurring/state_manager.ts`: pause/resume/skip/end transitions

### Integration tests
- Full E2E: create recurring → instance gen → T-24h auth → execute → review → next instance
- Card expiration mid-recurring
- Cleaner pause notification flow

### Manual QA
- Real Stripe test mode for multi-instance flow
- DST transition during recurring (test in late October / early November)
- Pause/resume actions on staging

---

## 8. Deployment plan

### Pre-deploy
- [ ] Migrations applied
- [ ] Phase 6a/6c/6f operational
- [ ] Phase 9a Stripe customer payment persistence verified
- [ ] Cron infrastructure stable

### Deployment order
1. Migrations
2. Library code
3. UI
4. Server actions
5. Crons (instance gen + auth)
6. Soft launch: 14 days monitoring (longer than other phases due to recurring nature)

### Rollback
- App code revert if bugs surface
- Don't roll back schema (recurring state integrity)
- Crons can pause independently

---

## 9. Phase 6g → other phases handoff

Phase 6g closes out Phase 6 sub-phases. Output ready for:
- Phase 7c badges — recurring relationships count for "Customer favorite in [ZIP]" badge (5+ active recurring)
- Phase 9b Friday payouts — recurring captures aggregate
- Phase 5 Match Score — cleaners with active recurring relationships get scoring boost

---

## 10. Open questions

1. **Monthly = calendar month or every 4 weeks.** Recommendation: every 4 weeks (predictable). Lock.
2. **Recurring cancellation policy.** No fee for customer-initiated cancel? Recommend yes (flexibility wins customers). Lock.
3. **Cleaner pause SLA.** How long can cleaner pause before customer auto-released? Recommend 14 days max.

---

This spec is the canonical Phase 6g build reference. Walkthrough lives in `phase-6g-recurring-bookings-walkthrough.md`.
