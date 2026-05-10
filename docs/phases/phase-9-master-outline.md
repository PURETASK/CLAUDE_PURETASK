# PureTask — Phase 9 Master Outline

**Purpose:** A single navigation document for everything in Phase 9 (money operations: refunds, payouts, taxes, reconciliation), organized by sub-phase. Goal / Design / Build / Verify format for each section.

**Status:** Outline-level navigation. Detailed acceptance criteria, specific code, and gotchas live in `phase-9a-spec.md` (and future per-sub-phase specs). The why-behind-every-decision lives in `phase-9a-explainer.md` (and future).

**Phase scope:** Phase 9 is **the platform's money infrastructure**. Every dollar flowing through PureTask — booking captures, commission splits, refunds, tips, payouts to cleaners, platform revenue — is tracked, reconciled, and reported. Cleaners get paid Fridays via Stripe Connect. Customers get refunds when disputes resolve in their favor. The IRS gets 1099s for cleaners earning over $600/year. The platform has a financial audit trail that survives any scrutiny.

**Phase duration estimate:** ~5 weeks of focused engineering across 3 sub-phases.

**Phase depends on:**
- Phase 6f payment capture flow operational (Phase 6f wires Stripe `payment_intent.captured` webhooks; Phase 9 consumes)
- Phase 7a commission engine operational (each capture stores its commission_rate snapshot)
- Phase 8a/b refund triggers operational (Phase 9 processes the actual refunds)
- B5 schema deployed (payment_methods, charges, refunds, commission_records, payouts, payout_line_items)
- Stripe Connect Express verified for cleaners (Phase 4)
- At least 5 cleaners with completed bookings producing real captured charges

**Wireframes covered by Phase 9:**

| Sub-phase | Primary wireframes | Theme |
|---|---|---|
| 9a | WF 6 (pricing display references), WF 23 (standalone tip flow), WF 62 (admin refund processing) | Refund engine + balance ledger + tips |
| 9b | WF 6 (cleaner Friday payout summary), WF 6b (empty earnings), WF 30 (Stripe Connect status), WF 50 (cleaner tour mentions) | Friday payouts + instant payouts |
| 9c | WF 30 (1099 status), WF 34 (tax info form already specced in Phase 4), admin financial dashboard | Tax + 1099 + reconciliation |

---

## Critical ordering note

**Phase 9a's refund engine is a hard dependency for Phase 8.** Phase 8a accepts customer-accepted partial refunds → Phase 9a processes them. Phase 8b admin Tier 2 partial/full refunds → Phase 9a processes them.

This means **Phase 9a should ship in parallel with or before Phase 8a** in actual build sequence, even though Phase 9 is conceptually "after" Phase 8 in the phase numbering.

Recommended actual build order:
1. Phase 7a (commission engine) — done
2. **Phase 9a (refund engine + balance ledger)** — ships before Phase 8a
3. Phase 8a (Tier 1 disputes)
4. Phase 8b (Tier 2 admin mediation)
5. Phase 9b (Friday payouts) — needs all above
6. Phase 8c (Tier 3) + Phase 9c (taxes) — can run parallel

---

## How to read this document

Each sub-phase has the four-heading format:
- **Goal** — what this sub-phase accomplishes in plain English
- **Design** — decisions to make before writing code
- **Build** — concrete files, components, migrations, integrations
- **Verify** — how you know it works

If a section doesn't list a Design step, that means decisions are settled in the schema or wireframes — just build to spec.

---

## Phase 9 sub-phase overview

| Sub-phase | Title | Estimated weeks | Critical dependencies |
|---|---|---|---|
| **9a** | Cleaner balance ledger + refund engine + platform revenue tracking | 1.5 | Phase 6f + 7a |
| **9b** | Friday payout cron + instant payouts | 2 | 9a + Phase 8 if refunds firing |
| **9c** | Tax + 1099 + reconciliation | 1.5 | 9b (year-end aggregation needs) |

**Critical ordering rule:** 9a must ship before 9b. 9a should also ship before/with Phase 8a. 9c is largely independent but easier with 9a/9b data flowing.

---

# Phase 9 — Lock-in decisions (must resolve before any sub-phase ships)

These nine decisions surfaced from wireframe deep dive + Phase 6/7/8 spec dependencies. Phase 9 spec **must** lock them before any money-impacting code ships.

## Lock 1 — Friday payout time

**Decision:** **Friday at 12:00 PM Pacific** (matches WF 50 "Every Friday at noon, automatically").

**Rationale:** Pacific noon = 9 AM Eastern = end of US morning. Cleaners across all US time zones see payouts in normal awake hours. Mid-day Friday gives time for resolution if payout fails.

**Action:** Cron schedule: `0 12 * * 5` Pacific. Runs once per week.

## Lock 2 — Friday payout cutoff window

**Decision:** Captures completed by **Thursday 11:59 PM Pacific** included in Friday payout. Captures Friday morning wait until next week's payout.

**Rationale:** 12-hour buffer between cutoff and payout cron run protects against captures still processing through Stripe.

**Action:** `payouts` query filters: `charge.captured_at <= [previous Thursday 23:59:59 PT]`. Charges captured Friday after cutoff stay in pending state for next week.

## Lock 3 — Instant payout fee

**Decision:** **5% fee** on instant payouts (matches WF 50 "Instant payout for 5%").

**Rationale:** Stripe's instant payout fee is ~1.5%; PureTask 5% covers cost + small platform margin + service expectations. Cleaners who need immediate cash pay the convenience cost.

**Action:** When cleaner triggers instant payout, deduct 5% from amount sent. Display clearly: "Instant payout of $400 = $380 to your account."

## Lock 4 — Minimum payout threshold

**Decision:** **$10 minimum** for Friday payout. Balances below $10 carry to next week.

**Rationale:** Stripe Connect has per-payout costs (small but real). Below $10, payout cost approaches payout amount — not worth processing.

**Action:** Friday cron filters: cleaners with balance < $10 → skip this week, accumulate.

## Lock 5 — 1099-NEC threshold

**Decision:** **$600 cumulative net earnings per calendar year** triggers 1099-NEC generation per IRS standard.

**Rationale:** IRS requirement for non-employee compensation. Stripe Connect handles 1099 generation; PureTask coordinates the trigger.

**Action:** Phase 9c reconciliation cron tracks year-to-date net earnings per cleaner. At $600 threshold: flag in Stripe; 1099 generated by Stripe at year-end.

## Lock 6 — Negative balance handling

**Decision:** Cleaner balance can go negative due to refund clawbacks. Negative balance is **carried forward across weeks** until offset by future earnings.

**Rationale:** Cleaner did the booking, customer disputed, full refund + cleaner clawback. Cleaner's earned amount might already have been paid out. Future earnings offset the deficit.

**Action:** `cleaner_balances` ledger supports negative values. No automatic collection from cleaner; balance offsets via future captures. If cleaner leaves platform with negative balance, write off (rare; admin discretion).

## Lock 7 — Stripe Connect type

**Decision:** **Stripe Connect Express** (already locked in Phase 4).

**Rationale:** Express handles tax forms, identity verification, ACH verification automatically. PureTask doesn't need to build these.

**Action:** No new decision; verify Phase 4 setup.

## Lock 8 — Refund Stripe action by tier

**Decision:** Map dispute outcomes to Stripe actions:

| Phase 8 outcome | Stripe action |
|---|---|
| Tier 1 cleaner-offered partial refund (pre-capture) | `payment_intent.cancel` partial — only if not yet captured |
| Tier 1 cleaner-offered partial refund (post-capture) | `charge.refund` partial |
| Tier 1 cleaner-offered full refund (pre-capture) | `payment_intent.cancel` (void) |
| Tier 1 cleaner-offered full refund (post-capture) | `charge.refund` full |
| Tier 2 admin partial | `charge.refund` partial + `cleaner_balance` deduction |
| Tier 2 admin full + strike | `charge.refund` full + `cleaner_balance` full clawback |
| Tier 2 goodwill credit | `charge.refund` partial + platform absorbs (no cleaner deduction) |
| Tier 3 insurance covered | `charge.refund` full + insurance reimburses platform separately |

**Rationale:** Stripe API has different methods for pre-capture vs post-capture refunds. Use the correct one per state.

**Action:** Phase 9a refund engine routes by combination of (refund_type, capture_state) → Stripe action.

## Lock 9 — Tip handling at refund

**Decision:** **Tips are NEVER refunded automatically when booking is refunded.** They follow customer's explicit decision in WF 23 standalone tip flow.

**Rationale:** Tip is a separate Stripe charge given voluntarily. Customer disputed the work? They can manually refund the tip via support. Auto-refunding tips creates confusion + potential customer-service complaints from cleaners ("they refunded my tip too?").

**Action:** Phase 9a refund engine does NOT touch tip charges when processing booking refunds. Tip refunds = manual admin action only.

---

# Phase 9a — Cleaner balance ledger + refund engine + platform revenue tracking (1.5 weeks)

**Phase 9a goal:** Every dollar in the system has a ledger entry. When a charge captures, cleaner balance increases by their share, platform revenue increases by booking fee + commission. When a refund processes, balances adjust appropriately. The 5 refund paths from Phase 8 lock-in all work end-to-end. Standalone tip flow (WF 23) processes tips as separate Stripe charges with 100% pass-through to cleaner.

**Phase 9a depends on:**
- Phase 6f payment capture firing webhooks
- Phase 7a commission engine storing commission_rate per `cleaner_payouts` row
- B5 schema deployed (charges, refunds, commission_records, payout_line_items)
- Stripe webhook handler operational

**Wireframes:** WF 6 (pricing display references — no UI work in 9a), WF 23 (standalone tip flow), WF 62 (admin refund processing).

**Sub-sections of 9a:**

## 9a-1 — Cleaner balance ledger

### Goal
A unified ledger of every money event affecting cleaner balance. Every event has a type, amount, related entity (charge / refund / payout / tip), timestamp. Balance computed as SUM(events). Source of truth for what cleaner is owed.

### Design

**Decisions to make:**

1. **Ledger pattern.** Append-only event log. Never mutate; only insert. Balance is computed: `SUM(amount_cents)`. This is standard double-entry accounting for marketplaces.

2. **Event types** (locked):
   - `charge_captured_cleaner_share` — positive amount; cleaner share of captured charge
   - `tip_received` — positive amount; 100% of tip
   - `refund_full_clawback` — negative amount; full cleaner share clawed back
   - `refund_partial_clawback` — negative amount; partial clawback
   - `payout_sent` — negative amount; balance moved out via Friday payout
   - `instant_payout_sent` — negative amount; balance moved out via instant
   - `instant_payout_fee` — negative amount; 5% fee on instant payout
   - `admin_manual_adjustment` — variable; rare admin intervention with reason + admin_id
   - `goodwill_credit` — positive amount; platform absorbs cost on cleaner's behalf

3. **Balance computation.** Pure SQL: `SELECT SUM(amount_cents) FROM cleaner_ledger_events WHERE cleaner_user_id = X`. Cache on `cleaner_profiles.balance_cents` (refreshed on event insert).

4. **Negative balances supported.** Per Lock 6.

5. **Currency.** Cents (integer) throughout. Never store dollars as decimals — floating point math = audit nightmares. B5 schema already enforces this.

### Build

- `cleaner_ledger_events` table (new — see schema section)
- `lib/payouts/ledger_writer.ts` — `recordLedgerEvent({...})` — single point for all inserts
- `lib/payouts/balance_calculator.ts` — pure function: events → current balance
- Trigger on insert: refresh `cleaner_profiles.balance_cents` cache

### Verify

- Captured charge: ledger entry inserted with positive cleaner share
- Tip: ledger entry with full tip amount
- Sum of events = current balance for any cleaner
- Balance cache stays consistent with computed sum

## 9a-2 — Refund engine

### Goal
The 5 refund paths from Phase 8 work end-to-end. Each path produces correct Stripe API call, correct ledger entries, correct customer + cleaner notifications.

### Design

1. **5 refund paths** (locked in master outline + Phase 8 Lock 7):

| Path | Customer | Cleaner balance | Platform |
|---|---|---|---|
| Tier 1 cleaner-offered (any %) | Receives refund | Deducted by cleaner share of refund | $9.99 booking fee retained |
| Tier 2 admin partial (default 50/50) | Receives partial refund | Deducted by share of partial | Absorbs other share |
| Tier 2 admin full + strike | Receives full refund | Fully clawed back | $9.99 booking fee retained |
| Tier 2 goodwill credit | Receives refund | Unaffected | Absorbs full cost |
| Tier 3 insurance covered | Receives full refund | Unaffected | Insurance reimburses separately |

2. **Refund-to-Stripe-action mapping** (Lock 8): pre-capture vs post-capture matters. Most disputes happen post-capture (after Phase 6f), so most refunds are `charge.refund`.

3. **Refund stored in `refunds` table** (B5). Already designed.

4. **Cleaner balance impact** via `cleaner_ledger_events` row with appropriate negative type.

5. **Platform revenue impact** via `platform_revenue_events` table (new):
   - Booking fee: always positive ($9.99 per booking, retained on refunds)
   - Commission: positive on capture, negative on refund-with-clawback (commission given back proportional to refund)
   - Goodwill absorption: negative event when platform eats refund cost

6. **Reason categorization.** B5 `refunds.reason` enum already covers categories.

### Build

- `lib/payouts/refund_processor.ts` — main orchestrator: takes (booking_id, refund_type, amount, admin_id) → executes Stripe + ledger + notifications
- `lib/payouts/stripe_refund_caller.ts` — handles pre-capture cancel vs post-capture refund logic
- `lib/payouts/cleaner_clawback.ts` — calculates clawback amount + creates ledger event
- `lib/payouts/platform_revenue_writer.ts` — inserts platform revenue event
- `platform_revenue_events` table (new — see schema)
- Webhook handler for `charge.refunded` confirmation

### Verify

- Tier 1 cleaner-offered 50% refund: Stripe partial refund executed; cleaner balance deducted by their share of 50%; customer gets $X back; platform keeps $9.99
- Tier 2 admin full + strike: Stripe full refund executed; cleaner balance fully clawed back; Phase 7a score event fires; customer gets full
- Tier 2 goodwill: Stripe refund executed; cleaner balance unaffected; platform_revenue_events shows absorption
- Webhook confirmations match expected outcomes

## 9a-3 — Standalone tip flow (WF 23)

### Goal
Customer post-completion (within 30 days) can tip a cleaner. Tip is a new Stripe charge separate from the booking. 100% pass-through to cleaner. WF 20 review prompt (Phase 6f) and WF 23 standalone (Phase 9a) both use this engine.

### Design

1. **Tip = separate Stripe PaymentIntent.** Independent of booking authorization. Captures immediately (no manual capture pattern).

2. **30-day window.** Customer can tip up to 30 days post-approval. After 30 days: tip flow disabled for that booking (rare; most tips happen at WF 20).

3. **Tip table** (new — not in B5):

```sql
CREATE TABLE tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  customer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  cleaner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  stripe_payment_intent_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('review_prompt', 'standalone_post_review')),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

4. **Cleaner balance impact.** Tip ledger event with `tip_received` type, positive full amount.

5. **No tip refunds via dispute** (Lock 9). Tips are voluntary; never automatically refunded.

### Build

- WF 23 route + UI components
- `lib/payouts/tip_processor.ts` — Stripe charge + ledger entry + cleaner notification
- `tips` table migration

### Verify

- Customer tips $10 → Stripe charges $10 → cleaner balance +$10 → cleaner gets push "Sarah K. tipped you $10"
- 30 days post-approval → tip flow disabled
- Tip refund: not possible automatically (admin action only)

## 9a-4 — Platform revenue tracking

### Goal
Every captured charge generates platform revenue events. Booking fee ($9.99 always), commission (varies by tier), tip handling (0% commission), refund-related adjustments. Admin financial dashboard reads from these events.

### Design

1. **`platform_revenue_events` table** (new):

```sql
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
  amount_cents INTEGER NOT NULL,  -- can be negative
  related_charge_id UUID REFERENCES charges(id) ON DELETE SET NULL,
  related_refund_id UUID REFERENCES refunds(id) ON DELETE SET NULL,
  related_payout_id UUID REFERENCES payouts(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_platform_revenue_event_type ON platform_revenue_events (event_type, occurred_at DESC);
CREATE INDEX idx_platform_revenue_charge ON platform_revenue_events (related_charge_id) WHERE related_charge_id IS NOT NULL;
```

2. **Per-event semantics:**
   - Capture: insert `booking_fee_collected` (+$9.99) AND `commission_collected` (+commission)
   - Full refund with clawback: insert `commission_returned_on_refund` (-commission)
   - Goodwill: insert `goodwill_absorbed` (negative; equals what platform paid)
   - Instant payout: insert `instant_payout_fee_collected` (+5% of payout)

3. **Daily aggregation cache.** Daily cron sums events by type → caches in `platform_revenue_daily` view or table for fast admin dashboard reads.

### Build

- `platform_revenue_events` table migration
- `lib/payouts/platform_revenue_writer.ts` — inserts events
- Phase 6f integration: revenue events fire on capture
- 9a-2 integration: revenue events fire on refund
- Daily aggregation cron

### Verify

- 10 bookings captured at varied tiers → revenue events match expected sum
- Refund of one booking → revenue events show negative commission return
- Daily cache reflects sum of events

---

# Phase 9b — Friday payout cron + instant payouts (2 weeks)

**Phase 9b goal:** Every Friday at noon Pacific, all eligible cleaners receive their accumulated balance via Stripe Connect payout. Instant payouts available 24/7 with 5% fee. Suspended cleaners (background check expired, etc.) have payouts held. Admin can preview Friday batch + manually trigger if needed.

**Wireframes:** WF 6 (cleaner Friday payout summary), WF 6b (empty earnings state), WF 30 (Stripe Connect status).

## 9b-1 — Friday payout cron

### Goal
Cron fires Friday 12:00 PM Pacific. Aggregates eligible cleaner balances. Issues Stripe Connect payouts. Records `payouts` rows + `payout_line_items` for audit. Notifies cleaners.

### Design

1. **Eligibility filter:**
   - `cleaner_profiles.stripe_connect_state = 'active'` (verified)
   - `cleaner_profiles.background_check.state = 'clear'` (per Phase 4 + Lock from WF 64)
   - Balance >= $10 minimum (Lock 4)
   - Not flagged for admin review

2. **Cutoff window:** captures up to Thursday 11:59 PM Pacific (Lock 2).

3. **Stripe Connect payout API call.** Each eligible cleaner gets one `transfers/create` call. PureTask Stripe account → cleaner's Connect account.

4. **`payouts` row inserted** per cleaner. State machine: `pending → in_transit → paid` (or `failed`).

5. **`payout_line_items` rows** detail what's in this payout. One per ledger event included.

6. **Cleaner balance updated.** `payout_sent` ledger event inserted with negative full balance amount.

7. **Notification on success:** "$X paid to your bank ending in ****1234. Should arrive in 1-2 business days."

8. **Notification on failure:** "Friday payout failed. Reason: [Stripe error]. We'll retry; contact support if needed."

9. **Concurrency.** Each cleaner is independent. Use advisory locks per cleaner_id to prevent double-payout if cron runs overlap.

### Build

- `jobs/friday_payout_cron.ts` — Friday 12 PM Pacific cron
- `lib/payouts/eligibility_checker.ts` — filters cleaners
- `lib/payouts/stripe_payout_caller.ts` — Stripe Connect transfer
- `lib/payouts/payout_recorder.ts` — inserts `payouts` + `payout_line_items` + ledger event
- Cleaner notification

### Verify

- Cron runs every Friday for 14 weeks; >95% success rate per cleaner
- Suspended cleaner: payout held; balance accumulates
- $5 balance: skipped, accumulates
- Payout failure: retried next Friday + admin alert

## 9b-2 — Instant payouts

### Goal
Cleaner can request instant payout of current balance any time. 5% fee deducted. Funds reach cleaner within minutes (Stripe instant) or 30 minutes (slower path).

### Design

1. **Eligibility:** Same as Friday + Stripe Instant Payouts feature enabled on cleaner's debit card. Some cleaners have only ACH; instant unavailable for them.

2. **Fee transparency.** Display BEFORE confirmation: "$400 instant payout = $380 to your account ($20 fee)."

3. **Stripe API.** Use `payouts/create` with `method: 'instant'`. Different from Friday's `transfers/create` because instant goes directly to debit card.

4. **Two ledger events:** `instant_payout_sent` (negative full amount) + `instant_payout_fee` (negative 5%). Net effect: balance -100%.

5. **Platform revenue.** `instant_payout_fee_collected` event for the 5%.

6. **Rate limit.** Max 1 instant payout per cleaner per 24 hours (anti-fraud).

### Build

- `/cleaner/payouts/instant` route + UI
- `lib/payouts/instant_payout_processor.ts`
- Rate limit check
- Stripe Instant Payouts API integration

### Verify

- $400 instant request → $380 to debit card → 5% platform revenue
- Second request within 24h → blocked
- ACH-only cleaner: instant option unavailable in UI

## 9b-3 — Payout history + admin tools

### Goal
Cleaners see their payout history (WF 6 already shows this; verify wired to Phase 9b data). Admin can preview Friday batch (WF 54 attention queue), manually trigger emergency payouts, mark cleaners suspended.

### Design

1. **Cleaner-side payout history.** Reads `payouts` + `payout_line_items` for `cleaner_user_id`.

2. **Admin Friday preview.** Friday batch generated to a "pending" state at 11 AM Pacific (1 hour before payout cron). Admin sees in WF 54 attention queue: "Friday payout review · X cleaners · $Y total · runs in 1 hour · Preview batch →"

3. **Admin manual trigger.** "Force payout now" admin button for emergency cases (e.g., Friday cron failed).

4. **Suspension flag.** Admin can mark cleaner `payout_suspended` with reason. Friday cron skips suspended cleaners.

### Build

- WF 6 cleaner earnings page (payout history)
- Admin Friday preview surface (extends WF 54)
- Admin manual payout trigger
- Suspension flagging UI

### Verify

- Cleaner sees full payout history
- Admin preview shows correct Friday batch
- Manual trigger works for individual cleaner
- Suspended cleaner: skipped + accumulates

---

# Phase 9c — Tax + 1099 + reconciliation (1.5 weeks)

**Phase 9c goal:** Year-to-date earnings tracked per cleaner. $600 threshold flagged. 1099-NEC generated by Stripe at year-end and delivered to cleaner. Admin financial dashboard shows platform revenue trends. Year-end reconciliation report ties out platform books.

**Wireframes:** WF 30 (1099 status), WF 34 (tax info form, already specced in Phase 4).

## 9c-1 — Year-to-date earnings tracker

### Goal
A daily cron computes year-to-date net earnings per cleaner. Surfaced in WF 30. Stripe coordinates 1099 generation when threshold hit.

### Design

1. **Daily cron** at 5 AM Pacific (after Friday payout completes).

2. **Calculation:** `SUM(cleaner_ledger_events.amount_cents WHERE created_at YEAR = current AND type IN ('charge_captured_cleaner_share', 'tip_received'))`. Refunds (`refund_*_clawback`) reduce; payouts (`payout_sent`) don't because they're balance movements not earnings.

3. **Cache on `cleaner_profiles.ytd_earnings_cents`** for fast read.

4. **Stripe 1099 trigger:** When YTD reaches $600, flag in Stripe Connect. Stripe generates 1099-NEC by January 31 of following year.

5. **Customer pays vs cleaner earns distinction.** Customer paid $125.99. Cleaner earned $103.36 (Top Performer commission + booking fee). Earnings are cleaner's, not customer's spend.

### Build

- `jobs/ytd_earnings_cron.ts`
- `lib/payouts/ytd_calculator.ts` — pure function
- Stripe Connect 1099 flag integration
- WF 30 1099 status display

### Verify

- Cleaner with $14,820 YTD earnings → cached value matches
- Cleaner crosses $600 mid-year → Stripe flagged
- Year-end: Stripe generates 1099 within 31 days

## 9c-2 — Admin financial dashboard

### Goal
Admin sees platform financial state at a glance. Daily/weekly/monthly revenue. Refund rates. Goodwill spend. Insurance claims. Cleaner payout totals.

### Design

1. **Reads from `platform_revenue_events`** (Phase 9a) and aggregations.

2. **Key metrics:**
   - Daily/weekly/monthly GMV
   - Daily/weekly/monthly platform revenue (booking fees + commissions - goodwill - refunds)
   - Refund rate (refunds / completed bookings)
   - Goodwill absorption total
   - Cleaner payout totals
   - Top earners + bottom performers

3. **Time-series visualizations.** 14-day, 30-day, 90-day, YTD views.

4. **Export to CSV.** Admin can download for accounting.

### Build

- `/admin/financial-dashboard` route
- Aggregation queries
- Time-series chart components
- CSV export endpoint

### Verify

- Numbers reconcile with `platform_revenue_events` sum
- Time-series renders correctly
- Export contains all events for selected period

## 9c-3 — Year-end reconciliation report

### Goal
At end of calendar year, generate report tying out: customer payments + tips - cleaner payouts - refunds - platform fees = $0 (must balance). Surface discrepancies for accounting investigation.

### Design

1. **Triple-entry reconciliation:**
   - Customer side: SUM(charges.amount) + SUM(tips.amount) - SUM(refunds.amount) = X
   - Cleaner side: SUM(cleaner_ledger_events) = Y
   - Platform side: SUM(platform_revenue_events) = Z
   - Identity: X - Y = Z (within rounding tolerance)

2. **Stripe reconciliation.** Compare to Stripe's own monthly reports. Surface any discrepancies.

3. **Admin review.** Discrepancies > $100 flagged for manual investigation.

### Build

- `jobs/year_end_reconciliation.ts` — annual cron Jan 31 of following year
- Reconciliation report PDF generator
- Admin discrepancy review interface

### Verify

- Test reconciliation on Q4 staging data
- Force a discrepancy: verify flagging works
- Stripe report comparison

---

# Phase 9 verification + closeout (Phase 9d)

### Acceptance criteria

- [ ] Cleaner balance ledger captures every money event with no gaps
- [ ] All 5 refund paths execute correctly with right Stripe calls
- [ ] Standalone tip flow (WF 23) works post-completion
- [ ] Friday payout cron runs successfully for 14 consecutive weeks
- [ ] Instant payouts work with 5% fee deducted
- [ ] $600 threshold triggers 1099 flag
- [ ] Admin financial dashboard renders correct numbers
- [ ] Year-end reconciliation balances within rounding tolerance
- [ ] Suspended cleaners' payouts held correctly
- [ ] Customer + cleaner notifications fire on all money events

### Performance targets

- Friday payout cron 1000 cleaners: <10 minutes total
- Instant payout request: <5 seconds end-to-end
- Refund processing: <3 seconds end-to-end
- Admin financial dashboard load: <500ms p95

### Cross-phase impact

- Phase 6f payment captures now fire revenue events
- Phase 7a commission rates feed payout calculations
- Phase 8a/b refund triggers now process via Phase 9a engine
- Phase 4 Stripe Connect integration extends to Friday payouts

---

# Schema additions consolidated

```sql
-- Cleaner balance ledger (Phase 9a)
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
  related_tip_id UUID, -- references tips(id) but tips table created below
  related_payout_id UUID REFERENCES payouts(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  triggered_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ledger_cleaner_recent ON cleaner_ledger_events (cleaner_user_id, created_at DESC);
CREATE INDEX idx_ledger_event_type ON cleaner_ledger_events (event_type, created_at DESC);

-- Tips (Phase 9a)
CREATE TABLE tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  customer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  cleaner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  stripe_payment_intent_id TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL CHECK (source IN ('review_prompt', 'standalone_post_review')),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tips_cleaner ON tips (cleaner_user_id, paid_at DESC);
CREATE INDEX idx_tips_booking ON tips (booking_id);

-- Platform revenue events (Phase 9a)
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
  related_payout_id UUID REFERENCES payouts(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_platform_revenue_event_type ON platform_revenue_events (event_type, occurred_at DESC);

-- Cleaner profile additions
ALTER TABLE cleaner_profiles
  ADD COLUMN IF NOT EXISTS balance_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cleaner_profiles
  ADD COLUMN IF NOT EXISTS ytd_earnings_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cleaner_profiles
  ADD COLUMN IF NOT EXISTS payout_suspended BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE cleaner_profiles
  ADD COLUMN IF NOT EXISTS payout_suspended_reason TEXT;

-- Daily revenue aggregate cache (optional but useful for dashboard performance)
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
```

---

# Recommended build order

**Critical path adjustment:** Phase 9a should ship **with or before** Phase 8a (refund engine is dependency for disputes). Subsequent phases follow naturally.

1. **Phase 7a** (3 weeks) — done
2. **Phase 9a** (1.5 weeks) — refund engine + balance ledger. **Ship before/with Phase 8a.**
3. **Phase 8a** (3 weeks) — Tier 1 disputes
4. **Phase 8b** (1.5 weeks) — Tier 2 admin
5. **Phase 9b** (2 weeks) — Friday payouts
6. **Phase 8c** (1 week) — Tier 3
7. **Phase 9c** (1.5 weeks) — taxes + reconciliation
8. **Phase 9d** + **Phase 8d** verification

**Total Phase 9:** 5 weeks of focused work, but interleaved with Phase 8 (so wall time = ~7-8 weeks for Phase 8 + 9 combined).

This document is the canonical Phase 9 navigation reference. Detailed acceptance criteria + code structure live in per-sub-phase spec files. Plain-English walkthroughs live in per-sub-phase explainer files.
