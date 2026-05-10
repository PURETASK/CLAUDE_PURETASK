# PureTask Build Spec Index

> **Purpose:** This is the navigation document for the entire PureTask build plan. Every phase, every sub-phase, every spec + walkthrough file is cataloged here with its scope, dependencies, and current status. When you start building (or return to a phase mid-build), this is the first document you open.

**Last updated:** May 9, 2026
**Total specs:** 32 sub-phase docs + 8 phase overviews + 2 superseded originals = 42 build planning files

---

## Quick orientation

The PureTask build is split into **10 phases**. Phases 1-2 are deployed (foundation + auth). Phases 3-10 cover the full product build.

Each phase that's complex enough is split into **sub-phases** (3a, 3b, 6a-g, 7a-c, 8a-c, 9a-c, 10a-d). Each sub-phase has two documents:

- **`-spec.md`** — the canonical implementation reference (acceptance criteria, schema, files to create, gotchas, deployment plan)
- **`-walkthrough.md`** — the plain-English learning document (why each section exists, beginner traps, what comes next)

**Build them in order.** Use the spec to implement, the walkthrough to understand.

---

## Recommended actual build order

This is the cross-phase dependency-aware order. Differs from sequential numerical order in two important places (Phase 9a comes before Phase 8b/c; Phase 10c may defer).

```
Phase 1 (deployed)
  ↓
Phase 2 (deployed)
  ↓
Phase 3a — customer foundation
  ↓
Phase 4 — cleaner onboarding
  ↓
Phase 5 — browse + discovery
  ↓
Phase 6a — booking creation
  ↓
Phase 9a — refund engine + ledger ← BEFORE Phase 8 because disputes need refunds
  ↓
Phase 6b → 6c → 6d → 6e → 6f → 6g (booking lifecycle continues)
  ↓
Phase 7a — score + tier engine
  ↓
Phase 8a — Tier 1 disputes
  ↓
Phase 7b → 7c (notifications/appeals + badges)
  ↓
Phase 8b — Tier 2 admin mediation
  ↓
Phase 9b — Friday payouts
  ↓
Phase 8c — Tier 3 escalation + insurance
  ↓
Phase 9c — tax + 1099 + reconciliation
  ↓
Phase 10a — notifications infrastructure
  ↓
Phase 3b — settings completion (small; can slot anywhere after 3a)
  ↓
Phase 10b — state component library
  ↓
Phase 10d — tours + support + a11y + polish
  ↓
Phase 10c — marketing pages + SEO (NOT BLOCKING for launch per Lock 9; can defer)
  ↓
LAUNCH
```

---

## Phase 3 — Customer foundation (deployed-ready before Phase 4)

**Status:** Phase 3a fully specced. Phase 3b fully specced. Original monolithic Phase 3 superseded by 3a/3b split.

| Doc | Path | Lines | Notes |
|---|---|---|---|
| Overview | `phase-3-overview.md` | — | Why Phase 3 exists |
| **3a Customer Foundation** | | | |
| Spec | `phase-3a-customer-foundation-spec.md` | — | Address mgmt, profile, dashboard skeleton |
| Walkthrough | `phase-3a-customer-foundation-walkthrough.md` | — | Plain-English |
| **3b Settings Completion** | | | |
| Spec | `phase-3b-settings-completion-spec.md` | — | 2FA, active sessions, CCPA tools |
| Walkthrough | `phase-3b-settings-completion-walkthrough.md` | — | Plain-English |
| **Superseded** | | | |
| Old spec | `phase-3-original-monolithic-spec-SUPERSEDED.md` | — | Pre-3a/3b split; do not use |
| Old walkthrough | `phase-3-original-monolithic-walkthrough-SUPERSEDED.md` | — | Pre-3a/3b split; do not use |

**Key locks:**
- Notifications subsumed by Phase 10a (don't build twice)
- Payments subsumed by Phase 6a (don't build twice)
- 2FA + active sessions = priority security
- CCPA tools required for California launch

---

## Phase 4 — Cleaner onboarding (single phase, no sub-phases)

**Status:** Fully specced as monolithic Phase 4 (large but cohesive).

| Doc | Path | Notes |
|---|---|---|
| Overview | `phase-4-overview.md` | Why Phase 4 exists |
| Spec | `phase-4-cleaner-onboarding-spec.md` | Application, Checkr background check, Stripe Connect Express, equipment verification, admin approval |
| Walkthrough | `phase-4-cleaner-onboarding-walkthrough.md` | Plain-English |

**Key locks:**
- Checkr partnership required pre-build
- Stripe Connect Express only (not Custom)
- W-9 collected via Stripe (avoids 1099 burden)
- Lawyer-reviewed application copy non-negotiable
- 5-7 day approval SLA target

**Critical pre-launch items:**
- Checkr account approved + sandbox + production tested
- Stripe Connect Express approved
- Lawyer review of application + ICA agreement

---

## Phase 5 — Browse + discovery (single phase, no sub-phases)

**Status:** Fully specced as monolithic Phase 5.

| Doc | Path | Notes |
|---|---|---|
| Overview | `phase-5-overview.md` | Why Phase 5 exists |
| Spec | `phase-5-browse-discovery-spec.md` | Cleaner cards, search, filters, ZIP-based service area, metro states |
| Walkthrough | `phase-5-browse-discovery-walkthrough.md` | Plain-English |

**Key locks:**
- ZIP-based service area (not radius-based) for v1
- Metro state machine: `waitlist → active → paused`
- Pre-launch metros excluded from SEO + sitemap
- Sacramento as first active metro

---

## Phase 6 — Booking lifecycle (7 sub-phases)

**Status:** ALL fully specced.

| Doc | Path | Notes |
|---|---|---|
| Overview | `phase-6-overview.md` | Why Phase 6 exists |
| **6a Booking Creation** | | |
| Spec | `phase-6a-booking-creation-spec.md` | Booking flow, Stripe authorize-only, slot reservation, conflict resolution |
| Walkthrough | `phase-6a-booking-creation-walkthrough.md` | Plain-English |
| **6b Messaging** | | |
| Spec | `phase-6b-messaging-spec.md` | Booking-scoped real-time messaging, append-only, supabase realtime |
| Walkthrough | `phase-6b-messaging-walkthrough.md` | Plain-English |
| **6c Availability** | | |
| Spec | `phase-6c-availability-spec.md` | Weekly rules + time-off + shared `getCleanerAvailability()` query |
| Walkthrough | `phase-6c-availability-walkthrough.md` | Plain-English |
| **6d GPS On-The-Way** | | |
| Spec | `phase-6d-gps-on-the-way-spec.md` | Mapbox ETA, 3-min pings, 100m geofence, pings stop at clock-in (privacy) |
| Walkthrough | `phase-6d-gps-on-the-way-walkthrough.md` | Plain-English |
| **6e Active Job Photos** | | |
| Spec | `phase-6e-active-job-photos-spec.md` | EXIF stripping, required rooms gate clock-out, 30-day retention |
| Walkthrough | `phase-6e-active-job-photos-walkthrough.md` | Plain-English |
| **6f Approve, Pay, Review** | | |
| Spec | `phase-6f-approve-pay-review-spec.md` | 24h auto-approval, Stripe capture, review flow, tip flow |
| Walkthrough | `phase-6f-approve-pay-review-walkthrough.md` | Plain-English |
| **6g Recurring Bookings** | | |
| Spec | `phase-6g-recurring-bookings-spec.md` | Schedule creation, daily instance gen, T-24h auth cron |
| Walkthrough | `phase-6g-recurring-bookings-walkthrough.md` | Plain-English |

**Key locks:**
- Stripe authorize-only at booking; capture at clock-out (Lock 1)
- 24h customer auto-approval window (Lock 2)
- GPS pings stop at clock-in for privacy (WF 64)
- EXIF stripping required on all photos (WF 64)
- 30-day photo retention (Lock 3)
- Recurring bookings NOT tier-gated (Phase 7 Lock 3 resolution)
- Mapbox 10x cheaper than Google ($11 vs $112/mo)

---

## Phase 7 — Reliability score + tiers (3 sub-phases)

**Status:** ALL fully specced.

| Doc | Path | Notes |
|---|---|---|
| Overview | `phase-7-overview.md` | Why Phase 7 exists |
| **7a Score + Tier Engine** | | |
| Spec | `phase-7a-score-tier-engine-spec.md` | Reliability events, daily tier eval cron, Bronze/Silver/Gold/Platinum tiers, immutable score history |
| Walkthrough | `phase-7a-score-tier-engine-walkthrough.md` | Plain-English |
| **7b Notifications + Appeals** | | |
| Spec | `phase-7b-notifications-appeals-spec.md` | 4-state WF 53 notifications, appeal flow with admin review, `is_overturned` integration |
| Walkthrough | `phase-7b-notifications-appeals-walkthrough.md` | Plain-English |
| **7c Badges** | | |
| Spec | `phase-7c-badges-spec.md` | ZIP-locked + Specialty badges, 6-month re-eval, 90-day decay, max single multiplier |
| Walkthrough | `phase-7c-badges-walkthrough.md` | Plain-English |

**Key locks:**
- Score 0-100 (not 1-5 stars)
- Tiers: Bronze (0-49) / Silver (50-69) / Gold (70-84) / Platinum (85-100)
- Multipliers don't compound (max single applies) — Lock 4
- Recurring bookings NOT gated by tier — Lock 3
- Appeal review: admin overturns event → `is_overturned = TRUE`

---

## Phase 8 — Disputes + safety (3 sub-phases)

**Status:** ALL fully specced.

| Doc | Path | Notes |
|---|---|---|
| Overview | `phase-8-overview.md` | Why Phase 8 exists |
| **8a Tier 1 Disputes** | | |
| Spec | `phase-8a-tier-1-disputes-spec.md` | Customer/cleaner direct resolution, dispute messaging, photo evidence |
| Walkthrough | `phase-8a-tier-1-disputes-walkthrough.md` | Plain-English |
| **8b Tier 2 Admin Mediation** | | |
| Spec | `phase-8b-tier-2-admin-mediation-spec.md` | WF 56 queue + WF 57 mediation, 3 decision options, required rationale |
| Walkthrough | `phase-8b-tier-2-admin-mediation-walkthrough.md` | Plain-English |
| **8c Tier 3 Escalation** | | |
| Spec | `phase-8c-tier-3-escalation-spec.md` | Insurance partner integration (>$500 damage), legal review path, anti-abuse dashboard |
| Walkthrough | `phase-8c-tier-3-escalation-walkthrough.md` | Plain-English |

**Key locks:**
- 3-tier system: customer/cleaner direct → admin mediation → insurance/legal
- 24h Tier 1 SLA; 12h business-hours Tier 2 SLA; 60-day Tier 3 SLA
- 3 admin decision options: cleaner stands / partial refund / full refund + strike (Lock 6)
- Custom partial refund % allowed (Phase 9a path 2)
- Required rationale 50-1000 chars visible to both parties (WF 57.7)
- 14-day soft launch on Phase 8b (sensitive admin work)
- 30-day soft launch on Phase 8c
- Insurance partner agreement REQUIRED before Phase 8c implementation begins (4-8 week negotiation)
- Counsel notes admin-only via strict RLS

---

## Phase 9 — Money + payouts (3 sub-phases)

**Status:** ALL fully specced.

| Doc | Path | Notes |
|---|---|---|
| Overview | `phase-9-overview.md` | Why Phase 9 exists |
| **9a Refund Engine + Ledger** | | |
| Spec | `phase-9a-refund-engine-ledger-spec.md` | 5 refund paths, cleaner ledger events, platform revenue events, tips |
| Walkthrough | `phase-9a-refund-engine-ledger-walkthrough.md` | Plain-English |
| **9b Friday Payouts** | | |
| Spec | `phase-9b-friday-payouts-spec.md` | Friday 12 PM PT cron, $10 minimum, instant payouts 5% fee, advisory locks |
| Walkthrough | `phase-9b-friday-payouts-walkthrough.md` | Plain-English |
| **9c Tax + 1099 + Reconciliation** | | |
| Spec | `phase-9c-tax-1099-reconciliation-spec.md` | YTD earnings cron, $600 IRS threshold, financial dashboard, year-end triple-entry |
| Walkthrough | `phase-9c-tax-1099-reconciliation-walkthrough.md` | Plain-English |

**Key locks:**
- 5 refund paths from Phase 9a Lock 7
- Instant payout fee: 5% (covers Stripe cost + margin) — Lock 3
- Minimum payout: $10 (Stripe per-transfer cost) — Lock 4
- Negative balance carries forward (Lock 6)
- Friday 12 PM Pacific cron — Lock 2
- 4-week soft launch on Phase 9b (4 Friday cycles)
- Stripe handles 1099 generation (don't build own)
- Year-end reconciliation: triple-entry within ±$1 tolerance

**Critical: Phase 9a comes before Phase 8b/c in build order.** Disputes need refund paths.

---

## Phase 10 — Polish + launch readiness (4 sub-phases)

**Status:** ALL fully specced. Phase 10c NOT BLOCKING for launch (Lock 9).

| Doc | Path | Notes |
|---|---|---|
| Overview | `phase-10-overview.md` | Why Phase 10 exists |
| **10a Notifications Infrastructure** | | |
| Spec | `phase-10a-notifications-infrastructure-spec.md` | Push + email + in-app, severity calibration, quiet hours, dispatcher pattern |
| Walkthrough | `phase-10a-notifications-infrastructure-walkthrough.md` | Plain-English |
| **10b State Component Library** | | |
| Spec | `phase-10b-state-component-library-spec.md` | EmptyState + ErrorState + Skeleton; ~30 contexts |
| Walkthrough | `phase-10b-state-component-library-walkthrough.md` | Plain-English |
| **10c Marketing Pages + SEO** | | |
| Spec | `phase-10c-marketing-pages-seo-spec.md` | City × Service landing pages, Schema.org, sitemap, static pages |
| Walkthrough | `phase-10c-marketing-pages-seo-walkthrough.md` | Plain-English |
| **10d Tours + Support + Polish** | | |
| Spec | `phase-10d-tours-support-polish-spec.md` | WF 48/50 tours, WF 47 support, WF 70 waitlist, WCAG 2.1 AA, Lighthouse >90 |
| Walkthrough | `phase-10d-tours-support-polish-walkthrough.md` | Plain-English |

**Key locks:**
- Phase 10a notifications subsume Phase 3 notifications work (Lock 1)
- Phase 10c NOT BLOCKING for launch (Lock 9) — can ship lean or defer
- WCAG 2.1 AA target (not AAA)
- Lighthouse >90 on critical paths
- 3-tier support SLA: General 24-48h / Booking 4-12h / Emergency 1h
- First-100 perks: $25 off per metro

---

## Cross-phase dependency map

```
Database foundation (B1-B8) — deployed
  ↓
Phase 3a customer foundation
  ↓ (provides: customer_profiles, addresses)
Phase 4 cleaner onboarding
  ↓ (provides: cleaner_profiles, Stripe Connect)
Phase 5 browse
  ↓ (provides: cleaner cards, metro state)
Phase 6a booking creation
  ↓ (provides: bookings, Stripe authorize-only)
Phase 9a refund engine + ledger
  ↓ (provides: 5 refund paths, balance, revenue events)
  
  ├→ Phase 6b messaging
  ├→ Phase 6c availability
  ├→ Phase 6d GPS
  ├→ Phase 6e photos
  ├→ Phase 6f approve/pay/review
  └→ Phase 6g recurring
       ↓ (provides: full booking lifecycle)
       
Phase 7a score + tier engine
  ↓ (provides: reliability_events, tier eval cron)

Phase 8a Tier 1 disputes
  ↓ (provides: dispute creation, evidence, escalation)

Phase 7b appeals + 7c badges
  ↓ (extend score system)

Phase 8b Tier 2 admin mediation
  ↓ (uses: refund engine, score events)

Phase 9b Friday payouts
  ↓ (uses: ledger, balance)

Phase 8c Tier 3 escalation
  ↓ (uses: insurance partner integration)

Phase 9c tax + reconciliation
  ↓ (closes Phase 9)

Phase 10a notifications infrastructure
  ↓ (subsumes Phase 3 notifications work)

Phase 3b settings completion
  ↓ (small; can slot anywhere after 3a)

Phase 10b state component library
  ↓ (used across all phases)

Phase 10d tours + support + a11y
  ↓ (final polish)

Phase 10c marketing pages + SEO
  (optional; defer if launching lean)

LAUNCH
```

---

## External vendors required across all phases

Tracked here for the comprehensive pre-launch checklist. Each must be in place before the corresponding phase begins.

| Vendor | Phase | Purpose | Lead time |
|---|---|---|---|
| Supabase | 1 | Database, auth, storage, realtime | Deployed |
| Vercel | 1 | Hosting, cron | Deployed |
| Stripe (platform) | 6a | Customer charges, authorize-only | 1-2 weeks |
| Stripe Connect Express | 4 | Cleaner payouts, 1099 generation | 2-4 weeks |
| Checkr | 4 | Background checks | 4-6 weeks |
| Mapbox | 6d | GPS tracking, geocoding, ETA | 1 week |
| Twilio (or similar) | 10a | SMS notifications | 1-2 weeks |
| SendGrid (or similar) | 10a | Email delivery | 1 week |
| Push notification service | 10a | Web Push (browser-based v1) | 1 week |
| Insurance partner | 8c | Damage claims >$500 | **4-8 weeks** |
| Legal counsel (retainer) | 4, 8c | Lawyer review + Tier 3 case counsel | Ongoing |

**Critical pre-launch:**
- Insurance partner agreement signed (longest lead time)
- Checkr account approved + sandbox + production tested
- Stripe Connect Express approved
- All lawyer reviews complete

---

## Operational lock-ins captured across phases

Quick reference for "why was this decided" questions during build.

**Build order:**
- Phase 9a (refunds) before Phase 8b/c (disputes) — disputes need refund paths

**Stripe:**
- Authorize-only at booking; capture at clock-out (Phase 6a Lock 1)
- Connect Express only (Phase 4)
- Stripe handles 1099 generation (Phase 9c)

**GPS + privacy:**
- Pings stop at clock-in (Phase 6d / WF 64)
- 3-min ping interval; 100m geofence

**Photos:**
- EXIF stripping required (Phase 6e / WF 64)
- 30-day retention (Phase 6e Lock 3)
- 5 photos max per booking (Phase 6e)

**Money:**
- 5% instant payout fee (Phase 9b Lock 3)
- $10 minimum payout (Phase 9b Lock 4)
- Friday 12 PM Pacific cron (Phase 9b Lock 2)
- Negative balance carries forward (Phase 9b Lock 6)

**Reliability + tiers:**
- 4 tiers: Bronze/Silver/Gold/Platinum (Phase 7a)
- Multipliers don't compound (Phase 7c Lock 4)
- Recurring NOT tier-gated (Phase 7 Lock 3)

**Disputes:**
- 3-tier system (Phase 8)
- 24h Tier 1 / 12h Tier 2 / 60-day Tier 3 SLAs
- 3 admin decision options (Phase 8b Lock 6)
- Required rationale visible to parties (WF 57.7)

**Notifications:**
- Severity-based quiet hours (Phase 10a)
- Critical category overrides quiet hours
- Phase 10a subsumes Phase 3 notifications (Phase 3 Lock 1)

**Launch:**
- Phase 10c NOT BLOCKING for launch (Phase 10 Lock 9)
- Sacramento as first active metro
- 14-30 day soft launch monitoring per phase

---

## How to use this index

**Starting a new phase:**
1. Open this index
2. Find the phase row → spec path
3. Read the spec end to end
4. Read the walkthrough for plain-English context
5. Check cross-phase dependencies map for what comes before
6. Verify external vendors required
7. Refresh assumptions (re-check Stripe API docs, Mapbox pricing, etc.)
8. Begin Day 1 of implementation

**Mid-phase review:**
1. Open this index
2. Find the phase
3. Re-read just the gotchas section in the spec
4. Verify acceptance criteria progress

**Cross-phase question:**
1. Open this index
2. Cross-phase dependency map shows what depends on what
3. Operational lock-ins captures "why" decisions

---

## What's NOT in these specs (transparent gaps)

- **Real test cases.** Specs reference test strategies; actual test code not written.
- **Phase 11+ post-launch features.** Mobile native, expansion metros, premium tier, blog CMS, etc.
- **Cleaner / customer onboarding playbooks.** First 100 cleaners outreach + onboarding sequence.
- **Marketing launch materials.** PR, social media, email campaigns.
- **Crisis communication protocols.** What to say when something goes wrong publicly.
- **Investor materials.** Pitch deck, financials, vision documents.
- **i18n / multi-language.** English only v1.
- **Native mobile apps.** Web-first launch.

These are real gaps. Each is its own future task when reached.

---

## File quality + freshness notes

- **Phase 6 specs got the most polish** (early in this batch run; aggressive draft maturity).
- **Phase 10 specs are appropriately leaner** (Phase 10 sub-phases are smaller scope).
- **Every spec has an "author note"** flagging that real implementation will reveal misses. Specs are *strong starting points*, not final blueprints.
- **Re-read each spec ~1 week before that phase begins.** Refresh memory + reality-check assumptions against current Stripe / Mapbox / Checkr / etc. APIs.
- **Walkthroughs are durable.** Specs may need updates; walkthroughs explain *why* and rarely change.

---

This index is the canonical navigation document for the PureTask build plan. Update when new phases or sub-phases are added.
