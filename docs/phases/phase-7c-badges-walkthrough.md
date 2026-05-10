# Phase 7c — Plain-English Breakdown

This document walks through `phase-7c-badges-spec.md` in plain English.

Phase 7c is **the recognition layer.** Before Phase 7c, cleaners can be excellent without any visible signal. After Phase 7c, sustained excellence earns visible badges that customers see when browsing — Top-rated in 94110, Eco-friendly, Customer favorite, etc. Badges drive customer trust + Phase 5 Match Score multipliers + cleaner motivation.

The two systems work in parallel:
- **ZIP-locked badges** = sustained local performance (geographic specificity)
- **Specialty badges** = customer-confirmed traits (capability differentiation)

Both rely on data accumulated by other phases. Phase 7c is the calculator + display layer.

---

# Section 0 — External account prerequisites

## What it means in plain English

Phase 7c has **no new vendors.** Two new daily crons. Verify Vercel Cron / pg_cron capacity.

## Beginner traps

- **Don't add crons without monitoring.** Silent cron failures = drift in badge state.

---

# Section 1 — Summary

## What it means in plain English

Six things will work after Phase 7c:

1. ZIP-locked badges (3 types) award via daily cron
2. Specialty badges (6 types) award via daily cron
3. Badge display priority logic
4. WF 65 + WF 66 detail pages
5. Phase 5 Match Score multipliers
6. 9 badge types locked; no mid-flight additions

## Why "9 types locked"

Each badge requires:
- Lawyer-reviewed copy
- UI design
- Threshold tuning
- Detail page content
- Admin support docs

Adding a 10th badge mid-launch = re-do all of the above. Lock the 9. Add via admin if needed Phase 11+.

## Why ZIP-locked vs specialty are different

ZIP-locked = local social proof. "She's the best in MY neighborhood" matters more than "she's good somewhere."

Specialty = capability match. Customer with cats → wants Pet-friendly cleaner. Customer moving out → wants Move-out specialist.

Both surface different signal. Both useful. Customers see both on cards.

## Why "decay rule"

Cleaner who EARNED Eco-friendly 6 months ago might not be Eco-friendly anymore. Maybe they switched products. Maybe customers stopped tagging.

90-day rolling window forces ongoing demonstration. Earn it; keep earning it. Otherwise badge fades.

## Beginner traps

- **Don't add custom badges easily.** Each is real work.
- **Don't skip decay logic.** Earned-once-forever badges meaningless.

---

# Section 2 — Acceptance criteria

## What it means in plain English

Three groups: ZIP, specialty, display.

### ZIP-locked

Three thresholds:
- **Top-rated**: 25 cleanings + 4.7 avg + active 90 days = aspirational
- **Trusted by neighbors**: 10 cleanings + 4.5 avg = entry-level
- **Customer favorite**: 5 active recurring = relationship-builder path

Each cleaner can have multiple ZIP-locked badges (one per active ZIP). Profile shows top 3.

6-month re-evaluation. Earn it; if criteria still met at 6 months, renew. If not, badge ends.

### Specialty

6 types: eco, pet, move-out, airbnb, allergen, on-time. Each requires:
- Cleaner self-listed in onboarding (Phase 4)
- 15+ customer trait tags from reviews

Both required. Cleaner self-claims aren't enough. Customer confirmation aren't enough. Both = badge.

90-day decay window enforces ongoing demonstration.

### Display integration

Cleaner card top 3 priority:
1. ZIP-matching badge (highest)
2. Specialty matching customer's service
3. General by recency

Profile (WF 7) shows ALL active badges. Grouped: ZIP first, specialty second.

Phase 5 Match Score multipliers:
- ZIP-matching: 1.5x
- Specialty matching service: 1.2x

Don't compound. Max single applies.

### Cross-cutting

80% test coverage. Cron reliability monitoring critical.

## Beginner traps

- **Don't display all badges on cleaner cards.** Top 3 only.
- **Don't compound multipliers.** Inflation kills usefulness.

---

# Section 3 — Database state required

## What it means in plain English

B4 has `badges` + `cleaner_badges` already. Phase 7c adds:
- `zip_code` column on `cleaner_badges` (for ZIP-locked variants)
- `expires_at`, `last_evaluated_at`, `qualifying_stats` (audit + display)
- `active` flag (suspended cleaners' badges marked inactive)

Plus seed data for 9 badge types.

### Why qualifying_stats JSONB

Detail page (WF 65, WF 66) shows cleaner's specific stats: "26 cleanings · 4.8 avg" or "16 customers tagged eco-friendly." Stored at evaluation time so detail page doesn't recompute.

## Beginner traps

- **Don't compute stats at display time.** Cache during eval.
- **Don't forget seed data.** Badge types must exist before crons evaluate.

---

# Section 4 — Files to create

## What it means in plain English

~15 files. Spread:
- 2 routes (detail page + API)
- 4 components
- 6 library files
- 2 server actions
- 2 crons
- 1 migration

### Why 6 library files

Each does one thing:
- ZIP calculator
- Specialty calculator
- Decay check
- Expiry handler
- Priority sorter
- Match Score multiplier

Pure functions. Testable.

## Beginner traps

- **Don't put eval logic in cron handlers.** Pure functions in lib/.
- **Don't share components between WF 65 and WF 66 prematurely.** Different content, different layout.

---

# Section 5 — Implementation order

## What it means in plain English

10 days. Sequential within each sub-phase:

### Days 1-4: ZIP-locked badges
Schema → calculator → cron → expiry handler

### Days 5-7: Specialty badges
Calculator → cron → decay logic

### Days 8-9: Display integration
Components → Phase 5 integration

### Day 10: Closeout

## Why ZIP-locked first

ZIP-locked has more types (3 vs 1 per evaluation pass). More logic. Build first; specialty patterns follow.

## Beginner traps

- **Don't build display before crons award badges.** No data to display.
- **Don't skip end-to-end test.** Match Score multiplier verification matters.

---

# Section 6 — Specific gotchas

## What it means in plain English

8 gotchas:

### A — Cleaner active in many ZIPs
8 ZIPs = overwhelming. **Fix:** top 3 only on profile.

### B — Specialty whiplash
Barely meets threshold; loses 1 tag; badge fades. **Fix:** 15-day buffer (decay at 105 not 90).

### C — New cleaner can't earn ZIP
Months to 25 cleanings. **Fix:** tiered approach (Trusted = 10, achievable).

### D — Recurring in different ZIP
Customer has two homes. **Fix:** counts in address ZIP per schedule.

### E — Slow eval on large cleaners
500+ bookings. **Fix:** cache metrics on cleaner_profiles.

### F — Multiplier compounding
1.5 × 1.2 = 1.8x. **Fix:** max single multiplier; don't compound.

### G — Eval during suspension
Awards badge to suspended cleaner. **Fix:** skip suspended cleaners.

### H — Trait inflation from Phase 6f
All tags every review. **Fix:** Phase 6f enforces max 4; Phase 7c trusts.

## Why these matter

Badges affect customer trust + Match Score + cleaner livelihood. Bugs cost real money.

## Beginner traps

- **Don't compound multipliers.** Verify Phase 5 integration takes max.
- **Don't skip suspension check.** Inappropriate badges = trust collapse.

---

# Section 7 — Testing strategy

Standard layers. Threshold edge cases (24/25/26) critical. Decay timing tests important.

## Beginner traps

- **Don't test only happy paths.** Threshold edges find bugs.

---

# Section 8 — Deployment plan

Standard. Seed data critical pre-deploy.

## Beginner traps

- **Don't run crons before seed data inserted.** Eval finds nothing; badges never awarded.

---

# Section 9 — Handoff

Phase 7c is largely terminal. Output consumed by Phase 5 + customer browsing.

Closes Phase 7 sub-phases.

---

# Section 10 — Open questions

1. Multiplier compounding (max single recommended)
2. Threshold values (re-evaluate post-launch)
3. Decay grace period (105 days recommended)
4. Custom badges (defer)

---

# Notes on what comes next

Phase 7 fully complete after 7c. Next: Phase 8 sub-phases (8b admin mediation, 8c Tier 3 escalation).

---

This walkthrough is the Phase 7c learning document.
