# Phase 9b — Plain-English Breakdown

This document walks through `phase-9b-friday-payouts-spec.md` in plain English.

Phase 9b is **the cleaner-payment heartbeat.** Before Phase 9b, captured charges accumulate in cleaner balance via Phase 9a's ledger but no money actually leaves PureTask's Stripe account. After Phase 9b, every Friday at noon Pacific the platform pays cleaners. Instant payouts available 24/7 for cleaners who need cash sooner.

This is the moment cleaners truly get paid. Without Phase 9b, the whole platform is theoretical from cleaner perspective. With it, the platform delivers on its core promise.

---

# Section 0 — External account prerequisites

## What it means in plain English

Phase 9b has **no new vendors.** Stripe Connect already configured (Phase 4). What Phase 9b exercises is the payout API.

### Why "verify Stripe Connect transfer permissions"

Test in Stripe test mode:
- Create test Connect account
- Trigger transfer
- Verify funds land in Connect dashboard
- Test failure modes

Bugs found in Stripe test mode are 100x cheaper than production.

### Why "verify Stripe Instant Payouts feature"

Not all Connect accounts are eligible for instant. ACH-only cleaners (older bank account types) only get standard ACH (1-2 business days). Eligible debit cards get instant.

Detection at runtime via Stripe capability flags.

### Why "plan for failure scenarios"

Friday cron = high-stakes recurring event. Failure modes:
- Stripe API outage Friday
- Individual cleaner Connect verification expired
- Platform balance insufficient for total payouts

Plan responses. Don't ship without alerting.

## Beginner traps

- **Don't deploy without alerting on cron failures.** Silent failures = cleaners not paid Friday.
- **Don't assume all cleaners eligible for instant.** Eligibility checked per-cleaner.

---

# Section 1 — Summary

## What it means in plain English

Eight things will work after Phase 9b:

1. Friday payout cron at 12:00 PM Pacific
2. Eligibility filter (Connect verified + background clear + balance ≥ $10 + not suspended)
3. Cutoff: captures up to Thursday 11:59 PM Pacific
4. Stripe Connect transfer with state machine
5. Instant payouts with 5% fee
6. Suspended cleaners' balances accumulate
7. Admin Friday preview at 11 AM
8. Cleaner payout history (WF 6) renders

## Why noon Pacific specifically

9 AM Eastern. End of US morning. Cleaners across all US time zones see payouts in awake hours. Mid-day Friday gives time for resolution if payout fails.

## Why $10 minimum threshold

Stripe per-payout costs (~$0.25). Below $10, payout cost approaches payout amount. Wait until next week.

## Why 5% instant fee

Stripe's instant cost ~1.5%. PureTask 5% covers cost + small platform margin + service expectations. Cleaners who need cash now pay convenience.

## Beginner traps

- **Don't allow $5 payouts.** Stripe fees eat them.
- **Don't process instant without eligibility check.** ACH-only cleaners get errors.

---

# Section 2 — Acceptance criteria

## What it means in plain English

Three groups: Friday cron, instant payouts, history + admin.

### Friday cron

The 95% per-cleaner success rate matters. 100% is unrealistic — some cleaners' Connect accounts will have transient issues. 95% is the bar.

Webhook state machine: `pending → in_transit → paid` (or `failed`). Each transition logged.

### Instant payouts

Fee transparency BEFORE confirmation is critical. Cleaner sees "$400 = $380 to your account" and decides explicitly. Without this, surprise fee = customer service ticket.

Rate limit prevents fraud. Compromised cleaner account can't drain via repeated instant requests.

### History + admin

WF 6 cleaner earnings page reads from `payouts` + `payout_line_items`. WF 6b empty state for cleaners with $0 lifetime.

Admin Friday preview at 11 AM (1h before cron) lets admin verify batch before it runs. Force payout button for emergencies.

### Cross-cutting

85% test coverage. Highest of any phase because financial.

Concurrency via advisory locks prevents double-payout if cron runs overlap. Critical safety.

## Beginner traps

- **Don't skip fee transparency.** Customer service nightmare.
- **Don't allow simultaneous cron runs.** Use advisory locks.

---

# Section 3 — Database state required

## What it means in plain English

B5 has `payouts` + `payout_line_items` already. Phase 9b adds:
- State machine on `payouts`
- `payout_method` enum (friday/instant/admin_manual)
- Stripe transfer ID linkage
- `instant_payout_rate_limits` (24h tracking)
- `friday_payout_previews` (admin tool)
- `payout_cron_executions` (audit log)

### Why separate rate limit table

Single source of truth. Don't try to compute "did this cleaner instant in last 24h?" by scanning `payouts` — slow at scale. Pre-computed table = fast lookup.

### Why cron execution log

When Friday cron fails, admin needs to know:
- Did it start?
- How many cleaners processed?
- How many failed?
- What were the errors?

Log captures. Without it, debugging is forensics.

## Beginner traps

- **Don't compute rate limit on every check.** Pre-computed table.
- **Don't skip cron execution log.** Debugging cost without it.

---

# Section 4 — Files to create

## What it means in plain English

~25 files. Spread:
- 3 routes
- 8 components (cleaner + admin sides)
- 7 library files
- 5 server actions
- 3 background jobs
- 1 migration

### Why 7 library files

Each does one thing:
- Eligibility checker
- Stripe transfer wrapper
- Payout recorder (database insert)
- Instant processor (different from Friday)
- Concurrency locks
- Failure handler
- Friday preview generator

Pure functions. Tested.

### Why 3 background jobs

- Friday cron at 12 PM
- Preview generator at 11 AM (before cron)
- Webhook handler (Stripe sends payout state updates)

Different cadences, different concerns.

## Beginner traps

- **Don't combine Friday + instant in one library file.** Different APIs.
- **Don't skip webhook handler.** State updates won't propagate.

---

# Section 5 — Implementation order

## What it means in plain English

10 days. Sequential:
- Days 1-5: Friday cron
- Days 6-8: Instant payouts
- Days 9-10: History + admin + closeout

## Why Friday cron gets 5 days

Most complex part of Phase 9b:
- Eligibility filtering (correct)
- Stripe transfer (handle failures)
- Database recording (audit trail)
- Concurrency (advisory locks)
- Webhook handling (state updates)

Each day = one piece.

## Beginner traps

- **Don't try to ship Friday + instant in parallel.** Sequential focus.
- **Don't skip webhook handler day.** State machine breaks.

---

# Section 6 — Specific gotchas

## What it means in plain English

8 gotchas:

### A — Webhook ordering
Webhook arrives before code commits. **Fix:** upsert by stripe_transfer_id.

### B — Friday is US holiday
Banking delays. **Fix:** cron runs; document expected delays.

### C — Balance changes between preview and cron
Refund processes after preview. **Fix:** preview is estimated.

### D — Connect verification expires
Re-verification required. **Fix:** eligibility check at cron time.

### E — Instant double-click
Two payouts. **Fix:** idempotency key.

### F — Suspended reinstatement
Massive accumulated payout. **Fix:** admin alert at $1,000.

### G — ACH-only attempts instant
UI bug. **Fix:** server-side capability check.

### H — Cron before Thursday captures complete
Cutoff edge cases. **Fix:** precise SQL boundary.

## Why these matter

Phase 9b moves real money. Bugs are expensive.

## Beginner traps

- **Don't rely solely on UI for eligibility.** Server-side.
- **Don't ignore webhook ordering.** Stripe doesn't guarantee.

---

# Section 7 — Testing strategy

Standard layers. Manual force-trigger Tuesday in dev mode useful — don't wait for Friday.

## Beginner traps

- **Don't test only on Friday.** Force-run modes for development.

---

# Section 8 — Deployment plan

Standard. **4-week soft launch** (4 Friday cycles) — Phase 9b fires weekly, so 4 weeks of monitoring captures real patterns.

## Beginner traps

- **Don't shorten soft launch.** Friday-specific bugs hide.

---

# Section 9 — Handoff to Phase 9c

Phase 9b output for Phase 9c:
- `payouts` rows feed reconciliation
- `payout_sent` events tracked
- YTD earnings calc reads from ledger

---

# Section 10 — Open questions

1. Cleaner timezones (Pacific only at SF launch)
2. Instant limit (1 per 24h)
3. Suspended balance max ($1,000 alert)

---

# Notes on what comes next

Phase 9c (taxes + 1099 + reconciliation) — depends on 9b.

Phase 9b is the moment cleaners get paid. Get this right.

---

This walkthrough is the Phase 9b learning document.
