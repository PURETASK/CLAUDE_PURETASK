# Phase 8a — Tier 1 Customer/Cleaner Direct Dispute Resolution Specification

> **Author note (transparency):** This spec is being written ahead of when Phase 8a will actually be built — minimum 12-15 weeks from now (after Phase 6 + Phase 7 sub-phases firing events). The spec is correct as of the current date but will need a refresh when implementation actually starts, particularly for: actual dispute volume patterns (which determine SLA tuning), customer-side dispute UX after real customer feedback, and insurance partner case package format (depends on partner choice). Treat this document as an **aggressive draft**.

**Phase goal:** A customer within the 48-hour post-approval window can open a dispute on a completed booking. They select a category, describe the issue, upload up to 5 photos as evidence, and specify their desired outcome. The cleaner sees the dispute in their inbox and responds with one of four offer types: re-clean, partial refund, stand-by-work, or escalate to admin. The customer accepts or rejects. Tier 1 resolves cleanly when both parties agree; stalemates auto-escalate to Tier 2.

**Estimated duration:** ~3 weeks of focused engineering (15 working days).

**Depends on:**
- Phase 6f sets `bookings.dispute_window_expires_at` at approval time (Phase 8a verifies this column exists; coordinate with Phase 6f spec)
- Phase 6e photos exist for cleaner clock-out evidence (auto-attached to disputes)
- Phase 7a `recordReliabilityEvent()` dispatcher operational (Phase 8a fires score events on resolution)
- B3 schema deployed (`disputes`, `dispute_messages`, `dispute_resolutions` tables)
- Phase 9 partial refund mechanics (Phase 8a accepts customer-accepted partial refunds → Phase 9 processes)
- At least 5 active cleaners with completed bookings for testing

**Wireframes covered:** WF 16 (customer dispute initiation), WF 17 (cleaner dispute response). WF 56 + WF 57 are Phase 8b territory.

**Phase 8a sub-sections (mostly sequential):**

- **8a-1** — Customer dispute initiation (~3 days)
- **8a-2** — Cleaner dispute response (~3 days)
- **8a-3** — Customer accept/reject + Tier 1 resolution (~3 days)
- **8a-4** — Dispute message thread (~2 days)
- **8a-5** — Auto-escalation cron (~2 days)
- **Closeout + integration testing** (~2 days)

---

## 0. External account prerequisites

Phase 8a has **no new external services** beyond what's already in place. Photo storage uses Supabase Storage (Phase 6e). Notifications use existing infrastructure (Phase 10). Stripe is needed for partial refunds but only in Phase 8a-3 (and the actual refund execution is Phase 9 territory).

### 0.1 Verify Phase 6f set the dispute window column

Phase 6f sets `bookings.dispute_window_expires_at` to `approved_at + 48 hours` when a booking transitions to approved (manual or auto). Phase 8a depends on this column. Before Phase 8a starts:

- Confirm Phase 6f migration ran
- Confirm column populated for at least 5 test bookings in approved state
- Confirm value is exactly 48 hours from approval (not 24, not 72)

If Phase 6f hasn't done this, Phase 8a-1 starts with a coordination task: ensure Phase 6f sets this column correctly first.

### 0.2 Insurance partner identified (deferred to Phase 8c)

Phase 8a doesn't need insurance partner. Phase 8c does. But **start the partner conversation during Phase 8a build** because partner negotiation can take 4-8 weeks. Don't wait until Phase 8c to begin.

### 0.3 No lawyer items block Phase 8a

Lock-in decisions in master outline are product decisions, not legal questions. Lawyer items for Phase 8 (Tier 3 legal review path, insurance partner contracts) are Phase 8c territory.

---

## 1. Summary

Phase 8a is **the user-facing layer of dispute resolution.** Concretely, by the end of Phase 8a:

1. **Customer can open a dispute within 48 hours.** From booking detail (post-approval), customer taps "Report an issue" → category select → description form → photo upload (up to 5) → desired outcome → submit. Window enforcement is server-side.

2. **Cleaner sees dispute in inbox immediately.** Real-time notification. Cleaner reviews customer's claim + auto-attached clock-out photos + customer's evidence photos. Has 48 hours to respond.

3. **Cleaner responds with one of four options.** Re-clean (propose new time), partial refund (specify amount), stand by work (no refund), escalate to admin.

4. **Customer accepts or rejects cleaner's offer.** Acceptance triggers resolution flow (refund process, re-clean booking creation, etc.). Rejection allows one counter-proposal cycle before auto-escalation.

5. **Dispute message thread runs throughout.** Both parties can communicate within the dispute (separate from booking messages because admin needs read access at escalation).

6. **Auto-escalation handles stalemates.** Cron checks every 15 minutes. Three triggers fire escalation: cleaner non-response 48h, customer two-rejections, explicit escalation.

7. **Score events fire on resolution.** Phase 7a integration: cleaner stands accepted = no impact; partial refund accepted = -1; re-clean accepted = 0 (good faith).

What Phase 8a does NOT do (deferred to 8b/8c):
- Admin mediation interface (8b)
- Tier 3 escalation paths (8c)
- Insurance partner integration (8c)

---

## 2. Acceptance criteria

### Customer dispute initiation (WF 16)

- [ ] `/booking/[id]/dispute/open` route accessible only to customer who owns booking
- [ ] Window enforcement: server returns 410 Gone if `dispute_window_expires_at < NOW()`
- [ ] Category select shows 6 options (`quality`, `damage`, `missing_item`, `no_show_or_partial`, `safety`, `other`)
- [ ] Description field requires 50-2000 characters
- [ ] Photo upload allows up to 5 files; each <10 MB; jpg/png/heic
- [ ] Desired outcome radio shows 5 options (`re_clean`, `partial_refund`, `full_refund`, `replacement_or_compensation`, `cleaner_review`)
- [ ] On submit: `disputes` row inserted with state = `tier_1_pending_response`
- [ ] Photos stored in `dispute_photos` table with 7-year retention
- [ ] Cleaner notification fires within 5 seconds (push + email)
- [ ] Customer sees confirmation screen: "Your dispute has been opened. Maria has 48 hours to respond."

### Cleaner dispute response (WF 17)

- [ ] `/cleaner/disputes/[id]` route accessible only to cleaner who owns booking
- [ ] Customer claim renders with text + photos + desired outcome
- [ ] Cleaner's clock-out photos auto-attached for context
- [ ] Response form shows 4 options: re-clean / partial refund / stand by work / escalate
- [ ] Re-clean option requires proposed time within 7 days
- [ ] Partial refund requires amount input ($0.01 to booking total)
- [ ] Stand by work requires explanation text (50-1000 chars)
- [ ] Escalate option goes immediately to Tier 2 (jumps Tier 1)
- [ ] On response submit: `dispute_resolutions` row inserted; dispute state updates
- [ ] Customer notification fires within 5 seconds
- [ ] 48h cron auto-escalates non-response disputes

### Customer accept/reject + resolution

- [ ] `/booking/[id]/dispute/[id]/respond` accessible to customer
- [ ] Customer sees cleaner's offer with all relevant details (re-clean time, refund amount, statement)
- [ ] Three response options: accept / counter-propose / reject
- [ ] Counter-propose limited to 1 use per dispute
- [ ] Acceptance flow:
  - Re-clean accepted → new booking row created via Phase 6a; original dispute marked resolved
  - Partial refund accepted → Phase 9 partial refund processed; cleaner balance updated
  - Stand by work accepted → no money moves; dispute closes with cleaner-stands outcome
- [ ] Score events fire correctly (Phase 7a integration)
- [ ] Two customer rejections trigger auto-escalation
- [ ] Resolution notifications to both parties

### Dispute message thread

- [ ] Both parties can send messages within dispute thread
- [ ] Messages distinct from booking messages (separate visibility)
- [ ] Real-time delivery via Supabase Realtime
- [ ] Read receipts visible
- [ ] Admin can read dispute messages post-escalation (Tier 2)

### Auto-escalation

- [ ] Cron runs every 15 minutes successfully for 14 consecutive runs post-deploy
- [ ] 48h cleaner non-response → auto-escalate within 15 min of threshold
- [ ] Two customer rejections → auto-escalate immediately on second rejection (synchronous, not crontriggered)
- [ ] Explicit escalation requests → immediate state transition
- [ ] On escalation: state → `tier_2_mediation`; both parties notified; admin queue updated

### Cross-cutting

- [ ] All Phase 8a code has unit tests; coverage ≥80% on `lib/disputes/` files
- [ ] RLS enforced: customer reads own disputes; cleaner reads own; admin bypass
- [ ] All state transitions logged in audit table
- [ ] Performance: dispute creation <800ms p95 including photo upload

---

## 3. Database state required

### Existing tables (no changes)

- `disputes` — B3 schema sufficient
- `dispute_messages` — B3 sufficient
- `dispute_resolutions` — B3 sufficient
- `bookings.dispute_window_expires_at` — set by Phase 6f

### New migrations (Phase 8a)

```sql
-- Phase 8a migration

-- Dispute photos (separate from booking_photos for 7-year retention)
CREATE TABLE dispute_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE RESTRICT,
  uploader_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  uploader_role TEXT NOT NULL CHECK (uploader_role IN ('customer', 'cleaner', 'admin')),
  storage_path TEXT NOT NULL,
  original_filename TEXT,
  file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0),
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/heic')),
  caption TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retention_until TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 years'
);
CREATE INDEX idx_dispute_photos_dispute ON dispute_photos (dispute_id);
CREATE INDEX idx_dispute_photos_retention ON dispute_photos (retention_until);

-- Dispute escalation events (audit trail)
CREATE TABLE dispute_escalation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'cleaner_non_response_48h',
    'customer_two_rejections',
    'explicit_escalation_request',
    'admin_decision',
    'auto_resolution'
  )),
  triggered_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_escalation_events_dispute ON dispute_escalation_events (dispute_id, triggered_at DESC);

-- Customer rejection counter on dispute_resolutions
ALTER TABLE dispute_resolutions
  ADD COLUMN IF NOT EXISTS customer_rejection_count INTEGER NOT NULL DEFAULT 0;

-- Cleaner response deadline tracker on disputes
ALTER TABLE disputes
  ADD COLUMN IF NOT EXISTS cleaner_response_deadline TIMESTAMPTZ;
ALTER TABLE disputes
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;
ALTER TABLE disputes
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE disputes
  ADD COLUMN IF NOT EXISTS resolution_outcome TEXT CHECK (resolution_outcome IN (
    're_clean_accepted', 'partial_refund_accepted', 'cleaner_stands_accepted',
    'tier_2_resolved', 'tier_3_resolved', 'expired_no_action'
  ));
```

### RLS policies

```sql
-- Disputes: customer reads own; cleaner reads own; admin bypass
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY disputes_parties ON disputes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = disputes.booking_id
      AND (b.customer_user_id = auth.uid() OR b.cleaner_user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Dispute photos: parties + admin
ALTER TABLE dispute_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY dispute_photos_parties ON dispute_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM disputes d
      JOIN bookings b ON b.id = d.booking_id
      WHERE d.id = dispute_photos.dispute_id
      AND (b.customer_user_id = auth.uid() OR b.cleaner_user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Dispute messages: parties + admin (post-escalation)
ALTER TABLE dispute_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY dispute_messages_parties ON dispute_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM disputes d
      JOIN bookings b ON b.id = d.booking_id
      WHERE d.id = dispute_messages.dispute_id
      AND (b.customer_user_id = auth.uid() OR b.cleaner_user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
```

---

## 4. Files to create

### App routes — Customer-facing dispute (~3 files)

- `/app/booking/[id]/dispute/open/page.tsx` — WF 16 dispute initiation
- `/app/booking/[id]/dispute/[dispute_id]/page.tsx` — dispute detail + thread (customer view)
- `/app/booking/[id]/dispute/[dispute_id]/respond/page.tsx` — accept/reject offer

### App routes — Cleaner-facing dispute (~2 files)

- `/app/cleaner/disputes/page.tsx` — list of active disputes for cleaner
- `/app/cleaner/disputes/[dispute_id]/page.tsx` — WF 17 cleaner response

### Feature module — Dispute initiation (~6 components)

- `/features/disputes/components/DisputeCategorySelect.tsx`
- `/features/disputes/components/DisputeDescriptionForm.tsx`
- `/features/disputes/components/DisputePhotoUpload.tsx` — up to 5 photos
- `/features/disputes/components/DesiredOutcomeRadio.tsx`
- `/features/disputes/components/DisputeWindowDisplay.tsx` — countdown to 48h close
- `/features/disputes/components/DisputeConfirmation.tsx` — post-submit

### Feature module — Cleaner response (~5 components)

- `/features/disputes/components/DisputeClaimDisplay.tsx` — customer's claim + photos
- `/features/disputes/components/CleanerResponseForm.tsx` — 4-option chooser
- `/features/disputes/components/RescheduleProposalForm.tsx` — re-clean specifics
- `/features/disputes/components/RefundOfferForm.tsx` — partial refund specifics
- `/features/disputes/components/StandByWorkForm.tsx` — explanation text

### Feature module — Customer accept/reject (~4 components)

- `/features/disputes/components/OfferReviewDisplay.tsx`
- `/features/disputes/components/AcceptOfferAction.tsx`
- `/features/disputes/components/CounterProposeForm.tsx`
- `/features/disputes/components/RejectAndRequestForm.tsx`

### Feature module — Dispute thread (~3 components)

- `/features/disputes/components/DisputeMessageThread.tsx`
- `/features/disputes/components/DisputeMessageInput.tsx`
- `/features/disputes/components/DisputeMessageRow.tsx`

### Library code (~6 files — dispute logic)

- `/lib/disputes/dispute_creator.ts` — `createDispute()` with window enforcement
- `/lib/disputes/dispute_response_handler.ts` — cleaner response logic
- `/lib/disputes/dispute_resolution_handler.ts` — customer accept/reject + resolution
- `/lib/disputes/escalation_logic.ts` — three trigger conditions
- `/lib/disputes/dispute_state_machine.ts` — state transitions
- `/lib/disputes/photo_uploader.ts` — handles 5-photo limit, retention assignment

### Server actions / API routes (~6 files)

- `/app/api/disputes/create/route.ts` — POST create dispute
- `/app/api/disputes/[id]/respond/route.ts` — POST cleaner response
- `/app/api/disputes/[id]/accept/route.ts` — POST customer accept
- `/app/api/disputes/[id]/reject/route.ts` — POST customer reject
- `/app/api/disputes/[id]/messages/route.ts` — GET/POST messages
- `/app/api/disputes/[id]/photos/route.ts` — GET signed URLs

### Background jobs (1 file)

- `/jobs/dispute_auto_escalation.ts` — cron every 15 min

### Database migrations (1 file)

- `migrations/2026XXXXXX_phase_8a_schema.sql`

### Phase 7a integration

Modify Phase 7a `recordReliabilityEvent()` calls to fire on:
- Dispute opened (no immediate score impact, but counts toward dispute rate)
- Dispute resolved with cleaner stands → 0 score impact
- Dispute resolved with partial refund → -1 score impact
- Dispute resolved with re-clean → 0 score impact (good faith)

### Docs (3 files; this set)

- `phase-8-master-outline.md` — already created
- `phase-8a-spec.md` — this file
- `phase-8a-explainer.md` — plain-English walkthrough

---

## 5. Implementation order

### Sub-phase 8a-1 — Customer dispute initiation (~3 days)

**Day 1 — Schema + dispute creator library.** Run migrations. Build `lib/disputes/dispute_creator.ts` with window enforcement + photo upload coordination. Unit test extensively.

**Day 2 — WF 16 UI components.** Build category select, description form, photo upload (5-limit), desired outcome radio. Wire to dispute creator.

**Day 3 — Server action + cleaner notification.** Wire `/api/disputes/create` route. Notification trigger to cleaner. End-to-end test: customer opens dispute → row inserted → cleaner notified.

### Sub-phase 8a-2 — Cleaner dispute response (~3 days)

**Day 4 — Cleaner inbox + dispute display.** Build `/cleaner/disputes/[id]` route. Render customer's claim + photos + auto-attached clock-out photos.

**Day 5 — Cleaner response form (4 options).** Build all 4 sub-forms (re-clean, partial refund, stand by work, escalate). Each updates dispute state correctly.

**Day 6 — Server action + customer notification.** Wire `/api/disputes/[id]/respond`. Customer notification on response. Test all 4 paths.

### Sub-phase 8a-3 — Customer accept/reject + resolution (~3 days)

**Day 7 — Customer offer review + accept paths.** Build `/booking/[id]/dispute/[id]/respond`. Render cleaner's offer. Accept handlers for each offer type:
- Re-clean accept → call Phase 6a booking creation with proposed time
- Partial refund accept → call Phase 9 partial refund
- Stand by work accept → close dispute with cleaner-stands outcome

**Day 8 — Reject paths + counter-propose.** Counter-propose flow (1 use only). Reject + escalate path. Reject + request alternative path.

**Day 9 — Score event integration + resolution audit.** Phase 7a integration: fire correct score events per outcome. Audit log entries for all transitions. End-to-end test all 3 acceptance paths.

### Sub-phase 8a-4 — Dispute message thread (~2 days)

**Day 10 — Realtime thread + message components.** Build `DisputeMessageThread` + Realtime subscription. RLS for dispute_messages.

**Day 11 — Read receipts + integration.** Read receipts. Integration with cleaner inbox + customer dispute view.

### Sub-phase 8a-5 — Auto-escalation cron (~2 days)

**Day 12 — Escalation logic library.** Build `lib/disputes/escalation_logic.ts`. Three triggers. Pure function: dispute state → should_escalate decision.

**Day 13 — Cron job + monitoring.** Build `jobs/dispute_auto_escalation.ts`. Schedule 15-min cadence. Monitoring + alerts. Test all three trigger paths in staging.

### Closeout (~2 days)

**Day 14 — End-to-end integration testing.** Full flow: customer opens dispute → cleaner offers re-clean → customer accepts → new booking created → original dispute resolved with score event. Repeat for partial refund + stand-by-work paths.

**Day 15 — Edge cases + polish.** 48h window expiry on customer side. Photo upload edge cases (file too large, wrong format). Counter-propose limit enforcement. Two-rejection auto-escalation timing.

---

## 6. Specific gotchas

### Gotcha A — Window enforcement race

**The problem:** Customer opens dispute exactly at `dispute_window_expires_at`. Server-side check happens 200ms later when request arrives. `NOW()` at server > expires_at. Dispute rejected even though customer initiated within window.

**The fix:** Add 5-minute grace period on server side: `dispute_window_expires_at + INTERVAL '5 minutes' > NOW()`. Acknowledges client-server time variance + transit time.

### Gotcha B — Photo upload partial failure

**The problem:** Customer uploads 5 photos. 4 succeed; 1 fails (network blip). Dispute created with 4 photos. Customer expects 5.

**The fix:** Photo upload completes BEFORE dispute creation. If fewer than expected uploaded, prompt: "1 photo failed to upload. Retry or proceed with 4 photos?" Don't lose customer's typed description while resolving.

### Gotcha C — Re-clean booking creation race with cleaner availability

**The problem:** Customer accepts cleaner's re-clean proposal for "Friday 11 AM." By the time the system creates the new booking, cleaner has accepted another booking for that slot.

**The fix:** Use Phase 6a booking holds mechanism. Customer accept → 5-minute hold on slot → create booking row. If cleaner accepted another booking in those 5 minutes (rare), surface conflict and ask customer to propose alternative.

### Gotcha D — Counter-propose loops

**The problem:** Customer counter-proposes; cleaner counter-counter-proposes; customer counter-counter-counter-proposes. Infinite loop.

**The fix:** **One counter-propose per side per dispute.** After both have counter-proposed, no further counter — only accept, reject + escalate, or stand-by-work.

### Gotcha E — Auto-escalation cron firing during cleaner response in progress

**The problem:** Cleaner is mid-response (typing out their stand-by-work explanation) at 47:55 hours. Cron fires at 48:00, escalates dispute. Cleaner submits at 48:01; gets error.

**The fix:** Cleaner response form has explicit "Save draft" capability. Drafts auto-save every 30 seconds. If escalation fires mid-response, surface message: "This dispute escalated to admin while you were responding. Your draft is saved; admin can read it." Don't lose cleaner's typing.

### Gotcha F — Two-rejection counter not synchronizing

**The problem:** Customer rejects offer #1. Cleaner re-offers immediately. Customer rejects offer #2 within 30 seconds. Counter increments to 2 but escalation logic checks against state machine that hasn't yet reflected the rejection.

**The fix:** Customer rejection action is synchronous: increment counter, check threshold, escalate if 2 reached, return updated state. No cron involvement. Customer sees "escalated to admin" immediately.

### Gotcha G — Photo retention drift

**The problem:** Dispute photos have 7-year retention. Job photos (linked to same booking via `booking_photos`) have 30-day retention. Job photos auto-delete; dispute references them but they're gone.

**The fix:** When dispute opens, **copy** relevant clock-out photos from `booking_photos` to `dispute_photos` (with cleaner_role uploader, marked auto-attached). Original `booking_photos` continues 30-day deletion path; `dispute_photos` copy retained 7 years.

### Gotcha H — Dispute message thread visibility transition

**The problem:** Tier 1 dispute messages visible only to customer + cleaner. Dispute escalates to Tier 2. Admin needs to read thread. RLS policy must allow admin from this point.

**The fix:** RLS policy allows admin always (admin_users membership check). The existing customer + cleaner check OR'd with admin check works. Don't try to gate by dispute state — too brittle.

---

## 7. Testing strategy

### Unit tests

- `lib/disputes/dispute_creator.ts`: window enforcement edge cases (exactly at expiry, +/- 1 minute)
- `lib/disputes/dispute_response_handler.ts`: each of 4 cleaner response types
- `lib/disputes/dispute_resolution_handler.ts`: each of 3 customer response paths + 2-rejection threshold
- `lib/disputes/escalation_logic.ts`: 3 trigger conditions, edge cases
- `lib/disputes/dispute_state_machine.ts`: invalid transitions rejected

### Integration tests

- Full Tier 1 flow E2E for each of 3 successful resolution paths
- Auto-escalation: simulate 48h cleaner non-response; verify state transitions
- Two-rejection auto-escalation
- Concurrent customer + cleaner activity (race protection)
- Photo upload with 5 photos (large files)

### Manual QA

- Customer opens dispute on staging booking
- Cleaner responds with each option type
- Counter-propose loop boundaries
- 48h window expiry on staging cleaners
- Notification delivery (push + email)
- Realtime message thread on multi-device

---

## 8. Deployment plan

### Pre-deploy checklist

- [ ] All migrations applied to production
- [ ] Phase 6f confirmed setting `dispute_window_expires_at` correctly
- [ ] Phase 7a `recordReliabilityEvent()` operational
- [ ] Cron scheduler running (Vercel Cron or pg_cron)
- [ ] At least 5 production-equivalent test bookings approved within last 48h for E2E test
- [ ] Customer + cleaner notification templates lawyer-reviewed
- [ ] Support team trained on Tier 1 patterns

### Deployment order

1. Migrations
2. Application code
3. Cron jobs activated
4. Phase 7a integration calls activated (replace stubs)
5. Soft launch: 7 days monitoring before announcing dispute system widely

### Rollback plan

- App code revert if UI bugs surface
- Schema migrations forward-only — don't roll back
- Cron jobs can pause independently
- If escalation logic firing incorrectly: pause cron, manual admin review of recent escalations

---

## 9. Phase 8a → Phase 8b/8c handoff

Phase 8a output ready for Phase 8b (admin mediation):
- Disputes flowing → 8b consumes from queue
- Tier 2 escalated state → 8b admin tooling activates
- Full evidence + thread → 8b mediation interface renders
- `dispute_resolutions` records ready for admin updates

Phase 8a output ready for Phase 8c (Tier 3 escalation):
- Dispute categories include `damage`, `safety`, `theft` → Phase 8c uses for Tier 3 trigger
- Dispute photo retention 7 years → satisfies legal requirement
- Audit trail complete → satisfies insurance partner due diligence

---

## 10. Open questions for Phase 8b/8c lock-in

These don't block 8a but should resolve before 8b/8c:

1. **Tier 2 SLA exact business hours.** Recommendation: 9 AM - 6 PM Pacific weekdays. Confirm before 8b.
2. **Insurance partner identified.** Pre-launch task. Recommendation: start partner conversation during 8a build.
3. **Tier 3 legal review counsel.** Recommendation: continue Phase 4 lawyer relationship.
4. **Anti-abuse threshold.** 30% customer dispute rate, 20% cleaner. Verify with Phase 8a real data before 8b admin dashboard surfaces.

---

This spec is the canonical Phase 8a build reference. Plain-English walkthrough lives in `phase-8a-explainer.md`. High-level navigation across all of Phase 8 lives in `phase-8-master-outline.md`.
