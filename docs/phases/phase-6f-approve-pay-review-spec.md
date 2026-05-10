# Phase 6f — Approve & Pay + Review + Tip Specification

> **Author note (transparency):** This spec is being written ahead of when Phase 6f will actually be built. The spec is correct as of the current date but will need a refresh when implementation actually starts, particularly for: actual customer auto-approval rates after launch, Stripe capture timing edge cases, tip prompt acceptance rates, and review submission patterns. Treat this as an aggressive draft.

**Phase goal:** After Phase 6e clock-out, booking enters `awaiting_approval`. Customer has 24 hours to review photos and approve. Manual approval (WF 10) or 24h auto-approval both trigger Stripe capture + cleaner balance update. Customer optionally submits review with star rating + trait tags (WF 20). 4+ star ratings unlock tip prompt. Standalone tip flow (WF 23) accessible 30 days post-approval. 48-hour dispute window opens at approval (Phase 8a consumes).

**Estimated duration:** ~1.5 weeks of focused engineering (8 working days).

**Depends on:**
- Phase 6e complete (photos uploaded, clock-out fires `awaiting_approval` state)
- Phase 6a complete (Stripe authorization exists; capture is the second half)
- Phase 7a operational (review events fire score events)
- Phase 9a operational (capture writes to `cleaner_ledger_events`; tip processor available)
- Phase 10a available or stubbed (notifications fire on approval, review, tip)
- B2 + B3 + B5 schemas deployed

**Wireframes covered:** WF 10 (approve & pay), WF 20 (review prompt + tip), WF 23 (standalone tip).

**Phase 6f sub-sections (sequential):**

- **6f-1** — 24h auto-approval + manual approval (WF 10) (~3 days)
- **6f-2** — Review submission with traits (WF 20) (~2 days)
- **6f-3** — Tip flow (WF 20 inline + WF 23 standalone) (~2 days)
- **Closeout + integration testing** (~1 day)

---

## 0. External account prerequisites

Phase 6f has **no new external services.** Stripe is configured (Phase 4 + Phase 6a). Payouts run via Phase 9a/9b. Notifications via Phase 10a.

### 0.1 Verify Stripe capture API for partial captures

Phase 6a authorized full amount. Phase 6f captures full amount at approval. **No partial capture path in 6f** — Phase 8a/9a handle partial refunds post-capture.

Verify in Stripe test mode:
- Authorize $125.99 → 7-day hold
- Capture full amount via `paymentIntents.capture()`
- Verify charge moves from authorized to captured state

### 0.2 Webhook idempotency

Phase 9a `stripe_webhook_processed` table handles webhook retries. Phase 6f relies on this. Verify table exists.

### 0.3 No lawyer items

WF 10, WF 20, WF 23 copy reviewed in Phase 6 lawyer pass. No new lawyer items.

---

## 1. Summary

Phase 6f is **the closing transaction layer.** Concretely, by the end of Phase 6f:

1. **Customer can manually approve at WF 10.** Reviews photos. Taps "Approve and pay." Stripe captures full amount. State → `approved`. Cleaner ledger event fires.

2. **24-hour auto-approval cron.** Bookings stuck in `awaiting_approval` past 24h auto-approve. Same downstream effects as manual.

3. **48-hour dispute window opens at approval.** `bookings.dispute_window_expires_at = approved_at + 48h`. Phase 8a consumes.

4. **Review submission optional (WF 20).** Star rating + trait tags + optional comment. Phase 7a score event fires. Trait tags feed Phase 7c specialty badges.

5. **Tip prompt at WF 20 if 4+ stars.** Inline tip selector ($5/$10/$15/custom). Stripe processes. 100% to cleaner.

6. **Standalone tip flow (WF 23) accessible 30 days post-approval.** Same engine as inline tip.

7. **Phase 7a integration:** approval doesn't directly fire score event; review submission does. Phase 9a integration: capture creates ledger entry + platform revenue events.

What Phase 6f does NOT do:
- Refund mechanics (Phase 9a)
- Dispute resolution (Phase 8a/b)
- Friday payouts (Phase 9b)

---

## 2. Acceptance criteria

### 6f-1 Approval (WF 10)

- [ ] Customer at WF 10 sees: photos by room, completion timestamp, total amount
- [ ] "Approve and pay" button enabled (no gate other than booking state)
- [ ] Tap → server-side: `paymentIntents.capture()` + state transition + dispute window opens
- [ ] State: `awaiting_approval → approved`
- [ ] `bookings.captured_at`, `approved_at`, `dispute_window_expires_at` set
- [ ] Phase 9a ledger event: `charge_captured_cleaner_share` (positive cleaner share)
- [ ] Phase 9a platform revenue events: `booking_fee_collected` (+$9.99) + `commission_collected` (+commission)
- [ ] Cleaner notification fires: "Booking approved · $X to your balance"
- [ ] Customer redirected to WF 20 review prompt
- [ ] 24h auto-approval cron runs every 5 min; approves any `awaiting_approval` past threshold
- [ ] Auto-approval same downstream effects as manual

### 6f-2 Review submission (WF 20)

- [ ] Review form: star rating (1-5) + trait tag multi-select + optional comment (0-1000 chars)
- [ ] Trait tags: 6 specialty traits + general positive traits (per WF 20.4)
- [ ] Submit → `reviews` row inserted; `review_traits` rows for each tag
- [ ] Review optional: customer can skip; doesn't gate approval
- [ ] Phase 7a score event fires per rating tier (5★=+1, 4★=0, 3★=-1, 2★=-3, 1★=-5)
- [ ] Trait tags counted toward Phase 7c specialty badges
- [ ] Cleaner notification: "Sarah K. left you a 5-star review"

### 6f-3 Tip flow

- [ ] Inline tip prompt at WF 20 if rating ≥4
- [ ] Tip amounts: $5 / $10 / $15 / custom (custom $1-$200)
- [ ] Tip = separate Stripe PaymentIntent (immediate capture)
- [ ] On success: `tips` row + Phase 9a `tip_received` ledger event (+full amount)
- [ ] No commission deducted (100% pass-through)
- [ ] Cleaner notification: "Sarah K. tipped you $10"
- [ ] Standalone WF 23 flow accessible 30 days post-approval
- [ ] Past 30 days: tip flow disabled with hint

### Cross-cutting

- [ ] All Phase 6f code has unit tests; coverage ≥80% (financial integration)
- [ ] RLS: customer reads/writes own booking's review; cleaner reads reviews for own bookings
- [ ] All transactions idempotent (capture retries don't double-charge)
- [ ] Performance: approval flow <2s p95 end-to-end (includes Stripe capture)

---

## 3. Database state required

### Existing tables

- `bookings` (B2) — has state machine + capture timestamp columns
- `charges` (B5) — Stripe charge mirror
- `tips` (Phase 9a) — tip records
- `cleaner_ledger_events` (Phase 9a) — balance ledger
- `platform_revenue_events` (Phase 9a) — platform revenue

### New migrations (Phase 6f)

```sql
-- Phase 6f migration

-- Reviews (B3 has reviews + review_traits already; verify schema)
-- If missing, add:
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
  customer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  cleaner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT CHECK (LENGTH(comment) <= 1000),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reviews_cleaner ON reviews (cleaner_user_id, submitted_at DESC);

CREATE TABLE IF NOT EXISTS review_traits (
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  trait_key TEXT NOT NULL CHECK (trait_key IN (
    'eco_friendly', 'pet_friendly', 'move_out_specialist', 'airbnb_expert',
    'allergen_aware', 'on_time_pro',
    'thorough', 'communicative', 'professional', 'friendly', 'detail_oriented'
  )),
  PRIMARY KEY (review_id, trait_key)
);

-- Booking dispute window column (consumed by Phase 8a)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS dispute_window_expires_at TIMESTAMPTZ;

-- Approval timing tracking
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS approved_via TEXT CHECK (approved_via IN ('manual', 'auto_24h'));
```

### RLS policies

```sql
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Reviews: parties read; customer writes
CREATE POLICY reviews_parties_read ON reviews
  FOR SELECT USING (
    customer_user_id = auth.uid()
    OR cleaner_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    OR TRUE -- public read for cleaner profile display
  );

CREATE POLICY reviews_customer_write ON reviews
  FOR INSERT WITH CHECK (customer_user_id = auth.uid());

-- review_traits: same as reviews
ALTER TABLE review_traits ENABLE ROW LEVEL SECURITY;
CREATE POLICY review_traits_via_review ON review_traits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM reviews r
      WHERE r.id = review_traits.review_id
      AND (r.customer_user_id = auth.uid() OR r.cleaner_user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    OR TRUE
  );
```

---

## 4. Files to create

### App routes (~3 files)

- `/app/booking/[id]/approve/page.tsx` — WF 10 approval
- `/app/booking/[id]/review/page.tsx` — WF 20 review form
- `/app/booking/[id]/tip/page.tsx` — WF 23 standalone tip

### Components — Approval (~4 files)

- `/features/approval/components/ApprovalScreen.tsx` — WF 10 main UI
- `/features/approval/components/PhotoGalleryByRoom.tsx`
- `/features/approval/components/CompletionSummary.tsx`
- `/features/approval/components/ApproveAndPayButton.tsx`

### Components — Review (~4 files)

- `/features/review/components/StarRatingSelector.tsx`
- `/features/review/components/TraitTagPicker.tsx` — multi-select
- `/features/review/components/ReviewCommentField.tsx`
- `/features/review/components/ReviewSubmissionShell.tsx` — orchestrates

### Components — Tip (~3 files)

- `/features/tip/components/TipAmountSelector.tsx` — preset + custom
- `/features/tip/components/InlineTipPrompt.tsx` — WF 20 inline
- `/features/tip/components/StandaloneTipFlow.tsx` — WF 23

### Library code (~5 files)

- `/lib/approval/approval_processor.ts` — orchestrates capture + state + ledger + revenue
- `/lib/approval/auto_approval_cron.ts` — handler for 24h cron
- `/lib/review/review_processor.ts` — review insert + score event
- `/lib/review/trait_aggregator.ts` — counts traits for Phase 7c
- `/lib/tip/tip_processor.ts` — Stripe charge + ledger (uses Phase 9a tip_processor.ts as base)

### Server actions / API routes (~5 files)

- `/app/api/booking/[id]/approve/route.ts` — POST manual approval
- `/app/api/booking/[id]/review/route.ts` — POST review submission
- `/app/api/booking/[id]/tip/route.ts` — POST tip
- `/app/api/booking/[id]/photos/signed-urls/route.ts` — GET signed URLs for WF 10
- `/app/api/webhooks/stripe/payment-captured/route.ts` — webhook handler (extends Phase 9a)

### Background jobs (1 file)

- `/jobs/approval_auto_cron.ts` — runs every 5 min

### Phase 7a + 9a + 10a integration

- Phase 7a: review insert → fires `review_5_star`/`review_4_star`/etc. event
- Phase 9a: capture → ledger event + platform revenue events
- Phase 10a: notifications on approval, review, tip

### Database migrations (1 file)

- `migrations/2026XXXXXX_phase_6f_schema.sql`

### Docs (3 files)

- (Phase 6 overview already exists)
- `phase-6f-approve-pay-review-spec.md` — this file
- `phase-6f-approve-pay-review-walkthrough.md`

---

## 5. Implementation order

### 6f-1 — Approval flow (~3 days)

**Day 1 — Schema + approval processor library.** Migration. Build `lib/approval/approval_processor.ts`. Test Stripe capture flow.

**Day 2 — WF 10 UI.** `ApprovalScreen`, `PhotoGalleryByRoom`, `ApproveAndPayButton`. Wire to processor. End-to-end manual approval test.

**Day 3 — Auto-approval cron.** `jobs/approval_auto_cron.ts`. Runs every 5 min. Test with backdated `awaiting_approval` bookings.

### 6f-2 — Review (~2 days)

**Day 4 — Review UI + submission.** `StarRatingSelector`, `TraitTagPicker`, `ReviewSubmissionShell`. Submit → row inserts.

**Day 5 — Phase 7a score events.** Wire review insert → `recordReliabilityEvent()` per star tier. Trait aggregation for Phase 7c badges.

### 6f-3 — Tip flow (~2 days)

**Day 6 — Inline tip at WF 20.** `InlineTipPrompt` rendered if rating ≥4. Tip processing via Phase 9a tip processor.

**Day 7 — Standalone WF 23.** `StandaloneTipFlow` route. 30-day window enforcement.

### Closeout (~1 day)

**Day 8 — End-to-end integration.** Full booking lifecycle: book → execute → clock-out → approve → review → tip. Verify all downstream events.

---

## 6. Specific gotchas

### Gotcha A — Auto-approval cron during cleaner clock-out delay

**The problem:** Cleaner finishes work, but doesn't clock out until 26 hours later (forgot). Booking enters `awaiting_approval` 26h late. Auto-approval at 24h after that = 50h after work actually completed. Customer expected approval by then.

**The fix:** 24h timer starts at clock-out, not at scheduled_end. Document expectation. If cleaner consistently clocks out late, Phase 7a `late_clock_out` event (not in current scope; consider).

### Gotcha B — Customer approves before photos finish uploading

**The problem:** Cleaner clocks out; photos still uploading in background. Customer at WF 10 sees partial photos. Approves anyway.

**The fix:** WF 10 polls until all expected photos visible (per `bookings.required_rooms` count). Render skeletons for pending. Approve disabled until all visible.

### Gotcha C — Stripe capture fails after authorization

**The problem:** Customer authorized at booking. 7+ days have passed. Capture fails with "authorization expired."

**The fix:** Phase 6a re-authorization cron at T-24h handles long-lead bookings. If still expired at approval: customer notified to update payment; manual re-auth path; ops handles edge case.

### Gotcha D — Review submitted before approval

**The problem:** Customer at WF 20 submits review without first approving. Booking still `awaiting_approval`. Inconsistent state.

**The fix:** WF 20 only accessible post-approval (state = `approved`). UI gate. Server-side check.

### Gotcha E — Trait tag inflation

**The problem:** Customer ticks all 11 trait tags on every review. Specialty badges become meaningless because everyone has all of them.

**The fix:** Limit trait tags per review (max 4 selectable). UI + server validation. Per WF 20.4.

### Gotcha F — Tip after dispute opened

**The problem:** Customer disputes booking. Day 2 of dispute, customer tips cleaner anyway (separate transaction).

**The fix:** Tip flow disabled during dispute window if dispute opened. Reactivates after dispute resolved (if booking still approved). Edge case; lock in spec.

### Gotcha G — Customer expects refund of tip on dispute

**The problem:** Customer disputes booking. Expects tip refunded too. Per Phase 9 Lock 9, tips never auto-refund.

**The fix:** Customer support path: customer contacts admin, admin manually refunds tip if appropriate. Document in WF 23 fine print: "Tips are voluntary and not auto-refunded with disputes."

### Gotcha H — Review optional but feels mandatory

**The problem:** WF 20 visually presents review as required. Customer feels pressured. Skips approval entirely.

**The fix:** Clear "Skip review" button alongside submit. Don't gate continuation on review. Customer can always come back later (within 14 days).

---

## 7. Testing strategy

### Unit tests

- `lib/approval/approval_processor.ts`: each downstream effect on success/failure
- `lib/review/review_processor.ts`: each star tier → correct Phase 7a event
- `lib/tip/tip_processor.ts`: Phase 9a integration

### Integration tests

- Full E2E: book → clock-in → clock-out → photos → approve → capture → cleaner balance + platform revenue updated
- 24h auto-approval cron with backdated booking
- Review submission → score event fires correctly

### Manual QA

- Real Stripe test mode E2E
- Customer + cleaner devices in parallel
- Tip flow inline + standalone

---

## 8. Deployment plan

### Pre-deploy
- [ ] Migrations applied
- [ ] Phase 9a ledger + refund engine operational
- [ ] Phase 7a score event dispatcher operational
- [ ] Stripe webhook signature verification

### Deployment order
1. Migrations
2. Library code (approval + review + tip processors)
3. UI
4. Server endpoints
5. Auto-approval cron
6. Phase 7a/9a/10a integrations
7. Soft launch: 7 days

### Rollback
- App code revert if bugs surface
- Don't roll back schema (financial integrity)

---

## 9. Phase 6f → Phase 8a/9b handoff

Phase 6f output ready for:
- **Phase 8a** (Tier 1 disputes) — `dispute_window_expires_at` set; customer can open dispute within 48h
- **Phase 9b** (Friday payouts) — captured charges populate cleaner ledger; payout cron consumes
- **Phase 7c** (badges) — review trait counts feed specialty badge calc

---

## 10. Open questions

1. **Review submission window.** 14 days post-approval recommended. Lock.
2. **Trait tag max selectable.** 4 recommended. Lock.
3. **Tip during dispute behavior.** Disabled during open dispute. Lock.

---

This spec is the canonical Phase 6f build reference. Walkthrough lives in `phase-6f-approve-pay-review-walkthrough.md`.
