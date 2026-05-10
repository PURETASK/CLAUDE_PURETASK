# Phase 7b — Plain-English Breakdown

This document walks through `phase-7b-notifications-appeals-spec.md` in plain English.

Phase 7b is **the user-facing layer of the trust system.** Before Phase 7b, Phase 7a's score and tier engine runs silently — cleaners don't know their score changed, don't know they're approaching tier promotion, don't know they're at risk of tier drop. After Phase 7b, every score-impacting event surfaces appropriately, and cleaners have due process via the appeal flow.

The hardest design challenge: **calibrating notification intrusiveness.** Too many notifications = fatigue + ignore. Too few = surprise tier changes. The 4-state model from WF 53 is calibrated to severity.

---

# Section 0 — External account prerequisites

## What it means in plain English

Phase 7b uses Phase 10a notification infrastructure. **No new vendors.**

Lawyer review on tier-drop copy matters because cleaners affected by drops are upset. Bad wording = customer service nightmares + potential discrimination claims.

## Beginner traps

- **Don't write tier-drop copy without lawyer review.** High-risk notification.
- **Don't assume Phase 10a is operational.** Verify dispatcher works first.

---

# Section 1 — Summary

## What it means in plain English

Six things will work:
1. WF 53's 4 notification states wired correctly
2. Causal explanations included
3. Throttling prevents fatigue
4. Tier appeal submission within 48h
5. Admin review with approve/deny/modify
6. Appeal acceptance reverses score events

## Why 4 separate notification states

Severity calibration:
- ±1-2 score = small ripple, push-only
- ±3+ score = noteworthy drop, push + in-app banner
- Tier promotion = celebration moment, full-screen modal
- Tier drop pending = action-required, full-screen + push + email

Each state matches its severity. Reusing same UI for all = blunt instrument.

## Why "appeal acceptance reverses score events"

Phase 7a's `is_overturned` flag was designed for this. When admin approves appeal, specific events flagged. Next score recalc excludes overturned events. Score recovers. Tier reverts.

This means appeals don't manually adjust scores — they correct the underlying events. Audit trail clean.

## Beginner traps

- **Don't fire same notification UI for all 4 states.** Severity matters.
- **Don't manually adjust scores.** Use overturn pattern.

---

# Section 2 — Acceptance criteria

## What it means in plain English

Three groups: notifications, appeal submission, admin review.

### Notifications

The 4-state matrix is locked. Test each state with realistic Phase 7a triggers. Verify push + email + in-app channels respect Phase 10a preferences.

Throttling: 5+ small same-direction events per day = batched. Without this, cleaner gets 10 push notifications saying "+1." Annoying.

Pause-on-drop: once tier drop warning issued, suppress small-positive notifications during 48h appeal window. Mixed signals are confusing.

### Appeal submission

48h window enforced server-side. Don't trust client clock.

One-free-per-drop: cleaner gets ONE appeal per tier_assignment row. Subsequent attempts blocked.

Drop pause: appeal submission flips `pending_drop_appeal_id` flag. Tier eval cron skips this cleaner.

### Admin review

Three decisions: approve / deny / modify.
- Approve: events overturned, score recalcs, tier reverts.
- Deny: drop proceeds; cleaner notified with reason.
- Modify: partial overturn (specific events).

Decision rationale required (50-1000 chars). Visible to cleaner. Provides transparency.

### Cross-cutting

80% test coverage. Audit logging for compliance.

## Beginner traps

- **Don't trust client time for 48h window.** Server-side only.
- **Don't allow second appeal on same drop.** Once-only rule.
- **Don't skip rationale.** Cleaner deserves explanation.

---

# Section 3 — Database state required

## What it means in plain English

B4 has `cleaner_appeals` already. Phase 7b adds:
- `appeal_category` enum
- `admin_decision`, `admin_decision_rationale`, `admin_decision_by`, `admin_decided_at`
- `notification_batch_log` table (tracks batched notifications to avoid double-flush)

### Why notification_batch_log

Without it, 5 small +1 events at 3 PM trigger batch at 3:30. Another 5 at 4 PM trigger batch at 4:30. Cron might overlap and double-fire.

Log tracks dispatch state. Cron checks before re-dispatching.

## Beginner traps

- **Don't UPDATE batch log entries.** New row per batch.
- **Don't forget RLS on appeals.** Cleaner reads own; admin reads all.

---

# Section 4 — Files to create

## What it means in plain English

~25 files. Heavy on UI (8 components for cleaner + admin sides) plus library code (6 files).

### Why split cleaner + admin UI

Different users, different concerns:
- Cleaner UI: friendly, supportive, action-clear (submit appeal)
- Admin UI: data-rich, decision-focused (review history, choose outcome)

Shared components don't fit cleanly.

### Why heavy library code

Notification dispatch + throttling + appeal processing + overturn handling = lots of orchestration. Pure functions where possible. Tested.

## Beginner traps

- **Don't share UI components between cleaner and admin.** Different needs.
- **Don't put dispatch logic in components.** Library code.

---

# Section 5 — Implementation order

## What it means in plain English

8 days. Sequential:
- Days 1-3: notifications
- Days 4-5: cleaner appeal submission
- Days 6-7: admin review
- Day 8: closeout

## Why this order

Notifications are the trigger. Without them, cleaner doesn't know tier drop pending. Without that, no appeals.

Cleaner-side appeal flow before admin review because cleaner submits before admin reviews.

## Beginner traps

- **Don't build admin UI before cleaner submission works.** No data to review.

---

# Section 6 — Specific gotchas

## What it means in plain English

8 gotchas:

### A — Notification at 4 AM
Tier eval cron runs at 4 AM; warning fires; cleaner asleep. **Fix:** Phase 10a quiet hours respected for push; email still fires.

### B — Appeal at hour 49
Network down day 1; submits late. **Fix:** strict 48h with logged attempts; document.

### C — Multiple events overturned
Single appeal references multiple events. **Fix:** `event_ids` JSONB array; atomic overturn.

### D — Tier reverts but 14-day gate?
Appeal approved; score recovers. **Fix:** appeal-driven revert bypasses gate.

### E — Admin queue overflow
Crisis causes mass appeals. **Fix:** bulk-handle with shared rationale.

### F — Cleaner misses notifications
Push denied + email in spam. **Fix:** multiple channels; critical override.

### G — Cron-detected drop fires during appeal
Race between cron and pause logic. **Fix:** cron checks active appeals first.

### H — Admin denies but score recovered naturally
Drop forced regardless? **Fix:** re-evaluate with current score; don't force.

## Why these matter

Phase 7b touches livelihoods. Bugs cause real harm.

## Beginner traps

- **Don't trust async timing.** Race conditions surface here.
- **Don't override natural recovery.** Re-evaluate state.

---

# Section 7 — Testing strategy

Standard layers. Real device testing for notification reception. Edge cases at 48h boundary critical.

## Beginner traps

- **Don't skip 48h boundary tests.** Off-by-one bugs.

---

# Section 8 — Deployment plan

Standard. Lawyer copy review pre-deploy critical. Monitor 7 days closely.

---

# Section 9 — Handoff

Phase 7b output for Phase 7c — no direct dependency. Both consume Phase 7a independently.

---

# Section 10 — Open questions

1. Appeal grace period (strict 48h recommended)
2. Bulk admin handling (defer)
3. "Restored after appeal" cosmetic badge (defer)

---

# Notes on what comes next

Phase 7c (badges) — parallel with 7b after 7a complete.

Phase 7b is sensitive — tier changes affect cleaner livelihood. Get this right.

---

This walkthrough is the Phase 7b learning document.
