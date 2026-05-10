# Phase 8c — Tier 3 Escalation + Insurance + Legal Review Specification

> **Author note (transparency):** This spec is being written ahead of when Phase 8c will actually be built. The spec is correct as of the current date but will need a refresh when implementation actually starts, particularly for: insurance partner relationship + case package format (depends on partner choice), legal counsel relationship details, actual Tier 3 volume (likely rare), and police involvement protocols. Treat this as an aggressive draft.

**Phase goal:** Tier 3 disputes (insurance / legal / safety) flag for human review. Damage claims >$500 auto-flag; safety + theft auto-flag immediately. Insurance partner notified for damage claims with structured case package. Legal review path for theft/harassment/safety. Police involvement coordinated for criminal matters. Phase 8 closeout: anti-abuse dashboard surfaces flagged customer/cleaner accounts.

**Estimated duration:** ~1 week of focused engineering (5 working days).

**Depends on:**
- Phase 8b complete (Tier 2 mediation operational; escalation hooks ready)
- Insurance partner relationship secured (started during Phase 8a build)
- Phase 4 lawyer relationship continues for legal review path
- B3 + Phase 8a/8b schemas deployed
- Phase 10a notification dispatcher operational

**Wireframes covered:** Limited explicit wireframes — WF 47.3.3 (emergency report) touches Tier 3.

**Phase 8c sub-sections (mostly parallel within 8c):**

- **8c-1** — Tier 3 escalation triggers (~1.5 days)
- **8c-2** — Insurance partner integration (~2 days)
- **8c-3** — Legal review path (~1 day)
- **8c-4** — Anti-abuse dashboard + Phase 8 closeout (~0.5 days)

---

## 0. External account prerequisites

### 0.1 Insurance partner identified + agreement signed

**Critical pre-launch task.** Phase 8c can't ship without a partner. Started during Phase 8a build (4-8 week negotiation window).

Options to evaluate:
- **Existing platform insurance providers** — MoneyMutual, ICW Group, etc.
- **Cleaning-specific underwriters** — niche but more relevant
- **Self-insurance pool** — set aside platform revenue; absorb claims directly. Risky for early stage; defer.

Required from partner:
- Coverage scope: damage to customer property during cleanings
- Coverage limit per claim: $5,000 - $25,000 typical
- Premium structure: per-booking (e.g., $0.50/booking) vs flat monthly
- Deductible: who pays first $500
- Claim process: timeline, documentation requirements
- Partner contact for case submission

Don't begin Phase 8c implementation without partner signed.

### 0.2 Legal counsel relationship continuation

Phase 4 lawyer engagement continues into Phase 8c for:
- Tier 3 legal review of theft/harassment cases
- Police coordination protocol
- Civil action recommendations
- Confidentiality on Tier 3 cases

Verify counsel has retainer agreement covering these scenarios.

### 0.3 No new vendor signups in Phase 8c

Insurance + lawyer = ongoing relationships, not new signups. Don't try to find new vendors mid-Phase 8c.

---

## 1. Summary

Phase 8c is **the severe-case escalation layer.** Concretely, by the end of Phase 8c:

1. **Damage claims >$500 auto-flag for Tier 3.** Determined by customer's stated damage value during dispute opening (Phase 8a).

2. **Safety + theft categories auto-flag immediately.** Skip Tier 1/2; go straight to Tier 3.

3. **Manual flag from Tier 2 mediation.** Admin can elevate Tier 2 dispute to Tier 3 if discovers severity warrants.

4. **Insurance partner notified for damage claims.** Structured case package generated. Partner determines coverage. Outcome captured.

5. **Legal review path for theft/safety.** Counsel notified. Recommendations captured. Could route to police, civil action, or platform action.

6. **Anti-abuse dashboard.** Customer >30% dispute rate flagged; cleaner >20%. Admin sees flagged accounts in WF 54 attention queue.

7. **Phase 8 closeout verification.** All sub-phases (8a, 8b, 8c) verified end-to-end with realistic dispute scenarios.

What Phase 8c does NOT do:
- Build new dispute UI for customers/cleaners (Phase 8a/8b cover)
- Process insurance payouts (handed to insurance partner)
- Provide legal counsel directly (handled by retained counsel)

---

## 2. Acceptance criteria

### 8c-1 Escalation triggers

- [ ] Damage claim with stated amount >$500 → auto-flag for Tier 3 at dispute opening (Phase 8a integration)
- [ ] Safety category → auto-flag immediately
- [ ] Theft category → auto-flag immediately
- [ ] Customer or cleaner explicit "Request legal review" → flag
- [ ] Admin during Tier 2 mediation: "Escalate to Tier 3" button visible
- [ ] Tier 3 flag pauses Tier 2 mediation (no decision finalized)
- [ ] `dispute_tier_3_escalations` row created with category + reason
- [ ] Both parties notified: "Your dispute requires further review"

### 8c-2 Insurance partner integration

- [ ] Insurance case package generator outputs structured PDF or email per partner spec
- [ ] Package contents: booking financial details + customer claim text + photos + cleaner response + clock-out photos + message thread + reliability context
- [ ] Email submission to partner with case ID
- [ ] Admin can capture partner response: coverage decision (covered/partial/denied) + payout amount + reasoning
- [ ] Phase 9a Tier 3 insurance pathway processes payout (insurance reimburses platform; cleaner unaffected)
- [ ] Customer notified of insurance outcome

### 8c-3 Legal review path

- [ ] Theft/safety/explicit-legal-request → counsel notified via secure channel
- [ ] Confidentiality maintained: Tier 3 legal cases visible only to admin + counsel
- [ ] Counsel recommendation captured: police involvement / civil action / no action / revert to Tier 2
- [ ] Outcome routes to appropriate downstream (Phase 8b Tier 2 path if reverting; admin manual coordination if police)
- [ ] Both parties notified of status without case details

### 8c-4 Anti-abuse dashboard

- [ ] Daily cron computes customer dispute rate (last 10 bookings)
- [ ] Daily cron computes cleaner dispute rate (last 20 bookings)
- [ ] Customer >30% rate flagged in WF 54 admin queue
- [ ] Cleaner >20% rate flagged in WF 54 admin queue
- [ ] Phase 8b mediation interface shows flag context during decision

### Cross-cutting

- [ ] All Phase 8c code has unit tests; coverage ≥75%
- [ ] RLS: Tier 3 cases admin + counsel only
- [ ] Confidentiality preserved (cleaner/customer don't see counsel notes)
- [ ] Phase 9a integration: Tier 3 insurance pathway working

---

## 3. Database state required

### Existing tables (no changes)

- `disputes`, `dispute_resolutions` — populated by Phase 8a/8b

### New migrations (Phase 8c)

```sql
-- Phase 8c migration

-- Tier 3 escalation tracking (already in Phase 8 master outline; re-stating here)
CREATE TABLE IF NOT EXISTS dispute_tier_3_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL UNIQUE REFERENCES disputes(id) ON DELETE RESTRICT,
  escalation_category TEXT NOT NULL CHECK (escalation_category IN (
    'damage_over_500', 'theft', 'safety', 'legal_request', 'other'
  )),
  flagged_by_admin_id UUID NOT NULL REFERENCES users(id),
  flagged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Insurance flow
  insurance_case_submitted_at TIMESTAMPTZ,
  insurance_response_at TIMESTAMPTZ,
  insurance_outcome TEXT CHECK (insurance_outcome IN ('covered', 'partial', 'denied', 'pending')),
  insurance_payout_cents INTEGER,
  insurance_partner_case_id TEXT,
  insurance_response_text TEXT,
  
  -- Legal flow
  legal_review_at TIMESTAMPTZ,
  legal_recommendation TEXT CHECK (legal_recommendation IN (
    'police_involvement', 'civil_action_recommended', 'no_legal_action_revert_tier_2', 'platform_action_only'
  )),
  legal_notes TEXT, -- counsel-only; confidential
  
  -- Resolution
  resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_tier_3_pending ON dispute_tier_3_escalations (dispute_id) WHERE resolved_at IS NULL;

-- Anti-abuse flag cache (computed daily)
ALTER TABLE customer_profiles
  ADD COLUMN IF NOT EXISTS dispute_rate_last_10 NUMERIC(4,3) DEFAULT 0.0;
ALTER TABLE customer_profiles
  ADD COLUMN IF NOT EXISTS dispute_rate_flag_at TIMESTAMPTZ;

ALTER TABLE cleaner_profiles
  ADD COLUMN IF NOT EXISTS dispute_rate_last_20 NUMERIC(4,3) DEFAULT 0.0;
ALTER TABLE cleaner_profiles
  ADD COLUMN IF NOT EXISTS dispute_rate_flag_at TIMESTAMPTZ;
```

### RLS policies

```sql
-- Tier 3 escalations: admin only (cleaner/customer cannot read)
ALTER TABLE dispute_tier_3_escalations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tier_3_admin_only ON dispute_tier_3_escalations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
-- Cleaner/customer get status updates via dispute notifications, not direct table read
```

---

## 4. Files to create

### App routes (~3 files)

- `/app/admin/disputes/[id]/tier-3/page.tsx` — Tier 3 escalation detail
- `/app/admin/disputes/tier-3-queue/page.tsx` — list of all Tier 3 cases
- `/app/admin/anti-abuse-flags/page.tsx` — flagged accounts dashboard

### Components (~6 files)

- `/features/admin-disputes/tier-3/components/Tier3EscalationFlow.tsx`
- `/features/admin-disputes/tier-3/components/InsuranceCasePackage.tsx`
- `/features/admin-disputes/tier-3/components/InsuranceResponseCapture.tsx`
- `/features/admin-disputes/tier-3/components/LegalReviewPanel.tsx`
- `/features/admin-disputes/tier-3/components/AntiAbuseFlagsList.tsx`
- `/features/admin-disputes/tier-3/components/EscalateToTier3Button.tsx`

### Library code (~5 files)

- `/lib/admin-disputes/tier-3/escalation_handler.ts` — auto + manual flag logic
- `/lib/admin-disputes/tier-3/insurance_case_generator.ts` — package builder
- `/lib/admin-disputes/tier-3/insurance_outcome_processor.ts` — applies coverage decision
- `/lib/admin-disputes/tier-3/legal_review_router.ts` — counsel notification + recommendation routing
- `/lib/admin-disputes/anti_abuse_calculator.ts` — daily dispute rate computation

### Server actions (~4 files)

- `/app/api/admin/disputes/[id]/escalate-tier-3/route.ts` — POST escalation
- `/app/api/admin/disputes/[id]/insurance-response/route.ts` — POST insurance outcome
- `/app/api/admin/disputes/[id]/legal-recommendation/route.ts` — POST legal recommendation
- `/app/api/admin/anti-abuse-flags/route.ts` — GET flagged accounts

### Background jobs (1 file)

- `/jobs/anti_abuse_daily_calculator.ts` — daily dispute rate calc

### Phase 9a integration

- Tier 3 insurance covered = Phase 9a refund path 5 (insurance payout)
- Cleaner unaffected (assumes no negligence)
- Phase 9a tracks insurance reimbursement separately

### Database migrations (1 file)

- `migrations/2026XXXXXX_phase_8c_schema.sql`

### Docs (3 files)

- (Phase 8 overview already exists)
- `phase-8c-tier-3-escalation-spec.md` — this file
- `phase-8c-tier-3-escalation-walkthrough.md`

---

## 5. Implementation order

### 8c-1 — Escalation triggers (~1.5 days)

**Day 1 — Auto-flag logic.** Build `lib/admin-disputes/tier-3/escalation_handler.ts`. Triggers on damage>$500, safety, theft. Test Phase 8a integration.

**Day 1.5 — Manual flag from Tier 2.** `EscalateToTier3Button` on Phase 8b mediation interface. Pause Tier 2 mediation on flag.

### 8c-2 — Insurance partner integration (~2 days)

**Day 2 — Case package generator.** Build `lib/admin-disputes/tier-3/insurance_case_generator.ts`. Test package format with mock partner spec.

**Day 3 — Response capture + Phase 9a integration.** `InsuranceResponseCapture` UI. Phase 9a path 5 wiring. Test full flow with sample case.

### 8c-3 — Legal review path (~1 day)

**Day 4 — Counsel notification + recommendation.** Build `lib/admin-disputes/tier-3/legal_review_router.ts`. Counsel email template. Recommendation capture form.

### 8c-4 — Anti-abuse + closeout (~0.5 days)

**Day 5 — Anti-abuse dashboard + Phase 8 closeout.** Build `anti_abuse_calculator.ts`. Daily cron. WF 54 integration. End-to-end verify Phase 8 sub-phases.

---

## 6. Specific gotchas

### Gotcha A — Damage claim amount inflated to trigger Tier 3

**The problem:** Customer wants severe action. Inflates damage claim from $300 to $600 to trigger Tier 3 + insurance.

**The fix:** Insurance partner audits claim amount. Customer required to document damage value with photos + receipts. Admin flags suspicious inflation; reverts to Tier 2 if unjustified.

### Gotcha B — Insurance partner case timeline mismatch

**The problem:** Insurance partner takes 4-6 weeks to decide. Customer + cleaner waiting that long. Cleaner balance frozen during.

**The fix:** Set expectations early. Both parties notified: "Insurance review takes 4-6 weeks. Your dispute is in active review." Cleaner balance frozen for the disputed amount only; rest of balance flows normally.

### Gotcha C — Counsel notes leak via cleaner appeal

**The problem:** Cleaner files Phase 7b appeal claiming Tier 3 outcome unfair. Appeal review reads counsel's confidential notes.

**The fix:** RLS strict on `dispute_tier_3_escalations.legal_notes`. Even admin reading appeals doesn't get legal notes; separate counsel-only view. Phase 7b appeal admin sees outcome ("denied per counsel review") without details.

### Gotcha D — Police involvement procedural confusion

**The problem:** Counsel recommends police involvement. Admin doesn't know if PureTask reports or customer reports. Confusion delays.

**The fix:** Locked protocol. PureTask provides documentation to whichever party reports. Customer/cleaner are who reports based on counsel guidance. Document.

### Gotcha E — Anti-abuse threshold false positives

**The problem:** Customer with 4 disputes out of 10 bookings (40%) flagged as abuser. But all 4 disputes were legitimate (cleaner actually no-show'd 4 times).

**The fix:** Threshold is initial flag for admin REVIEW, not auto-action. Admin reviews each flagged account; assesses pattern; chooses action (warn / restrict / no action). Don't auto-restrict.

### Gotcha F — Insurance + cleaner negligence

**The problem:** Insurance covers customer damage. Cleaner negligence caused damage. Should cleaner pay back insurance? Score impact?

**The fix:** Lock policy. If insurance pays, cleaner score impact based on negligence determination during admin review. If clear cleaner fault → score impact + tier review. If accident → cleaner unaffected. Document.

### Gotcha G — Tier 3 case lifecycle without resolution

**The problem:** Insurance partner times out. Counsel slow. Tier 3 case sits 3 months. Customer + cleaner anxious.

**The fix:** SLA on Tier 3: 60 days from escalation. If unresolved, admin reviews and renders best-judgment decision based on available evidence. Document expected timeline; communicate proactively.

### Gotcha H — Anti-abuse flag affects future dispute outcomes

**The problem:** Customer flagged for high dispute rate. Genuinely-bad cleaner causes new dispute. Admin's bias against flagged customer affects fair decision.

**The fix:** Flag is informational, not binding. Admin uses for context but evaluates each dispute on its own evidence. Mediation interface shows flag but emphasizes case-specific evidence.

---

## 7. Testing strategy

### Unit tests
- `lib/admin-disputes/tier-3/escalation_handler.ts`: auto-flag triggers
- `lib/admin-disputes/tier-3/insurance_case_generator.ts`: package format
- `lib/admin-disputes/anti_abuse_calculator.ts`: dispute rate math edge cases

### Integration tests
- Damage claim >$500 → auto-flag → insurance package generated
- Safety category → auto-flag → counsel notified
- Anti-abuse cron → flag updated correctly

### Manual QA
- Sample Tier 3 case end-to-end on staging
- Insurance partner sandbox/test flow
- Counsel notification template review

---

## 8. Deployment plan

### Pre-deploy
- [ ] Insurance partner agreement signed
- [ ] Legal counsel retainer confirmed
- [ ] Migrations applied
- [ ] Admin training on Tier 3 protocols

### Deployment order
1. Migrations
2. Library code
3. Admin UI
4. Anti-abuse cron
5. Phase 8b/9a integration
6. Soft launch: 30 days monitoring (longer for rare-event-frequency phase)

### Rollback
- App code revert if bugs surface
- Don't roll back schema (Tier 3 audit integrity)

---

## 9. Phase 8c → Phase 8 closeout

Phase 8 is now complete:
- Phase 8a: Tier 1 customer/cleaner direct disputes
- Phase 8b: Tier 2 admin mediation
- Phase 8c: Tier 3 escalation

End-to-end verification with realistic scenarios:
- Quality dispute resolves at Tier 1 (re-clean accepted)
- Photo dispute escalates to Tier 2 (admin partial refund)
- Damage claim escalates to Tier 3 (insurance covered)
- Theft case escalates to Tier 3 (legal review + police coordination)

---

## 10. Open questions

1. **Insurance partner selection.** Final decision before Phase 8c starts. Options: existing platform insurer or cleaning-specific underwriter.
2. **Tier 3 SLA.** 60 days recommended; insurance partner timeline drives.
3. **Anti-abuse action thresholds.** Recommend warning at first flag, restriction at second flag (different incidents).
4. **Cleaner negligence policy on insurance claims.** Recommend lock: clear fault = score impact; accident = no impact. Document.

---

This spec is the canonical Phase 8c build reference. Walkthrough lives in `phase-8c-tier-3-escalation-walkthrough.md`.
