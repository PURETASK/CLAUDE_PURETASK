# Phase 9a — Plain-English Breakdown

This document walks through every section of `phase-9a-spec.md` and explains:
- What each thing means in plain English
- What needs to be designed (decisions to make)
- What needs to be built (actual files)
- Why each decision matters
- Beginner-trap warnings where they apply

Phase 9a is **the financial accounting backbone of PureTask.** Before Phase 9a, every dollar going through the platform exists somewhere (Stripe, the database) but isn't unified into a coherent ledger. After Phase 9a, every cent has a ledger entry, every captured charge has a revenue event, every refund has both. Cleaner balance is `SUM(events)`. Platform revenue is `SUM(revenue events)`. The math is auditable end to end.

**Critical to understand:** Phase 9a is a hard dependency for Phase 8a/8b. Recommended actual build order is Phase 9a → Phase 8a → Phase 8b → Phase 9b. Numbers in phase-X say "Phase 9 comes after Phase 8" but in real implementation, the refund engine ships first.

Read section by section.

---

# Section 0 — External account prerequisites

## What it means in plain English

Phase 9a has **no new vendors to set up.** Stripe is already configured (Phases 4 + 6). What you need is verification that Stripe APIs work for the specific operations Phase 9a exercises:

1. Partial refund on a captured charge
2. Full refund on a captured charge
3. Cancel an uncaptured PaymentIntent (= void)
4. Capture a partial amount of an authorized PaymentIntent (for pre-capture partial refunds — Stripe doesn't have direct "partial cancel," so the pattern is "capture what should be kept, refund the rest")
5. Webhook delivery on `charge.refunded` events

Run these tests against your Stripe test environment **before writing application code**. If any fail, fix Stripe first. Phase 9a debugging time vanishes when you have stripe-side confidence.

## Why this is much simpler than Phase 4

Phase 4 set up Stripe Connect, Checkr, lawyer engagement. Phase 9a builds on top. No new integrations. No vendor approvals. Just code.

## Beginner traps

- **Don't skip the pre-capture partial refund test.** Stripe's API for "I want to refund half of an uncaptured authorization" requires understanding "capture half, refund nothing, never capture the rest" — counterintuitive.
- **Don't forget to verify webhook signatures.** Phase 9a webhook handler must verify Stripe signatures on every request. Without this, attackers could fake refund webhooks.

---

# Section 1 — Summary

## What it means in plain English

The summary promises five things will work by end of Phase 9a:

1. **Every money event creates a `cleaner_ledger_events` row.** This is the source of truth for "what does cleaner X have in balance." Captures, refunds, tips, payouts, fees — all recorded with type and amount.

2. **Refund engine handles all 5 paths.** Tier 1 cleaner-offered partial/full, Tier 2 admin partial, Tier 2 admin full + strike, Tier 2 goodwill credit, Tier 3 insurance. Each routes correctly to Stripe + ledger + platform revenue + notifications.

3. **Standalone tip flow works.** Customer can tip up to 30 days post-approval via WF 23. Tips are separate Stripe charges with 100% pass-through to cleaner.

4. **Platform revenue tracked.** Booking fees + commissions on capture. Negative events on refunds + goodwill. Daily aggregation cache for fast admin dashboard reads.

5. **No UI for Phase 9a directly.** Phase 9a is the engine; Phase 8b admin tools render the UI; Phase 9c admin financial dashboard renders the dashboards.

## Why this is one sub-phase, not three

You might wonder why ledger, refund engine, tips, and revenue tracking are bundled. They're related because they all touch `cleaner_ledger_events` and `platform_revenue_events`. Splitting would create fragmented state. Bundling produces a coherent accounting layer.

## Why this matters

Phase 9a is the moment the platform becomes **financially auditable**. Before this, "we charged the customer $125.99 and the cleaner got $103.36" is true but exists in three different tables (charges, commission_records, payouts). After Phase 9a, the cleaner's balance is `SUM(cleaner_ledger_events)` — a single ledger that proves the money math.

This also matters legally. Tax forms (Phase 9c), reconciliation (Phase 9c), insurance partner (Phase 8c) all need clean audit trails. Phase 9a is what makes those trustworthy.

## Beginner traps

- **Don't skip ledger entries because "Stripe already tracks this."** Stripe is the source of truth for Stripe's view. Your ledger is the source of truth for your view. They reconcile but they're different sources. Both matter.
- **Don't confuse cleaner balance with Stripe balance.** Cleaner balance = what cleaner is owed. Stripe balance = platform's actual money in Stripe. Friday payouts move money from platform Stripe balance to cleaner Stripe Connect balance.

---

# Section 2 — Acceptance criteria

## What it means in plain English

Five groups of acceptance criteria. Don't ship until every box checks.

### Cleaner balance ledger

Every Phase 6f capture must insert a `charge_captured_cleaner_share` ledger event. Every Phase 9a refund must insert a `refund_*_clawback` event. Every Phase 9a tip must insert a `tip_received` event. Every Phase 9b payout (future) will insert a `payout_sent` event.

The cache on `cleaner_profiles.balance_cents` matters. Every time a ledger event inserts, the cache refreshes. Reading balance from cache is fast (1 query); reading via SUM is slower (scan ledger). Cache + sum-on-write pattern.

Negative balances supported. This is the unusual part. If a cleaner gets a full refund clawback after their balance was paid out Friday, balance goes negative. They earn it back over future captures.

### Refund engine

The 5 refund paths each have specific behavior. Test each path:
- Tier 1 cleaner-offered partial → customer refunded; cleaner balance reduced; platform keeps booking fee
- Tier 2 partial → 50/50 split (default) between cleaner and platform absorption
- Tier 2 full + strike → customer fully refunded; cleaner fully clawed back; Phase 7a fires score event
- Tier 2 goodwill → customer refunded; cleaner unaffected; platform absorbs
- Tier 3 insurance → customer fully refunded; cleaner unaffected; insurance partner reimburses platform separately (out of band)

Pre-capture vs post-capture matters because Stripe API differs. Most disputes happen post-capture (after Phase 6f), so most refunds use `charges.refunds.create`. Pre-capture cancel is rare — only if customer disputes within 24-hour approval window (rare; usually they just decline approval).

Webhook idempotency. Stripe retries webhooks if your handler returns non-2xx. Without idempotency, duplicate processing. Use `stripe_webhook_processed` table to dedupe.

### Standalone tip flow (WF 23)

The 30-day window is hard-coded. After 30 days, tip flow disabled. Most tips happen at WF 20 (review prompt) anyway; standalone is the safety net.

100% pass-through. No commission on tips. Customer tips $10; cleaner gets $10. Platform gets nothing on tips.

Tip refunds: not automatic. If customer disputes a booking that included a tip, the booking refund is automatic (per refund engine), but the tip refund requires admin action. Customer gets to decide if they want the tip back.

### Platform revenue tracking

Every capture creates 2 platform revenue events (booking fee + commission). Every refund with cleaner clawback creates 1 negative event (commission returned). Every goodwill creates 1 negative event (absorption).

Daily aggregation makes admin dashboard fast. Without aggregation, dashboard SUM queries scan all events; with cache, lookups are 1 row.

### Cross-cutting

85% test coverage on `lib/payouts/` because financial bugs cause real money harm. Higher than other phases.

Webhook signature verification is non-negotiable. Without it, attackers could fake refund webhooks and trigger ledger entries.

## Beginner traps

- **Don't trust Stripe webhooks to arrive in order.** Refund webhook can arrive before charge webhook. Idempotency + retry handles this; out-of-order without retry causes ledger gaps.
- **Don't process tips automatically when booking refunds.** Per Lock 9, tip refunds are admin-only. Customer might still want their tip to go through despite dispute.
- **Don't skip the 30-day tip window enforcement.** Without it, customer could tip 6 months later, cleaner forgets context, confusion ensues.

---

# Section 3 — Database state required

## What it means in plain English

You're adding **3 new tables** to support Phase 9a (`cleaner_ledger_events`, `tips`, `platform_revenue_events`) plus a daily cache table and a few columns on `cleaner_profiles`.

### `cleaner_ledger_events`

The heart of Phase 9a. Append-only. Every money event affecting cleaner balance is here. 9 event types cover the full vocabulary.

The event types matter. They're distinct because each represents a different financial flow:
- `charge_captured_cleaner_share` — cleaner earned this from a booking
- `tip_received` — cleaner got a tip
- `refund_full_clawback` / `refund_partial_clawback` — cleaner had to give back some/all earnings
- `payout_sent` — Friday cron paid out the balance
- `instant_payout_sent` / `instant_payout_fee` — instant payout split into amount + fee for clarity
- `admin_manual_adjustment` — admin intervention with reason
- `goodwill_credit` — platform gave cleaner credit (rare)

### `tips`

Separate table because tips are independent of bookings (separate Stripe charges, separate lifecycles). Tips reference the booking but aren't part of the booking's payment intent.

### `platform_revenue_events`

Source of truth for platform financial state. 6 event types covering: booking fees, commissions, refund returns, goodwill absorption, instant payout fees, admin adjustments. Admin financial dashboard reads from this.

### `platform_revenue_daily`

Cache table for performance. Daily cron sums events into this table. Admin dashboard reads from cache, not raw events. Without cache, dashboard load is slow at scale.

### `stripe_webhook_processed`

Idempotency table. Each Stripe webhook event has a unique `stripe_event_id`. Insert into this table on first processing; check before processing on subsequent events.

### Why RLS matters

RLS prevents:
- Cleaner reading another cleaner's balance
- Customer reading platform revenue
- Anyone except admin reading platform revenue

The pattern: RLS allows owning party + admin bypass. Standard. Don't ship without.

## Beginner traps

- **Don't store dollar amounts as decimals.** Cents only (integer). Floating point math = audit nightmares.
- **Don't UPDATE ledger events.** They're append-only. To correct an error, insert a correction event with reason + admin_id. Original event stays for audit.
- **Don't forget the cache invalidation.** If you forget to refresh `cleaner_profiles.balance_cents` after inserting a ledger event, balance reads return stale data.

---

# Section 4 — Files to create

## What it means in plain English

The spec lists ~20 files. Heavy on library code (~10 files) because Phase 9a is mostly accounting math. UI is light (~3 files for tip flow); admin UI lives in Phase 8b.

### Library code (~10 files)

The bulk of Phase 9a. **Pure functions where possible.**

- `ledger_writer.ts` — single point for all ledger inserts (centralized)
- `balance_calculator.ts` — pure function: events → balance
- `refund_processor.ts` — orchestrator for 5 refund paths
- `stripe_refund_caller.ts` — Stripe API wrapper for refunds
- `cleaner_clawback.ts` — calculates clawback amounts
- `platform_revenue_writer.ts` — inserts platform revenue events
- `tip_processor.ts` — Stripe charge + ledger + notification for tips
- `refund_path_resolver.ts` — pure function: (refund type, capture state) → action
- `balance_cache_refresher.ts` — keeps cache consistent
- `idempotency_check.ts` — webhook idempotency

### App routes (~2 files)

Just the tip flow + Stripe webhook handler.

### Components (~3 files)

Tip amount selector, payment confirm, confirmation. Small.

### Server actions (~3 files)

Process refund (called by Phase 8 dispute resolution), create tip, get cleaner balance.

### Phase 6f integration

Modify Phase 6f's payment capture handler to call Phase 9a's ledger writer + platform revenue writer. This is integration work, not new files.

### Phase 8 integration

Phase 8a/8b call `/api/refunds/process` endpoint. Phase 9a handles execution. Tight coupling between phases here.

## Why so much library code

Financial logic deserves pure-function isolation. Bugs in `cleaner_clawback.ts` cause real money mismatches. Pure functions = easy unit tests = catch bugs cheaply.

Components don't compute money. Server actions don't compute money. Library code computes money. Strict boundary.

## Beginner traps

- **Don't put refund logic in components.** It's ledger work. Library code only.
- **Don't write the webhook handler last.** Stripe webhook handling is the core of refund verification. Build it early, test it end to end.
- **Don't skip the idempotency check.** Stripe retries webhooks; without idempotency, duplicates corrupt the ledger.

---

# Section 5 — Implementation order

## What it means in plain English

8 working days. Sequential.

### Days 1-2: Cleaner balance ledger

Build the ledger writer + balance calculator first. Wire to Phase 6f capture. By end of Day 2, every capture creates a ledger entry.

### Days 3-5: Refund engine

Build refund path resolver, Stripe refund caller, refund processor, cleaner clawback. By end of Day 5, all 5 refund paths execute correctly with right Stripe + ledger entries.

### Day 6: Standalone tip flow

Build tip processor + WF 23 UI. By end of Day 6, customer can tip post-completion.

### Days 7-8: Platform revenue + closeout

Wire platform revenue events. Build daily aggregation cron. End-to-end testing.

## Why this order

Sequential because:
- Ledger must exist before refund engine inserts to it
- Refund engine must exist before tip flow (tip processor uses similar patterns)
- Platform revenue events must wire after refund engine (refund creates negative revenue events)

## Why some days might extend

Realistic time sinks:
- **Day 3 refund path resolver.** 5 paths × pre/post-capture states = 10 combinations to handle correctly. Test extensively.
- **Day 5 webhook handler.** Stripe webhook ordering, idempotency, signature verification all subtle.
- **Day 8 end-to-end.** Stripe + database + ledger + revenue all coordinated. Many integration points.

Build buffer.

## Beginner traps

- **Don't try to build ledger and refund engine in parallel.** Ledger is foundation; refund engine consumes ledger. Sequential.
- **Don't deploy webhook handler with `wide-open: true`.** Verify Stripe signatures every time.

---

# Section 6 — Specific gotchas

## What it means in plain English

The spec lists 8 gotchas. Real production issues.

### Gotcha A — Stripe webhook ordering not guaranteed

Refund webhook can arrive before charge webhook. **The fix:** idempotency + retry pattern. If dependent event missing, log + skip; Stripe retries; eventually consistent.

### Gotcha B — Partial refund cents rounding

Refund 25% of $125.99 = $31.4975. Round how? **The fix:** banker's rounding to nearest cent ($31.50). Document.

### Gotcha C — Refund of already-refunded charge

Stripe rejects if total refunds exceed charge amount. **The fix:** pre-check before Stripe call.

### Gotcha D — Cleaner balance race during concurrent events

Friday payout fires + new capture at same instant. **The fix:** SERIALIZABLE transactions for ledger writes; advisory locks per cleaner_id in Phase 9b.

### Gotcha E — Tip created before Phase 6f capture webhook

Customer tips immediately after approval; before charge webhook fires. **The fix:** tip is independent. Each ledger entry stands on its own. Phase 6f capture webhook later inserts capture entry. No coupling needed.

### Gotcha F — Customer double-clicks tip button

Two PaymentIntents created. **The fix:** idempotency key on PaymentIntent creation = hash of (customer_id, booking_id, 5-second-window).

### Gotcha G — Goodwill credit accounting

Where does the money come from? Platform's Stripe balance. **The fix:** `goodwill_absorbed` event reduces measured platform revenue. Stripe processes the refund using platform balance.

### Gotcha H — Refund timing display inconsistency

UI says "3 days"; reality is "5-10 business days." **The fix:** display "5-10 business days" consistently.

## Why these matter

Each gotcha, missed, surfaces as production financial bug. Read defensively.

## Beginner traps

- **Don't trust Stripe documentation about webhook ordering.** It says "may be out of order." Treat as definitely out of order.
- **Don't assume cents rounding doesn't matter.** Multiple roundings in cascading calculations can drift dollars.

---

# Section 7 — Testing strategy

## What it means in plain English

Three layers:

### Unit tests

Pure-function libraries. Refund path resolver: 10 combinations. Cleaner clawback: math + rounding edges. Balance calculator: mixed event types. Idempotency: webhook retry handling.

### Integration tests

Stripe + DB. Capture flows. Refund flows (each of 5 paths). Tip flow. Webhook retries.

### Manual QA

Real Stripe test environment. Concurrent operations. Time-mocked 30-day tip window.

## Beginner traps

- **Don't rely solely on unit tests for financial code.** Integration tests catch the real bugs.
- **Don't skip Stripe webhook retry tests.** This is where idempotency bugs hide.

---

# Section 8 — Deployment plan

## What it means in plain English

Pre-deploy, deployment order, rollback. Standard.

The unique-to-Phase-9a element: **don't roll back ledger entries.** Ledger integrity is critical. To correct an error post-deploy, insert correction ledger event with reason + admin_id. Don't UPDATE or DELETE rows.

Soft launch for 7 days. Monitor closely. Real money on the line.

## Beginner traps

- **Don't roll back schema migrations.** Forward-only.
- **Don't manually edit ledger rows in production.** Use admin tools that insert correction events.
- **Don't skip the 7-day soft launch.** Real money bugs surface in production volumes.

---

# Section 9 — Phase 9a → 8/9b/9c handoff

## What it means in plain English

Phase 9a output ready for:

- **Phase 8a (Tier 1 disputes)** — `/api/refunds/process` operational; Tier 1 cleaner-offered refunds flow
- **Phase 8b (Tier 2 admin)** — Tier 2 partial/full/goodwill refund paths tested
- **Phase 9b (Friday payouts)** — `cleaner_ledger_events` is balance source; payouts read + write
- **Phase 9c (taxes)** — `platform_revenue_events` is platform financial source; YTD earnings computable

## Why the decoupling

Phase 9a is intentionally engine-only. Surfaces (admin refund UI, financial dashboard, tip review prompt) live in other phases. This means:

- Phase 9a can ship and run without surfaces being built
- Surfaces can be built in any order
- Refactoring surfaces doesn't touch the engine

## What 9a doesn't do

- 9a doesn't render WF 62 admin refund UI (Phase 8b)
- 9a doesn't render financial dashboard (Phase 9c)
- 9a doesn't run Friday payout cron (9b)
- 9a doesn't generate 1099s (9c)

9a is engine; surfaces elsewhere.

---

# Section 10 — Open questions

## What it means in plain English

Three questions don't block 9a but should resolve before 9b/9c:

1. **Stripe Instant Payouts feature per cleaner.** Detect at runtime which cleaners have instant-eligible debit cards.
2. **Negative balance write-off threshold.** Cleaner leaves with -$200. Recommendation: 90 days.
3. **Year-end cutoff timing.** January 1 0:00 Pacific. Document explicitly.

## Why this is okay

9a is well-defined. Open questions affect 9b/9c, not 9a.

---

# Notes on what comes next

After Phase 9a:

- **Phase 8a/8b** (4-5 weeks combined) — disputes consume Phase 9a engine
- **Phase 9b** (2 weeks) — Friday payouts + instant payouts
- **Phase 9c** (1.5 weeks) — taxes + 1099 + reconciliation

Total Phase 9: 5 weeks of engineering. Phase 9a is the foundation; everything else builds on it.

After Phase 9:

- **Phase 10** (4 weeks) — notifications + polish + marketing pages

Phase 9 + Phase 10 together close out the platform's structural work. After Phase 10, the product is feature-complete; remaining work is iteration based on real user feedback.

---

This explainer is the canonical Phase 9a learning document. The spec (`phase-9a-spec.md`) is for execution; this is for understanding. The master outline (`phase-9-master-outline.md`) is for navigation across all of Phase 9.
