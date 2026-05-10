# PureTask — Phase 3 Master Outline

**Purpose:** A single navigation document for everything in Phase 3, split across 3a (foundation, ~1 week) and 3b (settings completion, 4–6 weeks, deferred).

**Status:** Outline only. Detailed specs and explainers come after this is approved.

---

## How to read this document

For each phase and each section within a phase, you get four headings:

- **Goal** — what this section accomplishes in plain English
- **Design** — decisions to make before writing code (UX, schema additions, business rules)
- **Build** — concrete files, components, migrations, integrations
- **Verify** — how you know it works (tests, end-to-end checks)

The **Goal** is the "why." The **Design** is the "what to think about." The **Build** is the "what to write." The **Verify** is the "how to know it's done."

If a section doesn't list a Design step, that means the design decisions are already settled in the schema or wireframes — just build to spec.

---

# Phase 3a — Customer foundation (1 week)

**Phase goal:** A freshly authenticated customer can complete a profile, add a service address, and configure a photo policy. The settings page exists with all WF 28 sections visible (most as scaffolded stub cards). Phase 5 (browse) and Phase 6 (booking) can be built on top of this.

**Phase depends on:** Phase 2 complete and verified end-to-end (sign up, sign in, sign out all work on production with real users).

**Wireframes covered:** WF 28 (settings shell), WF 29 (privacy + photo policy), and one new screen we design for address management.

**Acceptance for the phase:** A real test customer signed up via production URL can complete profile, add an address, set a photo policy, and have all three persist on refresh. RLS prevents cross-customer data access.

---

## 3a.1 — Customer profile bootstrap

### Goal

When a new user finishes sign-up via Phase 2 auth, a `customer_profiles` row is automatically created so the rest of the app can rely on it existing. No "complete your profile" gate; profile rows just exist by the time the user hits the settings page.

### Design

- **Trigger trigger or backfill?** Decision: trigger fires on insert into `users` when `primary_role = 'customer'`. Plus a one-time backfill query in the migration to handle test users who already exist from Phase 2 verification.
- **What happens if a user changes role later?** Out of scope for Phase 3a. Documented as a known gap.
- **Defaults at creation:** photo_policy = 'default', skip_photo_rooms = empty array, default_address_id = null, default_payment_method_id = null. All other columns use schema defaults.
- **Edge case:** sign-up failure between `auth.users` and `public.users` insert. Phase 2's user-sync migration handles this; Phase 3a inherits whatever Phase 2 produced. Don't re-litigate.

### Build

- `db/migrations/0010_phase3a_customer_profile_bootstrap.sql`:
  - Trigger function `handle_new_customer_user()`
  - Trigger on `users` AFTER INSERT WHEN `NEW.primary_role = 'customer'`
  - Backfill query: `INSERT INTO customer_profiles (user_id) SELECT id FROM users WHERE primary_role = 'customer' AND id NOT IN (SELECT user_id FROM customer_profiles) ON CONFLICT DO NOTHING;`

### Verify

- Apply migration to dev Supabase
- Sign up a brand-new test user via production URL
- Confirm row appears in `customer_profiles` automatically
- Confirm any pre-existing test users from Phase 2 also have rows now (backfill worked)

---

## 3a.2 — Settings page shell (WF 28)

### Goal

A `/settings` page exists with all 5 sections from WF 28 visible. Profile and Privacy + Data link are real and working. Notifications, Payment methods, and Security are stub cards that show the user "this is coming, here's when."

### Design

- **Stub card UX:** each unfinished section has a card showing the section name, a one-sentence description of what it'll do, and a small badge like "Coming in Phase 6" or "Coming pre-launch." The card is visually consistent with finished sections so users perceive completeness.
- **What goes in each section:**
  - Profile header (real) — display name, email, joined date, [Edit] button
  - Notifications (stub) — "Push, email, and SMS notification preferences. Coming in Phase 10."
  - Payment methods (stub) — "Add and manage cards for booking. Coming in Phase 6."
  - Security (stub) — "Two-factor auth and active session management. Coming pre-launch."
  - Service addresses (real) — list of addresses, "Manage addresses" button → 3a.4
  - Privacy + data (real) — link to /settings/privacy
  - Sign out (real, probably already in Phase 2)
- **Where addresses live:** added as a new section to settings since the Master Guide assigns them to Phase 3 and no wireframe places them elsewhere. Document this as deliberate deviation from WF 28.

### Build

- `src/app/(app)/settings/page.tsx` — server component, fetches profile + addresses summary
- `src/features/customer/components/SettingsLayout.tsx` — section card renderer
- `src/features/customer/components/StubCard.tsx` — reusable stub component (section name + description + phase badge)
- `src/features/customer/components/ProfileHeader.tsx` — display the user's name/email/joined date with edit button

### Verify

- Page loads without error for a freshly signed-up customer
- All 6 sections render (5 from WF 28 + addresses)
- Stub cards say what's coming and when
- Profile header shows real user data
- Mobile width 360px renders without horizontal scroll

---

## 3a.3 — Profile section (real)

### Goal

Customer can edit their display name and phone number. Email is read-only here (changes go through auth flow in Phase 2 territory).

### Design

- **Phone format:** stored as E.164. UI accepts loose input and normalizes on save. If Phase 2 already established a phone normalization utility, reuse it; if not, this phase introduces it.
- **What can't be edited here:** email (auth-managed), password (auth flow), primary_role (system-managed).
- **What's the minimum viable form?** Name (required, max 100 chars), phone (optional, E.164 if provided). That's it. Resist adding more.

### Build

- `src/app/(app)/settings/profile/page.tsx` — server component, fetches current profile
- `src/features/customer/components/ProfileForm.tsx` — client component, form with name + phone fields
- `src/features/customer/actions.ts::updateProfile(input)` — server action with Zod validation, returns success/error
- `src/features/customer/validation.ts::profileUpdateSchema` — Zod schema

### Verify

- Edit name, save, refresh — change persists
- Edit phone, save, refresh — change persists in E.164
- Submit with empty name — server rejects with friendly error
- Submit with malformed phone — server rejects with friendly error

---

## 3a.4 — Address management (real, designed by us)

### Goal

Customer can add, edit, set-default, and soft-delete service addresses. By Phase 5 (browse), every customer who wants to book has at least one address.

### Design

- **No wireframe exists for this.** Master Guide says "Batch 3a customer signup/discovery is not yet designed." We design this UI ourselves, following PureTask's existing visual patterns from WF 28 and WF 1.
- **List page UX:** Each address is a card showing label (or "Untitled" if blank), full address, "Default" badge if applicable, [Edit] and [Delete] buttons. Top of page: [+ Add address] button. If no addresses exist, show empty state "You haven't added any addresses yet."
- **New/edit form fields:** label (optional), street_1 (required), street_2 (optional), city (required), state (US 2-letter dropdown), zip_code (5 digits or 5+4), country (locked to US, hidden field), access_instructions (optional textarea, max 500 chars).
- **Default address logic:** first address auto-becomes default. Customer can change default by clicking "Set as default" on a non-default. If customer soft-deletes the default, action automatically promotes another address to default (or sets to null if no others exist).
- **No geocoding in 3a.** Latitude/longitude stay null. Phase 5 adds geocoding.
- **Soft delete only.** Deleting an address sets `deleted_at = NOW()`. Past bookings still resolve. Customer doesn't see deleted addresses in the list.

### Build

- `db/migrations/0011_phase3a_addresses_rls.sql` — RLS policies for `addresses` table
- `src/app/(app)/settings/addresses/page.tsx` — list page
- `src/app/(app)/settings/addresses/new/page.tsx` — new address form
- `src/app/(app)/settings/addresses/[id]/page.tsx` — edit address form
- `src/features/customer/components/AddressList.tsx`
- `src/features/customer/components/AddressForm.tsx` — shared between new and edit
- `src/features/customer/components/AddressCard.tsx` — single row in list
- `src/features/customer/actions.ts`:
  - `createAddress(input)` — insert + auto-default if first
  - `updateAddress(id, input)` — verify ownership, update
  - `softDeleteAddress(id)` — set deleted_at + handle default reassignment
  - `setDefaultAddress(id)` — verify ownership, update customer_profiles.default_address_id
- `src/features/customer/validation.ts::addressSchema`
- `src/features/customer/queries.ts`:
  - `getAddresses(userId)` — non-deleted only
  - `getAddress(id, userId)` — single, owned by user

### Verify

- Add first address → it's automatically default
- Add second address → first stays default
- Click "Set as default" on second → default badge moves
- Edit address → changes persist
- Soft delete default address (with another address present) → other address becomes default
- Soft delete only address → default_address_id becomes null
- Hard refresh after each operation — state persists correctly
- Try to fetch another user's address via direct URL `/settings/addresses/<their-id>` → returns not-found or unauthorized
- RLS test: in Supabase SQL editor with user A's auth context, `SELECT * FROM addresses` returns only user A's addresses

---

## 3a.5 — Privacy + photo policy page (WF 29)

### Goal

A `/settings/privacy` page where the customer chooses their photo policy. Photo policy choice is real and working; other privacy features (data export, CCPA opt-out, account deletion) are stub cards.

### Design

- **Photo policy UX:**
  - Three radio options matching WF 29 exactly:
    1. "Default — all rooms photographed" (selected by default for new accounts)
    2. "Skip specific rooms"
    3. "Skip all photos — with dispute waiver"
  - When user picks option 2: a multi-select appears below with common rooms (Kitchen, Living Room, Bathroom, Master Bedroom, Other Bedrooms, Office, Garage, Basement, Other) + a free-text "Other" field.
  - When user picks option 3: a modal opens with the waiver text, requires explicit checkbox confirmation, and only on confirmation does the form save with `waiver_accepted_at = NOW()`.
- **Waiver text:** Use placeholder text marked `<!-- PENDING_LAWYER_REVIEW -->`. Do not block Phase 3a on lawyer turnaround. Waiver placeholder: "I waive the right to dispute solely on cleaning quality without providing my own photo evidence."
- **Photography Policy link:** points to `/legal/photography-policy` which is a placeholder page reading "Coming pre-launch — pending legal review." Document the placeholder.
- **Photo info copy:** Static educational text from WF 29 ("Photos protect both you and your cleaner..."). This text doesn't need lawyer review; it's just product copy. Keep it accurate to schema (encrypted at rest, 90-day deletion, never used for marketing/AI).
- **Stub cards on this page:**
  - Download your data — "Export your bookings, messages, and photos. Coming pre-launch (CCPA)."
  - Request earlier photo deletion — "Delete photos before 90-day automatic deletion. Coming pre-launch."
  - California privacy rights — "CCPA opt-out and data rights. Coming pre-launch."
  - Account deletion — "Permanently delete your account. Coming pre-launch."

### Build

- `src/app/(app)/settings/privacy/page.tsx` — page with photo policy form + stub cards
- `src/app/legal/photography-policy/page.tsx` — placeholder page reading "Coming pre-launch"
- `src/features/customer/components/PhotoPolicyForm.tsx` — three radios + conditional sub-fields
- `src/features/customer/components/RoomMultiSelect.tsx` — for "skip named rooms"
- `src/features/customer/components/WaiverModal.tsx` — explicit confirmation modal
- `src/features/customer/actions.ts::updatePhotoPolicy(input)` — Zod validation, conditional waiver_accepted_at logic
- `src/features/customer/validation.ts::photoPolicySchema` — Zod with conditional refinements:
  - if policy = 'skip_named_rooms', skip_photo_rooms must be non-empty array
  - if policy = 'skip_all_with_waiver', waiver_acknowledgment must be true (UI flag)
  - if policy = 'default', skip_photo_rooms must be empty

### Verify

- Default policy is "default"
- Pick "skip named rooms," select "Kitchen" + "Master Bedroom," save, refresh → state persists
- Pick "skip all + waiver" → modal appears, save without checking the box → modal stays open, change doesn't persist
- Pick "skip all + waiver," check box, confirm → policy saves, `waiver_accepted_at` is set in DB
- Switch back to "default" → previous skip rooms cleared, waiver_accepted_at preserved (don't clear it; it's a record of acknowledgment)
- All four stub cards render with correct phase labels
- Photography Policy link goes to placeholder page

---

## 3a.6 — RLS verification

### Goal

The whole point of RLS is that your application can't accidentally leak customer data even if the app code has bugs. Phase 3a is the first phase where customer data exists in volume, so this is where RLS gets stress-tested.

### Design

This is a verification-only step, not a build step. The RLS policies themselves are added in 0010 and 0011 migrations.

### Build

(No new code; this is a test pass.)

### Verify

- Create two test users via production sign-up: User A and User B
- Each adds an address and configures a photo policy
- In Supabase SQL editor:
  - Set auth context to User A: `SELECT set_config('request.jwt.claim.sub', '<USER_A_ID>', true);`
  - Run `SELECT * FROM customer_profiles;` → only User A's profile
  - Run `SELECT * FROM addresses;` → only User A's addresses
  - Try `UPDATE customer_profiles SET photo_policy = 'default' WHERE user_id = '<USER_B_ID>';` → 0 rows updated
- Repeat for User B
- Document the test results in the Phase 3a progress doc

---

## 3a.7 — Phase 3a verification + closeout

### Goal

Phase 3a is complete only when verified end-to-end on production, not when local builds pass.

### Design

(No design; this is a process step.)

### Build

- `docs/phases/phase-3a-progress-update.md` — written at the end, mirroring the Phase 1 format

### Verify

- All acceptance criteria from each section above pass on production URL with a fresh test customer account
- `pnpm lint`, `pnpm typecheck`, `pnpm build` all green
- Vercel deploy succeeds and serves the correct version (verify with cache-bust query param if needed)
- RLS verification (3a.6) documented
- Tag `phase-3a-complete` in git
- Open PR with files-of-interest list

---

# Phase 3b — Settings completion (4–6 weeks, deferred)

**Phase goal:** Replace all stub cards from Phase 3a with real, working features. Bring the settings page to launch-ready state.

**Phase depends on:**
- Phase 3a complete
- For Notifications: notification dispatcher backend (this phase introduces it; no other dependency)
- For Payment methods: Stripe customer payment integration (overlaps heavily with Phase 6a)
- For CCPA features: lawyer-reviewed copy
- For Account deletion: a clear policy on what cascades and what's preserved

**Wireframes covered:** Completes WF 28 and WF 29.

**Critical scoping note:** Phase 3b does NOT have to be one continuous block of work. Each sub-phase below is independent and can be slotted into the build wherever it makes sense. Notifications might fit better right before launch. Payment methods will likely happen as part of Phase 6a. Account deletion can be a final pre-launch hardening item.

---

## 3b.1 — Notifications system (~2–3 weeks)

### Goal

Replace the notifications stub card with a working preference UI backed by a real notification dispatcher.

### Design

- **Provider choices:** Push (Web Push API + service worker, or Firebase Cloud Messaging if mobile native ever happens), email (Resend, Postmark, or SendGrid), SMS (Twilio).
- **Preference granularity:** Per WF 28 — separate toggles for "Cleaner is on the way," "Job complete · review request," "Recurring suggestions," "Promos and tips," plus channel-level master toggles for push/email/SMS.
- **Default state for new customers:** all transactional notifications ON, marketing/promo OFF, push ON if browser supports, email ON, SMS off (requires explicit phone verification).
- **Schema additions needed:**
  - `notification_preferences` table (or columns on `customer_profiles`?) — decision required
  - `notification_log` table for delivery tracking
  - Possibly extending `notifications` and `notification_deliveries` tables already in B6 schema
- **Dispatcher pattern:** event-driven. When `booking_state_event` fires (Phase 6), the dispatcher reads preferences, picks channels, dispatches.

### Build

- New migration for preference schema
- `src/lib/notifications/dispatcher.ts` — server-side event handler
- Three provider integrations: push, email, SMS
- `src/features/customer/components/NotificationPreferencesForm.tsx`
- Server actions for toggling preferences
- Server worker for web push subscription management

### Verify

- Customer toggles "Cleaner is on the way" off → trigger event, no push fires, email still fires (per their settings)
- SMS opt-in flow: customer requests SMS → receives verification code → enters code → SMS preferences unlocked
- All three channels deliver in <30 seconds for high-priority events
- Failed deliveries are logged and retry-eligible

---

## 3b.2 — Payment methods (~1 week, overlaps with Phase 6a)

### Goal

Replace the payment methods stub card with real Stripe-backed card management.

### Design

- **This is the same work as Phase 6a (Stripe customer payment).** The only question is sequencing. Two sane patterns:
  - Do it as part of Phase 6a (recommended): Phase 6a builds the full Stripe customer payment integration including booking-time charge. The settings page UI then surfaces the existing customer payment methods.
  - Do it as a Phase 3b standalone (alternative): build Stripe customer setup (`SetupIntent` + payment method save) without booking-time charge. Phase 6a then layers booking charges on top.
- **Default payment method logic:** mirrors default address pattern. First card auto-becomes default. Customer can change. Soft delete reassigns default.
- **Card display:** brand (Visa/MC/Amex/Discover), last 4 digits, expiration month/year, default badge. Don't store card data; pull from Stripe.

### Build

- `src/lib/stripe/client.ts` and `src/lib/stripe/server.ts` (probably already partially in repo)
- `src/app/(app)/settings/payment-methods/page.tsx`
- `src/features/customer/components/PaymentMethodsList.tsx`
- `src/features/customer/components/AddCardForm.tsx` (Stripe Elements)
- Server actions for: create SetupIntent, list payment methods (proxy to Stripe), set default, delete card
- `db/migrations/00xx_phase3b_payment_methods.sql` — local mirror table or just `default_payment_method_id` reference

### Verify

- Add card via Stripe Elements → card appears in list
- Delete non-default card → removed from Stripe and from view
- Set non-default card as default → default badge moves; `customer_profiles.default_payment_method_id` updates
- Test card 4000 0000 0000 0002 (declined) → error rendered cleanly

---

## 3b.3 — Security: 2FA + active sessions (~1 week)

### Goal

Replace the security stub card with real 2FA and session management.

### Design

- **2FA approach:** TOTP (RFC 6238) via authenticator apps. Don't roll SMS-based 2FA — known weaker. Use a mature library like `otpauth` or Supabase's built-in MFA.
- **Recovery codes:** generate 10 single-use codes when 2FA enrolled. User can regenerate.
- **Active sessions:** list of recent sessions with device info (user agent), IP (rough city if possible), last seen timestamp, "Sign out this session" button per row.
- **"Sign out everywhere" button:** revokes all sessions except current.
- **Schema:** `auth_sessions` table already exists in B1. May need columns added or a `session_metadata` join table.

### Build

- 2FA enrollment flow: `/settings/security/2fa/enable` → QR code → user scans → user enters first TOTP → success
- 2FA challenge during sign-in: if user has 2FA enrolled, sign-in flow asks for TOTP after password
- `src/app/(app)/settings/security/page.tsx`
- `src/features/customer/components/TwoFactorSetup.tsx`
- `src/features/customer/components/RecoveryCodesDisplay.tsx`
- `src/features/customer/components/ActiveSessionsList.tsx`
- Server actions: enroll2FA, disable2FA, regenerateRecoveryCodes, signOutSession, signOutAll

### Verify

- Enroll 2FA → sign out → sign in requires TOTP
- Use recovery code instead of TOTP → works once, then invalid
- "Sign out this session" → that session immediately can't refresh
- "Sign out everywhere" → other devices kicked out within 30 seconds

---

## 3b.4 — Privacy data tools: export, photo deletion, CCPA opt-out (~1 week)

### Goal

Replace the three CCPA-related stub cards with working features.

### Design

- **Download your data (CCPA right to access):**
  - User clicks "Download" → backend kicks off async export job → email link sent when ready
  - Export contains: profile, addresses, bookings, messages, payment history, photo references (URLs valid for 7 days), preferences, audit log
  - Format: ZIP with one JSON file per category
  - SLA: 30 days max per CCPA, target 24 hours
- **Request earlier photo deletion:**
  - User picks a booking from a list → confirms deletion → photos for that booking deleted within 24 hours instead of waiting for 90-day auto-deletion
  - Requires Phase 6e photo system to exist
- **CCPA opt-out:**
  - "Do not sell my personal information" toggle (state law requirement)
  - Even if you don't sell data, the toggle has to exist
  - Document explicitly that PureTask doesn't sell data; toggle is for compliance form
- **Lawyer dependency:** all on-page copy needs review. Use placeholder text marked `<!-- PENDING_LAWYER_REVIEW -->`.

### Build

- Background job for data export (BullMQ, Inngest, or Supabase Edge Functions)
- `src/app/(app)/settings/privacy/data-export/page.tsx`
- `src/features/customer/components/DataExportRequest.tsx`
- `src/features/customer/components/EarlyPhotoDeletion.tsx`
- `src/features/customer/components/CCPAOptOut.tsx`
- New table: `data_export_requests` with status (queued, processing, ready, failed, expired)

### Verify

- Request data export → receive email within 24 hours → download ZIP → verify all sections present
- Request photo deletion for a specific booking → photos deleted within 24 hours from R2
- Toggle CCPA opt-out → state persists, audit logged

---

## 3b.5 — Account deletion (~1 week)

### Goal

Replace the account deletion stub card with a real, legally-defensible account deletion flow.

### Design

- **What gets deleted:** user's profile data, addresses, photo policy, payment methods (Stripe customer also deleted), notifications, sessions
- **What gets retained (and why):** booking records (tax/legal requirement, 7+ years), reviews left for cleaners (those reviews belong to the cleaner now), payment ledger entries (tax records), audit logs. All of these have the user's PII anonymized but the records remain.
- **Pending bookings:** must be resolved before deletion. UI shows "You have 2 active bookings. Resolve these first."
- **Confirmation flow:** user types their email to confirm. Submit → 7-day cooling-off period → after 7 days, deletion executes (this is a common pattern that prevents accidental/coerced deletions).
- **Lawyer dependency:** Cooling-off and retention policy must align with Customer ToS and CCPA. Use placeholder text.

### Build

- `src/app/(app)/settings/privacy/delete-account/page.tsx`
- Multi-step flow: warning → list of pending items → confirmation typing → cooling-off acknowledgment
- `db/migrations/00xx_phase3b_account_deletion.sql` — `account_deletion_requests` table
- Background job that runs daily, finds requests past cooling-off, executes deletion
- Anonymization functions for retained tables

### Verify

- Try to delete with active booking → blocked with clear message
- Submit deletion → email confirmation arrives → 7 days pass → account is gone
- Cancel deletion within 7 days → request cancelled, account intact
- After deletion: bookings still readable in admin tools (anonymized), reviews still on cleaner profiles

---

## 3b.6 — Phase 3b verification + closeout

### Goal

Each sub-phase (3b.1–3b.5) is independently verifiable and shippable. Closeout happens per sub-phase, not as one big closeout.

### Build

- One progress doc per sub-phase: `docs/phases/phase-3b1-progress-update.md`, `phase-3b2-progress-update.md`, etc.
- One git tag per sub-phase: `phase-3b1-complete`, etc.

### Verify

- Stub card replaced with real feature on production
- All acceptance criteria for the sub-phase pass
- No regressions to Phase 3a functionality

---

# Cross-cutting concerns

These apply to both Phase 3a and Phase 3b and should be visible in every spec.

## C1 — Lawyer-pending copy

Every piece of user-facing legal/compliance text in Phase 3 (waiver, photography policy, CCPA opt-out, account deletion warning, data export TOS) needs lawyer review before launch. Inline notes flag each spot. The standard marker is:

```
<!-- PENDING_LAWYER_REVIEW: brief description of what needs review -->
```

Cursor doesn't block on lawyer turnaround. The placeholder text must be plausibly correct — not gibberish — but lawyer-final.

## C2 — Mobile-first

All UI must work on a 360px-wide viewport without horizontal scroll. The customer base will be mostly on phones. Test on actual phone (or DevTools mobile emulator) before declaring complete.

## C3 — RLS first, application checks second

Every data access path checks RLS at the database level AND ownership at the application level. Defense-in-depth. Don't skip the application check just because RLS exists.

## C4 — Soft delete only

No `DELETE FROM` statements anywhere in customer-facing code. All deletes set `deleted_at` and queries filter accordingly.

## C5 — Server actions return result objects

Every server action returns `{ success: true, data?: T } | { success: false, error: string }`. Never throws. Never lets DB errors leak to the client. Always logs server-side.

## C6 — Verification on production, not local

Phase complete = production URL verified with a real test account. Local builds and Cursor's word do not constitute verification.

---

# What we'll produce after this outline is approved

1. **`phase-3a-spec.md`** — detailed executable spec for Cursor (~300 lines)
2. **`phase-3a-explainer.md`** — plain-English breakdown (~600 lines)

Phase 3b specs come later, when 3a is complete and you're ready to schedule sub-phases. They don't need to all exist at once.

---

# Open questions for your review

Before I write the detailed Phase 3a spec and explainer, please confirm or push back on these:

1. **Settings page deviation from WF 28:** I'm adding a "Service addresses" section to settings since it has no other home. Acceptable, or do you want addresses elsewhere (top-level menu? customer dashboard sidebar)?

2. **Address geocoding deferred:** Phase 3a leaves lat/lng null. Phase 5 backfills. OK?

3. **Stub card UX:** stubs are visually consistent with real cards, with a "Coming in Phase X" badge. OK, or do you want them visually de-emphasized (grayer, smaller)?

4. **Phase 3b sub-phase ordering:** my outline lists 3b.1 (notifications) → 3b.5 (account deletion). Real-world order will likely be 3b.2 (payments, with Phase 6a) → 3b.4 (CCPA, before launch) → 3b.5 (deletion, before launch) → 3b.3 (security, post-launch acceptable) → 3b.1 (notifications, before launch). Want me to renumber 3b.1–5 in this priority order, or keep them as-is and just leave a note about real-world sequencing?

5. **Phase 3a duration:** I'm projecting 5–7 working days. Comfortable with that, or want me to size differently?
