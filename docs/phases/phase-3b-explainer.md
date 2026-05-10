# Phase 3b — Plain-English Breakdown

This document walks through every section of `phase-3b-spec.md` and explains:
- What each thing means in plain English
- What needs to be designed (decisions to make)
- What needs to be built (actual files)
- Why each decision matters
- Beginner-trap warnings where they apply

Phase 3b is **the polish layer for customer settings.** Before Phase 3b, the settings page from Phase 3a has stub cards: "Notifications (coming soon)", "Payment methods (coming soon)", etc. After Phase 3b, every card is functional. Customers can configure their notification preferences, manage payment cards, enable 2FA, and exercise their privacy rights.

**Critical to understand:** Phase 3b is **not the monolithic block originally envisioned.** Several Phase 3b components are now subsumed by other phases:

- **Notifications system (3b.1)** — Phase 10a now owns the dispatcher, infrastructure, and preference backend. Phase 3b just surfaces UI.
- **Payment methods (3b.2)** — Phase 6a now owns Stripe customer payments. Phase 3b just surfaces UI.
- **2FA + sessions (3b.3)** — Genuinely new work.
- **Privacy data tools (3b.4)** — Genuinely new work.

This makes Phase 3b lighter than originally scoped — about 4-5 weeks instead of 4-6.

Read section by section.

---

# Section 0 — External account prerequisites

## What it means in plain English

Phase 3b has **no new vendors.** Stripe is set up (Phase 4 + Phase 6a). Notifications providers set up (Phase 10a). The only blocker is **lawyer review of CCPA copy** for data export, account deletion, and CCPA opt-out flows.

## Why lawyer review matters here

Privacy compliance is one of the few areas where wording really matters. CCPA (California Consumer Privacy Act) has specific requirements:

- "Do Not Sell My Personal Information" link must use those exact words
- Account deletion must clearly state what cascades and what stays
- Data export must include all personal data the user has the right to see

Get this wrong = potential CCPA violations. Lawyer-reviewed copy = compliance.

## Beginner traps

- **Don't ship privacy features without lawyer review.** Even if copy "looks right," CCPA has subtle requirements.
- **Don't try to write privacy policies yourself.** You're a founder, not a privacy attorney. Outsource.
- **Don't assume "we don't sell data" means CCPA doesn't apply.** California still requires the "Do Not Sell" toggle even if you don't currently sell.

---

# Section 1 — Summary

## What it means in plain English

Four things will work by end of Phase 3b:

1. **Notifications preferences UI works.** WF 28 reads/writes Phase 10a's preferences table. Customer can toggle each category × channel, set quiet hours.

2. **Payment methods UI works.** Customer adds/removes cards via Stripe Elements. Sees brand, last 4, default badge. Phase 6a backend.

3. **2FA + sessions work.** TOTP-based 2FA with authenticator apps. Recovery codes. Active session list. Sign-out everywhere.

4. **Privacy tools work.** Data export request. Account deletion. CCPA opt-out. Photo deletion control.

## Why this isn't one big sub-phase

Each of the four components is independent. They share the settings page but their data domains don't overlap. Notifications data is in `notification_preferences`. Payment data is in `payment_methods`. 2FA data is in `user_2fa`. Privacy data is in `data_export_requests` + `account_deletion_requests`.

## Why this matters

Settings completeness is **table stakes for trust.** Customers who can't find their notification settings think the platform doesn't respect them. Customers who can't enable 2FA distrust security. Customers who can't delete their account suspect lock-in.

Without Phase 3b, you have a half-built product. With Phase 3b, customer settings feels complete.

## Beginner traps

- **Don't gate Phase 3b on Phase 10a / Phase 6a being "100% complete."** Each sub-section can ship as its dependency completes. Don't wait.
- **Don't underestimate 2FA complexity.** Recovery flow without recovery codes (lost device + lost paper) is genuinely hard. Plan for support workflow.

---

# Section 2 — Acceptance criteria

## What it means in plain English

Five groups of criteria.

### 3b.1 Notifications UI surface

The key insight: **Phase 3b doesn't store preferences itself.** Phase 10a's `notification_preferences` table is the source of truth. Phase 3b is just a UI surface.

This means: changes from settings UI immediately respected by Phase 10a dispatcher. No sync logic needed.

### 3b.2 Payment methods UI surface

Same pattern. Phase 6a stores payment methods + default. Phase 3b reads and renders.

The "cannot remove last card with active recurring" check matters. Without it, customer accidentally orphans their recurring booking. Customer service ticket inbound.

### 3b.3 2FA + sessions

TOTP-based (not SMS). SMS-based 2FA is well-known to be weaker (SIM swapping). TOTP via authenticator apps is the safer default.

Recovery codes single-use because: if reusable, attacker who steals one code keeps access. Single-use means after first use, that code is dead.

Active sessions list with sign-out per session matters because: customer suspects compromised device. Wants to nuke that session specifically without signing out themselves on their main device.

### 3b.4 Privacy data tools

Data export within 30 days = CCPA compliance. Most users will get it within hours, but 30 days is the legal commitment.

Account deletion multi-step (acknowledge cascade → type "DELETE" → final confirm) prevents accidental deletion. Friction here is good — irreversible action deserves protection.

CCPA opt-out is mostly symbolic for PureTask (we don't sell data). But California requires it anyway.

Photo deletion control is unique: 30-day automatic retention is the default (per WF 29), but customer can delete sooner. Per-booking + bulk options.

### Cross-cutting

Settings audit log captures what changed, by whom, when. Useful for both security investigations + customer support ("when did I change this?").

## Beginner traps

- **Don't store preferences in two places.** Phase 10a owns `notification_preferences`. Don't replicate in `customer_profiles`.
- **Don't ship 2FA without recovery codes.** Lost device = locked out forever without codes.
- **Don't allow 1-step account deletion.** Friction protects customers from accidents.

---

# Section 3 — Database state required

## What it means in plain English

Most tables already exist. Phase 3b adds **6 new tables** primarily for 3b.3 (2FA) and 3b.4 (privacy):

- `user_2fa` — encrypted TOTP secret + enabled flag
- `user_2fa_recovery_codes` — hashed single-use codes
- `data_export_requests` — queue of pending exports
- `account_deletion_requests` — scheduled deletions
- `customer_settings_audit_log` — audit trail
- Columns on `customer_profiles` — CCPA opt-out flag

### Why encrypt 2FA secret

Plain TOTP secret = full 2FA bypass if leaked. Encryption with application-level key (separate from DB key) means leaking the DB doesn't leak 2FA.

### Why hash recovery codes

Hash like passwords. Validate by hashing input + comparing to stored. Storing plaintext = full bypass on DB leak.

### Why audit log

When customer claims "I never changed that setting," audit log proves what happened. When attacker compromises account, audit log shows their changes for forensics.

## Beginner traps

- **Don't store TOTP secret in plaintext.** Encrypt at application level.
- **Don't store recovery codes in plaintext.** Hash like passwords.
- **Don't forget RLS.** `user_2fa` must be readable only by owner.

---

# Section 4 — Files to create

## What it means in plain English

The spec lists ~35 files. Spread across:

- 6 routes (per sub-section)
- ~15 components (forms, lists, displays)
- ~6 library files (TOTP, recovery codes, session revoker, data export, deletion cascade, photo deletion)
- ~10 server actions (one per privileged operation)
- 2 background jobs (export processor, deletion processor)
- 1 migration

### Why so many components

Settings has a lot of small UIs. Each does one thing well: a single form, a single list, a single toggle. Compose into routes.

### Why library code matters

The privacy logic specifically deserves pure-function isolation. Account deletion cascade rules are complex. Bugs here cause real privacy violations.

## Beginner traps

- **Don't put deletion cascade logic in components.** Library code only. Components dispatch.
- **Don't skip the background jobs.** Data export + account deletion are async; need crons.
- **Don't try to handle account deletion synchronously.** Customer waits 30 seconds for cascade = bad UX. Schedule + process async.

---

# Section 5 — Implementation order

## What it means in plain English

Phase 3b sub-sections are largely independent. Recommended sequence:

### 3b.1 (3 days) → 3b.2 (3 days) → 3b.3 (1 week) → 3b.4 (1.5 weeks)

But you can also reorder based on which dependencies finish first:
- If Phase 10a ships before Phase 6a: do 3b.1 first
- If Phase 6a ships before Phase 10a: do 3b.2 first
- 3b.3 and 3b.4 are independent of other phases; can slot anytime

### Why 3b.4 takes longest

Privacy work has lawyer dependency + multi-step UX (account deletion) + cascade logic + background jobs. More moving parts.

## Beginner traps

- **Don't build all four sub-sections in parallel.** Sequential focus.
- **Don't skip lawyer review on 3b.4.** Could re-do work.

---

# Section 6 — Specific gotchas

## What it means in plain English

8 gotchas. Real production issues.

### Gotcha A — Notification preferences row missing

If Phase 10a hasn't created the row yet, Phase 3b reads null and shows wrong defaults. **Fix:** verify Phase 10a creates row at user creation; or seed defaults on first Phase 3b read.

### Gotcha B — Payment removal during active recurring

Customer removes only card; recurring booking orphaned. **Fix:** server-side check before removal.

### Gotcha C — 2FA secret encryption at rest

Plain secret in DB = full bypass on leak. **Fix:** encrypt at application level.

### Gotcha D — Recovery codes shown only once

Customer closes browser. Loses access. **Fix:** explicit copy warning + checkbox + regenerate path.

### Gotcha E — Sign-out everywhere propagation delay

Customer expects instant; reality is up to 60 seconds. **Fix:** UI says "May take up to 1 minute."

### Gotcha F — Data export contains too much

Cleaner privacy violated. **Fix:** customer's data only; cleaner counterparts redacted.

### Gotcha G — Account deletion races with active booking

Cleaner shows up to deleted account. **Fix:** 7-day grace; active bookings must complete first.

### Gotcha H — CCPA opt-out semantically meaningless

PureTask doesn't sell data. **Fix:** lawyer-reviewed copy explains.

## Why these matter

Each gotcha is a real production issue. Read defensively.

## Beginner traps

- **Don't trust Phase 10a to create preferences row.** Verify.
- **Don't ship account deletion without grace period.** Real bookings get orphaned.

---

# Section 7 — Testing strategy

## What it means in plain English

Three layers:

### Unit tests
TOTP generation/validation against test vectors. Recovery codes hash/validate. Cascade rules. Data export schema.

### Integration tests
End-to-end 2FA enrollment + sign-in. Data export request → cron → email → download.

### Manual QA
Real authenticator apps. Stripe test cards. Multi-device 2FA testing.

## Beginner traps

- **Don't test only Google Authenticator.** Test multiple authenticator apps (Authy, 1Password, etc.).
- **Don't skip recovery code tests.** They're the lifeline; must work first time.

---

# Section 8 — Deployment plan

## What it means in plain English

Pre-deploy, deployment order, rollback. Standard.

The unique element: **encryption key management.** TOTP secret encryption key must be in production env vars before any 2FA enrollment happens. Otherwise, customers enroll, key not set, all enrollments unusable.

## Beginner traps

- **Don't deploy Phase 3b code without encryption key set.** Verify env vars first.
- **Don't roll back schema migrations.** Forward-only.

---

# Section 9 — Phase 3b → other phases handoff

## What it means in plain English

Phase 3b output ready for:
- Phase 6a recurring → uses Phase 3b payment method defaults
- Phase 9c reconciliation → uses Phase 3b account deletion data
- Compliance audits → uses Phase 3b privacy tools

---

# Section 10 — Open questions

## What it means in plain English

Four questions:
1. Account deletion grace period (7 days recommended; lawyer confirm)
2. Data export delivery (email link vs in-app download)
3. 2FA recovery without codes (customer support path)
4. CCPA scope (all customers vs California-only)

These are tuning questions, not architectural.

---

# Notes on what comes next

After Phase 3b:

The settings page is **launch-ready.** Every card functional. Customer trust signals all in place.

Phase 3b doesn't gate anything else. Other phases can ship independently. Treat Phase 3b as polish that improves customer experience but isn't on the critical path.

---

This explainer is the canonical Phase 3b learning document. The spec (`phase-3b-spec.md`) is for execution; this is for understanding. The master outline (`phase-3-master-outline.md`) is for navigation.
