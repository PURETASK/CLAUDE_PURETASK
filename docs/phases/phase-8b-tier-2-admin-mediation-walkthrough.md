# Phase 8b — Plain-English Breakdown

This document walks through `phase-8b-tier-2-admin-mediation-spec.md` in plain English.

Phase 8b is **the most consequential admin work in the platform.** Before Phase 8b, Tier 1 disputes either resolve cleanly or auto-escalate into nowhere. After Phase 8b, escalated disputes land on an admin's queue, and the admin renders the decision that determines: who gets refunded, how much, whether the cleaner takes a score hit, whether tier review fires.

Get this wrong and you have: cleaners striking-off the platform over unfair decisions; customers fleeing because disputes feel arbitrary; or both. Get it right and you have: a fair, fast, transparent dispute resolution system that builds trust on both sides.

---

# Section 0 — External account prerequisites

## What it means in plain English

Phase 8b has **no new vendors.** Extends Phase 4 admin tooling.

Lawyer-review on rationale templates matters because admin's text becomes visible to both parties. Bad wording = customer service incidents.

## Beginner traps

- **Don't ship admin tools without lawyer-reviewed templates.** Tone matters when explaining loss.
- **Don't conflate admin auth with regular auth.** RLS bypass is privileged.

---

# Section 1 — Summary

## What it means in plain English

Seven things will work after Phase 8b:

1. WF 56 admin queue with SLA prioritization
2. WF 57 mediation interface with full evidence
3. Three decision paths (cleaner stands / partial / full + strike)
4. Required rationale visible to both parties
5. Save draft for complex cases
6. Phase 9a refund engine processes outcomes
7. Tier 2 SLA tracking (12h business hours)

## Why "save draft"

Some disputes require external research:
- Calling cleaner for clarification
- Reviewing other bookings for context
- Consulting senior admin

Forcing decision in one sitting = bad decisions. Save draft enables thoughtful review.

## Why "rationale visible to both parties"

Transparency. If decision goes against cleaner, they deserve to know why. If goes against customer, same.

This pressure forces admin to write defensible decisions. Anonymous internal-only rationale = arbitrary feeling for parties.

## Why Phase 9a integration matters

Decision is just data without money movement. Phase 9a's 5 refund paths execute the actual financial outcome. Phase 8b orchestrates; Phase 9a executes.

## Beginner traps

- **Don't write rationale visible to parties without lawyer review.** Liability exposure.
- **Don't allow decisions without rationale.** Process integrity.
- **Don't skip draft save.** Admins under pressure make worse decisions.

---

# Section 2 — Acceptance criteria

## What it means in plain English

Three groups: list, mediation, SLA.

### List

SLA prioritization sorts by breach proximity. Closest-to-breach first. Admin always sees most urgent disputes top.

Customer reliability flag matters. If customer has 30%+ dispute rate over last 10 bookings (Phase 8 Lock 8), surface this. Helps admin spot abuse patterns.

### Mediation

Three decision options match Phase 8 Lock 6:
- Cleaner stands = no impact
- Partial = small impact
- Full + strike = severe impact

Custom partial percentage allowed. 0-100% slider plus dollar amount input. Admin discretion within Phase 9a refund engine path 2.

Required rationale 50-1000 chars. Visible to both parties.

Submit triggers atomic downstream:
- Refund (if applicable)
- Score event
- Notifications
- State transition
- Audit entry

All-or-nothing transaction. Don't ship partial state.

### SLA

12-hour business-hours rule (9 AM - 6 PM PT weekdays). Friday evening escalation pauses; resumes Monday 9 AM.

Pre-breach at 8h alerts admin. Breach at 12h escalates urgency.

### Cross-cutting

80% test coverage on financially consequential code.

## Beginner traps

- **Don't allow non-business-hours SLA timer.** Drift causes weekend false breaches.
- **Don't dispatch downstream actions before transaction commits.** Failed refund + sent notification = bad state.

---

# Section 3 — Database state required

## What it means in plain English

Phase 8a created `dispute_resolutions`. Phase 8b adds:
- Admin decision details (type, by, at, rationale, partial %, partial amount cents)
- `dispute_mediation_drafts` table (admin draft state)
- SLA tracking columns on disputes

### Why drafts in separate table

Cleaner separation. Drafts are admin scratch state. Resolutions are official record. Don't conflate.

Drafts also auto-clean after 7 days; resolutions persist forever.

## Beginner traps

- **Don't UPDATE dispute_resolutions for partial decisions.** New row per decision.
- **Don't store drafts on disputes table.** Cleanup complexity.

---

# Section 4 — Files to create

## What it means in plain English

~25 files. Heavy on admin UI (11 components).

### Why so many components

WF 57 has 7 distinct sections: header, parties, claim, photos, messages, decision, audit timeline. Plus list views.

Each gets its own component. Admin tooling is information-dense; small components keep it manageable.

### Why lib code

Decision orchestration + refund routing + score event firing + SLA math = lots of integration. Pure functions where possible.

## Beginner traps

- **Don't put orchestration in components.** Decision_processor.ts handles.
- **Don't compute SLA in UI.** Server-side; UI displays.

---

# Section 5 — Implementation order

## What it means in plain English

8 days. Sequential:
- Days 1-2: queue
- Days 3-6: mediation interface
- Day 7: SLA
- Day 8: closeout

## Why mediation gets 4 days

Most complex part of Phase 8b. Multiple data sources (parties, photos, messages, audit). Decision panel with form validation. Submit orchestration.

## Beginner traps

- **Don't rush mediation interface.** This is the highest-stakes admin screen in the platform.
- **Don't skip Day 8 E2E test.** Many integration points.

---

# Section 6 — Specific gotchas

## What it means in plain English

8 gotchas:

### A — Photo grid slow loads
13+ photos via signed URLs. **Fix:** lazy-load + skeletons.

### B — Custom partial refund cents rounding
Drift between admin display and Phase 9a. **Fix:** admin UI computes cents; submits cents only.

### C — Decision race with auto-escalation
Admin submits Tier 2 decision; meanwhile escalates to Tier 3. **Fix:** optimistic locking; reject if state changed.

### D — Rationale wording legal exposure
Admin types accusatory text. **Fix:** lawyer-reviewed templates + admin training.

### E — SLA with multi-day weekends + holidays
Memorial Day shifts SLA. **Fix:** business hours calendar with holidays.

### F — Draft survives admin sign-out
Admin B sees admin A's draft. **Fix:** RLS scopes by admin_user_id.

### G — Score event during quiet hours
4 AM cron + tier drop notification. **Fix:** critical category override Phase 10a quiet hours.

### H — Refund failure post-decision
Stripe error after decision recorded. **Fix:** transactional submission; rollback on failure.

## Why these matter

Phase 8b touches money + livelihoods + legal exposure. Bugs are expensive.

## Beginner traps

- **Don't trust Phase 9a to succeed.** Wrap in transaction.
- **Don't skip optimistic locking.** Race conditions surface here.

---

# Section 7 — Testing strategy

Standard layers. Real dispute E2E critical. SLA edge cases (weekends, holidays) need explicit tests.

## Beginner traps

- **Don't test SLA only on weekdays.** Weekend behavior matters.

---

# Section 8 — Deployment plan

Standard. **Soft launch 14 days** (longer than other phases). Sensitive admin work warrants extended monitoring.

---

# Section 9 — Handoff to Phase 8c

Phase 8b output for Phase 8c:
- "Escalate to Tier 3" button on mediation interface
- Auto-flagging logic on damage/safety/theft
- Pause Tier 2 mediation during Tier 3

---

# Section 10 — Open questions

1. Draft expiry (7 days recommended)
2. Multi-admin collaboration (lock during active mediation)
3. Decision reversal (no; escalate to senior admin)

---

# Notes on what comes next

Phase 8c (Tier 3 escalation + insurance + legal) — depends on Phase 8b mediation flow.

Phase 8b is the dispute system's heart. Get this right.

---

This walkthrough is the Phase 8b learning document.
