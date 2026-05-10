# Phase 9b — Friday Payouts + Instant Payouts Specification

> **Author note (transparency):** This spec is being written ahead of when Phase 9b will actually be built. The spec is correct as of the current date but will need a refresh when implementation actually starts, particularly for: actual Stripe Connect payout reliability at scale, instant payout adoption rates, edge cases in cleaner Stripe Connect verification states, and ACH-vs-debit-card distribution. Treat this as an aggressive draft.

**Phase goal:** Every Friday at 12:00 PM Pacific, eligible cleaners receive accumulated balance via Stripe Connect payout. Instant payouts available 24/7 with 5% fee. Suspended cleaners' balances accumulate. Admin can preview Friday batch + manually trigger emergency payouts.

**Estimated duration:** ~2 weeks of focused engineering (10 working days).

**Depends on:**
- Phase 9a complete (cleaner balance ledger operational)
- Phase 4 Stripe Connect Express setup
- Phase 7a operational (cleaner suspension flag accessible)
- B5 schema deployed (`payouts`, `payout_line_items`)
- Phase 10a notification dispatcher operational

**Wireframes covered:** WF 6 (cleaner Friday payout summary), WF 6b (empty earnings state), WF 30 (Stripe Connect status).

**Phase 9b sub-sections (sequential):**

- **9b-1** — Friday payout cron (~5 days)
- **9b-2** — Instant payouts (~3 days)
- **9b-3** — Payout history + admin tools (~2 days)

---

## 0. External account prerequisites

Phase 9b has **no new vendors.** Stripe Connect already configured (Phase 4).

### 0.1 Verify Stripe Connect transfer permissions

Test before code:
- Create test cleaner Connect account (Express)
- Trigger `transfers/create` from platform → Connect account
- Verify funds in Connect dashboard
- Test failure modes: unverified, debit limit, currency mismatch

### 0.2 Verify Stripe Instant Payouts feature

Requires:
- Connect account verified
- Cleaner has eligible debit card (not ACH-only)

Detection at runtime: Stripe API returns capability `instant_payouts: 'active'` per Connect account.

### 0.3 Plan for Friday cron failure scenarios

- Stripe API outage → retry next Friday
- Individual cleaner failure → admin alert + manual review
- Platform balance insufficient → critical alert; pause until resolved

Don't ship Phase 9b without alerting set up.

---

## 1. Summary

Phase 9b is **the cleaner-payment heartbeat.** By the end:

1. Friday payout cron at 12:00 PM Pacific
2. Eligibility: verified Connect + clear background + balance ≥ $10 + not suspended
3. Cutoff: captures up to Thursday 11:59 PM Pacific
4. Stripe Connect transfer per cleaner; state machine `pending → in_transit → paid`
5. Instant payouts available 24/7 with 5% fee
6. Suspended cleaners' balances accumulate
7. Admin Friday preview at 11 AM
8. Cleaner payout history (WF 6) renders

What Phase 9b does NOT do:
- 1099 generation (Phase 9c)
- Year-end reconciliation (Phase 9c)
- Admin financial dashboard (Phase 9c)

---

## 2. Acceptance criteria

### 9b-1 Friday payout cron

- [ ] Cron `0 12 * * 5` Pacific
- [ ] Eligibility: Connect verified + background clear + balance ≥ $10 + not suspended
- [ ] Cutoff: balance through Thursday 11:59:59 PM Pacific
- [ ] Stripe `transfers/create` per cleaner
- [ ] On success: `payouts` row state = `pending`; webhook → `in_transit` → `paid`
- [ ] On failure: state = `failed`; admin alert + cleaner notification
- [ ] `payout_line_items` rows (one per ledger event included)
- [ ] Phase 9a `payout_sent` ledger event (negative full amount)
- [ ] Cleaner notified: "$X paid to bank ending in ****1234"
- [ ] Cron runs reliably for 14 consecutive Fridays
- [ ] >95% per-cleaner success rate
- [ ] Suspended cleaner: balance accumulates
- [ ] $5 balance: skipped

### 9b-2 Instant payouts

- [ ] `/cleaner/payouts/instant` route
- [ ] Eligibility check via Stripe capability
- [ ] ACH-only cleaners: instant unavailable hint
- [ ] Fee transparency BEFORE confirmation: "$400 = $380 to account ($20 fee)"
- [ ] Stripe `payouts/create` with `method: 'instant'`
- [ ] On success: 2 ledger events (full amount + 5% fee, both negative)
- [ ] Platform revenue: `instant_payout_fee_collected` event
- [ ] Rate limit: max 1 per cleaner per 24 hours
- [ ] Cleaner notification

### 9b-3 Payout history + admin tools

- [ ] WF 6 cleaner earnings page renders history
- [ ] WF 6b empty state for $0 lifetime earners
- [ ] Admin Friday preview at 11 AM (1h before cron)
- [ ] Admin "Force payout now" button
- [ ] Admin can flag `payout_suspended` with reason

### Cross-cutting

- [ ] Coverage ≥85% (financial)
- [ ] Concurrency: advisory locks per cleaner_id
- [ ] Idempotency: webhook retries safe
- [ ] Audit: every payout has `payout_line_items`

---

## 3. Database state required

### Existing tables

- `payouts`, `payout_line_items` (B5)
- Phase 9a tables

### New migrations (Phase 9b)

```sql
-- Phase 9b migration

ALTER TABLE payouts
  ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'pending'
  CHECK (state IN ('pending', 'in_transit', 'paid', 'failed', 'cancelled'));
ALTER TABLE payouts
  ADD COLUMN IF NOT EXISTS payout_method TEXT NOT NULL DEFAULT 'friday_batch'
  CHECK (payout_method IN ('friday_batch', 'instant', 'admin_manual'));
ALTER TABLE payouts
  ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT UNIQUE;
ALTER TABLE payouts
  ADD COLUMN IF NOT EXISTS expected_arrival_at TIMESTAMPTZ;
ALTER TABLE payouts
  ADD COLUMN IF NOT EXISTS failure_reason TEXT;

CREATE TABLE instant_payout_rate_limits (
  cleaner_user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_instant_at TIMESTAMPTZ NOT NULL,
  count_24h INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE friday_payout_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preview_for_friday DATE NOT NULL,
  total_cleaners INTEGER NOT NULL,
  total_amount_cents INTEGER NOT NULL,
  preview_generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cron_executed_at TIMESTAMPTZ
);

CREATE TABLE payout_cron_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cron_type TEXT NOT NULL CHECK (cron_type IN ('friday_batch', 'instant_processor')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cleaner_count_total INTEGER,
  cleaner_count_success INTEGER,
  cleaner_count_failed INTEGER,
  total_amount_cents INTEGER,
  errors JSONB DEFAULT '[]'::JSONB
);
```

### RLS policies

```sql
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY payouts_cleaner_own ON payouts
  FOR SELECT USING (
    cleaner_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

ALTER TABLE payout_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY payout_lines_cleaner ON payout_line_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM payouts p
      WHERE p.id = payout_line_items.payout_id
      AND p.cleaner_user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

ALTER TABLE friday_payout_previews ENABLE ROW LEVEL SECURITY;
CREATE POLICY friday_previews_admin ON friday_payout_previews
  FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
```

---

## 4. Files to create

### App routes (~3)
- `/app/cleaner/earnings/page.tsx` — WF 6 / WF 6b
- `/app/cleaner/payouts/instant/page.tsx`
- `/app/admin/friday-preview/page.tsx`

### Components — Cleaner (~5)
- `PayoutHistoryList`, `PayoutRow`, `EmptyEarningsState`, `InstantPayoutForm`, `InstantPayoutEligibilityCheck`

### Components — Admin (~3)
- `FridayBatchPreview`, `ForcePayoutButton`, `PayoutSuspensionToggle`

### Library code (~7)
- `lib/payouts/eligibility_checker.ts`
- `lib/payouts/stripe_payout_caller.ts`
- `lib/payouts/payout_recorder.ts`
- `lib/payouts/instant_payout_processor.ts`
- `lib/payouts/cron_concurrency_lock.ts`
- `lib/payouts/payout_failure_handler.ts`
- `lib/payouts/friday_preview_generator.ts`

### Server actions (~5)
- `/api/payouts/instant/request`
- `/api/payouts/[id]`
- `/api/admin/payouts/friday-preview`
- `/api/admin/payouts/force/[cleaner_id]`
- `/api/admin/payouts/suspend/[cleaner_id]`

### Background jobs (3)
- `jobs/friday_payout_cron.ts` — Friday 12 PM Pacific
- `jobs/friday_preview_generator_cron.ts` — Friday 11 AM Pacific
- `jobs/payout_status_webhook_handler.ts` — Stripe webhook handler

### Phase 9a + 10a integration

- Phase 9a: ledger events for `payout_sent`, `instant_payout_sent`, `instant_payout_fee`
- Phase 9a: platform revenue event for `instant_payout_fee_collected`
- Phase 10a: cleaner notifications

### Migration (1)
- `migrations/2026XXXXXX_phase_9b_schema.sql`

### Docs (3)
- (Phase 9 overview exists)
- `phase-9b-friday-payouts-spec.md` — this file
- `phase-9b-friday-payouts-walkthrough.md`

---

## 5. Implementation order

### 9b-1 — Friday cron (~5 days)

**Day 1** — Schema + eligibility checker
**Day 2** — Stripe transfer caller
**Day 3** — Payout recorder + ledger integration
**Day 4** — Cron handler + concurrency
**Day 5** — Webhook + state transitions

### 9b-2 — Instant payouts (~3 days)

**Day 6** — Instant processor
**Day 7** — Eligibility + UI
**Day 8** — Rate limit + closeout

### 9b-3 — History + admin (~2 days)

**Day 9** — WF 6 / WF 6b
**Day 10** — Admin tools + closeout

---

## 6. Specific gotchas

### A — Stripe webhook ordering
Webhook arrives before code commits. **Fix:** upsert by `stripe_transfer_id`.

### B — Friday is US holiday
Banking delays. **Fix:** cron still runs; Stripe handles holiday delays; document.

### C — Balance changes between preview and cron
Refund processes after preview. **Fix:** preview is "estimated"; cron computes fresh.

### D — Connect account verification expires
Re-verification required. **Fix:** eligibility check at cron time; skip + alert if unverified.

### E — Instant payout double-click
Two requests succeed; double fee. **Fix:** idempotency key on Stripe call.

### F — Suspended reinstatement timing
Massive accumulated balance dumps at once. **Fix:** admin alert when suspended balance >$1,000.

### G — ACH-only cleaner attempts instant
UI bug. **Fix:** server-side capability check.

### H — Cron starts before Thursday captures complete
Cutoff edge cases. **Fix:** precise SQL boundary; document.

---

## 7. Testing strategy

### Unit tests
- `eligibility_checker.ts`: each filter
- `instant_payout_processor.ts`: fee math + ledger events
- `cron_concurrency_lock.ts`: simultaneous run handling

### Integration tests
- Friday cron E2E with 5+ test cleaners
- Stripe Connect transfer success → webhook → state update
- Instant payout: $400 → $380 to debit + $20 platform revenue

### Manual QA
- Real Stripe test cleaners on staging
- Friday cron tested by Tuesday force-run mode
- Instant payout on real test debit card

---

## 8. Deployment plan

### Pre-deploy
- [ ] Migrations applied
- [ ] Phase 9a operational
- [ ] Stripe Connect production verified
- [ ] Alerting configured for cron failures

### Deployment order
1. Migrations
2. Library code
3. Cron jobs (preview-only mode for 1 Friday)
4. UI
5. Phase 10a notifications
6. Soft launch: 4 weeks (4 Friday cycles)

### Rollback
- Cron pause if bugs surface
- Don't roll back schema (audit)
- Failed payouts manually retried via admin force

---

## 9. Phase 9b → Phase 9c handoff

Phase 9b output ready for Phase 9c:
- `payouts` rows feed reconciliation
- `payout_sent` events tracked
- YTD earnings calculation can read from ledger

---

## 10. Open questions

1. Friday cron timezone for cleaners outside Pacific (Pacific only at SF launch)
2. Instant payout limit per day (1 per 24h sufficient)
3. Suspended balance maximum (alert at $1,000)

---

This spec is the canonical Phase 9b build reference. Walkthrough lives in `phase-9b-friday-payouts-walkthrough.md`.
