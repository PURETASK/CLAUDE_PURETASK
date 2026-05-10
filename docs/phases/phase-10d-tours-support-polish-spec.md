# Phase 10d — Tours + Support + Polish + A11y Specification

> **Author note (transparency):** This spec is being written ahead of when Phase 10d will actually be built. The spec is correct as of the current date but will need a refresh when implementation actually starts, particularly for: actual tour completion rates after launch, support volume distribution across tiers, accessibility audit findings (specific to real codebase), and performance optimization opportunities revealed by real-data Lighthouse runs. Treat this as an aggressive draft.

**Phase goal:** Final pre-launch polish layer. Customer first-time tour (WF 48) and cleaner platform tour (WF 50) work + are skippable. Support contact + ticketing (WF 47) live with 3-tier SLA. Waitlist signup (WF 70) with first-100 perks ($25 off). WCAG 2.1 AA accessibility audit + fixes. Animation polish. Performance optimization (Lighthouse >90). Final pre-launch verification.

**Estimated duration:** ~1.5 weeks of focused engineering (8 working days).

**Depends on:**
- Phases 1-9 complete
- Phase 10b state components available
- Phase 10c help articles + FAQ available (or stubbed if Phase 10c deferred)
- All wireframe-driven UI screens functional

**Wireframes covered:** WF 47 (support contact), WF 48 (customer first-time tour), WF 50 (cleaner platform tour), WF 70 (waitlist + first-100 perks).

**Phase 10d sub-sections (parallel where possible):**

- **10d-1** — Tours (WF 48, 50) (~2 days)
- **10d-2** — Support contact + ticketing (WF 47) (~2 days)
- **10d-3** — Waitlist signup + first-100 perks (WF 70) (~1 day)
- **10d-4** — Accessibility audit + fixes (~2 days)
- **10d-5** — Animation polish + performance (~1 day)

---

## 0. External account prerequisites

### 0.1 Email aliases

Phase 10d requires:
- `support@puretask.co` — general inquiries
- `press@puretask.co` — press requests
- `hello@puretask.co` — partnership/business
- `legal@puretask.co` — formal legal correspondence

Set up before launch. Forward to admin team email.

### 0.2 Accessibility tooling

Pre-deploy install:
- **axe DevTools** — automated a11y testing
- **NVDA** (Windows) or **VoiceOver** (Mac) — manual screen reader testing
- **WAVE** — web accessibility evaluation tool

### 0.3 Performance monitoring

Lighthouse CI integration:
- Per-deploy automated Lighthouse runs
- Track core web vitals (LCP, FID, CLS)
- Alert on regression

### 0.4 Lawyer review on emergency disclaimer

WF 47.3.3 emergency 911 disclaimer requires lawyer review:
- "If you are in immediate physical danger, call 911"
- Liability framing (PureTask not emergency response)
- Don't ship support emergency tier without review.

---

## 1. Summary

Phase 10d is **the final pre-launch polish.** Concretely, by the end of Phase 10d:

1. **Customer first-time tour (WF 48)** runs on first dashboard visit. Skippable. Re-triggerable from settings.

2. **Cleaner platform tour (WF 50)** runs on first cleaner dashboard visit post-approval. 5 panels. Skippable.

3. **Support contact (WF 47)** with 3-tier routing: General (24-48h SLA) / Booking (4-12h SLA) / Emergency (1h SLA).

4. **Tickets created in `support_tickets`.** Admin queue extends WF 54.

5. **Waitlist signup (WF 70)** with first-100 perks ($25 off).

6. **WCAG 2.1 AA accessibility achieved** across all customer/cleaner-facing routes.

7. **Lighthouse >90** on all critical paths.

8. **Animation polish** — page transitions, skeleton shimmer, micro-interactions consistent.

What Phase 10d does NOT do:
- Build new features (Phase 11+ post-launch)
- Translate to other languages (defer)
- Mobile native apps (web-first launch)

---

## 2. Acceptance criteria

### 10d-1 Tours

- [ ] WF 48 customer 3-panel tour renders on first `/dashboard` visit
- [ ] Tracks `customer_profiles.first_tour_completed_at` and `first_tour_skipped_at`
- [ ] WF 50 cleaner 5-panel tour renders on first cleaner dashboard post-approval
- [ ] Tracks `cleaner_profiles.platform_tour_completed_at` and `platform_tour_skipped_at`
- [ ] Both skippable; doesn't re-prompt in same session
- [ ] Settings → "Show tour again" link works
- [ ] Skip + complete handlers fire correctly

### 10d-2 Support contact (WF 47)

- [ ] `/contact` route with 3 tiered forms
- [ ] General tier: form + 24-48h SLA disclosure
- [ ] Booking issue tier: form + booking_id field + 4-12h SLA
- [ ] Emergency tier: form + 1h SLA + 911 disclaimer (lawyer-reviewed)
- [ ] Submit creates `support_tickets` row with priority
- [ ] Emergency tier triggers admin push notification within seconds
- [ ] Email aliases: support@, press@, hello@ configured + forwarding
- [ ] Admin support queue at `/admin/support` extends WF 54

### 10d-3 Waitlist (WF 70)

- [ ] `/waitlist` route accessible from non-active metros
- [ ] Form: email + ZIP + service interest
- [ ] Submit creates `waitlist_signups` row
- [ ] First 100 signups per metro flagged for $25 off perk
- [ ] Email confirmation: "You're #47 on Sacramento waitlist"
- [ ] Phase 5 metro state transition (waitlist → active) triggers waitlist email blast

### 10d-4 Accessibility audit

- [ ] All Phase 1-9 routes pass automated axe scan
- [ ] All forms have associated labels
- [ ] All images have alt text
- [ ] Color contrast WCAG AA (4.5:1 normal, 3:1 large)
- [ ] All interactive elements keyboard-accessible
- [ ] Focus indicators visible on all interactive elements
- [ ] Tab order logical
- [ ] Screen reader announces all dynamic state changes
- [ ] Skip-to-content link on all pages
- [ ] No keyboard traps

### 10d-5 Animation polish + performance

- [ ] Page transitions consistent across routes
- [ ] Skeleton shimmer animation smooth
- [ ] Micro-interactions (button presses, hovers, focus) consistent
- [ ] Lighthouse Performance >90 on critical paths (dashboard, search, booking flow)
- [ ] Lighthouse Accessibility >95
- [ ] Lighthouse Best Practices >90
- [ ] Lighthouse SEO >90 (post-Phase 10c)
- [ ] Largest Contentful Paint <2.5s
- [ ] First Input Delay <100ms
- [ ] Cumulative Layout Shift <0.1

### Cross-cutting

- [ ] All Phase 10d code has unit tests; coverage ≥75%
- [ ] Real device testing on iOS + Android Safari + Chrome
- [ ] Pre-launch verification across all critical paths

---

## 3. Database state required

### Existing tables

- `support_tickets` (B6 schema)
- `customer_profiles`, `cleaner_profiles` for tour tracking columns

### New migrations (Phase 10d)

```sql
-- Phase 10d migration

-- Tour tracking
ALTER TABLE customer_profiles
  ADD COLUMN IF NOT EXISTS first_tour_completed_at TIMESTAMPTZ;
ALTER TABLE customer_profiles
  ADD COLUMN IF NOT EXISTS first_tour_skipped_at TIMESTAMPTZ;

ALTER TABLE cleaner_profiles
  ADD COLUMN IF NOT EXISTS platform_tour_completed_at TIMESTAMPTZ;
ALTER TABLE cleaner_profiles
  ADD COLUMN IF NOT EXISTS platform_tour_skipped_at TIMESTAMPTZ;

-- Support tickets enhancements
ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'general'
  CHECK (priority IN ('general', 'booking_issue', 'emergency'));
ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS sla_response_at TIMESTAMPTZ;
ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS related_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;

-- Waitlist signups
CREATE TABLE waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  metro_slug TEXT,
  service_interest TEXT[],
  signup_position INTEGER NOT NULL,
  first_100_perk BOOLEAN NOT NULL DEFAULT FALSE,
  perk_redeemed_at TIMESTAMPTZ,
  signed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notified_active_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX idx_waitlist_email_metro ON waitlist_signups (email, metro_slug);
CREATE INDEX idx_waitlist_position ON waitlist_signups (metro_slug, signup_position);
```

### RLS policies

```sql
-- Waitlist: public insert; admin read
ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY waitlist_insert_anonymous ON waitlist_signups
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY waitlist_admin_read ON waitlist_signups
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
```

---

## 4. Files to create

### App routes (~5 files)

- `/app/contact/page.tsx` — WF 47
- `/app/waitlist/page.tsx` — WF 70
- `/app/admin/support/page.tsx` — admin support queue

### Components — Tours (~4 files)

- `/features/tours/components/CustomerTour.tsx` — WF 48 3-panel
- `/features/tours/components/CleanerTour.tsx` — WF 50 5-panel
- `/features/tours/components/TourPanel.tsx` — single panel UI
- `/features/tours/components/TourTriggerLogic.tsx` — first-visit detection

### Components — Support (~5 files)

- `/features/support/components/ContactTierSelector.tsx`
- `/features/support/components/GeneralSupportForm.tsx`
- `/features/support/components/BookingIssueForm.tsx`
- `/features/support/components/EmergencyForm.tsx`
- `/features/support/admin/SupportQueueList.tsx`

### Components — Waitlist (~2 files)

- `/features/waitlist/components/WaitlistSignupForm.tsx`
- `/features/waitlist/components/WaitlistConfirmation.tsx`

### Library code (~6 files)

- `/lib/tours/first_visit_detector.ts` — checks tour state
- `/lib/support/ticket_creator.ts` — inserts with priority
- `/lib/support/sla_calculator.ts` — per-tier SLA
- `/lib/waitlist/signup_processor.ts` — handles signup + perk assignment
- `/lib/waitlist/active_metro_blast.ts` — emails when waitlist→active
- `/lib/a11y/aria_helpers.ts` — common ARIA patterns

### Server actions (~5 files)

- `/app/api/support/ticket/route.ts` — POST ticket
- `/app/api/support/admin-queue/route.ts` — GET queue
- `/app/api/waitlist/signup/route.ts` — POST signup
- `/app/api/tours/complete/route.ts` — POST tour completion
- `/app/api/tours/skip/route.ts` — POST tour skip

### Background jobs (~1 file)

- `/jobs/sla_breach_alert_cron.ts` — every 30 min during business hours

### Database migrations (1 file)

- `migrations/2026XXXXXX_phase_10d_schema.sql`

### Accessibility audit deliverables

- Audit report (issues + remediation)
- Fixes across Phase 1-9 routes (touches every component)

### Performance optimization sweeps

- Code splitting analysis
- Image optimization (Next.js Image component everywhere)
- Bundle analysis + tree shaking
- Critical CSS inlining

### Docs (3 files)

- (Phase 10 overview already exists)
- `phase-10d-tours-support-polish-spec.md` — this file
- `phase-10d-tours-support-polish-walkthrough.md`

---

## 5. Implementation order

### 10d-1 — Tours (~2 days)

**Day 1 — Customer tour (WF 48).** Build component + first-visit detection + skip/complete handlers.

**Day 2 — Cleaner tour (WF 50).** 5-panel tour. Settings re-trigger.

### 10d-2 — Support (~2 days)

**Day 3 — 3-tier support forms.** `/contact` route. Each form with appropriate fields.

**Day 4 — Admin support queue + SLA cron.** Extends WF 54. SLA breach alerts.

### 10d-3 — Waitlist (~1 day)

**Day 5 — Waitlist signup + perks + active blast.** WF 70. First-100 logic. Email blast on metro→active.

### 10d-4 — Accessibility (~2 days)

**Day 6 — Audit + critical fixes.** Run axe scan across all routes. Fix critical issues (color contrast, missing labels, keyboard traps).

**Day 7 — Manual screen reader testing + polish.** NVDA/VoiceOver verification. Tab order. Focus indicators.

### 10d-5 — Animation + performance (~1 day)

**Day 8 — Animation consistency + Lighthouse pass.** Page transitions. Lighthouse audit. Performance regression fixes. Final pre-launch verification.

---

## 6. Specific gotchas

### Gotcha A — Tour appears on every login

**The problem:** Tour state stored client-side. Cleared on logout. Re-renders next login.

**The fix:** Server-side tour state on profile columns. Login pulls from DB. Tour tracking is durable.

### Gotcha B — Emergency tier abuse

**The problem:** Customer uses "Emergency" tier for non-emergency to skip queue. Real emergencies get queued behind.

**The fix:** Emergency tier requires confirmation: "This is for immediate physical danger. Misuse may delay actual emergencies." UI gate. Admin can downgrade ticket priority post-review.

### Gotcha C — Waitlist email blast at scale

**The problem:** Sacramento waitlist 5,000 signups. Metro becomes active. Email blast tries to send 5,000 emails synchronously. Crash.

**The fix:** Email blast via batch background job. 100-email batches with 1-min delays. Phase 10a notification dispatcher handles.

### Gotcha D — A11y audit reveals hundreds of issues

**The problem:** axe scan returns 200+ issues across Phase 1-9. Day 6 budget insufficient.

**The fix:** Triage: critical (blocks usage) / important (degrades UX) / minor (cosmetic). Fix critical + important pre-launch. Defer minor to Phase 11+. Document deferred issues.

### Gotcha E — Performance regression masked by good local

**The problem:** Lighthouse score 95 on dev machine. Score 65 on real production. Different network + CPU.

**The fix:** Run Lighthouse on production deployment with throttled network + CPU (Lighthouse default settings). Don't trust dev numbers.

### Gotcha F — Tour conflicts with critical CTA

**The problem:** Customer's first dashboard visit shows tour. Tour overlay covers "Find a cleaner" button. Customer can't tap.

**The fix:** Tour panels position-aware. Don't overlay critical CTAs. Or skippable with prominent skip button.

### Gotcha G — Support form gives false hope

**The problem:** Customer submits support ticket Sunday 3 AM. Form says "We respond in 24-48h" implying Monday morning. Reality: it's a holiday weekend.

**The fix:** SLA disclosure mentions business days/hours. "We respond in 24-48 business hours." Plus expected response time per current queue depth (optional).

### Gotcha H — Animation triggers motion sickness

**The problem:** Page transitions with parallax effect. User with vestibular disorders gets dizzy.

**The fix:** `prefers-reduced-motion` media query respected. Animations reduce or disable when set. WCAG 2.3.3 requirement.

---

## 7. Testing strategy

### Unit tests
- Tour state transitions
- SLA calculator per tier
- Waitlist position numbering

### Integration tests
- Full tour completion flow
- Support ticket → admin queue
- Waitlist → active metro → email blast

### Manual QA
- Real device (iOS + Android) tour testing
- Screen reader full-flow walkthrough
- Lighthouse CI per critical path

---

## 8. Deployment plan

### Pre-deploy
- [ ] Email aliases configured + forwarding
- [ ] Accessibility audit complete (critical issues fixed)
- [ ] Lighthouse baselines met
- [ ] Lawyer-reviewed emergency disclaimer
- [ ] Migrations applied

### Deployment order
1. Migrations
2. Library code
3. Tours (low risk; new code)
4. Support routes
5. Waitlist
6. A11y fixes (touches existing code; deploy carefully)
7. Final Lighthouse verification
8. Soft launch: 14 days monitoring

### Rollback
- A11y fixes are mostly low-risk; rollback rarely needed
- Email aliases independent
- Tours additive

---

## 9. Phase 10d → Launch

After Phase 10d, **PureTask is launch-ready.** All wireframes implemented. All systems integrated. Performance + accessibility verified.

Final pre-launch checklist:
- [ ] All Phase 1-9 features functional
- [ ] All Phase 10a-d enhancements live
- [ ] Lawyer reviews complete
- [ ] Stripe live mode verified
- [ ] Background check provider live
- [ ] Insurance partner agreement signed
- [ ] Admin team trained
- [ ] Crisis communication plan in place
- [ ] First metro selected (Sacramento)
- [ ] First 100 cleaners onboarded
- [ ] Marketing assets ready

---

## 10. Open questions

1. **Tour completion rate target.** Aim for 50%+ completion (skip rate <50%). Tune copy if low.
2. **Support tier SLA accuracy.** Real volume will tune. 24-48h general likely accurate; emergency 1h ambitious.
3. **First-100 perk distribution.** Per metro vs platform-wide? Per metro recommended.
4. **Animation library.** CSS animations sufficient? Add Framer Motion if needed.
5. **Mobile native app.** Web-first v1. Native apps Phase 11+.

---

This spec is the canonical Phase 10d build reference. Walkthrough lives in `phase-10d-tours-support-polish-walkthrough.md`.
