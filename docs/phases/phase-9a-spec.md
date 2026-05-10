# Phase 9a — Cleaner Balance Ledger + Refund Engine + Platform Revenue Tracking Specification

> **Author note (transparency):** This spec is being written ahead of when Phase 9a will actually be built — minimum 10-13 weeks from now. The spec is correct as of the current date but will need a refresh when implementation actually starts, particularly for: exact Stripe API method signatures (subject to API version updates), platform_revenue aggregation strategies (depends on actual transaction volume), and tip flow UX after real customer feedback. Treat this document as an **aggressive draft**.

**Phase goal:** Every dollar in the system is tracked in `cleaner_ledger_events`. Every captured charge generates platform revenue events. The 5 refund paths from Phase 8 lock-in all execute end-to-end with correct Stripe calls, ledger entries, and notifications. Standalone tip flow (WF 23) processes tips as separate Stripe charges with 100% pass-through to cleaner.

**CRITICAL:** Phase 9a is a hard dependency for Phase 8a/8b. Phase 8 disputes can't process refunds without Phase 9a's engine. Recommended actual build order: **ship Phase 9a before Phase 8a**, even though Phase 9 numbers come "after" Phase 8.

**Estimated duration:** ~1.5 weeks of focused engineering (8 working days).

**Depends on:**
- Phase 6f payment capture flow operational (Stripe webhooks firing on capture)
- Phase 7a commission engine storing commission_rate per `cleaner_payouts` row
- B5 schema deployed (charges, refunds, commission_records)
- Stripe webhook handler operational (receives `charge.refunded`, `payment_intent.succeeded`, etc.)
- At least 5 cleaners with completed bookings producing real captures

**Wireframes covered:** WF 6 (pricing display references — no UI work in 9a), WF 23 (standalone tip flow), WF 62 (admin refund processing — UI in Phase 8b; processing engine here).

**Phase 9a sub-sections (mostly sequential):**

- **9a-1** — Cleaner balance ledger (~2 days)
- **9a-2** — Refund engine (~3 days)
- **9a-3** — Standalone tip flow WF 23 (~1.5 days)
- **9a-4** — Platform revenue tracking (~1.5 days)

---

## 0. External account prerequisites

Phase 9a has **no new external services to set up.** Stripe is already configured (Phases 4 + 6a). What 9a needs is verification that Stripe APIs work for the specific operations.

### 0.1 Verify Stripe refund APIs

Before writing code:

1. **Test partial refund on captured charge.** Create a test charge, capture it, then refund partial amount via `charges.refunds.create({amount: ...})`. Verify partial refund record created.

2. **Test full refund on captured charge.** Same charge, refund remaining amount. Verify full refund.

3. **Test cancel on uncaptured PaymentIntent.** Create authorization without capture, then `paymentIntents.cancel`. Verify no money moved.

4. **Test partial cancel on uncaptured PaymentIntent.** Stripe API: cancel partial isn't supported directly. For pre-capture partial refunds, the pattern is: capture the partial amount, then refund the rest. Document this in spec.

5. **Test webhook delivery.** `charge.refunded` webhook should fire on each refund. Verify your webhook handler receives + idempotently processes.

### 0.2 Verify Stripe Connect platform balance

Friday payouts (Phase 9b) draw from PureTask's platform Stripe balance. **9a doesn't trigger payouts** but does create the financial flows that build that balance. Verify the account exists with proper transfer permissions.

### 0.3 No new lawyer items

Phase 9 master outline locks were product decisions. Tax handling specifically: California sales tax on residential cleaning = none (locked at WF 42). No new legal blockers for 9a.

---

## 1. Summary

Phase 9a is the **financial accounting backbone** of the platform. By the end of Phase 9a:

1. **Every money event creates a `cleaner_ledger_events` row.** Captures, refunds, tips, payouts, fees — all logged. Cleaner's balance is `SUM(events)`.

2. **Refund engine handles all 5 paths.** Tier 1 cleaner-offered, Tier 2 partial, Tier 2 full + strike, Tier 2 goodwill, Tier 3 insurance. Each routes to correct Stripe action + correct ledger impact + correct platform revenue event.

3. **Standalone tip flow works.** Customer can tip up to 30 days post-approval. 100% to cleaner. No commission. WF 23 wired.

4. **Platform revenue tracked.** Booking fees + commissions on capture. Negative events on refunds + goodwill absorption. Daily aggregation cache.

5. **No UI for Phase 9a directly.** UI lives in Phase 8b admin tools (WF 62 admin refund) and Phase 6f review/tip prompt + Phase 9c admin financial dashboard. Phase 9a is the engine; surfaces are elsewhere.

What Phase 9a does NOT do (deferred to 9b/9c):
- Friday payout cron (9b)
- Instant payouts (9b)
- Tax + 1099 (9c)
- Year-end reconciliation (9c)

---

## 2. Acceptance criteria

### Cleaner balance ledger

- [ ] `cleaner_ledger_events` table created with 9 event types (per master outline Lock event types)
- [ ] `recordLedgerEvent()` function exists in `lib/payouts/ledger_writer.ts`
- [ ] Phase 6f payment capture inserts `charge_captured_cleaner_share` event
- [ ] Phase 9a tip flow inserts `tip_received` event
- [ ] Phase 9a refund engine inserts `refund_full_clawback` or `refund_partial_clawback` event
- [ ] `balance_calculator.ts` returns SUM of events per cleaner
- [ ] `cleaner_profiles.balance_cents` cache stays consistent with computed sum
- [ ] Negative balances supported (cleaner can have -$50 balance after clawback)

### Refund engine

- [ ] `lib/payouts/refund_processor.ts` orchestrates all 5 refund paths
- [ ] Pre-capture refund routes to `paymentIntents.cancel`
- [ ] Post-capture refund routes to `charges.refunds.create`
- [ ] Tier 1 cleaner-offered partial: customer refund + cleaner balance deducted by their share
- [ ] Tier 1 cleaner-offered full: customer full refund + cleaner balance fully deducted
- [ ] Tier 2 admin partial: customer partial refund + 50/50 split (default) configurable
- [ ] Tier 2 admin full + strike: customer full refund + cleaner clawback + Phase 7a score event fires
- [ ] Tier 2 goodwill: customer refund + cleaner unaffected + platform_revenue_events shows absorption
- [ ] Tier 3 insurance: customer full refund + cleaner unaffected + insurance flag set
- [ ] Webhook handler idempotent on `charge.refunded` events

### Standalone tip flow (WF 23)

- [ ] `/booking/[id]/tip` route accessible to customer who owns booking
- [ ] Tip flow disabled past 30 days post-approval
- [ ] Customer can tip $1 minimum to $200 maximum
- [ ] Stripe creates separate PaymentIntent (not part of booking authorization)
- [ ] On success: `tips` row inserted; `tip_received` ledger event for cleaner
- [ ] Cleaner notification fires within seconds
- [ ] No commission deducted from tip (100% to cleaner)
- [ ] Tip refunds: not possible automatically (admin action only)

### Platform revenue tracking

- [ ] `platform_revenue_events` table created with 6 event types
- [ ] Capture creates `booking_fee_collected` (+$9.99) AND `commission_collected` (+commission)
- [ ] Refund with cleaner clawback creates `commission_returned_on_refund` (negative)
- [ ] Goodwill refund creates `goodwill_absorbed` (negative)
- [ ] Daily cron aggregates events into `platform_revenue_daily`
- [ ] Daily aggregation accurate to within ±1 cent of event sum

### Cross-cutting

- [ ] All Phase 9a code has unit tests; coverage ≥85% on `lib/payouts/` files (high-stakes math)
- [ ] RLS: cleaner reads own ledger events; admin reads all
- [ ] All money operations idempotent (Stripe webhook retries safe)
- [ ] No double-charge or double-refund possible under concurrent operations
- [ ] Stripe webhook signature verification enforced

---

## 3. Database state required

### Existing tables (no changes)

- `charges` (B5) — captured charges, no changes
- `refunds` (B5) — refund records, used as-is
- `commission_records` (B5) — used as-is
- `bookings` — used for booking lookup
- `cleaner_profiles` — adding columns (see below)

### New migrations (Phase 9a)

```sql
-- Phase 9a migration

-- Cleaner balance ledger (the heart of Phase 9a)
CREATE TABLE cleaner_ledger_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'charge_captured_cleaner_share',
    'tip_received',
    'refund_full_clawback',
    'refund_partial_clawback',
    'payout_sent',
    'instant_payout_sent',
    'instant_payout_fee',
    'admin_manual_adjustment',
    'goodwill_credit'
  )),
  amount_cents INTEGER NOT NULL,
  related_charge_id UUID REFERENCES charges(id) ON DELETE SET NULL,
  related_refund_id UUID REFERENCES refunds(id) ON DELETE SET NULL,
  related_tip_id UUID, -- references tips below
  related_payout_id UUID, -- references payouts (Phase 9b)
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  triggered_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ledger_cleaner_recent ON cleaner_ledger_events
  (cleaner_user_id, created_at DESC);
CREATE INDEX idx_ledger_event_type ON cleaner_ledger_events
  (event_type, created_at DESC);
CREATE INDEX idx_ledger_charge ON cleaner_ledger_events
  (related_charge_id) WHERE related_charge_id IS NOT NULL;

-- Tips
CREATE TABLE tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  customer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  cleaner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents BETWEEN 100 AND 20000),
  stripe_payment_intent_id TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL CHECK (source IN ('review_prompt', 'standalone_post_review')),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tips_cleaner ON tips (cleaner_user_id, paid_at DESC);
CREATE INDEX idx_tips_booking ON tips (booking_id);

-- Platform revenue events
CREATE TABLE platform_revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'booking_fee_collected',
    'commission_collected',
    'commission_returned_on_refund',
    'goodwill_absorbed',
    'instant_payout_fee_collected',
    'admin_adjustment'
  )),
  amount_cents INTEGER NOT NULL,
  related_charge_id UUID REFERENCES charges(id) ON DELETE SET NULL,
  related_refund_id UUID REFERENCES refunds(id) ON DELETE SET NULL,
  related_payout_id UUID, -- references payouts (Phase 9b)
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_revenue_event_type ON platform_revenue_events
  (event_type, occurred_at DESC);
CREATE INDEX idx_revenue_charge ON platform_revenue_events
  (related_charge_id) WHERE related_charge_id IS NOT NULL;

-- Daily revenue aggregate cache (Phase 9c will read this)
CREATE TABLE platform_revenue_daily (
  date_pacific DATE PRIMARY KEY,
  booking_fee_total_cents INTEGER NOT NULL DEFAULT 0,
  commission_total_cents INTEGER NOT NULL DEFAULT 0,
  refund_returns_cents INTEGER NOT NULL DEFAULT 0,
  goodwill_absorbed_cents INTEGER NOT NULL DEFAULT 0,
  instant_payout_fees_cents INTEGER NOT NULL DEFAULT 0,
  net_revenue_cents INTEGER NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cleaner profile additions
ALTER TABLE cleaner_profiles
  ADD COLUMN IF NOT EXISTS balance_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cleaner_profiles
  ADD COLUMN IF NOT EXISTS ytd_earnings_cents INTEGER NOT NULL DEFAULT 0;

-- Stripe webhook idempotency
CREATE TABLE IF NOT EXISTS stripe_webhook_processed (
  stripe_event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### RLS policies

```sql
-- Cleaner ledger: cleaner reads own; admin reads all
ALTER TABLE cleaner_ledger_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY ledger_cleaner_own ON cleaner_ledger_events
  FOR SELECT USING (
    cleaner_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Tips: customer + cleaner read; admin reads all
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY tips_parties ON tips
  FOR SELECT USING (
    customer_user_id = auth.uid()
    OR cleaner_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Platform revenue: admin only
ALTER TABLE platform_revenue_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY revenue_admin_only ON platform_revenue_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Daily revenue cache: admin only
ALTER TABLE platform_revenue_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY revenue_daily_admin_only ON platform_revenue_daily
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
```

---

## 4. Files to create

### Library code (~10 files — the heart of Phase 9a)

- `/lib/payouts/ledger_writer.ts` — `recordLedgerEvent({...})` single point for all ledger inserts
- `/lib/payouts/balance_calculator.ts` — pure function: events → current balance
- `/lib/payouts/refund_processor.ts` — orchestrator for 5 refund paths
- `/lib/payouts/stripe_refund_caller.ts` — handles pre-capture cancel vs post-capture refund
- `/lib/payouts/cleaner_clawback.ts` — calculates clawback amount + creates ledger event
- `/lib/payouts/platform_revenue_writer.ts` — inserts platform revenue events
- `/lib/payouts/tip_processor.ts` — Stripe charge + ledger entry + cleaner notification
- `/lib/payouts/refund_path_resolver.ts` — pure function: (refund_type, capture_state) → Stripe action + ledger pattern
- `/lib/payouts/balance_cache_refresher.ts` — keeps `cleaner_profiles.balance_cents` consistent
- `/lib/payouts/idempotency_check.ts` — Stripe webhook idempotency

### App routes (~2 files)

- `/app/booking/[id]/tip/page.tsx` — WF 23 standalone tip flow
- `/app/api/webhooks/stripe/route.ts` — extends existing handler for refund events

### Feature module — Tip flow (~3 files)

- `/features/tips/components/TipAmountSelector.tsx`
- `/features/tips/components/TipPaymentConfirm.tsx`
- `/features/tips/components/TipConfirmation.tsx`

### Server actions (~3 files)

- `/app/api/refunds/process/route.ts` — POST process refund (called by Phase 8 dispute resolution)
- `/app/api/tips/create/route.ts` — POST create tip
- `/app/api/cleaner/balance/route.ts` — GET current balance + recent ledger events

### Background jobs (1 file)

- `/jobs/platform_revenue_daily_aggregator.ts` — daily cron at 1 AM Pacific

### Phase 6f integration changes

Modify Phase 6f payment capture handler to call:
- `recordLedgerEvent({type: 'charge_captured_cleaner_share', amount: cleaner_share, ...})`
- `recordPlatformRevenueEvent({type: 'booking_fee_collected', amount: 999, ...})`
- `recordPlatformRevenueEvent({type: 'commission_collected', amount: commission, ...})`

### Phase 8 integration

Phase 8a (Tier 1) and Phase 8b (Tier 2) call `/api/refunds/process` with refund parameters. Phase 9a refund engine handles execution.

### Database migrations (1 file)

- `migrations/2026XXXXXX_phase_9a_schema.sql`

### Docs (3 files; this set)

- `phase-9-master-outline.md` — already created
- `phase-9a-spec.md` — this file
- `phase-9a-explainer.md` — plain-English walkthrough

---

## 5. Implementation order

### Sub-phase 9a-1 — Cleaner balance ledger (~2 days)

**Day 1 — Schema + ledger writer.** Run migrations. Build `lib/payouts/ledger_writer.ts` with `recordLedgerEvent()`. Build `lib/payouts/balance_calculator.ts`. Unit test extensively.

**Day 2 — Phase 6f integration.** Modify Phase 6f payment capture flow to call ledger writer + platform revenue writer on capture. Verify ledger entries match captured amounts.

### Sub-phase 9a-2 — Refund engine (~3 days)

**Day 3 — Refund path resolver + Stripe refund caller.** Build `lib/payouts/refund_path_resolver.ts` (pure function: routes correctly). Build `lib/payouts/stripe_refund_caller.ts` (handles pre vs post capture). Unit test.

**Day 4 — Refund processor + cleaner clawback.** Build `lib/payouts/refund_processor.ts` orchestrator. Build `lib/payouts/cleaner_clawback.ts` for partial/full clawback math. Test all 5 refund paths.

**Day 5 — Webhook handler + idempotency.** Extend Stripe webhook handler for `charge.refunded`. Idempotency via `stripe_webhook_processed` table. Test Stripe webhook retries don't double-process.

### Sub-phase 9a-3 — Standalone tip flow (~1.5 days)

**Day 6 — Tip processor + WF 23 UI.** Build `lib/payouts/tip_processor.ts` (Stripe charge + ledger + notification). Build WF 23 route + UI components. Wire to Stripe.

**Day 6.5 — 30-day window enforcement + edge cases.** Tip flow disabled past 30 days. Tip refund not possible automatically. Test tip on completed booking.

### Sub-phase 9a-4 — Platform revenue tracking (~1.5 days)

**Day 7 — Platform revenue writer + integration.** Build `lib/payouts/platform_revenue_writer.ts`. Wire to Phase 6f capture + 9a-2 refunds. Test all 6 revenue event types.

**Day 7.5 — Daily aggregation cron.** Build `jobs/platform_revenue_daily_aggregator.ts`. Schedule 1 AM Pacific. Verify cache values match event sum.

### Closeout (~1 day)

**Day 8 — End-to-end integration testing.** Full flow: booking → capture → refund → reconcile. Verify all ledger entries + platform revenue events + cleaner balance. Document any edge cases discovered.

---

## 6. Specific gotchas

### Gotcha A — Stripe webhook ordering not guaranteed

**The problem:** Refund webhook can arrive before charge webhook in rare cases. If 9a tries to record refund before charge captured event exists, ledger entry references nothing.

**The fix:** Idempotency-key + retry pattern. Webhook handlers check if dependent event exists; if not, log and skip (Stripe will retry); if yes, process. Don't error on out-of-order — Stripe retries handle eventually.

### Gotcha B — Partial refund cents rounding

**The problem:** Refund 25% of $125.99 = $31.4975. Round to $31.50 (customer-facing) or $31.49 (truncate)? Cleaner clawback math diverges if rounding inconsistent.

**The fix:** Use cents arithmetic throughout. $125.99 = 12599 cents. 25% = 3149.75 cents → round to 3150 (banker's rounding). Cleaner clawback proportional. Document rounding rule in `refund_path_resolver.ts`.

### Gotcha C — Refund of already-refunded charge

**The problem:** Customer disputes; partial refund processed. Customer disputes again; second refund attempted. Stripe returns error if total refunds exceed charge amount.

**The fix:** Pre-check before Stripe call: `total_refunded_so_far + new_refund_amount <= charge.amount_cents`. Surface clear error to admin if attempting over-refund.

### Gotcha D — Cleaner balance race during concurrent events

**The problem:** Cleaner has $400 balance. Friday cron triggers payout of $400 at 12:00:00. Capture fires at 12:00:00.500 for new $50 cleaner share. Race: which writes first?

**The fix:** Use SERIALIZABLE transactions for ledger writes. Cleaner balance refresh is read-then-write, so wrap in transaction. Phase 9b Friday cron uses advisory locks per cleaner_id.

### Gotcha E — Tip created post-completion but before Phase 6f capture

**The problem:** Customer approves booking; clicks "Tip" before Phase 6f's capture webhook fires. Tip charge succeeds; cleaner balance += tip but charge balance not yet updated.

**The fix:** Tip is independent of capture. Tip ledger event records cleanly. Phase 6f capture also records cleanly when its webhook arrives. No coupling needed.

### Gotcha F — Idempotency on customer-side double-clicks

**The problem:** Customer clicks "Tip $10" twice. Two PaymentIntents created. Two charges. Two ledger events. Cleaner gets $20 unintentionally.

**The fix:** Idempotency key on PaymentIntent creation: hash of `(customer_id, booking_id, tip_intent_timestamp_5_sec_window)`. Same hash within 5 seconds = same PaymentIntent reused.

### Gotcha G — Goodwill credit accounting

**The problem:** Admin grants goodwill refund. Customer gets refund; cleaner unaffected. Platform absorbs cost. But where does the money come from? Platform's Stripe balance.

**The fix:** `goodwill_absorbed` event type with negative amount in `platform_revenue_events`. This reduces platform's measured net revenue. Stripe processes the refund using platform's balance; ledger reflects cost.

### Gotcha H — Refund timing display inconsistency

**The problem:** Stripe says refund takes 5-10 business days. UI says "in 3 days." Customer waits, complains, asks for status.

**The fix:** Display "5-10 business days" consistently across surfaces (matches WF 62 footer). Don't promise faster.

---

## 7. Testing strategy

### Unit tests

- `lib/payouts/refund_path_resolver.ts`: all 5 refund paths × pre/post-capture states (10 combinations)
- `lib/payouts/cleaner_clawback.ts`: partial/full clawback math + cents rounding
- `lib/payouts/balance_calculator.ts`: balance with mixed event types
- `lib/payouts/idempotency_check.ts`: webhook retry handling

### Integration tests

- Capture → ledger + revenue events created correctly
- Refund (each of 5 paths) → Stripe call + ledger + revenue events
- Tip → Stripe charge + ledger + notification
- Webhook retries: same event twice → processed once

### Manual QA

- Real Stripe test environment: full flow from booking → capture → refund
- Concurrent operations: simulate cleaner getting capture + payout simultaneously
- 30-day tip window: time-mocked test

---

## 8. Deployment plan

### Pre-deploy checklist

- [ ] All migrations applied to production
- [ ] Stripe webhook signature verification enabled
- [ ] Idempotency table empty + functional
- [ ] Phase 6f integration tested end-to-end on staging
- [ ] Tip flow tested with real customer + cleaner on staging
- [ ] Platform revenue events match expected formula on staging

### Deployment order

1. Migrations
2. Application code (libraries first, then UI)
3. Phase 6f integration calls activated
4. Stripe webhook handler updated for refund events
5. Daily aggregation cron activated
6. Soft launch: 7 days monitoring before announcing

### Rollback plan

- App code revert if bugs surface
- Schema migrations forward-only
- Critical: don't roll back ledger entries (audit trail integrity)
- If accounting bugs found: insert correction ledger entries via admin tool, not deletion

---

## 9. Phase 9a → Phase 8/9b/9c handoff

Phase 9a output ready for Phase 8a (Tier 1 disputes):
- `/api/refunds/process` endpoint operational
- Tier 1 cleaner-offered refund path tested
- Phase 8a calls 9a engine; engine handles Stripe + ledger

Phase 9a output ready for Phase 8b (Tier 2 disputes):
- Tier 2 partial / full / goodwill paths all tested
- Admin can route refunds via 9a engine

Phase 9a output ready for Phase 9b (Friday payouts):
- `cleaner_ledger_events` is source of balance
- Balance computation function exists
- Friday cron reads from ledger, writes payout events back

Phase 9a output ready for Phase 9c (taxes + reconciliation):
- `platform_revenue_events` is source of platform financial data
- Daily aggregation cache available
- YTD earnings computable from ledger

---

## 10. Open questions for Phase 9b/9c lock-in

These don't block 9a but should resolve before 9b/9c:

1. **Stripe Instant Payouts feature enabled per cleaner.** Need to detect at runtime whether cleaner's debit card supports instant. Test in 9b.
2. **Negative balance write-off threshold.** Cleaner leaves with -$200 balance. Recommendation: write off at 90 days no recovery. Lock in 9c.
3. **Year-end cutoff timing.** January 1 0:00 Pacific. Document explicitly.

---

This spec is the canonical Phase 9a build reference. Plain-English walkthrough lives in `phase-9a-explainer.md`. High-level navigation across all of Phase 9 lives in `phase-9-master-outline.md`.
