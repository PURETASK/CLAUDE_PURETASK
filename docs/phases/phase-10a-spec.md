# Phase 10a — Notification Infrastructure Specification

> **Author note (transparency):** This spec is being written ahead of when Phase 10a will actually be built — minimum 14-18 weeks from now (after Phase 6-9 sub-phases producing notification stub trigger points). The spec is correct as of the current date but will need a refresh when implementation actually starts, particularly for: FCM API version specifics, Resend's deliverability behavior at PureTask's actual scale, and notification batching tuning based on observed user response rates. Treat this document as an **aggressive draft**.

**Phase goal:** A unified notification dispatcher accepts events from Phase 6/7/8/9 sub-phases and delivers via push + email + in-app per user preferences. WF 19 cleaner-side notification center renders real notifications. WF 28 settings allow users to configure preferences per category × channel. Push permission flow (WF 37) wired correctly. All Phase 6-9 notification stubs replaced with real dispatcher calls.

**Estimated duration:** ~2 weeks of focused engineering (10 working days).

**Depends on:**
- Phase 6/7/8/9 stub trigger points exist (calls to `dispatchNotification()` exist but not wired)
- B6 schema deployed (notifications, notification_preferences, notification_deliveries tables exist)
- Firebase project provisioned + FCM credentials
- Resend account verified + DNS records added
- DKIM + SPF + DMARC records validated for sending domain
- At least 5 active users with push tokens (test deliveries)

**Wireframes covered:** WF 19 (notification center cleaner-side), WF 28 (notification preferences settings), WF 37 (push permission), WF 53 (4 score notification states from Phase 7b).

**Phase 10a sub-sections (mostly sequential):**

- **10a-1** — Push + email service setup + verification (~2 days)
- **10a-2** — Notification dispatcher + templates (~3 days)
- **10a-3** — User preferences + in-app notification center (WF 19, WF 28) (~3 days)
- **10a-4** — Batching, throttling, Phase 6-9 integration sweep (~2 days)

---

## 0. External account prerequisites

Phase 10a is **the most external-service-heavy phase since Phase 4**. Two new vendor relationships required:

### 0.1 Firebase / FCM setup

**Required actions:**

1. **Create Firebase project** for PureTask. Enable Cloud Messaging API.

2. **iOS APNs configuration.** Even if using Expo/cross-platform, iOS push requires APNs certificate or auth key uploaded to Firebase. Generate Apple Push Notification key from Apple Developer console. Upload to Firebase.

3. **Android FCM configuration.** Already enabled by default in Firebase project.

4. **Service account credentials.** Generate Firebase service account JSON. Store securely in environment variables (not in repo).

5. **Test push delivery.** Hello-world push to a test device before writing application code.

**Common pitfalls:**
- iOS push doesn't work without APNs key uploaded
- Service account JSON must NOT be committed to git
- Test on real devices (push notifications don't work in simulators reliably)

### 0.2 Resend setup

**Required actions:**

1. **Resend account creation** at resend.com.

2. **Domain verification.** Add `notifications.puretask.co` (subdomain) to Resend.

3. **DNS records.** Add to puretask.co DNS:
   - SPF record: `v=spf1 include:resend.com ~all`
   - DKIM records (Resend provides 3 CNAME records)
   - DMARC record: `v=DMARC1; p=none; rua=mailto:dmarc@puretask.co`

4. **API key.** Generate Resend API key. Store in environment variables.

5. **Test email delivery.** Hello-world email to test inbox. Verify DKIM passes (check headers).

**Common pitfalls:**
- DKIM records can take 24 hours to propagate. Plan ahead.
- Sending from an unverified domain = emails go to spam.
- Don't use a personal Gmail address as the sender; deliverability poor.

### 0.3 Lawyer items

Phase 10a doesn't trigger new lawyer items beyond what's already PENDING:
- Notification copy lawyer-reviewed for sensitive categories (dispute, payment) — confirmed by Phase 8/9 specs

---

## 1. Summary

Phase 10a is **the platform's communication infrastructure.** Concretely, by the end of Phase 10a:

1. **Notification dispatcher operational.** Single function `dispatchNotification({user_id, category, template_key, data})` called from all phases. Routes to push + email + in-app based on user preferences. Handles dedup, frequency caps, batching.

2. **WF 19 cleaner notification center renders real notifications.** Cleaner sees actual notifications from Phase 6/7/8/9 events. Mark as read works. Deep links work.

3. **WF 28 preferences UI works.** User can toggle each of 8 categories × 2 channels (push + email). Quiet hours configurable.

4. **WF 37 push permission flow wired.** First-visit prompt. OS permission stored. FCM token registered.

5. **All Phase 6/7/8/9 stubs replaced.** Every `recordNotificationStub()` or similar call replaced with real `dispatchNotification()`. Verified across phases.

6. **Batching + frequency caps enforced.** 5+ same-category in 30 min → batched. 5+ emails per day non-critical → suppressed.

What Phase 10a does NOT do (deferred to 10b/c/d):
- State component library (10b)
- Marketing pages (10c)
- Tours, support UI, waitlist (10d)
- Final a11y audit (10d)

---

## 2. Acceptance criteria

### Push + email service setup

- [ ] FCM credentials stored in env vars; service account JSON not in git
- [ ] iOS APNs key uploaded to Firebase
- [ ] Hello-world push delivered to test iOS + Android devices
- [ ] Resend domain verified with DKIM passing
- [ ] Hello-world email delivered to test inbox
- [ ] DKIM verification visible in email headers

### Notification dispatcher

- [ ] `dispatchNotification()` exists in `lib/notifications/dispatcher.ts`
- [ ] Accepts `{user_id, category, template_key, data, dedup_key?}`
- [ ] Reads user preferences before routing
- [ ] Inserts `notifications` row regardless of channel preferences
- [ ] Calls FCM if push enabled
- [ ] Calls Resend if email enabled
- [ ] Logs each delivery in `notification_deliveries` (success or failure)
- [ ] Dedup key prevents double-dispatch within 1 hour

### Templates

- [ ] Templates exist for all 8 categories × 3 channels
- [ ] Mustache or template-literal variable rendering works
- [ ] Lawyer-reviewed copy used for dispute, payment, score categories
- [ ] Template rendering tested with realistic variable data

### User preferences (WF 28)

- [ ] `/settings/notifications` route renders preferences UI
- [ ] All 8 categories × 2 channels toggleable
- [ ] Quiet hours start/end time configurable
- [ ] Saved preferences persist across sessions
- [ ] New user defaults match Lock 5 (booking_lifecycle, payment, dispute, score_tier all push+email ON; messaging push only; support email only; marketing OFF; system push+email)

### In-app notification center (WF 19)

- [ ] `/notifications` route renders cleaner notification list
- [ ] List ordered by created_at DESC
- [ ] Tap notification → deep link from metadata
- [ ] Mark all as read works
- [ ] Auto-mark on view
- [ ] Real-time updates via Supabase Realtime

### Push permission (WF 37)

- [ ] First customer dashboard visit triggers WF 37 pre-permission UI
- [ ] OS permission flow on Allow tap
- [ ] FCM token stored in `push_tokens` on grant
- [ ] Permission state stored on user
- [ ] Re-prompt accessible from settings

### Batching + frequency caps

- [ ] 5+ same-category notifications to same user in 30 min → batched into 1 summary
- [ ] Daily email cap 5/user enforced (non-critical)
- [ ] Critical categories (dispute, payment failure, security) ALWAYS deliver

### Phase 6-9 integration sweep

- [ ] Every `recordNotificationStub()` call replaced with real `dispatchNotification()`
- [ ] Phase 6 booking lifecycle notifications work end-to-end
- [ ] Phase 7 score change notifications (4 states from WF 53) work end-to-end
- [ ] Phase 8 dispute notifications work end-to-end
- [ ] Phase 9 payment notifications work end-to-end

### Cross-cutting

- [ ] All Phase 10a code has unit tests; coverage ≥80% on `lib/notifications/`
- [ ] RLS: user reads own notifications + preferences; admin bypass
- [ ] All notification operations idempotent (retries safe)
- [ ] FCM/Resend rate limits respected

---

## 3. Database state required

### Existing tables (no changes)

B6 schema is sufficient:
- `notifications` — in-app notification rows
- `notification_preferences` — user category/channel toggles
- `notification_deliveries` — delivery attempt log

### New migrations (Phase 10a)

```sql
-- Phase 10a migration

-- Push tokens (per device per user)
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  device_id TEXT, -- optional, for multi-device tracking
  device_type TEXT CHECK (device_type IN ('ios', 'android', 'web')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, fcm_token)
);
CREATE INDEX idx_push_tokens_user_active ON push_tokens (user_id) WHERE active = TRUE;
CREATE INDEX idx_push_tokens_inactive ON push_tokens (last_used_at) WHERE active = FALSE;

-- Push permission state on users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS push_permission_state TEXT
  CHECK (push_permission_state IN ('not_asked', 'granted', 'denied', 'default'))
  DEFAULT 'not_asked';

-- Dedup key tracking for notification idempotency
CREATE TABLE notification_dedup_keys (
  dedup_key TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dispatched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (dedup_key, user_id)
);
CREATE INDEX idx_dedup_expiring ON notification_dedup_keys (dispatched_at);
-- Cron deletes entries older than 1 hour daily
```

### RLS policies

```sql
-- Notifications: user reads own; admin bypass (B6 may have already)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_user_own ON notifications
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Notification preferences: user reads/writes own
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_prefs_user_own ON notification_preferences
  FOR ALL USING (user_id = auth.uid());

-- Push tokens: user reads/writes own; admin reads all
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY push_tokens_user_own ON push_tokens
  FOR ALL USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Dedup keys: backend only (no user access needed)
ALTER TABLE notification_dedup_keys ENABLE ROW LEVEL SECURITY;
-- No user-facing policy; service role bypasses
```

---

## 4. Files to create

### Library code (~12 files — heart of Phase 10a)

- `/lib/notifications/dispatcher.ts` — `dispatchNotification()` main entry point
- `/lib/notifications/template_renderer.ts` — Mustache-style variable rendering
- `/lib/notifications/push_sender.ts` — FCM API wrapper
- `/lib/notifications/email_sender.ts` — Resend API wrapper
- `/lib/notifications/in_app_writer.ts` — `notifications` row inserter
- `/lib/notifications/preferences_reader.ts` — reads + applies user preferences
- `/lib/notifications/batcher.ts` — same-category batching logic
- `/lib/notifications/frequency_cap.ts` — daily email cap
- `/lib/notifications/quiet_hours.ts` — quiet hours suppression for push
- `/lib/notifications/dedup.ts` — dedup_key idempotency
- `/lib/notifications/critical_override.ts` — bypass caps for critical categories
- `/lib/notifications/delivery_logger.ts` — `notification_deliveries` row inserts

### App routes (~3 files)

- `/app/notifications/page.tsx` — WF 19 in-app notification center
- `/app/settings/notifications/page.tsx` — WF 28 preferences UI
- `/app/api/notifications/[id]/route.ts` — mark as read endpoint

### Feature module — Notification center (~5 components)

- `/features/notifications/components/NotificationCenterList.tsx`
- `/features/notifications/components/NotificationRow.tsx`
- `/features/notifications/components/MarkAllReadButton.tsx`
- `/features/notifications/components/NotificationDeepLink.tsx`
- `/features/notifications/components/EmptyNotifications.tsx` (uses Phase 10b state library)

### Feature module — Preferences UI (~4 components)

- `/features/notifications/components/PreferenceCategoryRow.tsx`
- `/features/notifications/components/QuietHoursSelector.tsx`
- `/features/notifications/components/ChannelToggle.tsx`
- `/features/notifications/components/PreferenceDefaults.tsx`

### Feature module — Push permission (~2 components)

- `/features/notifications/components/PushPermissionPreprompt.tsx` — WF 37
- `/features/notifications/components/PushPermissionDeniedFallback.tsx`

### Server actions (~4 files)

- `/app/api/notifications/preferences/route.ts` — GET/PUT preferences
- `/app/api/notifications/push-token/route.ts` — POST register token
- `/app/api/notifications/mark-read/route.ts` — mark as read
- `/app/api/notifications/test-send/route.ts` — admin-only test sender

### Background jobs (~3 files)

- `/jobs/notification_batch_dispatcher.ts` — every 5 min for batched
- `/jobs/notification_retention_cleanup.ts` — daily delete >90d
- `/jobs/dedup_key_cleanup.ts` — hourly delete >1h dedup keys

### Templates (~24 template files — 8 categories × 3 channels)

- `/templates/booking_lifecycle/created.{push,email,in_app}`
- `/templates/booking_lifecycle/accepted.{push,email,in_app}`
- (... and so on for all 8 categories × all event types)

### Phase 6-9 integration sweep

Modify each phase's notification stub calls to real `dispatchNotification()`:
- Phase 6a: booking creation, accept, decline, reschedule, cancel notifications
- Phase 6b: messaging notifications
- Phase 6d: on-the-way, late notice notifications
- Phase 6e: photo system notifications (rare)
- Phase 6f: approval, capture, review prompt notifications
- Phase 6g: recurring instance notifications
- Phase 7a: score change events (no direct notifications — 7b dispatches)
- Phase 7b: 4 score change notification states
- Phase 8a: dispute opened, response, resolution notifications
- Phase 8b: Tier 2 mediation outcome notifications
- Phase 9a: refund processing, tip received notifications

### Database migrations (1 file)

- `migrations/2026XXXXXX_phase_10a_schema.sql`

### Docs (3 files; this set)

- `phase-10-master-outline.md` — already created
- `phase-10a-spec.md` — this file
- `phase-10a-explainer.md` — plain-English walkthrough

---

## 5. Implementation order

### Sub-phase 10a-1 — Push + email service setup (~2 days)

**Day 1 — FCM setup + verification.** Firebase project. APNs key. Service account JSON. Hello-world push to test devices. Verify on real iPhone + Android.

**Day 2 — Resend setup + verification.** Resend account. Domain verification. DNS records (24h propagation lead time — start early). Hello-world email. DKIM verification.

### Sub-phase 10a-2 — Notification dispatcher + templates (~3 days)

**Day 3 — Dispatcher core + push sender.** `lib/notifications/dispatcher.ts`. `lib/notifications/push_sender.ts` calling FCM. Test with hardcoded payload.

**Day 4 — Email sender + in-app writer.** Resend integration. `notifications` table inserts. Three-channel routing in dispatcher.

**Day 5 — Templates for all 8 categories.** Markdown/JSON template files. Variable rendering. Test with realistic data per category.

### Sub-phase 10a-3 — User preferences + in-app center (~3 days)

**Day 6 — Preferences UI (WF 28).** `/settings/notifications` route. Per-category toggles. Quiet hours selector. Save handler.

**Day 7 — In-app notification center (WF 19).** `/notifications` route. Realtime subscription. Mark as read. Deep link routing.

**Day 8 — Push permission flow (WF 37).** Pre-permission UI. OS permission integration (Expo Notifications.requestPermissionsAsync). FCM token registration. Re-prompt path from settings.

### Sub-phase 10a-4 — Batching + integration sweep (~2 days)

**Day 9 — Batching + frequency caps.** `lib/notifications/batcher.ts`. `lib/notifications/frequency_cap.ts`. Cron `notification_batch_dispatcher.ts`. Test 5+ same-category scenario.

**Day 10 — Phase 6-9 integration sweep + closeout.** Replace all stub calls across phases. Verify each phase's notifications work. End-to-end test. Soft launch readiness review.

---

## 6. Specific gotchas

### Gotcha A — FCM token rotation

**The problem:** FCM tokens can rotate (app reinstall, OS update, user clears data). Stored token becomes invalid. Push fails silently.

**The fix:** Validate token on app open. If FCM returns "registration token not found" error, mark token inactive in DB. Re-register on next valid token.

### Gotcha B — Email reputation cold start

**The problem:** Brand new sending domain. First emails go to spam aggressively. Recipients miss critical notifications.

**The fix:** Warm up sending reputation pre-launch. Send 10-20 internal emails per day for 2 weeks before launch. Maintain low complaint rate. Don't blast 1000 emails day one.

### Gotcha C — Quiet hours timezone confusion

**The problem:** User sets quiet hours 10 PM - 8 AM. User's timezone is Pacific. Notification dispatcher running on UTC server. Off-by-7-hour push at 3 AM cleaner time.

**The fix:** Always compute quiet hours in user's local timezone (`users.timezone`). Convert to UTC for cron checks. Test with timezone-shifted users.

### Gotcha D — Notification batching race

**The problem:** 5 events fire to same user in 25 minutes. Batch logic counts events. 6th event fires at 30 min mark. Race: which gets batched, which sent individual?

**The fix:** Batching uses transactional reads. SELECT count of unsent events with same category in last 30 min FOR UPDATE. Decision made atomically.

### Gotcha E — Critical override bypass

**The problem:** Customer with all push off (preferences set to never push). Dispute opens. Cleaner needs to know. Push fired despite preferences.

**The fix:** Critical categories (dispute, payment failure, account security) bypass user-level off preferences. Document this clearly to users in WF 28: "We always send these for critical events." Otherwise = liability if cleaner missed dispute.

### Gotcha F — Email frequency cap excludes critical

**The problem:** User has 5 emails today (cap reached). Dispute escalation email tries to send. Cap blocks it. User misses critical dispute deadline.

**The fix:** Frequency cap explicitly skips critical categories. Only marketing + score_tier small + help center notifications + similar non-critical hit cap.

### Gotcha G — In-app notification real-time delivery offline

**The problem:** User's app is closed. New notification inserts. Real-time channel inactive. User opens app 4 hours later — should see new notification immediately.

**The fix:** App fetches all unread notifications on open (REST endpoint). Realtime delivers new ones while open. Combined: never miss a notification.

### Gotcha H — Test environment notifications going to real users

**The problem:** Staging environment connected to production users. Test notifications send to real customers. Customer sees "Test #123."

**The fix:** Strict environment separation. Staging FCM project + staging Resend domain. Never share API keys between staging + production. Verify env in dispatcher: `if (env.NODE_ENV !== 'production' && !env.ALLOW_REAL_NOTIFICATIONS) { logOnly(); return; }`.

---

## 7. Testing strategy

### Unit tests

- `lib/notifications/dispatcher.ts`: routing logic per preferences
- `lib/notifications/template_renderer.ts`: variable rendering
- `lib/notifications/batcher.ts`: 30-min window logic
- `lib/notifications/frequency_cap.ts`: 24h count + critical bypass
- `lib/notifications/quiet_hours.ts`: timezone-aware suppression
- `lib/notifications/dedup.ts`: 1-hour idempotency

### Integration tests

- End-to-end: trigger Phase 6 booking creation → user receives push + email + in-app
- Real FCM test environment delivery
- Real Resend test environment delivery (use Resend's test mode)
- Realtime delivery to subscribed user

### Manual QA

- Real iOS + Android device testing
- Multi-device same user (push delivers to all devices)
- Push permission denial → re-prompt path
- Quiet hours: set, verify push suppressed, verify email still delivers

---

## 8. Deployment plan

### Pre-deploy checklist

- [ ] All migrations applied to production
- [ ] FCM credentials in production env vars
- [ ] APNs key uploaded to Firebase production project
- [ ] Resend production domain verified
- [ ] DNS records propagated (verify with `dig`)
- [ ] Email reputation warmed up (2 weeks of internal sends)
- [ ] Phase 6-9 stub-replacement sweep complete
- [ ] Lawyer copy review done for dispute/payment templates

### Deployment order

1. Migrations
2. Application code (libraries first)
3. Templates
4. Push permission UI on customer + cleaner sides
5. Notification center (WF 19) live
6. Preferences UI (WF 28) live
7. Phase 6-9 integration sweep activated
8. Soft launch: monitor 7 days

### Rollback plan

- App code revert if bugs surface
- Schema migrations forward-only
- Critical: disable specific categories via feature flag if delivery issues
- FCM/Resend can pause sends from their dashboards in emergency

---

## 9. Phase 10a → Phase 10b/c/d handoff

Phase 10a output ready for Phase 10b (state library):
- Notification center empty state pattern set (component to use)
- Notification dispatcher available for state-related notifications

Phase 10a output ready for Phase 10c (marketing pages):
- Email infrastructure available for waitlist launch announcements
- Notification dispatcher available for marketing campaigns (with strict opt-in)

Phase 10a output ready for Phase 10d (tours, support, polish):
- Tour completion can fire celebratory notification
- Support ticket updates dispatch via 10a
- Waitlist signup confirmations via 10a

---

## 10. Open questions for Phase 10b/c/d lock-in

These don't block 10a but should resolve before 10b/c/d:

1. **Notification analytics.** Track open rates, click-through, unsubscribe rates? Defer to Phase 11.
2. **Localized templates.** Spanish-language templates for Spanish-speaking cleaners? Defer to Phase 11 i18n.
3. **Marketing email opt-in flow.** Customers opt-in via signup checkbox? Cleaners via separate signup? Lock in 10c.

---

This spec is the canonical Phase 10a build reference. Plain-English walkthrough lives in `phase-10a-explainer.md`. High-level navigation across all of Phase 10 lives in `phase-10-master-outline.md`.
