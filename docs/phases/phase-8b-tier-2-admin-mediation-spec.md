# Phase 8b — Tier 2 Admin Dispute Mediation Specification

> **Author note (transparency):** This spec is being written ahead of when Phase 8b will actually be built. The spec is correct as of the current date but will need a refresh when implementation actually starts, particularly for: actual Tier 2 escalation volume after Phase 8a launch, admin SLA observations under real load, and dispute pattern analysis revealing additional decision options. Treat this as an aggressive draft.

**Phase goal:** Admin sees Tier 2 escalated disputes in queue (WF 56) with SLA prioritization. Admin opens WF 57 mediation interface — most consequential single admin screen. Reviews full evidence (both parties' photos, message thread, booking history, reliability context). Makes one of three decisions (cleaner stands / partial refund / full refund + strike) with required rationale visible to both parties. Phase 9a refund engine processes; Phase 7a score event fires.

**Estimated duration:** ~1.5 weeks of focused engineering (8 working days).

**Depends on:**
- Phase 8a complete (Tier 1 disputes flowing; auto-escalation cron firing)
- Phase 9a complete (refund engine operational; all 5 paths working)
- Phase 7a complete (`recordReliabilityEvent()` available)
- Phase 4 admin tooling foundation
- Phase 10a notification dispatcher operational

**Wireframes covered:** WF 56 (active disputes list), WF 57 (admin mediation interface).

**Phase 8b sub-sections (sequential):**

- **8b-1** — Admin disputes list (WF 56) (~2 days)
- **8b-2** — Admin mediation interface (WF 57) (~4 days)
- **8b-3** — Tier 2 SLA tracking + alerts (~1 day)
- **Closeout + integration** (~1 day)

---

## 0. External account prerequisites

Phase 8b has **no new vendors.** All internal work + Phase 9a refund integration + Phase 10a notifications.

### 0.1 Admin tool foundation

Phase 4 admin tooling exists. Phase 8b extends with disputes section. Verify admin sidebar + auth + RLS bypass patterns.

### 0.2 Lawyer review on decision rationale templates

Admin's rationale text becomes visible to customer + cleaner. Lawyer-review the structure and tone guidance for admins:
- Avoid accusatory language toward either party
- State factual basis (photos, timing, prior events)
- Explain decision per established policies
- Respect both parties' dignity

Don't ship without this.

---

## 1. Summary

Phase 8b is **the most consequential admin work in the platform.** Concretely, by the end of Phase 8b:

1. **WF 56 admin queue surfaces all active disputes.** Tier-filtered tabs. SLA-prioritized.

2. **WF 57 mediation interface renders all evidence.** Parties context, customer claim, photo evidence (both sides), full Tier 1 message thread, audit timeline.

3. **Three decision options work.** Cleaner stands (no refund, no score impact) / Partial refund (default 25%, custom % allowed) / Full refund + strike (full refund + Phase 7a -8 score event + tier review flag).

4. **Decision rationale required.** 50-1000 chars. Visible to both parties post-decision per WF 57.7.

5. **Save draft supported.** Complex disputes may need research. Admin saves; returns later; no downstream actions until submit.

6. **Phase 9a refund engine processes outcomes.** All 5 refund paths from Phase 9a Lock 7 wired correctly.

7. **Tier 2 SLA tracking active.** 12-hour business-hours SLA enforced. Pre-breach alert at 8 hours; breach at 12.

What Phase 8b does NOT do:
- Tier 3 escalation (Phase 8c)
- Insurance partner integration (Phase 8c)
- Anti-abuse flagging surface (Phase 8c includes admin dashboard view)

---

## 2. Acceptance criteria

### 8b-1 Admin disputes list (WF 56)

- [ ] `/admin/disputes` route accessible only to admin_users
- [ ] Tab filters: Active (Tier 2/3) / Direct resolution (Tier 1) / Resolved / All
- [ ] Default sort: SLA breach proximity (closest to 12h breach first)
- [ ] Per-row: booking ID + parties + service + customer reliability flag + cleaner tier + dispute type + age + Mediate/View action
- [ ] Customer reliability flag: shows "Good standing" / "Flagged" / "Disputes history" badge
- [ ] Recent resolved table below active (last 10) for pattern context
- [ ] Click "Mediate" → opens WF 57 for that dispute

### 8b-2 Admin mediation interface (WF 57)

- [ ] `/admin/disputes/[id]/mediate` route accessible only to admin
- [ ] Header shows dispute meta: booking ID, type, age, escalated_at
- [ ] Parties summary: customer reliability stats + cleaner tier/rating + booking financial
- [ ] Customer's claim quoted with category
- [ ] Photo evidence grid: customer photos + cleaner photos, organized by room
- [ ] Full Tier 1 message thread visible (read-only)
- [ ] Decision panel: 3 options + custom partial refund % input (0-100%)
- [ ] Custom partial refund accepts $0.01 to booking total
- [ ] Rationale text required (50-1000 chars)
- [ ] "Save draft" preserves state without firing actions
- [ ] "Submit decision" triggers downstream effects atomically:
  - Phase 9a refund (if applicable)
  - Phase 7a score event
  - Both parties notified with decision + rationale
  - Dispute state → resolved
  - Audit timeline entry

### 8b-3 Tier 2 SLA tracking

- [ ] SLA timer visible on each Tier 2 dispute
- [ ] Business hours: 9 AM - 6 PM Pacific weekdays only
- [ ] Pre-breach alert at 8 hours business time → admin push + email
- [ ] Breach alert at 12 hours business time → admin push + email + dashboard prominence
- [ ] Cron runs every 30 min during business hours
- [ ] Friday 4 PM escalation pauses over weekend; resumes Monday 9 AM

### Cross-cutting

- [ ] All Phase 8b code has unit tests; coverage ≥80%
- [ ] RLS: only admin reads; verified
- [ ] All decisions logged in audit table
- [ ] Performance: WF 57 load <500ms p95 (heavy data)

---

## 3. Database state required

### Existing tables

- `disputes` (B3 + Phase 8a additions)
- `dispute_resolutions` (B3)
- `dispute_messages` (B3)
- `dispute_photos` (Phase 8a)
- `dispute_escalation_events` (Phase 8a)

### New migrations (Phase 8b)

```sql
-- Phase 8b migration

-- Admin decision details on dispute_resolutions
ALTER TABLE dispute_resolutions
  ADD COLUMN IF NOT EXISTS admin_decision_type TEXT
  CHECK (admin_decision_type IN ('cleaner_stands', 'partial_refund', 'full_refund_with_strike'));
ALTER TABLE dispute_resolutions
  ADD COLUMN IF NOT EXISTS admin_decided_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE dispute_resolutions
  ADD COLUMN IF NOT EXISTS admin_decided_at TIMESTAMPTZ;
ALTER TABLE dispute_resolutions
  ADD COLUMN IF NOT EXISTS admin_rationale TEXT
  CHECK (LENGTH(admin_rationale) BETWEEN 50 AND 1000);
ALTER TABLE dispute_resolutions
  ADD COLUMN IF NOT EXISTS partial_refund_percent NUMERIC(5,2)
  CHECK (partial_refund_percent BETWEEN 0 AND 100);
ALTER TABLE dispute_resolutions
  ADD COLUMN IF NOT EXISTS partial_refund_amount_cents INTEGER;

-- Mediation drafts (admin saves before submit)
CREATE TABLE dispute_mediation_drafts (
  dispute_id UUID PRIMARY KEY REFERENCES disputes(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  draft_decision TEXT,
  draft_rationale TEXT,
  draft_partial_percent NUMERIC(5,2),
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SLA tracking for Tier 2
ALTER TABLE disputes
  ADD COLUMN IF NOT EXISTS sla_pre_breach_alerted_at TIMESTAMPTZ;
ALTER TABLE disputes
  ADD COLUMN IF NOT EXISTS sla_breached_at TIMESTAMPTZ;

-- Anti-abuse flag tracking (cached on profiles; populated by daily cron)
-- Already in Phase 8 master outline schema; verify exists
```

### RLS policies

```sql
-- Mediation drafts: admin only
ALTER TABLE dispute_mediation_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY drafts_admin_only ON dispute_mediation_drafts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
```

---

## 4. Files to create

### App routes (~3 files)

- `/app/admin/disputes/page.tsx` — WF 56 list
- `/app/admin/disputes/[id]/mediate/page.tsx` — WF 57 mediation
- `/app/api/admin/disputes/[id]/decide/route.ts` — POST decision

### Components — List (~4 files)

- `/features/admin-disputes/components/DisputesList.tsx`
- `/features/admin-disputes/components/DisputeRow.tsx`
- `/features/admin-disputes/components/SLABadge.tsx`
- `/features/admin-disputes/components/RecentResolvedDisputesPanel.tsx`

### Components — Mediation (~7 files)

- `/features/admin-disputes/components/MediationShell.tsx` — main orchestrator
- `/features/admin-disputes/components/DisputePartiesSummary.tsx`
- `/features/admin-disputes/components/PhotoEvidenceGrid.tsx` — by room
- `/features/admin-disputes/components/DisputeMessageThreadDisplay.tsx`
- `/features/admin-disputes/components/DecisionRadioPanel.tsx` — 3 options + custom %
- `/features/admin-disputes/components/RationaleInput.tsx`
- `/features/admin-disputes/components/DisputeAuditTimeline.tsx`

### Library code (~5 files)

- `/lib/admin-disputes/decision_processor.ts` — orchestrates decision submission
- `/lib/admin-disputes/refund_orchestrator.ts` — calls Phase 9a per decision type
- `/lib/admin-disputes/score_event_dispatcher.ts` — calls Phase 7a per decision type
- `/lib/admin-disputes/sla_calculator.ts` — business hours math
- `/lib/admin-disputes/draft_manager.ts` — save/load draft state

### Server actions / API routes (~4 files)

- `/app/api/admin/disputes/queue/route.ts` — GET dispute list
- `/app/api/admin/disputes/[id]/route.ts` — GET full mediation context
- `/app/api/admin/disputes/[id]/draft/route.ts` — PUT draft state
- `/app/api/admin/disputes/[id]/sla-status/route.ts` — GET SLA timer

### Background jobs (1 file)

- `/jobs/dispute_sla_tracker.ts` — every 30 min during business hours

### Phase 9a + 7a + 10a integration

- Phase 9a: decision triggers refund per decision type (cleaner stands = no refund; partial = path 2; full + strike = path 3)
- Phase 7a: decision fires score event per Phase 8 Lock 6 (cleaner stands = 0; partial = -2; full + strike = -8)
- Phase 10a: both parties notified via `dispatchNotification('dispute', 'admin_decision')`

### Database migrations (1 file)

- `migrations/2026XXXXXX_phase_8b_schema.sql`

### Docs (3 files)

- (Phase 8 overview already exists)
- `phase-8b-tier-2-admin-mediation-spec.md` — this file
- `phase-8b-tier-2-admin-mediation-walkthrough.md`

---

## 5. Implementation order

### 8b-1 — Admin disputes list (~2 days)

**Day 1 — Schema + queue API.** Migration. Build `/api/admin/disputes/queue/route.ts`. Tab filtering logic. SLA sorting.

**Day 2 — WF 56 UI.** `DisputesList`, `DisputeRow`, `SLABadge`. Recent resolved panel.

### 8b-2 — Mediation interface (~4 days)

**Day 3 — Mediation shell + parties summary.** `MediationShell`, `DisputePartiesSummary`. Load full context API.

**Day 4 — Photo evidence + message thread.** `PhotoEvidenceGrid` (by room), `DisputeMessageThreadDisplay`. Read-only render.

**Day 5 — Decision panel + rationale.** `DecisionRadioPanel` with 3 options + custom partial %, `RationaleInput`. Form validation.

**Day 6 — Submit decision + draft save.** `decision_processor.ts` orchestrates downstream. `draft_manager.ts`. Test all 3 decision types end-to-end.

### 8b-3 — SLA tracking (~1 day)

**Day 7 — SLA cron + alerts.** Build `lib/admin-disputes/sla_calculator.ts` (business hours math). Cron handler. Pre-breach + breach alerts.

### Closeout (~1 day)

**Day 8 — End-to-end integration.** Real dispute flow: Tier 1 escalates → admin queue → mediate → decision → all downstream effects fire correctly.

---

## 6. Specific gotchas

### Gotcha A — Photo grid rendering on slow connections

**The problem:** WF 57 photo grid loads 5 customer photos + 8 cleaner photos. Signed URL fetch + image load = slow on admin's network.

**The fix:** Lazy-load photos as admin scrolls. Skeleton placeholders. Don't block decision UI on photo load.

### Gotcha B — Custom partial refund cents rounding

**The problem:** Admin enters 33.33% on $125.99 booking. Refund = $41.99 (rounded). Cleaner clawback computed differently downstream — drift.

**The fix:** Phase 9a refund engine accepts cents amount, not percentage. Admin UI computes cents from percent + total; submits cents only. Single source of truth.

### Gotcha C — Decision submission race with auto-escalation

**The problem:** Admin opens mediation. Tier 2 SLA breach fires alert. Auto-escalation to Tier 3 cron runs, flags for Tier 3. Admin submits Tier 2 decision. Conflicting state.

**The fix:** Optimistic locking. Decision submission checks dispute state at write time. If state changed (e.g., to Tier 3), reject submission with "Dispute escalated; refresh to continue."

### Gotcha D — Rationale displayed to both parties wording

**The problem:** Admin types "Cleaner failed to deliver quality work" as rationale. Cleaner sees, takes personally, files harassment claim.

**The fix:** Lawyer-reviewed rationale templates + admin training. Provide structure: "Based on [evidence], the platform's policy on [X] applies." Avoid emotional language.

### Gotcha E — SLA calculation with multi-day weekends

**The problem:** Dispute escalated Friday 5 PM. SLA timer pauses 6 PM Friday. Resumes Monday 9 AM. With Memorial Day Monday (holiday), should resume Tuesday.

**The fix:** Business hours calendar respects US federal holidays. Add holiday list config; cron checks. Document.

### Gotcha F — Draft survives admin sign-out

**The problem:** Admin saves draft. Goes home. Returns next day. Different admin logged in same browser. Sees admin A's draft.

**The fix:** Draft tied to admin_user_id + dispute_id. RLS prevents admin B reading admin A's draft. UI blanks if different admin.

### Gotcha G — Score event timing

**The problem:** Decision submitted at 11:59 PM. Phase 7a tier eval cron runs at 4 AM. -8 score event in window; tier drop pre-warning fires. Cleaner notified at 4:01 AM.

**The fix:** Phase 10a quiet hours suppress push; email still delivers. Tier drop warning is critical category — overrides quiet hours via Phase 10a critical override.

### Gotcha H — Refund failure post-decision

**The problem:** Admin submits "Full refund + strike." Phase 9a refund engine fails (Stripe error). Decision recorded but customer doesn't get money.

**The fix:** Decision submission wraps refund in transaction. If refund fails, decision rolls back. Admin sees error; retries. Don't ship inconsistent state.

---

## 7. Testing strategy

### Unit tests
- `lib/admin-disputes/decision_processor.ts`: each decision type → correct downstream
- `lib/admin-disputes/sla_calculator.ts`: business hours edge cases (weekends, holidays)
- `lib/admin-disputes/refund_orchestrator.ts`: each Phase 9a path called correctly

### Integration tests
- Full E2E: Tier 1 escalates → admin mediates → 3 decision paths → downstream verified
- SLA: 8h pre-breach → 12h breach alerts fire correctly
- Draft save/load preserves state

### Manual QA
- Real dispute on staging with real evidence
- Admin reviews on staging admin tool
- All 3 decision types tested
- Customer + cleaner notification verification

---

## 8. Deployment plan

### Pre-deploy
- [ ] Migrations applied
- [ ] Phase 8a Tier 1 + 9a refund + 7a score events operational
- [ ] Lawyer rationale templates reviewed
- [ ] Admin training on tone guidelines complete

### Deployment order
1. Migrations
2. Library code
3. Admin UI (list + mediation)
4. SLA cron activation
5. Phase 9a + 7a + 10a integration verified
6. Soft launch: 14 days monitoring (longer for sensitive admin work)

### Rollback
- App code revert if bugs surface
- Don't roll back schema (decision audit integrity)

---

## 9. Phase 8b → Phase 8c handoff

Phase 8b output ready for Phase 8c:
- Mediation interface has "Escalate to Tier 3" button (Phase 8c implementation)
- Auto-flagging logic on damage/safety/theft (Phase 8c)
- Insurance partner integration (Phase 8c)

---

## 10. Open questions

1. **Save draft expiry.** How long do drafts persist? Recommend 7 days; auto-clear after.
2. **Multi-admin collaboration.** Two admins reviewing same dispute? Recommend lock during active mediation.
3. **Decision reversal post-submission.** Can admin reverse own decision? Recommend no; escalate to senior admin if needed.

---

This spec is the canonical Phase 8b build reference. Walkthrough lives in `phase-8b-tier-2-admin-mediation-walkthrough.md`.
