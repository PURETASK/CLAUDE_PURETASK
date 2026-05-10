# PureTask — Phase 8 Master Outline

**Purpose:** A single navigation document for everything in Phase 8 (the dispute resolution system), organized by sub-phase. Goal / Design / Build / Verify format for each section.

**Status:** Outline-level navigation. Detailed acceptance criteria, specific code, and gotchas live in `phase-8a-spec.md` (and future per-sub-phase specs). The why-behind-every-decision lives in `phase-8a-explainer.md` (and future).

**Phase scope:** Phase 8 is **the platform's conflict resolution layer**. When a customer is unhappy with a cleaning post-approval, they have 48 hours to open a dispute. Tier 1 (direct resolution between customer and cleaner) handles most cases. Tier 2 (admin mediation) handles stalemates. Tier 3 (insurance/legal escalation) handles severe cases — damage over $500, safety concerns, theft. By the end of Phase 8, the platform has a fair, auditable, multi-tier dispute system that protects both customers and cleaners.

**Phase duration estimate:** 5-6 weeks of focused engineering across 3 sub-phases.

**Phase depends on:**
- Phase 6e complete (photos exist as primary dispute evidence)
- Phase 6f complete (approval lifecycle establishes the 48-hour dispute window)
- Phase 7a complete (score events can fire on dispute outcomes)
- Phase 9 partially complete or specced (refund mechanics for Tier 2 outcomes)
- B3 schema deployed (disputes, dispute_messages, dispute_resolutions tables exist)
- Phase 4 admin tooling sufficient for Tier 2 mediation interface
- At least 5 active cleaners with completed bookings (for testing realistic disputes)

**Wireframes covered by Phase 8:**

| Sub-phase | Primary wireframes | Theme |
|---|---|---|
| 8a | WF 16 (customer dispute initiation), WF 17 (cleaner dispute response) | Tier 1 direct resolution |
| 8b | WF 56 (active disputes list), WF 57 (admin mediation interface) | Tier 2 admin mediation |
| 8c | (partial) WF 47.3.3 (emergency report) | Tier 3 escalation + closeout |

---

## How to read this document

Each sub-phase has the four-heading format:
- **Goal** — what this sub-phase accomplishes in plain English
- **Design** — decisions to make before writing code
- **Build** — concrete files, components, migrations, integrations
- **Verify** — how you know it works

If a section doesn't list a Design step, that means decisions are settled in the schema or wireframes — just build to spec.

---

## Phase 8 sub-phase overview

| Sub-phase | Title | Estimated weeks | Critical dependencies |
|---|---|---|---|
| **8a** | Tier 1 customer/cleaner direct resolution | 3 | Phase 6e + 6f + 7a |
| **8b** | Tier 2 admin mediation | 1.5 | 8a + Phase 9 refund mechanics |
| **8c** | Tier 3 escalation + closeout | 1 | 8b + insurance partner setup |

**Critical ordering rule:** 8a must ship before everything else. 8b auto-escalates from 8a — they're tightly coupled but can ship sequentially. 8c is a relatively thin escalation layer; it can ship after 8b.

---

# Phase 8 — Lock-in decisions (must resolve before any sub-phase ships)

These eight decisions surfaced from the wireframe deep dive. Phase 8 spec **must** lock them before any dispute-impacting code ships.

## Lock 1 — Dispute window

**Decision:** Customer has **48 hours from approval** (manual or auto) to open a dispute.

**Rationale:** Per WF 10 + Master Guide. After 48h, dispute window closes; remaining concerns route to support (WF 47).

**Action:** `bookings.dispute_window_expires_at` = approved_at + 48 hours. Phase 6f sets this column. Phase 8a checks it on dispute creation.

## Lock 2 — Tier 1 → Tier 2 auto-escalation triggers

**Decision:** Tier 1 escalates to Tier 2 when ANY of:
- **48 hours pass without cleaner response** to dispute opening
- **Customer rejects cleaner's offer twice** (e.g., cleaner offers re-clean, customer rejects; cleaner offers 25% refund, customer rejects)
- **Either party explicitly requests admin mediation** at any point

**Rationale:** Three triggers cover non-response (cleaner ghost), stalemate (offers exhausted), and explicit escalation (when one party wants neutral judgment).

**Action:** Phase 8a `dispute_state` enum includes intermediate states. Auto-escalation cron checks 48h cleaner non-response. Customer rejection counter on dispute_resolutions.

## Lock 3 — Tier 2 admin response SLA

**Decision:** Admin must respond to escalated Tier 2 disputes within **12 hours during business hours** (matches WF 56 header).

**Rationale:** Faster than Tier 1 because customer/cleaner have already been waiting through Tier 1.

**Action:** Phase 8b admin tooling surfaces Tier 2 disputes ordered by escalation time. Pre-breach alert at 8 hours; breach alert at 12 hours.

## Lock 4 — Tier 3 escalation criteria

**Decision:** Tier 2 escalates to Tier 3 when ANY of:
- **Damage claim exceeds $500** (insurance threshold)
- **Theft alleged** (police involvement may be required)
- **Safety incident** (physical confrontation, harassment, threats)
- **Customer or cleaner requests legal review** explicitly

**Rationale:** Four criteria cover insurance triggers, criminal matters, safety, and explicit legal escalation.

**Action:** Phase 8c admin tool flags Tier 3 candidates from Tier 2 mediation interface.

## Lock 5 — Dispute photo retention policy

**Decision:** Photos uploaded as dispute evidence retained for **7 years** post-resolution. Job photos under standard retention (30 days, per WF 29) get a copy migrated to dispute storage at dispute opening.

**Rationale:** Legal retention requirement (statute of limitations on civil claims). Distinct from standard job photos which delete to respect customer privacy.

**Action:** Phase 8a creates `dispute_photos` table separate from `booking_photos`. Photos copied at dispute opening; survive standard retention deletion.

## Lock 6 — Cleaner score impact per Tier 2 outcome

**Decision:** Per WF 57 three-decision options:

| Outcome | Score impact | Tier review trigger? |
|---|---|---|
| Cleaner stands | 0 | No |
| Partial refund (default 25%) | -2 | No (single event) |
| Full refund + strike | -8 | Yes — flag for tier eval at next cron |

**Rationale:** Distinguishes goodwill outcomes (no penalty) from genuinely bad outcomes (significant penalty + tier consequence).

**Action:** Phase 8b dispute resolution handler fires `reliability_event` (Phase 7a integration). Full-refund-plus-strike events flag `tier_assignments.review_required = TRUE`.

## Lock 7 — Refund mechanics by tier

**Decision:**

| Refund context | Money mechanics |
|---|---|
| Tier 1 cleaner-offered refund (any %) | Cleaner-funded — deducted from cleaner balance at next payout |
| Tier 2 partial refund (admin) | Configurable split: cleaner balance + platform absorption (default 50/50) |
| Tier 2 full refund (admin) | Cleaner balance fully clawed back from next payout (cleaner pays for the booking) |
| Tier 2 goodwill credit | Platform absorbs; cleaner unaffected |
| Tier 3 insurance-covered | Insurance payout; cleaner unaffected (assuming no negligence) |

**Rationale:** Aligns financial responsibility with fault. Cleaner pays when responsible; platform absorbs goodwill; insurance covers severe.

**Action:** Phase 9 refund engine implements all 5 paths. Phase 8 routes to correct path per outcome.

## Lock 8 — Anti-dispute-abuse mechanism

**Decision:** Customers with **>30% dispute rate over their last 10 bookings** flagged for admin review. Cleaners with >20% dispute rate over their last 20 bookings flagged.

**Rationale:** Some customers chronically dispute to extract refunds. Some cleaners genuinely produce poor work. Both patterns deserve attention.

**Action:** Phase 8 admin dashboard (extends WF 54) surfaces flagged accounts. Phase 8b admin tooling shows flag context during Tier 2 mediation (per WF 57.2 dispute history display).

---

# Phase 8a — Tier 1 customer/cleaner direct resolution (3 weeks)

**Phase 8a goal:** A customer can open a dispute within 48 hours of approval. They select a category, describe the issue, upload photo evidence. The cleaner sees the dispute in their inbox, responds with an offer (re-clean, partial refund, stand-by-work). The customer accepts or rejects. Tier 1 resolves cleanly when both parties agree. Stalemates auto-escalate to Tier 2.

**Phase 8a depends on:**
- Phase 6f sets `dispute_window_expires_at` on bookings at approval
- Phase 6e photos exist for cleaner-side evidence
- B3 disputes/dispute_messages/dispute_resolutions schema deployed
- Phase 7a `recordReliabilityEvent()` dispatcher available (Phase 8a fires score events on resolution)

**Wireframes:** WF 16 (customer dispute initiation), WF 17 (cleaner dispute response).

**Sub-sections of 8a:**

## 8a-1 — Customer dispute initiation (WF 16)

### Goal
A customer in the 48-hour post-approval window can open a dispute from booking detail. They select a category, write a description, upload up to 5 photos as evidence, specify desired outcome.

### Design

**Decisions to make:**

1. **Dispute categories:** `quality` / `damage` / `missing_item` / `no_show_or_partial` / `safety` / `other`. Lock in spec; map to B3 enum.

2. **Desired outcome options:** `re_clean` / `partial_refund` / `full_refund` / `replacement_or_compensation` / `cleaner_review` (just want it documented). Customer picks one.

3. **Photo upload limit:** 5 photos max for evidence (matches WF 16). Each photo stored separately in `dispute_photos` table (per Lock 5).

4. **Description length:** 50-2000 characters (matches WF 16 form sizing). Required field.

5. **Window enforcement:** Server-side check on creation: `bookings.dispute_window_expires_at > NOW()`. If expired, return 410 Gone with link to support.

6. **State machine:** Dispute starts in `tier_1_pending_response` state (cleaner hasn't seen yet). Notification fires to cleaner.

### Build

- `/booking/[id]/dispute/open` route
- `DisputeCategorySelect` component
- `DisputeDescriptionForm` component
- `DisputePhotoUpload` component (5-photo limit)
- `DesiredOutcomeRadio` component
- Server action: `createDispute()` — validates window, inserts dispute + dispute_photos rows
- Notification trigger to cleaner

### Verify

- Customer within 48h window opens dispute → row in `disputes` + photos in `dispute_photos`
- Customer past 48h window → 410 Gone with support link
- Cleaner notified within seconds of dispute opening
- Photos uploaded successfully (test 5 photos at once, ~5 MB each)

## 8a-2 — Cleaner dispute response (WF 17)

### Goal
Cleaner sees dispute in inbox. Reviews customer's claim + evidence. Responds with one of four offer types: re-clean, partial refund (specify amount), stand-by-work (no refund), or escalate to admin.

### Design

1. **Cleaner response options:**
   - **Re-clean** — propose specific time within 7 days
   - **Partial refund** — specify % or dollar amount
   - **Stand by work** — assert work was complete; no refund
   - **Escalate to admin** — explicit Tier 2 request

2. **Cleaner response window:** 48 hours from dispute opening to respond. Past 48h without response = auto-escalate to Tier 2 (Lock 2).

3. **Cleaner can include photos in response.** Cleaner's clock-out photos already attached automatically (per WF 17). Cleaner can upload additional context photos.

4. **Cleaner response message** — required text explaining their position.

5. **State transition:**
   - Re-clean offered → `tier_1_re_clean_offered`
   - Partial refund offered → `tier_1_partial_refund_offered`
   - Stand by work → `tier_1_cleaner_stands`
   - Escalate → `tier_2_mediation`

### Build

- `/cleaner/disputes/[id]` route
- `DisputeClaimDisplay` component (customer's claim + photos)
- `CleanerResponseForm` component (4 options)
- `RescheduleProposalForm` component (re-clean specifically)
- `RefundOfferForm` component (partial refund specifically)
- Server action: `respondToDispute()` — validates timing, creates dispute_resolution row
- Notification trigger to customer

### Verify

- Cleaner sees dispute in inbox immediately
- Each response type creates correct dispute_resolution row
- 48h cron auto-escalates non-response disputes
- Customer notified of cleaner response within seconds

## 8a-3 — Customer accept/reject + Tier 1 resolution

### Goal
Customer sees cleaner's offer. Accepts → Tier 1 resolves. Rejects → cleaner can offer different resolution OR escalation triggers.

### Design

1. **Customer response options:**
   - **Accept offer** — Tier 1 resolves; refund processed (if applicable); state → `resolved`
   - **Counter-propose** — limited use (1 counter only); cleaner sees counter offer
   - **Reject and escalate** — explicit Tier 2 request
   - **Reject and request alternative** — cleaner gets one more chance to offer

2. **Two-rejection rule (Lock 2):** Customer can reject cleaner's offers twice. Third disagreement auto-escalates to Tier 2.

3. **Acceptance triggers:**
   - Re-clean accepted → schedule new booking instance for proposed time
   - Partial refund accepted → Phase 9 partial refund processed
   - Cleaner stands accepted → no money moves; dispute closes (rare — usually means customer was just venting)

4. **Resolution event:** `dispute_resolutions` row marked `accepted_at` + final state.

5. **Score event fires** on resolution (Phase 7a integration):
   - Cleaner stands accepted → no impact
   - Partial refund accepted → -1 (small)
   - Re-clean accepted → 0 (good faith resolution)

### Build

- `/booking/[id]/dispute/[id]/respond` customer-side route
- `OfferReviewDisplay` component
- `AcceptOfferAction` + `RejectOfferAction` server actions
- Re-clean booking creation (reuses Phase 6a booking creation flow)
- Phase 9 partial refund integration
- Phase 7a score event firing

### Verify

- Customer accepts re-clean → new booking created, original marked `resolved_via_reclean`
- Customer accepts partial refund → Phase 9 processes; cleaner balance updated
- Two customer rejections → auto-escalate to Tier 2
- Phase 7a score events fire correctly per outcome

## 8a-4 — Dispute message thread

### Goal
Throughout Tier 1, customer + cleaner can exchange messages within the dispute thread. This is separate from booking messages (Phase 6b) — dispute thread has admin-readable visibility for potential escalation.

### Design

1. **Dispute messages distinct from booking messages.** Dispute thread is admin-readable; booking thread is not (per WF 64 + Lock 8 anti-abuse). When dispute opens, conversation should move to dispute thread.

2. **Real-time delivery** via Supabase Realtime, scoped by dispute_id.

3. **Read receipts** on dispute messages.

4. **B3 has `dispute_messages` table.** Phase 8a wires application.

5. **Visibility:** Customer + cleaner during Tier 1. Admin added at Tier 2 escalation.

### Build

- `DisputeMessageThread` component
- `DisputeMessageInput` component
- Realtime subscription
- Server action: `sendDisputeMessage()`

### Verify

- Customer sends dispute message → cleaner sees in real-time
- Read receipts update
- RLS: only parties + admin (post-escalation) can read

## 8a-5 — Auto-escalation cron

### Goal
A cron checks every 15 minutes for disputes that should auto-escalate. Three triggers (Lock 2): cleaner non-response 48h, customer two-rejection, explicit request.

### Design

1. **Cron cadence:** Every 15 minutes. Faster than score recalc because dispute timing matters more.

2. **Triggers checked:**
   - `dispute_state = tier_1_pending_response` AND `created_at < NOW() - INTERVAL '48 hours'`
   - `dispute_state IN (tier_1_re_clean_offered, tier_1_partial_refund_offered)` AND customer rejection count >= 2
   - Explicit escalation requests (any state)

3. **Escalation action:**
   - Update dispute state to `tier_2_mediation`
   - Insert event row for audit
   - Notify both parties + admin queue
   - Set `escalated_at` timestamp for SLA tracking

### Build

- `jobs/dispute_auto_escalation.ts` — cron handler
- Tier 2 admin notification
- Customer + cleaner "your dispute is being reviewed by admin" notification

### Verify

- 48h cleaner non-response → auto-escalate within 15 min of threshold
- Two customer rejections → auto-escalate immediately on second rejection
- Explicit escalation → immediate

---

# Phase 8b — Tier 2 admin mediation (1.5 weeks)

**Phase 8b goal:** Admin sees escalated disputes in queue. Reviews full evidence (both parties' photos, full message thread, booking history, parties' reliability context). Makes one of three decisions per WF 57: cleaner stands, partial refund, full refund + strike. Decision rationale visible to both parties. Phase 9 refund + Phase 7a score events fire.

**Wireframes:** WF 56 (active disputes list), WF 57 (admin mediation interface).

## 8b-1 — Admin disputes list (WF 56)

### Goal
Admin sees all active and recently resolved disputes. Tier-filtered tabs. SLA-driven prioritization.

### Design

1. **Tab filters:** Active (Tier 2/3) / Direct resolution (Tier 1) / Resolved / All.

2. **Sort default:** SLA breach proximity. Disputes closest to 12-hour Tier 2 breach surface first.

3. **Per-row info (matches WF 56):**
   - Booking ID + parties + service
   - Customer reliability context (good standing / flagged / disputes history)
   - Cleaner tier + rating
   - Dispute type + stage
   - Open for (age) — counted from `escalated_at` for Tier 2
   - Action button (Mediate / View)

4. **Recent resolved table** below active for context (matches WF 56). Helps admin spot patterns.

### Build

- `/admin/disputes` route (extends Phase 4 admin sidebar)
- `DisputesList` component with tab filter
- `DisputeRow` component
- `RecentResolvedDisputesPanel` component

### Verify

- All active Tier 2 disputes show with correct age + SLA highlight
- Tab filter works
- Click "Mediate" → opens WF 57

## 8b-2 — Admin mediation interface (WF 57)

### Goal
The most consequential single admin screen. Full evidence + decision UI for resolving a Tier 2 dispute. Admin sees parties context, customer claim, photo evidence (both sides), full message thread, makes a decision with required rationale, submits.

### Design

1. **Layout (matches WF 57):**
   - Header: dispute meta (booking ID, type, age)
   - Parties summary: customer reliability + cleaner reliability + booking financial
   - Customer's claim (quoted)
   - Photo evidence grid (customer + cleaner organized by room)
   - Full message thread (Tier 1 conversation history)
   - Decision panel (3 options)
   - Rationale text input (required, visible to both parties)
   - Audit timeline

2. **Three decision options (locked in Lock 6):**
   - Cleaner stands → no refund, no score impact
   - Partial refund (default 25%, custom amount allowed) → small refund + small score impact
   - Full refund + strike → full refund + significant score impact + tier review flag

3. **Custom partial refund amount.** Admin can override default 25% with any percentage 0-100% or specific dollar amount.

4. **Rationale required.** Text field, 50-1000 chars. Visible to both parties post-decision (per WF 57.7).

5. **Save draft option.** Complex disputes may need research. Admin saves partial state + returns later. Doesn't trigger refund/notifications until "Submit decision" pressed.

### Build

- `/admin/disputes/[id]/mediate` route
- `DisputePartiesSummary` component
- `PhotoEvidenceGrid` component (with room grouping)
- `DisputeMessageThreadDisplay` component (read-only for admin)
- `DecisionRadioPanel` component (3 options + custom % input)
- `RationaleInput` component (required text)
- `DisputeAuditTimeline` component
- Server action: `submitDisputeDecision()` — orchestrates refund + score event + notifications + state transition + audit log

### Verify

- All evidence renders correctly (test with disputes that have 5+ photos per side)
- Decision submission triggers correct downstream actions
- Save draft preserves state without firing actions
- Both parties receive notification with decision + rationale

## 8b-3 — Tier 2 SLA tracking + alerts

### Goal
Tier 2 SLA breaches don't go silent. Admin gets pre-breach + breach alerts. Dashboard surfaces SLA-at-risk disputes.

### Design

1. **SLA windows (Lock 3):**
   - Tier 2: 12 hours during business hours
   - Pre-breach alert at 8 hours
   - Breach alert at 12 hours

2. **Business hours definition:** 9 AM - 6 PM Pacific weekdays. Outside = pause. So a dispute escalated Friday 5 PM has SLA running 5-6 PM Friday + Monday 9 AM-noon = 4 hours used by Monday noon.

3. **Cron cadence:** every 30 minutes during business hours.

4. **Alert delivery:** Push + email to admin on duty.

### Build

- `jobs/dispute_sla_tracker.ts`
- Business hours calculation utility
- Admin push + email notification

### Verify

- Dispute escalated Monday 9 AM → 8h alert at Monday 5 PM; 12h alert at Tuesday 9 AM
- Friday 4 PM escalation pauses over weekend; resumes Monday 9 AM

---

# Phase 8c — Tier 3 escalation + closeout (1 week)

**Phase 8c goal:** Tier 3 disputes (insurance / legal / safety) flag for human review. Insurance partner notified for damage claims >$500. Legal review path for theft/safety. Police involvement coordinated for criminal matters. Phase 8 verification.

**Wireframes:** Limited explicit wireframes (WF 47.3.3 emergency report touches this).

## 8c-1 — Tier 3 escalation triggers (Lock 4)

### Goal
Admin during Tier 2 mediation can flag a dispute for Tier 3 escalation. Automatic flagging based on damage amount or category.

### Design

1. **Auto-flag triggers:**
   - Damage claim category + amount > $500 → auto-flag for Tier 3
   - Safety category → auto-flag immediately
   - Theft category → auto-flag immediately

2. **Manual flag:** Admin during Tier 2 sees "Escalate to Tier 3" button on mediation interface.

3. **Tier 3 flagging actions:**
   - Pause Tier 2 mediation (no decision finalized)
   - Notify insurance partner (email integration)
   - Create `dispute_tier_3_escalations` row with category + reason
   - Both parties notified: "Your dispute requires further review"

### Build

- Tier 3 flag logic in Phase 8b mediation handler
- Insurance partner email template
- New `dispute_tier_3_escalations` table (small — just escalation tracking)
- Tier 3 status surface in admin dashboard

### Verify

- Damage > $500 auto-flags
- Safety category auto-flags
- Manual flag from Tier 2 works
- Both parties notified

## 8c-2 — Insurance partner integration

### Goal
For damage claims, insurance partner receives the case (photos, customer + cleaner statements, financial details). Partner determines coverage. Outcome drives final resolution.

### Design

1. **Partner identified before launch.** Pre-launch task: secure insurance partner. Possibilities: existing platform insurance (e.g., MoneyMutual, ICW Group), or build relationship with cleaning-specific underwriter.

2. **Case package contents:**
   - Booking financial details
   - Customer claim text + photos
   - Cleaner response + clock-out photos
   - Full dispute message history
   - Reliability context for both parties

3. **Partner response captured:** Coverage decision + payout amount + any reasoning.

4. **Outcome routes:**
   - Insurance covers → customer paid by insurance; cleaner unaffected (assumes no negligence)
   - Insurance partial → admin allocates remainder
   - Insurance denies → admin makes final call (Tier 2 outcomes apply)

### Build

- Insurance case package generator (PDF or structured email)
- Email integration for partner submission
- Insurance response capture form (admin enters partner decision)
- Phase 9 insurance payout pathway

### Verify

- Test case package generation with realistic dispute
- Partner receives package successfully
- Response capture flows correctly to final resolution

## 8c-3 — Legal review path

### Goal
For theft, harassment, or other criminal matters, dispute pauses for legal review. Counsel determines whether police involvement, civil action, or platform action is appropriate.

### Design

1. **Lawyer engagement assumed.** Pre-launch lawyer relationship from Phase 4 + Phase 5 work continues here. Tier 3 legal matters route to retained counsel.

2. **Confidentiality:** Tier 3 legal cases visible only to admin + retained counsel. Both parties notified status changes but not internal counsel notes.

3. **Outcome paths:**
   - Police report recommended → admin coordinates with parties
   - Civil action recommended → out of platform scope; both parties retain own counsel
   - No legal action → revert to Tier 2 with legal context

### Build

- Legal review status tracking
- Counsel notification template
- Admin documentation of legal recommendations

### Verify

- Theft category triggers legal review path
- Counsel notified within SLA
- Status updates flow back to admin queue

## 8c-4 — Phase 8 verification + closeout

### Goal
All sub-phases verified end-to-end. Real disputes flowing through Tier 1, escalating to Tier 2, occasionally reaching Tier 3.

### Acceptance criteria

- [ ] Customer can open dispute within 48h window; rejected past window
- [ ] Cleaner receives dispute notification + can respond with all 4 option types
- [ ] Customer accept/reject flow works for all cleaner offer types
- [ ] Two customer rejections auto-escalate to Tier 2
- [ ] 48h cleaner non-response auto-escalates to Tier 2
- [ ] Admin Tier 2 queue surfaces disputes with correct SLA prioritization
- [ ] WF 57 mediation interface renders all evidence + 3 decision options
- [ ] Each decision triggers correct refund + score event + notifications
- [ ] Damage > $500 auto-flags Tier 3
- [ ] Safety/theft categories auto-flag Tier 3
- [ ] Insurance partner integration tested with sample case
- [ ] Legal review path tested
- [ ] Anti-abuse flags surface in admin dashboard for high-dispute customers/cleaners
- [ ] All dispute photos retained 7 years (separate from job photo retention)

### Performance targets

- Auto-escalation cron: <30 seconds per run for 1000 active disputes
- Tier 2 mediation interface load: <500ms p95 (heavy data: photos, messages, audit timeline)
- Dispute creation flow: <800ms p95 (includes photo upload)

---

# Schema additions consolidated (from wireframe deep dive)

B3 schema is largely sufficient. Phase 8 adds:

```sql
-- Dispute photos (separate from booking_photos for retention policy)
CREATE TABLE dispute_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE RESTRICT,
  uploader_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  uploader_role TEXT NOT NULL CHECK (uploader_role IN ('customer', 'cleaner', 'admin')),
  storage_path TEXT NOT NULL,
  caption TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- 7-year retention (Lock 5)
  retention_until TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 years'
);
CREATE INDEX idx_dispute_photos_dispute ON dispute_photos (dispute_id);

-- Tier 3 escalation tracking
CREATE TABLE dispute_tier_3_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL UNIQUE REFERENCES disputes(id) ON DELETE RESTRICT,
  escalation_category TEXT NOT NULL CHECK (escalation_category IN (
    'damage_over_500', 'theft', 'safety', 'legal_request', 'other'
  )),
  flagged_by_admin_id UUID NOT NULL REFERENCES users(id),
  flagged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  insurance_case_submitted_at TIMESTAMPTZ,
  insurance_response_at TIMESTAMPTZ,
  insurance_outcome TEXT CHECK (insurance_outcome IN ('covered', 'partial', 'denied', 'pending')),
  insurance_payout_cents INTEGER,
  legal_review_at TIMESTAMPTZ,
  legal_outcome TEXT,
  resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_tier_3_pending ON dispute_tier_3_escalations (dispute_id)
  WHERE resolved_at IS NULL;

-- Anti-abuse flag tracking (computed fields cached)
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS dispute_rate_last_10 NUMERIC(4,3);
ALTER TABLE cleaner_profiles ADD COLUMN IF NOT EXISTS dispute_rate_last_20 NUMERIC(4,3);
-- Updated by daily cron

-- Bookings dispute window column
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS dispute_window_expires_at TIMESTAMPTZ;
-- Set by Phase 6f at approval time
```

---

# Recommended build order

1. **Phase 8a** (3 weeks) — Tier 1 customer/cleaner. Critical path.
2. **Phase 8b** (1.5 weeks) — Tier 2 admin mediation. Sequential after 8a.
3. **Phase 8c** (1 week) — Tier 3 + closeout.

**Total estimated wall time:** 5-6 weeks.

**Pre-Phase-8 dependencies to confirm:**
- Insurance partner identified + case package format agreed
- Phase 9 refund mechanics specced (8b refund options depend)
- Phase 7a score event dispatcher operational (8a/8b fire events)

This document is the canonical Phase 8 navigation reference. Detailed acceptance criteria + code structure live in per-sub-phase spec files. Plain-English walkthroughs live in per-sub-phase explainer files.
