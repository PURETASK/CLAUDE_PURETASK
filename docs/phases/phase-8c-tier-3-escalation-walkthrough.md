# Phase 8c — Plain-English Breakdown

This document walks through `phase-8c-tier-3-escalation-spec.md` in plain English.

Phase 8c is **the severe-case escalation layer.** Most disputes resolve at Tier 1 (Phase 8a). Some escalate to admin mediation (Phase 8b). A small percentage involve damage over $500, theft, harassment, or safety incidents — these need insurance partners, legal review, or police coordination. Phase 8c handles them.

By volume, Phase 8c is the smallest dispute layer (likely <5% of disputes). By stakes, it's the highest. Mistakes here = legal exposure, insurance disputes, news coverage. Get it right by being conservative.

---

# Section 0 — External account prerequisites

## What it means in plain English

Phase 8c needs **two existing relationships:**

1. **Insurance partner** — must be signed before Phase 8c implementation starts. 4-8 week negotiation. Started during Phase 8a build.

2. **Legal counsel** — Phase 4 lawyer relationship continues. Confirm retainer covers Tier 3 scenarios.

No new vendor signups. Both relationships need to exist before code begins.

## Why "don't begin implementation without partner signed"

Insurance partner determines:
- What case package format they need
- Coverage scope and limits
- Premium structure
- Deductible
- Submission process

Code can't be written without partner spec. Without partner = stuck.

## Why "lawyer review of Tier 3 cases differs from earlier phases"

Earlier phases used lawyers for copy review. Tier 3 uses lawyer for **case-by-case counsel** — what action does this specific theft/safety/harassment case warrant?

Different relationship. More expensive per-case. Verify retainer covers.

## Beginner traps

- **Don't begin Phase 8c without insurance partner signed.** Stuck halfway through.
- **Don't conflate copy review lawyer with case review counsel.** Different services.

---

# Section 1 — Summary

## What it means in plain English

Seven things will work after Phase 8c:

1. Damage >$500 auto-flags Tier 3
2. Safety + theft auto-flag immediately
3. Manual flag from Tier 2 mediation
4. Insurance partner notified for damage claims
5. Legal review path for theft/safety
6. Anti-abuse dashboard
7. Phase 8 closeout verification

## Why "auto-flag at dispute opening for severe categories"

Don't wait for cleaner to ghost (Tier 1 escalation) or admin to escalate (Tier 2). Theft and safety are urgent. Skip Tier 1/2; go straight to Tier 3 the moment customer reports.

## Why insurance partner integration

Damage claims at scale = lawsuit risk if PureTask handles directly. Insurance partner:
- Has expertise in property damage assessment
- Has financial reserves to pay
- Provides legal protection (insurance defense)

Better than PureTask absorbing every damage claim from operating capital.

## Why legal review path

Theft, harassment, criminal matters = beyond admin scope. Counsel determines:
- Police should be involved? Customer or cleaner reports?
- Civil action recommended?
- Platform action only (account ban)?
- Revert to Tier 2 (no legal action)?

Admin executes counsel's recommendation.

## Why anti-abuse dashboard

Customers chronically disputing to extract refunds = abuse pattern. Cleaners with high dispute rates = quality issue. Both deserve attention.

Phase 8 Lock 8 thresholds: 30% customer / 20% cleaner. Daily cron computes; flags surface in admin queue.

## Beginner traps

- **Don't auto-act on anti-abuse flags.** Admin reviews; assesses; chooses action.
- **Don't fast-track Tier 3 for political pressure.** Process integrity over urgency.

---

# Section 2 — Acceptance criteria

## What it means in plain English

Four groups: triggers, insurance, legal, anti-abuse.

### Escalation triggers

Auto-flag rules:
- Damage >$500 (insurance threshold)
- Safety category (always)
- Theft category (always)
- Explicit "request legal review" (parties can ask)

Manual flag from Tier 2 mediation when admin discovers severity.

Tier 3 flag pauses Tier 2; doesn't replace.

### Insurance partner integration

Case package: structured PDF or email per partner spec. Contains all evidence: photos, statements, financial details, message history.

Partner response captured: covered/partial/denied + payout + reasoning.

Phase 9a path 5 processes payout.

### Legal review path

Counsel notified securely. Recommendations capture:
- Police involvement
- Civil action
- No action (revert to Tier 2)
- Platform action only

Confidentiality preserved. Counsel notes admin-only.

### Anti-abuse dashboard

Daily cron computes rates. WF 54 attention queue surfaces flagged accounts. Phase 8b mediation interface shows flag context.

Informational, not binding.

### Cross-cutting

75% test coverage. Lower than Phase 9a because Tier 3 logic is mostly orchestration, less novel math.

## Beginner traps

- **Don't auto-restrict flagged accounts.** Admin review.
- **Don't expose counsel notes via appeals.** RLS strict.

---

# Section 3 — Database state required

## What it means in plain English

One main new table: `dispute_tier_3_escalations`. Tracks insurance + legal flow per dispute.

Plus column additions on customer_profiles + cleaner_profiles for cached dispute rates (refreshed daily by cron).

### Why one combined table

Insurance and legal are different paths but same dispute. One row tracks both. JSONB for flexibility.

### Why daily cron for dispute rates

Computing on every read = expensive. Daily refresh = good enough for admin review.

## Beginner traps

- **Don't compute dispute rate on every dispute open.** Pre-compute daily.
- **Don't store legal notes in field readable by appeals admin.** RLS strict.

---

# Section 4 — Files to create

## What it means in plain English

~20 files. Smaller than Phase 8b because Tier 3 is rarer + more orchestrated.

### Why insurance + legal split

Different flows, different stakes:
- Insurance = structured process with partner SLA
- Legal = case-by-case counsel guidance

Different UX, different code.

## Beginner traps

- **Don't combine insurance + legal handling.** Different domains.
- **Don't auto-process insurance responses.** Admin captures manually.

---

# Section 5 — Implementation order

## What it means in plain English

5 days. Mostly sequential:
- Day 1-1.5: triggers
- Days 2-3: insurance
- Day 4: legal
- Day 4.5-5: anti-abuse + closeout

## Why insurance gets 2 days

Most complex Phase 8c work. Case package generation + Phase 9a integration + partner email + response capture = lots of moving parts.

## Beginner traps

- **Don't skip case package format validation with partner.** Test before code.

---

# Section 6 — Specific gotchas

## What it means in plain English

8 gotchas:

### A — Inflated damage claims
Customer wants Tier 3. **Fix:** insurance partner audits; admin reverts unjustified.

### B — Insurance timeline mismatch
4-6 weeks; cleaner balance frozen. **Fix:** clear expectations; freeze only disputed amount.

### C — Counsel notes leak via appeals
RLS bypass risk. **Fix:** strict RLS on legal_notes; separate admin view.

### D — Police procedural confusion
Who reports? **Fix:** locked protocol per counsel guidance.

### E — Anti-abuse false positives
Customer with legitimate complaints flagged. **Fix:** flag is review trigger, not auto-action.

### F — Insurance + cleaner negligence
Should cleaner pay back? **Fix:** policy lock per fault determination.

### G — Tier 3 case sits forever
SLA needed. **Fix:** 60-day SLA + best-judgment fallback.

### H — Flag affects future dispute fairness
Bias risk. **Fix:** flag informational; case-specific evidence drives decision.

## Why these matter

Tier 3 cases have legal exposure. Conservative approach.

## Beginner traps

- **Don't trust insurance partner timeline assumptions.** Verify SLA in writing.
- **Don't override counsel recommendations.** Document if doing so.

---

# Section 7 — Testing strategy

Standard layers. Real partner sandbox testing critical. Counsel notification template review pre-launch.

## Beginner traps

- **Don't skip end-to-end with real partner.** Format mismatches surface.

---

# Section 8 — Deployment plan

Standard. **30-day soft launch** (longer than other phases) — Tier 3 cases rare; takes 30 days to see typical patterns.

---

# Section 9 — Phase 8 closeout

Phase 8 complete after 8c:
- 8a: Tier 1 direct
- 8b: Tier 2 admin
- 8c: Tier 3 escalation

End-to-end scenarios verified.

---

# Section 10 — Open questions

1. Insurance partner selection (pre-launch)
2. Tier 3 SLA (60 days recommended)
3. Anti-abuse action thresholds (warning then restriction)
4. Cleaner negligence policy (clear fault = impact; accident = no)

---

# Notes on what comes next

Phase 8 done. Next: Phase 9b (Friday payouts) + Phase 9c (taxes).

Phase 8 is the hardest user-facing system to build right. Failure here = trust collapse. Success = differentiator.

---

This walkthrough is the Phase 8c learning document.
