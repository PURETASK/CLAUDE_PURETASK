# Phase 3b — Settings Completion Specification

> **Author note (transparency):** This spec is being written ahead of when Phase 3b will actually be built — minimum 3-6 weeks from now, with each sub-section potentially slotted into different points of the build sequence. The spec is correct as of the current date but reflects an important reality: **Phase 3b is no longer the monolithic block it was envisioned as.** Several of its components are now subsumed by other phases:
>
> - **3b.1 (Notifications system)** — Phase 10a now owns the notification dispatcher, push/email infrastructure, and preference backend. Phase 3b only needs to surface the UI that connects to Phase 10a's preference table.
> - **3b.2 (Payment methods)** — Phase 6a now owns the Stripe customer payment integration. Phase 3b only needs to surface the management UI.
> - **3b.3 (2FA + active sessions)** — Genuinely new work. Lives in 3b.
> - **3b.4 (Privacy data tools)** — Genuinely new work. Lives in 3b.
>
> Treat this spec as an aggressive draft that defers heavy lifting to other phases.

**Phase goal:** Replace all stub cards from Phase 3a with working features. By the end of Phase 3b, the customer settings page is fully functional: real notification preferences (wired to Phase 10a), real payment method management (wired to Phase 6a's Stripe customer integration), 2FA + active session controls, and CCPA-compliant data tools (export, deletion, opt-out).

**Estimated duration:** ~4-5 weeks of focused engineering, but **NOT one continuous block**. Each sub-section can ship independently.

**Depends on:**
- Phase 3a complete (stub cards exist; Phase 3b replaces them)
- Phase 10a notifications dispatcher operational (for 3b.1 UI surface)
- Phase 6a Stripe customer payment operational (for 3b.2 UI surface)
- Lawyer-reviewed CCPA copy (for 3b.4)
- Account deletion cascade policy decided (for 3b.4)

**Wireframes covered:** Completes WF 28 (notification preferences), WF 29 (privacy + photo retention).

**Phase 3b sub-sections (sequenceable):**

- **3b.1** — Notifications UI surface (~3 days, depends on Phase 10a)
- **3b.2** — Payment methods UI surface (~3 days, depends on Phase 6a)
- **3b.3** — 2FA + active sessions (~1 week, independent)
- **3b.4** — Privacy data tools (~1.5 weeks, lawyer-dependent)

---

## 0. External account prerequisites

### 0.1 No new vendors

Phase 3b is mostly settings UI on top of existing infrastructure. No new vendor relationships beyond Phase 4 + Phase 9 + Phase 10 setups.

### 0.2 Lawyer items

Phase 3b has one significant lawyer dependency: **CCPA-compliant copy** for data export, account deletion, opt-out flows. Specifically:
- Account deletion confirmation copy (what cascades, what's retained)
- Data export request acknowledgment
- "Do not sell my personal info" opt-out language
- Photo deletion impact disclosure

These should already be in flight from Phase 4/Phase 5 lawyer engagement. Confirm before 3b.4 ships.

### 0.3 No critical Phase 3b prerequisites beyond above

Phase 10a notifications + Phase 6a payments + lawyer review are the gating items. If those are done, Phase 3b unblocked.

---

## 1. Summary

Phase 3b is **the polish layer for customer settings.** Concretely, by the end of Phase 3b:

1. **Notifications preferences UI works.** WF 28 settings page reads from + writes to Phase 10a's `notification_preferences` table. Toggle each of 8 categories × push/email channel. Quiet hours configurable.

2. **Payment methods UI works.** Customer can add/remove/set default cards via Stripe Elements. Card display: brand, last 4, expiration, default badge. Phase 6a's Stripe customer integration provides the backend.

3. **2FA + active sessions work.** Customer can enable TOTP-based 2FA via authenticator app. Recovery codes generated. Active session list with per-session sign-out. "Sign out everywhere" button.

4. **Privacy data tools work.** Data export request (delivered via email within 30 days). Account deletion request (cascade per policy). CCPA opt-out. Photo deletion control (per-booking + bulk).

What Phase 3b does NOT do:
- Build notification dispatcher (Phase 10a)
- Build Stripe customer payment integration (Phase 6a)
- Build SMS notifications (deferred — Phase 11+)
- Build native mobile push (deferred — Phase 11+ if/when native app ships)

---

## 2. Acceptance criteria

### 3b.1 Notifications UI surface

- [ ] WF 28 notifications settings page replaces stub card from Phase 3a
- [ ] Reads from Phase 10a's `notification_preferences` table (no separate storage)
- [ ] All 8 categories × 2 channels toggleable
- [ ] Quiet hours start/end time configurable
- [ ] Save handler updates preferences in <500ms
- [ ] Toggle changes immediately respected by Phase 10a dispatcher
- [ ] First-time visit: defaults match Phase 10a Lock 5

### 3b.2 Payment methods UI surface

- [ ] WF 28 payment methods section replaces stub card from Phase 3a
- [ ] Lists current cards: brand, last 4, expiration, default badge
- [ ] Add card via Stripe Elements (uses Phase 6a `SetupIntent` if needed)
- [ ] Set default card (one card always default)
- [ ] Remove card (cannot remove if it's the only card with active recurring booking)
- [ ] All operations call Phase 6a infrastructure; no separate Stripe integration in 3b
- [ ] Test card 4000 0000 0000 0002 (declined) renders error cleanly

### 3b.3 2FA + active sessions

- [ ] `/settings/security` route accessible
- [ ] Enable 2FA flow: scan QR code with authenticator app → enter first TOTP → success
- [ ] Disable 2FA: requires current TOTP confirmation
- [ ] 10 recovery codes generated on enrollment; downloadable
- [ ] Recovery code regenerate: invalidates old codes; new 10 generated
- [ ] Sign-in flow with 2FA: password → TOTP prompt → success
- [ ] Recovery code instead of TOTP: works once, then invalid
- [ ] Active sessions list: device info, location (rough), last seen, sign-out per session
- [ ] "Sign out everywhere" revokes all except current session within 30 seconds

### 3b.4 Privacy data tools

- [ ] WF 29 privacy section accessible from settings
- [ ] "Request data export" creates `data_export_requests` row; admin processes within 30 days; email with download link
- [ ] "Delete my account" multi-step confirmation (acknowledge what cascades, type "DELETE", final confirm)
- [ ] Account deletion: cascade per policy (bookings stay for cleaner reference; reviews stay anonymized; messages anonymized)
- [ ] CCPA "Do Not Sell My Personal Info" toggle (compliance requirement; PureTask doesn't sell anyway, but legal must-have for California)
- [ ] Photo deletion control: per-booking "Delete photos now" button (instead of waiting 30 days)
- [ ] Bulk photo deletion: "Delete all photos older than X days"
- [ ] All copy lawyer-reviewed

### Cross-cutting

- [ ] All Phase 3b code has unit tests; coverage ≥75%
- [ ] RLS: customer reads/writes own settings only
- [ ] All settings changes audited in `customer_settings_audit_log` (new table)

---

## 3. Database state required

### Existing tables

- `notification_preferences` (B6, populated by Phase 10a)
- `payment_methods` (B5, populated by Phase 6a)
- `auth_sessions` (B1, exists)
- `customer_profiles` (B1, exists)

### New migrations (Phase 3b)

```sql
-- Phase 3b migration

-- 2FA secrets
CREATE TABLE user_2fa (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  secret_encrypted TEXT NOT NULL, -- encrypted with app-level key
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  enrolled_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ
);

-- Recovery codes (single-use, hashed)
CREATE TABLE user_2fa_recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL, -- bcrypt or argon2
  used_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_recovery_codes_user_unused ON user_2fa_recovery_codes (user_id) WHERE used_at IS NULL;

-- Data export requests
CREATE TABLE data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'ready', 'delivered', 'expired')) DEFAULT 'pending',
  download_url TEXT,
  download_expires_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);
CREATE INDEX idx_export_requests_status ON data_export_requests (status, requested_at);

-- Account deletion requests
CREATE TABLE account_deletion_requests (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_deletion_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cascade_summary JSONB DEFAULT '{}'::JSONB
);

-- CCPA opt-out flag
ALTER TABLE customer_profiles
  ADD COLUMN IF NOT EXISTS ccpa_opt_out BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE customer_profiles
  ADD COLUMN IF NOT EXISTS ccpa_opt_out_at TIMESTAMPTZ;

-- Settings audit log
CREATE TABLE customer_settings_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  setting_category TEXT NOT NULL,
  before_value JSONB,
  after_value JSONB,
  ip_address INET,
  user_agent TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_settings_audit_user ON customer_settings_audit_log (user_id, changed_at DESC);
```

### RLS policies

```sql
-- 2FA: user reads/writes own; never readable to anyone else
ALTER TABLE user_2fa ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_2fa_self ON user_2fa
  FOR ALL USING (user_id = auth.uid());

-- Recovery codes: same
ALTER TABLE user_2fa_recovery_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY recovery_codes_self ON user_2fa_recovery_codes
  FOR ALL USING (user_id = auth.uid());

-- Data export requests: user reads own; admin reads all
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY export_user_own ON data_export_requests
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Account deletion requests: same pattern
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY deletion_user_own ON account_deletion_requests
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
```

---

## 4. Files to create

### App routes (~6 files)

- `/app/settings/notifications/page.tsx` — wires to Phase 10a (3b.1 surface)
- `/app/settings/payment-methods/page.tsx` — wires to Phase 6a (3b.2 surface)
- `/app/settings/security/page.tsx` — 2FA + sessions
- `/app/settings/security/2fa/enable/page.tsx` — enrollment flow
- `/app/settings/privacy/page.tsx` — WF 29 data tools
- `/app/settings/privacy/delete-account/page.tsx` — multi-step deletion

### Components — Notifications (3b.1) (~2 files)

- `/features/settings/components/NotificationPreferencesForm.tsx` — uses Phase 10a preferences table
- `/features/settings/components/QuietHoursSelector.tsx` — also used by Phase 10a (10a wins; 3b reuses)

### Components — Payment methods (3b.2) (~3 files)

- `/features/settings/components/PaymentMethodsList.tsx`
- `/features/settings/components/AddCardForm.tsx` — Stripe Elements
- `/features/settings/components/PaymentMethodRow.tsx`

### Components — 2FA + sessions (3b.3) (~5 files)

- `/features/settings/components/TwoFactorSetup.tsx` — QR code + first TOTP
- `/features/settings/components/RecoveryCodesDisplay.tsx`
- `/features/settings/components/TwoFactorChallenge.tsx` — sign-in flow
- `/features/settings/components/ActiveSessionsList.tsx`
- `/features/settings/components/SessionRow.tsx`

### Components — Privacy (3b.4) (~5 files)

- `/features/settings/components/DataExportRequest.tsx`
- `/features/settings/components/DeleteAccountFlow.tsx` — multi-step
- `/features/settings/components/CCPAOptOutToggle.tsx`
- `/features/settings/components/PhotoDeletionControl.tsx`
- `/features/settings/components/PrivacyOverview.tsx`

### Library code (~6 files)

- `/lib/security/totp_generator.ts` — wraps `otpauth` library
- `/lib/security/recovery_codes.ts` — generate + validate
- `/lib/security/session_revoker.ts` — sign-out per session + everywhere
- `/lib/privacy/data_export_builder.ts` — assembles user's data
- `/lib/privacy/account_deletion_cascade.ts` — implements deletion policy
- `/lib/privacy/photo_deletion.ts` — per-booking + bulk

### Server actions (~10 files)

- Notifications: `/api/settings/notifications/preferences/route.ts`
- Payment methods: `/api/settings/payment-methods/route.ts`, `/.../[id]/default/route.ts`, `/.../[id]/delete/route.ts`
- 2FA: `/api/settings/security/2fa/enroll/route.ts`, `/.../disable/route.ts`, `/.../regenerate-codes/route.ts`
- Sessions: `/api/settings/security/sessions/route.ts`, `/.../[id]/revoke/route.ts`, `/.../revoke-all/route.ts`
- Privacy: `/api/settings/privacy/export/route.ts`, `/.../delete-account/route.ts`, `/.../ccpa-opt-out/route.ts`

### Background jobs (~2 files)

- `/jobs/data_export_processor.ts` — daily cron processes pending export requests
- `/jobs/account_deletion_processor.ts` — daily cron processes scheduled deletions

### Database migrations (1 file)

- `migrations/2026XXXXXX_phase_3b_schema.sql`

### Docs (3 files; this set)

- (Phase 3 master outline already exists)
- `phase-3b-spec.md` — this file
- `phase-3b-explainer.md` — plain-English walkthrough

---

## 5. Implementation order

Phase 3b sub-sections are largely independent and can be built in any order. Recommended sequence based on dependencies:

### 3b.1 — Notifications UI surface (~3 days)

**Day 1 — Connect to Phase 10a preferences.** Build `NotificationPreferencesForm`. Read from `notification_preferences` table. Test toggle behaviors.

**Day 2 — Quiet hours + UI polish.** `QuietHoursSelector`. Save handler. Test save → Phase 10a dispatcher respects.

**Day 3 — Audit log + closeout.** Settings audit log entries. Edge cases (no preferences row exists yet → seed defaults).

### 3b.2 — Payment methods UI surface (~3 days)

**Day 4 — List + display.** `PaymentMethodsList`. Reads from Phase 6a `payment_methods` table. Display brand/last 4/expiration/default.

**Day 5 — Add card flow.** Stripe Elements integration. SetupIntent. Save card. Set default.

**Day 6 — Remove + edge cases.** Remove card. Active recurring booking check. Test card declined error UI.

### 3b.3 — 2FA + active sessions (~1 week)

**Day 7 — TOTP enrollment flow.** Build `TwoFactorSetup` with QR code. `otpauth` library integration. Verify first TOTP. Store encrypted secret.

**Day 8 — Recovery codes.** Generate 10 codes. Hash + store. Display once (downloadable). Regenerate path.

**Day 9 — Sign-in challenge.** Modify auth flow: password → TOTP prompt → success. Recovery code path.

**Day 10 — Active sessions list.** Read from `auth_sessions`. Device parsing (User-Agent). IP geolocation (optional, basic).

**Day 11 — Session revocation.** Sign-out individual + sign-out everywhere. Test 30-second propagation.

### 3b.4 — Privacy data tools (~1.5 weeks)

**Day 12 — Data export request UI + queue.** `DataExportRequest` component. POST creates row in `data_export_requests`.

**Day 13 — Export processor cron.** Daily cron processes pending. Assembles user's data (bookings, reviews, messages, profile). Generates downloadable JSON. Email with link.

**Day 14-15 — Account deletion multi-step.** `DeleteAccountFlow` with: acknowledge cascade → type "DELETE" → final confirm → 7-day grace period (cancel-able). Scheduled deletion.

**Day 16 — Account deletion processor cron.** Cascade per policy. Anonymize where data must remain.

**Day 17 — CCPA opt-out + photo deletion.** Simple toggle. Per-booking photo deletion. Bulk photo deletion option.

**Day 18 — Lawyer copy review + closeout.** All copy verified. End-to-end test.

---

## 6. Specific gotchas

### Gotcha A — Notification preferences row doesn't exist yet

**The problem:** Customer never explicitly set preferences. WF 28 page loads. Reads from `notification_preferences` — no row. UI defaults to all-off when reality is Phase 10a defaults are all-on for critical.

**The fix:** Phase 10a creates `notification_preferences` row at user creation with defaults. Verify before Phase 3b ships. If missing, Phase 3b seeds defaults on first read.

### Gotcha B — Payment method removal during active recurring

**The problem:** Customer has recurring booking using card X. Customer removes card X. Recurring booking can't capture. Cleaner gets unpaid.

**The fix:** Server-side check before card removal: any active recurring booking using this card → require new default first. Block removal until alternate default set.

### Gotcha C — 2FA secret encryption at rest

**The problem:** Plain TOTP secret in DB = if DB compromised, all 2FA broken.

**The fix:** Encrypt secret with application-level key (separate from DB key). Use `crypto.createCipheriv` with AES-256-GCM. Key in environment, not DB.

### Gotcha D — Recovery codes shown only once

**The problem:** Customer enrolls in 2FA. Sees recovery codes. Closes browser without copying. Loses access.

**The fix:** Two-step display: page 1 shows codes with explicit "Copy these now — you won't see them again" warning. Page 2 requires "I have saved my codes" checkbox before continuing. Codes still recoverable via "regenerate" but old codes invalidate.

### Gotcha E — Sign-out everywhere doesn't revoke fast enough

**The problem:** Customer fears compromised session. Hits "Sign out everywhere." Other device still works for 30+ seconds because token cache.

**The fix:** Use Supabase auth's `signOut({scope: 'others'})` which invalidates server-side. Clients refresh tokens within 60 seconds. Document expected propagation in UI: "May take up to 1 minute to take effect."

### Gotcha F — Data export contains too much

**The problem:** Customer exports data. Contains entire dispute thread + cleaner identity + cleaner reviews. Cleaner privacy violated.

**The fix:** Export contains customer's data only — their messages, their photos, their reviews. Cleaner-side counterparts redacted or summarized. Lawyer-review the export schema.

### Gotcha G — Account deletion races with active booking

**The problem:** Customer schedules account deletion. Active booking still in flight. Cleaner shows up; account doesn't exist.

**The fix:** Account deletion includes 7-day grace period. Active bookings must complete before grace ends OR customer cancels them first. Background processor verifies before final deletion.

### Gotcha H — CCPA opt-out semantically meaningless if PureTask doesn't sell data

**The problem:** Customer toggles "Do Not Sell My Personal Info." PureTask never sold info. Toggle has no effect. Customer confused.

**The fix:** Lawyer-reviewed copy explains: "PureTask does not currently sell personal information. This toggle confirms your preference if our practices ever change. We will notify you of any changes." Toggle still meaningful as a documented preference.

---

## 7. Testing strategy

### Unit tests

- `lib/security/totp_generator.ts`: TOTP generation + validation against known test vectors
- `lib/security/recovery_codes.ts`: hash + validate; single-use enforcement
- `lib/privacy/account_deletion_cascade.ts`: cascade rules per data type
- `lib/privacy/data_export_builder.ts`: schema validation; cleaner data redaction

### Integration tests

- 2FA enrollment → sign out → sign in with TOTP → success
- Recovery code path: works once, invalid second time
- Data export: request → cron processes → email sent → download works
- Account deletion: request → 7-day grace → cron processes → cascade verified

### Manual QA

- Full settings flow on staging (each sub-section)
- Stripe test cards for payment methods (success, declined)
- Real authenticator apps (Google Authenticator, Authy, 1Password)

---

## 8. Deployment plan

### Pre-deploy checklist

- [ ] Phase 10a notifications operational (for 3b.1)
- [ ] Phase 6a Stripe customer payments operational (for 3b.2)
- [ ] Lawyer copy reviewed for 3b.4
- [ ] Encryption key for 2FA secrets stored in production env vars
- [ ] Account deletion policy documented + lawyer-reviewed

### Deployment order

1. Migrations
2. Application code
3. Sub-sections deployed in order (or independently)
4. Soft launch: monitor for 7 days

### Rollback plan

- App code revert if bugs surface
- Schema migrations forward-only
- 2FA: customers who enrolled keep enrollment; UI revert doesn't break enrollment

---

## 9. Phase 3b → other phases handoff

Phase 3b output ready for:
- Phase 6a recurring bookings — uses Phase 3b payment method default
- Phase 9c reconciliation — uses Phase 3b account deletion data
- Compliance audits — uses Phase 3b privacy tools

---

## 10. Open questions

1. **Account deletion grace period.** 7 days recommended. Confirm with lawyer.
2. **Data export delivery method.** Email with download link vs in-app download. Lock during 3b.4.
3. **2FA recovery flow without recovery codes.** Lost device + lost codes = customer support path. Document.
4. **CCPA scope.** Apply to all customers or California-only? Apply to all is simpler + safer.

---

This spec is the canonical Phase 3b build reference. Plain-English walkthrough lives in `phase-3b-explainer.md`. High-level navigation lives in `phase-3-master-outline.md`.
