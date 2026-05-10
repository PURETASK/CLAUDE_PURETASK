# Phase 10d — Plain-English Breakdown

This document walks through `phase-10d-tours-support-polish-spec.md` in plain English.

Phase 10d is **the final pre-launch polish.** Before Phase 10d, the platform works but feels rough — accessibility gaps, no onboarding hand-holding, support unclear, performance not verified. After Phase 10d, polish layer applied: tours teach new users, support routes by urgency, waitlist captures non-active markets, accessibility passes WCAG 2.1 AA, Lighthouse >90.

This is the phase that determines whether launch feels like beta or product. Skip Phase 10d → users feel friction. Ship Phase 10d → users feel cared for.

---

# Section 0 — External account prerequisites

## What it means in plain English

Four pre-launch items:
1. **Email aliases** (support, press, hello, legal)
2. **Accessibility tools** (axe DevTools, NVDA/VoiceOver, WAVE)
3. **Lighthouse CI** for performance monitoring
4. **Lawyer review** on emergency disclaimer

## Why emergency disclaimer needs lawyer

WF 47.3.3 emergency tier promises 1-hour SLA. Customer in actual emergency:
- 911 = right call (police/medical)
- PureTask = wrong call (we're not first responders)

Disclaimer must redirect to 911 explicitly. Without it: liability if customer expects emergency response from platform.

## Beginner traps

- **Don't ship support without lawyer-reviewed emergency copy.** Liability.
- **Don't skip Lighthouse CI.** Performance drift over time.

---

# Section 1 — Summary

## What it means in plain English

Eight things will work after Phase 10d:

1. Customer 3-panel tour (WF 48)
2. Cleaner 5-panel tour (WF 50)
3. 3-tier support routing (WF 47)
4. Tickets in admin queue
5. Waitlist signup with first-100 perks
6. WCAG 2.1 AA accessibility
7. Lighthouse >90
8. Animation polish

## Why "tours skippable + re-triggerable"

Forcing tours = user frustration. Skippable = autonomy.

But re-triggerable from settings matters: user skips, regrets, wants to see. Settings link enables.

## Why 3-tier support

Different urgency levels need different responses:
- **General** (24-48h) — "How do I cancel a booking?"
- **Booking issue** (4-12h) — "Cleaner didn't show up"
- **Emergency** (1h) — "Cleaner threatening me"

Same form for all = either over-prioritize trivial or under-prioritize urgent. Three tiers calibrate.

## Why first-100 perks

Early adopters drive word-of-mouth. $25 off first booking = small platform cost, big customer LTV impact.

Per-metro perk count creates urgency: "Only 12 spots left in Sacramento."

## Why accessibility is non-negotiable

Legal: ADA Title III applies to digital services. Settling lawsuits costs $50K-$250K each.
Ethical: 26% of US adults have a disability. Excluding them = excluding 1 in 4 customers.
SEO: Google penalizes inaccessible sites.
Quality: a11y improvements help all users.

## Beginner traps

- **Don't make tours mandatory.** Skippable.
- **Don't trust dev Lighthouse scores.** Production differs.
- **Don't defer a11y to "later."** Lawsuit exposure.

---

# Section 2 — Acceptance criteria

## What it means in plain English

Five groups: tours, support, waitlist, a11y, performance.

### Tours

WF 48 customer 3-panel + WF 50 cleaner 5-panel. Server-side state tracking (durable across logins).

### Support

3-tier routing with appropriate SLAs. Emergency tier triggers admin push within seconds.

Tickets in `support_tickets` table; admin queue at `/admin/support` (extends WF 54).

### Waitlist

Form: email + ZIP + service interest. First 100 per metro flagged for $25 off.

Email confirmation with position number. Active-metro transition triggers email blast.

### Accessibility

WCAG 2.1 AA achievable target (not AAA — AAA is aspirational).

Critical items:
- All forms with labels
- All images with alt text
- Color contrast 4.5:1
- Keyboard navigation
- Focus indicators
- Screen reader compatibility
- Skip-to-content links

### Performance

Lighthouse >90 on critical paths.

Core Web Vitals:
- LCP <2.5s
- FID <100ms
- CLS <0.1

### Cross-cutting

75% test coverage. Real device testing critical.

## Beginner traps

- **Don't aim for AAA.** AA sufficient + achievable.
- **Don't skip Core Web Vitals.** Google ranking factor.

---

# Section 3 — Database state required

## What it means in plain English

Phase 10d adds:
- Tour tracking columns on `customer_profiles` + `cleaner_profiles`
- Support ticket priority + SLA columns
- `waitlist_signups` table

### Why server-side tour tracking

Client-side state cleared on logout. User logs in on phone, sees tour again. Annoying.

Server-side state means tour shows once per user permanently (until they reset via settings).

## Beginner traps

- **Don't store tour state in localStorage.** Doesn't survive logout.
- **Don't UPDATE tour timestamps after first set.** Idempotent.

---

# Section 4 — Files to create

## What it means in plain English

~30 files plus accessibility audit work:
- 5 routes
- 11 components
- 6 library files
- 5 server actions
- 1 cron
- 1 migration
- A11y audit deliverables (touches every component from Phases 1-9)
- Performance optimization sweeps

### Why accessibility audit "touches every component"

A11y issues live everywhere:
- Missing labels in forms (Phase 5 search, Phase 6 booking)
- Missing alt text on images (cleaner photos, profile)
- Color contrast issues (theme colors)
- Keyboard traps (modals, dropdowns)

Audit scope = entire app. Day 6-7 budget tight; aggressive triage.

## Beginner traps

- **Don't try to fix every a11y issue.** Triage critical/important/minor.
- **Don't skip Phase 1-9 components in audit.** Most issues there.

---

# Section 5 — Implementation order

## What it means in plain English

8 days:
- Days 1-2: tours
- Days 3-4: support
- Day 5: waitlist
- Days 6-7: a11y
- Day 8: animation + performance

## Why a11y gets 2 days

Audit + critical fixes = 1 day. Manual screen reader testing + polish = 1 day. Tight but achievable with triage.

If audit reveals 200+ issues, defer minor to Phase 11+. Document deferred.

## Beginner traps

- **Don't underestimate a11y.** Real apps have 100+ issues.
- **Don't skip Day 8 final Lighthouse pass.** Last chance pre-launch.

---

# Section 6 — Specific gotchas

## What it means in plain English

8 gotchas:

### A — Tour every login
Client-side state. **Fix:** server-side tracking.

### B — Emergency tier abuse
Skip queue exploit. **Fix:** confirmation + admin downgrade.

### C — Waitlist email blast crash
5K synchronous emails. **Fix:** batch background job.

### D — A11y audit reveals 200+ issues
Day 6 insufficient. **Fix:** triage critical/important/minor; defer minor.

### E — Performance regression masked
Dev 95, prod 65. **Fix:** production Lighthouse with throttling.

### F — Tour overlays critical CTA
Can't tap "Find a cleaner." **Fix:** position-aware panels.

### G — Support gives false hope
Sunday 3 AM ticket. **Fix:** business hours SLA disclosure.

### H — Animation triggers motion sickness
Vestibular disorder users. **Fix:** prefers-reduced-motion respected.

## Why these matter

Phase 10d is final polish. Bugs here = launch-day issues.

## Beginner traps

- **Don't trust dev environment performance.** Production differs.
- **Don't skip prefers-reduced-motion.** WCAG requirement.

---

# Section 7 — Testing strategy

Standard layers. **Real device testing critical.** iOS + Android Safari + Chrome.

Screen reader full-flow walkthrough essential.

## Beginner traps

- **Don't skip real device.** Simulator misses bugs.

---

# Section 8 — Deployment plan

Standard. **14-day soft launch monitoring.**

Pre-launch checklist (in spec) is comprehensive — verify each item before marketing announces launch.

---

# Section 9 — Launch readiness

After Phase 10d, **PureTask is launch-ready.**

The pre-launch checklist captures dependencies:
- All Phase 1-9 features functional
- All Phase 10 enhancements live
- All vendor relationships active (Stripe, background check, insurance)
- Admin team trained
- Crisis communication plan
- First metro selected
- First cohort cleaners onboarded
- Marketing assets ready

If any item not checked, don't launch.

---

# Section 10 — Open questions

1. Tour completion rate target (50%+ recommended)
2. SLA accuracy (real volume tunes)
3. First-100 perk distribution (per metro)
4. Animation library (CSS sufficient v1)
5. Mobile native app (defer)

---

# Notes on what comes next

Phase 10d closes the pre-launch build. After Phase 10d:
- Launch
- Phase 11+ post-launch features
- Continuous a11y improvements
- Performance optimization based on real users
- New features per customer feedback

Phase 10d is the last phase that protects launch quality. Don't rush.

---

This walkthrough is the Phase 10d learning document.
