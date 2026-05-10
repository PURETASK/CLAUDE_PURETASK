# Phase 6f — Plain-English Breakdown

This document walks through `phase-6f-approve-pay-review-spec.md` in plain English.

Phase 6f is **the closing transaction layer.** Before Phase 6f, work is done but no money has moved — Phase 6a authorized the charge, Phase 6e delivered photos, but Stripe still holds the money in escrow. After Phase 6f, customer reviews work + approves, money captures, cleaner balance updates, review feeds Phase 7a score system, and the 48-hour dispute window opens.

This is the moment the platform "completes" a booking transaction. Every consumer marketplace gets this wrong somehow; PureTask aims to get it right via 24h auto-approval (no friction for happy customers) + 48h dispute window (real recourse for unhappy ones).

---

# Section 0 — External account prerequisites

## What it means in plain English

Phase 6f has **no new vendors.** Stripe is configured (Phase 4 + 6a). What Phase 6f exercises is **Stripe capture API** — the second half of the auth+capture pattern.

Verify in Stripe test mode before writing app code:
- Authorize charge → 7-day hold
- Capture full amount via API
- Verify capture appears in dashboard

## Why "no partial capture in 6f"

Phase 6a authorized full amount. Phase 6f captures full amount. Why not partial?

Partial capture would be: "We'll only charge half because customer disputed." But that's Phase 9a refund logic post-capture. Cleaner separation.

Phase 6f path: capture full → Phase 9a partial refund if disputed. Two-step is cleaner than capture partial.

## Beginner traps

- **Don't try to capture partial amounts in Phase 6f.** Capture full; refund post-capture if needed.
- **Don't skip Stripe webhook idempotency check.** Phase 9a's table handles; verify exists.

---

# Section 1 — Summary

## What it means in plain English

Seven things happen at the end of Phase 6f:

1. Customer manually approves at WF 10 → Stripe captures
2. 24h auto-approval cron handles silent approvals
3. Approval opens 48h dispute window
4. Review submission optional with star + traits
5. Tip prompt at WF 20 if 4+ stars
6. Standalone WF 23 tip flow accessible 30 days
7. Phase 7a + 9a + 10a integrations fire correctly

## Why 24h auto-approval

Most customers are happy. They forget to manually approve. Without auto-approval, cleaner balance never updates. Cleaner pissed.

24h is the right balance: enough time for unhappy customers to dispute; short enough that money flows promptly.

## Why review is optional

Forcing reviews = bad reviews. Customer in a hurry just gives 3 stars to escape the form. Optional reviews = customers who actually have something to say submit. Higher quality data.

## Why tip prompt only at 4+ stars

Tipping when work was bad = awkward. Tipping when work was great = natural. Lock the prompt to high ratings to reduce uncomfortable moments.

## Beginner traps

- **Don't gate approval on review.** Lose customers who don't want to review.
- **Don't show tip prompt at all ratings.** Awkward at 1-3 stars.

---

# Section 2 — Acceptance criteria

## What it means in plain English

Three groups: approval, review, tip.

### Approval

The Phase 9a integration matters most here. Capture fires:
- Cleaner ledger event (positive cleaner share)
- Platform revenue events (booking fee + commission)

Without these events, cleaner balance doesn't update. Without that, Friday payouts don't include this booking.

The 48h dispute window opens at approval. Phase 8a reads this column. Don't skip.

### Review

5★ = +1 score. 4★ = 0. 3★ = -1. 2★ = -3. 1★ = -5. Locked in Phase 7 master outline.

Trait tags feed Phase 7c specialty badges. Eco-friendly tag × 15+ reviews × cleaner self-listed eco = badge earned.

### Tip

100% pass-through. Industry differentiator. Most platforms take commission on tips (Lyft, DoorDash). PureTask doesn't.

30-day window for standalone tip. Customer remembers cleaner did great; tips later. Past 30 days = locked.

### Cross-cutting

80% test coverage. Higher than messaging (75%) because financial integration. Lower than 9a (85%) because 6f is mostly orchestration of existing engines.

## Beginner traps

- **Don't forget to set dispute window column.** Phase 8a reads.
- **Don't allow 5+ trait tags per review.** Inflation.
- **Don't process tips automatically on dispute.** Phase 9 Lock 9.

---

# Section 3 — Database state required

## What it means in plain English

Most schema exists in B2/B3/B5. Phase 6f adds:
- `reviews` (if not in B3 already; verify)
- `review_traits` (linkage)
- `bookings.dispute_window_expires_at`
- `bookings.approved_at`, `approved_via` (manual vs auto_24h)

The `approved_via` distinction matters for analytics: what % of bookings auto-approve vs manual? Indicates customer trust.

## Beginner traps

- **Don't set dispute window only on manual approval.** Auto-approval also opens window.
- **Don't update `bookings.captured_at` and `approved_at` separately.** Same transaction.

---

# Section 4 — Files to create

## What it means in plain English

~20 files. Split:
- 3 routes (approval, review, tip)
- 11 components
- 5 library files
- 5 server actions
- 1 cron

### Why component split

Approval, review, tip are different UIs with different data. Each gets its own component family.

### Why library files

Orchestration of capture + ledger + revenue + state transitions = lots of moving parts. Library code centralizes; server actions thin.

## Beginner traps

- **Don't put approval logic in components.** Library code.
- **Don't write the cron as a one-off.** Same pattern as score recalc cron.

---

# Section 5 — Implementation order

## What it means in plain English

8 days. Sequential:
- Days 1-3: approval (manual + auto)
- Days 4-5: review
- Days 6-7: tip (inline + standalone)
- Day 8: closeout

## Why this order

Approval must work before review (review post-approval). Review before tip (tip prompt at review).

Approval is the financial event; build with most care.

## Beginner traps

- **Don't build review before approval.** Dependencies.
- **Don't skip Day 8 E2E test.** Lots of integration points.

---

# Section 6 — Specific gotchas

## What it means in plain English

8 gotchas:

### A — Cleaner clocks out late
Auto-approval timer starts at clock-out. **Fix:** document expectation; consider late_clock_out event.

### B — Customer approves before photos done uploading
Partial photo render. **Fix:** WF 10 polls; approve disabled until all visible.

### C — Stripe authorization expired
7+ days passed. **Fix:** Phase 6a re-auth cron handles; manual ops path for edge.

### D — Review before approval
Inconsistent state. **Fix:** WF 20 only accessible post-approval.

### E — Trait tag inflation
All 11 tags every review. **Fix:** max 4 per review.

### F — Tip during dispute
Customer tips after disputing. **Fix:** disabled during open dispute.

### G — Customer expects tip refund on dispute
Per Lock 9, tips never auto-refund. **Fix:** customer support path.

### H — Review feels mandatory
Visual pressure. **Fix:** clear "Skip review" alongside submit.

## Why these matter

Phase 6f closes transactions. Bugs cost money + trust.

## Beginner traps

- **Don't trust UX assumptions.** Test with real customers if possible.

---

# Section 7 — Testing strategy

Standard layers. Real Stripe test mode E2E mandatory. Customer + cleaner devices in parallel matter.

## Beginner traps

- **Don't test in unit tests only.** Integration matters most.

---

# Section 8 — Deployment plan

Standard. Phase 9a + 7a must be operational before 6f ships.

---

# Section 9 — Handoff

Phase 6f output for:
- Phase 8a (dispute window column)
- Phase 9b (cleaner ledger populated)
- Phase 7c (review traits feed badges)

---

# Section 10 — Open questions

1. Review submission window (14 days)
2. Trait tag max (4)
3. Tip during dispute (disabled)

---

# Notes on what comes next

Phase 6g (recurring) — depends on 6f for charge mechanics.

After Phase 6g, Phase 6 fully complete.

---

This walkthrough is the Phase 6f learning document.
