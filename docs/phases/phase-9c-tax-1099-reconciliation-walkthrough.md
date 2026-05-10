# Phase 9c — Plain-English Breakdown

This document walks through `phase-9c-tax-1099-reconciliation-spec.md` in plain English.

Phase 9c is **the platform's tax + financial reconciliation layer.** Before Phase 9c, money flows but no one's tracking the IRS-required totals or proving the books balance. After Phase 9c, every cleaner has cached YTD earnings + 1099 status, admin sees real-time financial dashboard, and year-end reconciliation proves customer side + cleaner side + platform side balance to $0.

This is the phase that makes PureTask audit-ready. Boring but essential.

---

# Section 0 — External account prerequisites

## What it means in plain English

**Stripe Connect handles 1099 generation.** Phase 9c just provides the YTD signal. PureTask doesn't print or mail 1099s.

Three pre-launch verifications:
1. Stripe 1099 feature enabled on platform account
2. Cleaner W-9 collection working via Stripe Express
3. Stripe delivers 1099 by January 31 (their commitment)

Lawyer review on tax disclaimer copy: "PureTask is not your tax advisor" + "Stripe delivers 1099" + "Consult tax professional."

## Why "Stripe handles 1099, not PureTask"

Tax compliance is hard:
- IRS rule changes
- State variations
- W-9 collection
- Timely delivery
- Corrections

Stripe Connect provides this as service. Lean on it. Don't build your own tax engine.

## Beginner traps

- **Don't try to generate 1099s yourself.** Stripe handles.
- **Don't ship tax UI without lawyer disclaimer review.** Liability.

---

# Section 1 — Summary

## What it means in plain English

Seven things will work after Phase 9c:

1. YTD earnings cached daily per cleaner
2. $600 IRS threshold flagged in Stripe
3. WF 30 surfaces 1099 status
4. Admin financial dashboard with key metrics
5. Time-series visualizations
6. CSV export
7. Year-end triple-entry reconciliation

## Why "earnings != balance != customer paid"

Three different concepts:
- **Customer paid**: total customer charged ($125.99)
- **Cleaner earned**: cleaner's share post-commission ($103.36)
- **Cleaner balance**: earned minus already-paid-out

YTD tracks earned. Reconciliation tracks all three sides separately.

## Why "triple-entry reconciliation"

Customer side: charges + tips - refunds = X
Cleaner side: ledger events sum = Y
Platform side: revenue events sum = Z

Identity: X = Y + Z (within ±$1 rounding)

If books don't balance, there's a bug. Year-end report surfaces.

## Beginner traps

- **Don't conflate earnings with balance.** Different.
- **Don't skip reconciliation.** Auditors want this.

---

# Section 2 — Acceptance criteria

## What it means in plain English

Three groups: YTD, dashboard, reconciliation.

### YTD

Daily cron at 5 AM Pacific (after Friday payout completes).

Sums earning event types only:
- charge_captured_cleaner_share (positive)
- tip_received (positive)
- refund_*_clawback (negative — reduces earnings)

Excludes balance movements:
- payout_sent (not earnings; just balance moving out)
- instant_payout_fee (already covered by clawback math)

When YTD crosses $600: Stripe flagged sticky (doesn't unflag if YTD dips below).

Year boundary: Jan 1 0:00 Pacific resets.

### Admin dashboard

Reads from `platform_revenue_events` + daily aggregation cache.

Key metrics: GMV, platform revenue, refund rate, goodwill, payouts, top earners.

Time-series: 14d/30d/90d/YTD.

CSV export streaming (memory-safe).

### Year-end reconciliation

Annual cron January 31. Triple-entry calculation. Discrepancies >$100 flagged.

Stripe processing fees are separate line item (not platform revenue).

PDF report generated for admin + accountant.

### Cross-cutting

80% test coverage. Streaming CSV essential.

## Beginner traps

- **Don't include payout_sent in YTD calc.** Balance movement, not earnings.
- **Don't compute year-end reconciliation in real-time.** Batch annual.

---

# Section 3 — Database state required

## What it means in plain English

Phase 9a created revenue events + daily aggregation. Phase 9b created payouts. Phase 9c adds:
- `reconciliation_reports` (year-end summaries)
- `reconciliation_discrepancies` (line-item anomalies for investigation)
- 1099 status columns on `cleaner_profiles`

### Why dedicated reconciliation tables

Annual events. Investigation history. Auditors need access.

Don't conflate with monthly platform_revenue_daily — different cadence + purpose.

## Beginner traps

- **Don't compute reconciliation each load.** Cache the result.
- **Don't UPDATE reconciliation reports after generation.** Frozen audit record.

---

# Section 4 — Files to create

## What it means in plain English

~25 files:
- 3 cleaner-side components (YTD + 1099 status + disclaimer)
- 6 admin dashboard components
- 6 library files (YTD calc, threshold flagger, dashboard aggregator, CSV exporter, triple-entry, discrepancy detector)
- 4 server actions
- 3 crons (YTD daily, daily aggregator, annual reconciliation)

### Why streaming CSV exporter

90 days of events = potentially 100K rows. In-memory load = OOM.

Streaming: write rows as queried. Cursor pagination. Memory stays bounded regardless of export size.

## Beginner traps

- **Don't load full export into memory.** Streaming required.
- **Don't put dashboard queries in components.** Library aggregator.

---

# Section 5 — Implementation order

## What it means in plain English

8 days. Sequential within sub-phases:
- Days 1-2: YTD
- Days 3-5: dashboard
- Days 6-7: reconciliation
- Day 8: closeout

## Why dashboard gets 3 days

Most UI work in Phase 9c. Multiple charts, time-series toggle, CSV export. Each needs validation against actual data.

## Beginner traps

- **Don't skip Day 8 closeout.** Phase 9 has many integration points.

---

# Section 6 — Specific gotchas

## What it means in plain English

8 gotchas:

### A — Year boundary timezone
UTC vs Pacific. **Fix:** YTD uses Pacific year explicitly.

### B — 1099 flag stickiness
Crosses $600, then refund drops below. **Fix:** sticky once set.

### C — Reconciliation rounding
Cumulative cents math drift. **Fix:** ±$1 tolerance.

### D — Stripe fee drift
Stripe's 2.9% + $0.30 isn't platform revenue. **Fix:** separate line item.

### E — Bulk 1099 delivery
10K cleaners on Jan 31. **Fix:** trust Stripe; customer service path.

### F — Cleaner disputes 1099 amount
Mismatch with their records. **Fix:** investigate per-event; bug if YTD ≠ Stripe.

### G — Dashboard slow at scale
Millions of events. **Fix:** daily aggregation cache.

### H — CSV memory
100K rows. **Fix:** streaming.

## Why these matter

Tax mistakes = IRS audits. Reconciliation mistakes = accounting nightmare. Conservative approach.

## Beginner traps

- **Don't trust Stripe API responses without verifying.** Test 1099 flag actually fires.
- **Don't skip discrepancy investigation.** $5 today = $5K next year if pattern.

---

# Section 7 — Testing strategy

Standard layers. Synthetic data for triple-entry math testing critical (known answer = bug detection).

## Beginner traps

- **Don't test only on real data.** Synthetic data exposes math bugs.

---

# Section 8 — Deployment plan

Standard. **30-day soft launch** because year-end testing requires patience. First reconciliation cron runs on schedule.

---

# Section 9 — Phase 9 closeout

Phase 9 complete after 9c:
- 9a: refund engine + ledger + tips + revenue
- 9b: Friday payouts + instant
- 9c: tax + 1099 + reconciliation

End-to-end verified: customer pays → captured → ledger → revenue events → Friday payout → cleaner paid → YTD updated → year-end reconciliation balances.

---

# Section 10 — Open questions

1. State tax variations (federal v1)
2. Reconciliation report distribution (admin-only initially)
3. 1099 dispute resolution path (customer service)

---

# Notes on what comes next

Phase 9 done. Next: Phase 10b/c/d — final phases before launch.

Phase 9 is invisible to most users when working. Visible when broken. Get it right.

---

This walkthrough is the Phase 9c learning document.
