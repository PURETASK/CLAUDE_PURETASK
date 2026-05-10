# Phase 10a — Plain-English Breakdown

This document walks through every section of `phase-10a-spec.md` and explains:
- What each thing means in plain English
- What needs to be designed (decisions to make)
- What needs to be built (actual files)
- Why each decision matters
- Beginner-trap warnings where they apply

Phase 10a is **the platform's communication infrastructure.** Before Phase 10a, every Phase 6/7/8/9 has stub `recordNotificationStub()` calls that don't actually deliver anything. After Phase 10a, those stubs are real notifications across push + email + in-app, respecting user preferences, batched intelligently, with critical-category overrides for safety. WF 19 cleaner notification center renders real activity. WF 28 settings let users control what they get.

Phase 10a is **the most external-service-heavy phase since Phase 4.** Two new vendor integrations (FCM, Resend) plus DNS configuration. The setup time is non-trivial — DNS propagation alone is 24 hours. Plan ahead.

Read section by section.

---

# Section 0 — External account prerequisites

## What it means in plain English

Phase 10a needs two new vendors set up before any application code can be written:

1. **Firebase + FCM (Firebase Cloud Messaging)** — sends push notifications to iOS and Android devices.
2. **Resend** — sends transactional emails.

Both are well-established services with reasonable pricing. FCM is free for typical scale. Resend has 100 emails/day free, then ~$20/month for 50K emails — adequate for early scale.

## Why these specific vendors

**FCM:** Apple's APNs and Google's FCM are the only push-notification systems for iOS and Android. FCM unifies both — even iOS pushes route through FCM as a wrapper around APNs. Single SDK + single codepath.

**Resend over alternatives:** SendGrid is feature-bloated and expensive. Postmark is fine but pricier than Resend. AWS SES is cheap but requires more configuration. Resend is modern, developer-friendly, and laser-focused on transactional email. Reasonable cost.

**Switching later is possible** but each vendor swap is a week of work + email reputation rebuilding. Pick well; commit.

## What "DNS propagation 24 hours" means

You add SPF + DKIM + DMARC records to your domain DNS to authorize Resend to send emails on your behalf. After adding the records, DNS caches across the internet take up to 24 hours to update. During this period, some emails may go to spam.

**Plan ahead:** add DNS records 1 week before you need to send real notifications. Don't add the day-of and expect things to work.

## Why test deliveries before code

Before writing any application code, send hello-world push + email. Verify they arrive. Verify DKIM passes. If your foundation is broken, your application code can't work. Most Phase 10a debugging time vanishes when the foundation is verified first.

## Beginner traps

- **Don't commit Firebase service account JSON to git.** This is the most common security mistake. Add `*.json` patterns to `.gitignore` and use environment variables.
- **Don't skip APNs key upload for iOS.** Push notifications won't work on iOS without the APNs auth key uploaded to Firebase.
- **Don't test push on simulators.** iOS Simulator doesn't reliably deliver pushes. Use real devices.
- **Don't send marketing-volume emails without warming up.** New domain + 1000 emails day one = spam folder forever. Warm up over weeks.

---

# Section 1 — Summary

## What it means in plain English

The summary promises six things will work by end of Phase 10a:

1. **Notification dispatcher operational.** Single function called from every phase. Routes to push + email + in-app. Handles preferences, batching, frequency caps.

2. **WF 19 cleaner notification center renders real notifications.** No more empty state — actual events from Phase 6/7/8/9.

3. **WF 28 preferences UI works.** User toggles each of 8 categories × 2 channels. Quiet hours.

4. **WF 37 push permission flow wired.** First-visit pre-permission. OS permission flow. Token registered.

5. **All Phase 6/7/8/9 stubs replaced.** Every `recordNotificationStub()` call across all earlier phases now calls real `dispatchNotification()`.

6. **Batching + frequency caps enforced.** 5+ same-category in 30 min batched. 5+ emails per day non-critical suppressed.

## Why this is one sub-phase, not five

Notification routing, preferences UI, push permission, in-app center, and Phase integration are tightly coupled. Splitting would create scattered ownership. Bundling produces a coherent infrastructure layer.

## Why this matters

Notifications are the **primary engagement channel** for two-sided marketplaces. Cleaners need to know when they have a new request. Customers need to know when their cleaner is on the way. Without notifications, the platform feels broken even if all other features work.

Phase 10a is also the moment **all earlier phases become user-visible.** A booking confirmed in Phase 6a is just a database row — invisible until Phase 10a delivers the "Booking confirmed" notification.

## Beginner traps

- **Don't ship without lawyer-reviewed copy.** Dispute notifications, payment failure notifications go to upset users. Bad copy = customer service nightmares.
- **Don't underestimate template authoring time.** 8 categories × 3 channels × multiple events = 30+ templates to write. Budget time.
- **Don't skip the warm-up period for email.** Sending domain reputation matters more than copy.

---

# Section 2 — Acceptance criteria

## What it means in plain English

Eight groups of criteria. Don't ship until every box checks.

### Push + email service setup

The foundation. FCM + Resend both verified with hello-world tests before any application code. If foundation broken, everything downstream breaks.

DKIM verification visible in email headers matters. Without DKIM, emails go to spam. With DKIM, deliverability is high.

### Notification dispatcher

The core API. `dispatchNotification({user_id, category, template_key, data, dedup_key?})` is called from every phase. The dispatcher handles routing, preferences, dedup, frequency caps, batching internally.

`notifications` row inserts always — even if user has push + email off. In-app notification center renders the row. User can review later even if push didn't deliver.

### Templates

8 categories × 3 channels = 24+ templates minimum. Plus per-event variants. Many templates.

Lawyer review for dispute, payment, score categories. These notifications affect user emotional state significantly. Wording matters.

### User preferences (WF 28)

Per-category × per-channel toggles. Quiet hours at user level (push suppressed; email always sends).

The default state matters because most users won't change defaults. Critical notifications opt-in by default; promotional opt-in only.

### In-app notification center (WF 19)

Cleaner-side renders all notifications. Order by created_at DESC. Mark as read on view. Real-time updates when new notification inserts via Supabase Realtime.

### Push permission (WF 37)

Pre-permission UI before OS dialog. OS only allows ONE prompt — don't waste it. Pre-permission prepares the user.

After OS denial, can't re-trigger OS dialog. Re-prompt path = settings → "Enable push" → opens app settings deep link.

### Batching + frequency caps

Batching prevents notification fatigue. Frequency caps protect against accidental email blasts.

Critical category override is essential. Disputes + payment failures + security must always deliver.

### Phase 6-9 integration sweep

The grunge work. Every stub call across earlier phases replaced with real dispatcher. Verify each phase's notifications work end-to-end.

## Beginner traps

- **Don't gate everything on `notification_preferences`.** Critical categories override.
- **Don't write the in-app center to bypass dispatcher.** Use the same flow for consistency.
- **Don't ship without testing all 8 categories end-to-end.** One missed category = silent failure.

---

# Section 3 — Database state required

## What it means in plain English

You're adding **2 new tables** (push_tokens, notification_dedup_keys) plus a column on users.

### `push_tokens`

Per device per user. A user might have iOS phone + Android tablet + web browser. Each gets its own row. When dispatching push, send to all active tokens for the user.

Active flag separates from invalid tokens (token rotated, app uninstalled). Inactive tokens stay for analytics but don't get sent.

### `notification_dedup_keys`

Idempotency table. When dispatcher receives `dedup_key`, check this table. If present within 1 hour, skip dispatch. Prevents double-sends from race conditions.

### `users.push_permission_state`

Tracks where the user is in the OS permission flow:
- `not_asked` — haven't seen prompt yet
- `granted` — said yes
- `denied` — said no
- `default` — saw prompt, dismissed without choice (iOS specific)

### Why B6 schema is sufficient

The major notification tables (`notifications`, `notification_preferences`, `notification_deliveries`) already exist. Phase 10a is mostly application logic + a couple support tables.

### Why RLS matters

Notifications contain potentially sensitive info (booking details, dispute status, payment failures). RLS prevents User A from reading User B's notifications.

Push tokens specifically: RLS prevents one user from spoofing another's tokens.

## Beginner traps

- **Don't store push tokens without a user_id foreign key.** Orphaned tokens = security mess.
- **Don't allow active=TRUE on tokens that haven't been used in 30+ days.** Cron should mark them inactive.
- **Don't forget cron to clean up old dedup_keys.** Table grows forever otherwise.

---

# Section 4 — Files to create

## What it means in plain English

The spec lists ~50+ files counting templates. Heavy on library code (~12 files) because notification logic is complex. UI is moderate (~10 components).

### Library code (~12 files)

The heart of Phase 10a. Each file does one thing:

- `dispatcher.ts` — entry point
- `template_renderer.ts` — variable rendering
- `push_sender.ts` — FCM wrapper
- `email_sender.ts` — Resend wrapper
- `in_app_writer.ts` — `notifications` table inserts
- `preferences_reader.ts` — preferences lookup
- `batcher.ts` — same-category batching
- `frequency_cap.ts` — daily email cap
- `quiet_hours.ts` — quiet hours suppression
- `dedup.ts` — idempotency
- `critical_override.ts` — bypass for critical
- `delivery_logger.ts` — `notification_deliveries` log

Each file's responsibility is clear. Pure functions where possible. Side effects isolated to specific files (push_sender, email_sender, in_app_writer).

### Templates (~24 minimum)

Per-category, per-channel files. Markdown for email body. Plain text for push. JSON for in-app (with fields like deep link).

Authoring templates is real work. Budget 1-2 days just for template content.

### Phase 6-9 integration sweep

Modify ~30 files across earlier phases to replace stubs. Most are 1-line changes (`recordNotificationStub()` → `dispatchNotification()`). But each needs verification.

## Why so much library code

Notification dispatch involves: preference lookup, template rendering, batching check, dedup check, frequency cap check, quiet hours check, critical override check, push send, email send, in-app insert, delivery logging. That's 10+ steps per dispatch. Splitting into focused files = testable + debuggable.

## Beginner traps

- **Don't put dispatcher logic in components.** Components dispatch; library does work.
- **Don't write all templates at the end.** Author templates as you build each category. Easier than 30 templates day 5.
- **Don't skip the integration sweep tests.** Each phase's notifications need verification.

---

# Section 5 — Implementation order

## What it means in plain English

10 working days. Sequential.

### Days 1-2: Service setup

Foundation first. FCM + Resend with hello-world tests. DNS records added (24h propagation lead time means start Day 1 morning).

### Days 3-5: Dispatcher + templates

Build the engine. Push sender, email sender, in-app writer. Three-channel routing. Templates for all 8 categories.

### Days 6-8: User-facing UI

WF 28 preferences. WF 19 notification center. WF 37 push permission flow.

### Days 9-10: Integration + closeout

Batching + frequency caps. Phase 6-9 integration sweep. End-to-end testing across all phases.

## Why this order

Sequential. Each day depends on the previous. No parallel possible without staffing two engineers.

## Why some days might extend

Realistic time sinks:
- **Day 2 DNS propagation.** If propagation slow, Day 3 starts late.
- **Day 5 template authoring.** Lawyer review can introduce delays.
- **Day 8 push permission edge cases.** iOS + Android both have quirks.
- **Day 10 integration sweep.** Each phase's notifications has unique data.

Build buffer.

## Beginner traps

- **Don't try to build dispatcher and UI in parallel.** Dispatcher is foundation; UI consumes.
- **Don't skip Day 1 hello-world tests.** Foundation issues surface day 5 = painful.

---

# Section 6 — Specific gotchas

## What it means in plain English

8 gotchas from real-world experience.

### Gotcha A — FCM token rotation

Tokens can rotate (app reinstall, OS update). Stored token becomes invalid. **The fix:** validate on app open; mark inactive on FCM "not found" errors.

### Gotcha B — Email reputation cold start

New domain = aggressive spam filtering. **The fix:** warm up over 2 weeks before launch.

### Gotcha C — Quiet hours timezone confusion

User in Pacific, server in UTC. **The fix:** compute quiet hours in user's local timezone always.

### Gotcha D — Notification batching race

Multiple events in quick succession with batching threshold. **The fix:** transactional reads with FOR UPDATE.

### Gotcha E — Critical override bypass

User has all push off; dispute opens. Cleaner needs to know. **The fix:** critical categories ignore user-level off preferences. Document in WF 28.

### Gotcha F — Email frequency cap excludes critical

Cap reached today; dispute escalation still must send. **The fix:** cap explicitly skips critical.

### Gotcha G — Real-time delivery offline

User app closed when notification inserts. **The fix:** combine REST fetch on app open + Realtime while open.

### Gotcha H — Test environment notifications to real users

Staging connected to production users by mistake. **The fix:** strict environment separation. Verify env in dispatcher.

## Why these matter

Each gotcha, missed, surfaces as production incident. Read defensively.

## Beginner traps

- **Don't trust FCM tokens to never rotate.** Validate frequently.
- **Don't skip the email warm-up.** Day 1 reputation is what matters most.

---

# Section 7 — Testing strategy

## What it means in plain English

Three layers:

### Unit tests

Pure-function libraries. Routing logic, template rendering, batching, frequency caps, quiet hours, dedup.

### Integration tests

End-to-end notification triggering Phase 6 booking → user receives push + email + in-app. Real FCM test environment. Real Resend test mode.

### Manual QA

Real iOS + Android devices. Multi-device same user. Push permission denial path. Quiet hours.

## Beginner traps

- **Don't test push only on simulators.** Real devices required.
- **Don't skip multi-device tests.** Many users have phone + tablet.

---

# Section 8 — Deployment plan

## What it means in plain English

Pre-deploy, deployment order, rollback. Standard.

The unique element: **email reputation warm-up.** Don't blast 1000 users day one. Send 10-20 internal emails for 2 weeks before launch. Then expand.

## Beginner traps

- **Don't launch with unverified domain.** Spam folder forever.
- **Don't deploy code before DNS propagated.** Verify with `dig` first.

---

# Section 9 — Phase 10a → 10b/c/d handoff

## What it means in plain English

Phase 10a output ready for:

- **10b state library** — empty state component used in WF 19; dispatcher available for state notifications
- **10c marketing pages** — email infrastructure for waitlist launch announcements
- **10d tours, support, polish** — tour celebratory notifications, support ticket updates, waitlist signup confirmations all dispatch via 10a

## Why the decoupling

10a is infrastructure; later sub-phases consume it. Each can build independently of subsequent ones.

## What 10a doesn't do

- 10a doesn't render WF 38/39/40 state components (10b)
- 10a doesn't render marketing pages (10c)
- 10a doesn't render tours or support UI (10d)
- 10a doesn't run a11y audit (10d)

10a is engine + critical UX (notification center + preferences); other UI elsewhere.

---

# Section 10 — Open questions

## What it means in plain English

Three questions don't block 10a but should resolve before 10b/c/d:

1. **Notification analytics.** Defer to Phase 11.
2. **Localized templates.** Defer to Phase 11 i18n.
3. **Marketing email opt-in flow.** Lock in 10c.

## Why this is okay

10a is well-defined. Open questions affect later sub-phases.

---

# Notes on what comes next

After Phase 10a:

- **Phase 10b** (1 week) — state component library
- **Phase 10c** (2 weeks) — marketing pages + SEO
- **Phase 10d** (1.5 weeks) — tours + support + polish + a11y

Total Phase 10: 5-6 weeks (with parallelism). 6-7 weeks sequential.

After Phase 10:

The platform is **feature-complete.** Every wireframe is implemented. Every phase has shipped. Remaining work is iteration based on real user feedback, additional cities, additional services, and platform optimizations.

---

This explainer is the canonical Phase 10a learning document. The spec (`phase-10a-spec.md`) is for execution; this is for understanding. The master outline (`phase-10-master-outline.md`) is for navigation across all of Phase 10.
