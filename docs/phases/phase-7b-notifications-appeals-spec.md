# Phase 7b — Score Notifications + Appeals Specification

> **Author note (transparency):** This spec is being written ahead of when Phase 7b will actually be built. The spec is correct as of the current date but will need a refresh when implementation actually starts, particularly for: notification batching tuning based on cleaner feedback, appeal acceptance rates, admin review SLA actuals, and notification copy lawyer review for sensitive score-drop scenarios. Treat this as an aggressive draft.

**Phase goal:** When score-impacting events fire from Phase 7a, cleaners get appropriate notifications. The 4 notification states from WF 53 are wired (small positive, drop, tier promotion, tier drop warning). Tier appeal flow works end-to-end: cleaner submits appeal within 48h → admin reviews → outcome routes back to cleaner. Appeal acceptance reverses the score event via `is_overturned` flag in Phase 7a.

**Estimated duration:** ~1.5 weeks of focused engineering (8 working days).

**Depends on:**
- Phase 7a complete (score events flow; tier transitions fire; pre-warning flagging works)
- Phase 10a notification dispatcher operational (or stubbed)
- B4 schema deployed (`reliability_events`, `tier_assignments`, `cleaner_appeals` tables)
- Admin tooling foundation from Phase 4

**Wireframes covered:** WF 53 (4 notification states), WF 19 (notification center cleaner-side), WF 53.4.1 (appeal submission flow).

**Phase 7b sub-sections (sequential):**

- **7b-1** — Score event notifications (WF 53 patterns) (~3 days)
- **7b-2** — Tier appeal submission (WF 53.4.1) (~2 days)
- **7b-3** — Admin appeal review (~2 days)
- **Closeout + integration** (~1 day)

---

## 0. External account prerequisites

Phase 7b has **no new vendors.** Uses Phase 10a notification infrastructure.

### 0.1 Verify Phase 10a categories

Phase 10a defines 8 notification categories. Phase 7b primarily uses `score_tier`. Verify category exists + has correct templates set up.

### 0.2 Lawyer review on tier-drop copy

Tier drop notifications go to upset cleaners affecting their livelihood. Lawyer-review the copy before launch:
- Cause attribution wording
- Appeal process language
- 48-hour deadline framing
- Tone (factual but supportive, not accusatory)

---

## 1. Summary

Phase 7b is **the user-facing layer of the trust system.** Concretely, by the end of Phase 7b:

1. **Score change notifications fire correctly per WF 53.** Small change = push only. Score drop = push + in-app banner. Tier promotion = full-screen modal + push. Tier drop pending = full-screen modal + push + email.

2. **Causal explanations included.** "Sarah K. left a 5-star review" not "Your score went up."

3. **Throttling prevents notification fatigue.** 5+ small same-direction events per day batch into one summary.

4. **Tier appeal submission works.** Cleaner with pending tier drop submits one-paragraph appeal within 48h. One-free-per-drop limit. Drop pauses on submission.

5. **Admin appeal review works.** Admin sees queue. Reviews context. Decides approve / deny / modify. Decision rationale visible to cleaner.

6. **Appeal-accepted reverses score events.** Phase 7a's `is_overturned` flag set; next score recalc excludes overturned events; tier reverts.

What Phase 7b does NOT do:
- Build score recalc cron (Phase 7a)
- Build tier eval cron (Phase 7a)
- Build badges (Phase 7c)

---

## 2. Acceptance criteria

### 7b-1 Score event notifications

- [ ] Single +1 score event → push only with cause text
- [ ] Single -3 score event → push + in-app banner
- [ ] Tier promotion → full-screen modal on next app open + push immediately
- [ ] Tier drop pending → full-screen modal + push + email; 48h countdown visible
- [ ] Score drop notifications include "See details" link to WF 2c
- [ ] 5+ small same-day same-direction events batch into single summary at end-of-day
- [ ] Once tier drop warning issued, small-positive notifications suppressed during 48h appeal window
- [ ] Causal text reads from event metadata correctly

### 7b-2 Tier appeal submission

- [ ] `/cleaner/appeals/submit/[tier_assignment_id]` route accessible only to affected cleaner
- [ ] 48-hour window enforced server-side
- [ ] Submission form: category radio (medical / family / customer issue / other) + textarea (max 500 chars)
- [ ] Submit → `cleaner_appeals` row inserted with `tier_assignment_id` reference
- [ ] On submission: `tier_assignments.pending_drop_appeal_id` set
- [ ] Tier drop paused: tier evaluation cron skips this cleaner until appeal resolves
- [ ] Cleaner attempts second appeal on same drop → 409 Conflict ("Appeal already submitted")
- [ ] 48h passes without appeal → tier drop proceeds

### 7b-3 Admin appeal review

- [ ] Admin queue accessible at `/admin/appeals`
- [ ] List pending appeals with cleaner info, drop reason, appeal text, time remaining
- [ ] Review interface shows: cleaner history (recent events), tier change context, full appeal text
- [ ] Three decision options: approve / deny / modify
- [ ] Approve: relevant `reliability_events` flagged `is_overturned = TRUE`; score recalcs; tier reverts
- [ ] Deny: drop proceeds; cleaner notified with admin reason
- [ ] Modify: partial overturn (specific events only); custom outcome
- [ ] Decision rationale required (50-1000 chars); visible to cleaner post-decision
- [ ] Cleaner notification fires within seconds of decision

### Cross-cutting

- [ ] All Phase 7b code has unit tests; coverage ≥80%
- [ ] RLS: cleaner reads/writes own appeals; admin reads all
- [ ] All transitions logged in audit table

---

## 3. Database state required

### Existing tables

- `cleaner_appeals` (B4) — sufficient
- `tier_assignments` (B4) — has `pending_drop_warned_at` and `pending_drop_appeal_id` from Phase 7a

### New migrations (Phase 7b)

```sql
-- Phase 7b migration

-- Appeal categories enforcement
ALTER TABLE cleaner_appeals
  ADD COLUMN IF NOT EXISTS appeal_category TEXT NOT NULL DEFAULT 'other'
  CHECK (appeal_category IN ('medical', 'family', 'customer_issue', 'platform_error', 'other'));

-- Admin decision tracking
ALTER TABLE cleaner_appeals
  ADD COLUMN IF NOT EXISTS admin_decision TEXT
  CHECK (admin_decision IN ('approved', 'denied', 'modified'));
ALTER TABLE cleaner_appeals
  ADD COLUMN IF NOT EXISTS admin_decision_rationale TEXT;
ALTER TABLE cleaner_appeals
  ADD COLUMN IF NOT EXISTS admin_decision_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE cleaner_appeals
  ADD COLUMN IF NOT EXISTS admin_decided_at TIMESTAMPTZ;

-- Notification batch tracking (so we don't double-batch)
CREATE TABLE notification_batch_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  batch_window_start TIMESTAMPTZ NOT NULL,
  batch_window_end TIMESTAMPTZ NOT NULL,
  event_count INTEGER NOT NULL,
  net_score_delta INTEGER NOT NULL,
  dispatched_at TIMESTAMPTZ
);
CREATE INDEX idx_batch_log_pending ON notification_batch_log (user_id, batch_window_end) 
  WHERE dispatched_at IS NULL;
```

### RLS policies

```sql
ALTER TABLE cleaner_appeals ENABLE ROW LEVEL SECURITY;
CREATE POLICY appeals_cleaner_own ON cleaner_appeals
  FOR ALL USING (
    cleaner_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
```

---

## 4. Files to create

### App routes (~3 files)

- `/app/cleaner/appeals/submit/[tier_assignment_id]/page.tsx` — WF 53.4.1
- `/app/cleaner/appeals/[appeal_id]/page.tsx` — appeal status / outcome view
- `/app/admin/appeals/page.tsx` — admin queue

### Components — Cleaner side (~4 files)

- `/features/appeals/components/AppealSubmissionForm.tsx`
- `/features/appeals/components/AppealCategorySelector.tsx`
- `/features/appeals/components/AppealStatusCard.tsx`
- `/features/appeals/components/AppealCountdownTimer.tsx` — 48h visible

### Components — Admin side (~4 files)

- `/features/appeals/admin/AppealsQueue.tsx`
- `/features/appeals/admin/AppealReviewInterface.tsx`
- `/features/appeals/admin/CleanerHistoryPanel.tsx`
- `/features/appeals/admin/DecisionRationaleInput.tsx`

### Library code (~6 files)

- `/lib/reliability/notification_dispatcher.ts` — maps event → notification template
- `/lib/reliability/notification_throttler.ts` — same-direction batching
- `/lib/reliability/appeal_submission_processor.ts` — validates window + inserts appeal
- `/lib/reliability/appeal_decision_processor.ts` — admin decision handling
- `/lib/reliability/event_overturn_handler.ts` — flags events overturned + triggers recalc
- `/lib/reliability/tier_drop_pause_check.ts` — pauses drop pending appeal

### Server actions (~5 files)

- `/app/api/cleaner/appeals/submit/route.ts` — POST appeal
- `/app/api/admin/appeals/[id]/decide/route.ts` — POST admin decision
- `/app/api/admin/appeals/queue/route.ts` — GET pending appeals
- `/app/api/admin/appeals/[id]/cleaner-context/route.ts` — GET cleaner history
- `/app/api/notifications/batch-dispatcher/route.ts` — internal endpoint for batch cron

### Background jobs (~1 file)

- `/jobs/notification_batch_dispatcher_cron.ts` — every 30 min batch flush

### Phase 7a + 10a integration

- Phase 7a: tier drop pre-warning fires Phase 7b notification
- Phase 7a: tier promotion fires Phase 7b celebration
- Phase 10a: all notifications use `dispatchNotification()` with `score_tier` category

### Database migrations (1 file)

- `migrations/2026XXXXXX_phase_7b_schema.sql`

### Docs (3 files)

- (Phase 7 overview already exists)
- `phase-7b-notifications-appeals-spec.md` — this file
- `phase-7b-notifications-appeals-walkthrough.md`

---

## 5. Implementation order

### 7b-1 — Score event notifications (~3 days)

**Day 1 — Notification dispatcher library.** Build `lib/reliability/notification_dispatcher.ts`. Map event types to template keys. Test all 4 WF 53 states.

**Day 2 — Throttling + batching.** Build `lib/reliability/notification_throttler.ts`. Same-direction same-day batching. Cron for batch flush.

**Day 3 — Templates + Phase 7a integration.** Wire Phase 7a tier transition events to fire WF 53 notifications. Test all 4 states with real Phase 7a triggers.

### 7b-2 — Tier appeal submission (~2 days)

**Day 4 — Appeal submission flow.** WF 53.4.1 form. Server action with 48h window enforcement. One-free-per-drop check.

**Day 5 — Tier drop pause integration.** Wire `pending_drop_appeal_id` setting. Phase 7a tier eval cron skips paused cleaners.

### 7b-3 — Admin appeal review (~2 days)

**Day 6 — Admin queue + review interface.** `/admin/appeals` queue. Review interface with cleaner context.

**Day 7 — Decision processing + overturn handler.** Approve/deny/modify decision flow. Phase 7a `is_overturned` integration. Cleaner notification.

### Closeout (~1 day)

**Day 8 — End-to-end integration.** Full flow: tier drop pre-warning → cleaner notification → appeal submission → admin review → decision → outcome notification.

---

## 6. Specific gotchas

### Gotcha A — Notification timing during off-hours

**The problem:** Tier drop warning fires at 4 AM Pacific (when Phase 7a tier eval cron runs). Cleaner asleep. Wakes up to alarming push.

**The fix:** Phase 10a quiet hours respected. If tier drop warning falls during cleaner's quiet hours, push delays until quiet hours end. Email still fires (less intrusive).

### Gotcha B — Appeal submission past 48h

**The problem:** Cleaner's network was down day 1 of pending drop. Submits appeal hour 49. Server rejects. Cleaner blames platform.

**The fix:** Server-side strict 48h enforcement, but log attempt with reason. If frequent edge cases (network outages), consider 1-hour grace period documented in WF 53.4.1 fine print.

### Gotcha C — Multiple events overturned together

**The problem:** Cleaner appealed tier drop caused by 3 specific reliability_events. Admin approves. Phase 7a needs to flag all 3 events overturned, not just one.

**The fix:** Appeal references specific events via `cleaner_appeals.event_ids` JSONB array. Admin decision overturns all referenced events atomically.

### Gotcha D — Tier reverts but not promoted

**The problem:** Appeal approved. Score recalcs. Score back above tier band threshold. But Phase 7a 14-day gate would normally apply — does it apply here?

**The fix:** Appeal-driven tier revert bypasses the 14-day gate. Cleaner returns to previous tier immediately. Document in spec.

### Gotcha E — Admin queue overflow

**The problem:** During platform crisis (e.g., Stripe outage causing many false late-arrival events), 100 cleaners submit appeals simultaneously. Admin overwhelmed.

**The fix:** Bulk-handle appeals from same root cause. Admin can mark multiple appeals "Approved due to platform outage" with shared rationale.

### Gotcha F — Cleaner doesn't see tier drop warning

**The problem:** Push permission denied + email in spam. Cleaner unaware of pending drop. 48h passes. Drop happens. Surprised cleaner.

**The fix:** Multiple notification channels (push + email + in-app modal). Phase 10a critical category override ensures delivery. Document expectation.

### Gotcha G — Appeal submission doesn't pause cron-detected drop

**The problem:** Cleaner submits appeal hour 47 of 48h window. Tier eval cron runs hour 48. Drop fires before pause logic catches up.

**The fix:** Tier eval cron checks for active appeals at start. Skip cleaners with pending appeals. Double-check in transaction.

### Gotcha H — Admin denies but cleaner score recovers naturally

**The problem:** Admin denies appeal. Drop proceeds. But by hour 48 + admin decision delay, cleaner has new positive events bringing score back above threshold.

**The fix:** Admin denial doesn't force drop. Phase 7a tier eval re-evaluates with current score. If criteria no longer met for drop, drop doesn't fire.

---

## 7. Testing strategy

### Unit tests

- `lib/reliability/notification_dispatcher.ts`: each event type → correct template
- `lib/reliability/notification_throttler.ts`: 5+ event batching
- `lib/reliability/appeal_submission_processor.ts`: window enforcement, double-submission block
- `lib/reliability/event_overturn_handler.ts`: multi-event overturn

### Integration tests

- Tier drop warning → cleaner notification → appeal submission → admin review → decision → cleaner notification
- Appeal-approved → events overturned → score recalc → tier reverts
- 48h passes without appeal → drop proceeds normally

### Manual QA

- Real cleaner devices (push + email + in-app)
- Admin queue UI on staging with multiple pending appeals
- Edge cases: appeal at hour 47:59, admin decision overlap

---

## 8. Deployment plan

### Pre-deploy
- [ ] Phase 7a operational with score events firing
- [ ] Phase 10a notification dispatcher operational
- [ ] Lawyer copy review for tier drop notification
- [ ] Admin tooling foundation ready

### Deployment order
1. Migrations
2. Library code
3. Cleaner-side UI (appeal submission)
4. Admin UI (queue + review)
5. Cron activation
6. Phase 7a integration sweep
7. Soft launch: 7 days monitoring

### Rollback
- App code revert if bugs surface
- Don't roll back schema (appeal audit integrity)

---

## 9. Phase 7b → Phase 7c handoff

Phase 7b output ready for Phase 7c:
- Score events flowing → Phase 7c badge calculator can read score data
- Tier transitions firing → Phase 7c can use tier as Match Score multiplier
- No direct dependency between 7b and 7c (both consume 7a)

---

## 10. Open questions

1. **Appeal submission grace period.** 48h strict or 1-hour grace? Recommendation: strict; document.
2. **Bulk appeal handling.** Admin tooling for shared-rationale bulk approve? Defer to Phase 11+ unless volume demands.
3. **Appeal approval cosmetic feedback.** Restored tier shows "Restored after appeal" badge for transparency? Defer.

---

This spec is the canonical Phase 7b build reference. Walkthrough lives in `phase-7b-notifications-appeals-walkthrough.md`.
