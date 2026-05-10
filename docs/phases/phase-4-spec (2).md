# Phase 4 — Cleaner Onboarding Pipeline Specification

> **Author note (transparency):** This spec is being written ahead of when Phase 4 will actually be built — at minimum 7-10 days from now (after Phase 3a completes), more likely 2-3 weeks. The spec is correct as of the current date but will need a refresh when implementation actually starts, particularly for: Stripe Identity API surface, Checkr API and approval timeline, and Stripe Connect Express requirements. These services change. Treat this document as an **aggressive draft**, not a final spec.

**Phase goal:** A new cleaner can complete a multi-step application, undergo identity verification (Stripe Identity), pass a background check (Checkr), set up payouts (Stripe Connect Express), and be approved by an admin. By the end of Phase 4, the cleaner has a complete `cleaner_profiles` row and can be discovered in Phase 5.

**Estimated duration:** 3 weeks of focused work — but realistically 4-5 calendar weeks because of external integration approval timelines (Checkr can take 1-2 weeks for business verification; Stripe Identity has its own activation; some lawyer-dependent items).

**Depends on:**
- Phase 3a complete and verified end-to-end on production
- Phase 2 auth working for cleaner-role users
- External accounts in place (see Section 0 below — the most important section in this spec)

**Wireframes covered:** WF 33 (background check status), WF 34 (tax info collection), WF 49 (photo etiquette training), WF 55 (admin application queue), WF 63 (Stripe Connect onboarding wrapper). Plus an **11-step application form that doesn't have a wireframe** — we design it ourselves.

**Critical structural note:** Phase 4 has **5 logical sub-phases** (not 7 like Phase 6, but enough that you should not try to do them as one push). Sub-phases:
- **4a** — External account setup (you, manual, before any code)
- **4b** — Application form + draft persistence (the 11-step form)
- **4c** — Stripe Identity verification integration
- **4d** — Checkr background check integration
- **4e** — Stripe Connect Express onboarding
- **4f** — Admin application review interface
- **4g** — Approval pipeline + cleaner_profile creation

These run mostly in sequence with some overlap. Don't try to do them in parallel.

---

## 0. External account prerequisites — DO THIS FIRST

This is not a normal phase prerequisite. It's three separate business relationships that each have their own approval timelines. **Start these immediately upon Phase 3a completion, or even during Phase 3a if you want to save time.** They run in parallel; none block each other.

### 0.1 Stripe account (probably already have one for Phase 6a)

- Existing Stripe account if you set one up for Phase 1 / Phase 6a planning, otherwise create at stripe.com
- Stripe Identity activation: dashboard → Products → Identity → activate
- Stripe Connect activation: dashboard → Connect → activate
  - Choose **Express** account type (NOT Custom or Standard — Express is the right product for marketplace contractor onboarding)
- Generate test mode API keys; save to a password manager or secret store
- Read: stripe.com/docs/identity (current as of writing) and stripe.com/docs/connect/express-accounts

**Time cost:** 1-2 hours of your time, plus any business verification Stripe requires (usually fast for US businesses).

### 0.2 Checkr account

- Apply for Checkr business account at checkr.com
- They will require:
  - Business verification (EIN, business address, articles of incorporation)
  - Compliance review (Checkr is regulated; they want to know what you'll use it for)
  - Pricing/contract negotiation
- Once approved: receive API credentials, FCRA disclosures and consent templates, webhook URLs
- Read: docs.checkr.com (especially the FCRA compliance section — this is legally non-trivial)

**Time cost:** 1-2 hours of your time spread over 1-2 weeks of Checkr's review. **This is the longest-pole item.** Apply on day 1 of Phase 3a if possible.

### 0.3 Lawyer items that block Phase 4 (or should)

These are not blocking from a "code can't ship" perspective, but they are blocking from a "you should not put this in front of real users without lawyer review" perspective:

- **Cleaner ToS** (independent contractor agreement)
- **FCRA disclosure and consent forms** for background check (Checkr provides templates; lawyer should review)
- **Tax classification language** (W-9 collection, 1099 issuance — what your platform says about cleaner tax obligations)
- **Identity verification consent** (data retention, what Stripe Identity shares with you)

If lawyer engagement hasn't started by the time Phase 4 begins, ship Phase 4 with `<!-- PENDING_LAWYER_REVIEW -->` placeholder text — same pattern as Phase 3a's photo policy waiver. But genuinely engage a lawyer; this stuff has more legal teeth than the photo policy.

### 0.4 Decisions you need to make before building 4a

- **Which states will you operate in at launch?** Background check requirements differ by state (some require additional disclosures). Easiest is "California only" at launch; expanding later is cheaper than backing out.
- **What's your background check threshold?** Checkr returns "clear," "consider," or "failed." "Consider" means there's something on the record that needs human judgment. You need a documented policy: which considerations are auto-rejected (e.g., violent felony in last 7 years), which trigger admin review, which auto-pass.
- **What's the appeals process?** A cleaner whose application is rejected has rights — both legal (FCRA) and practical (your reputation). Document it.

These are policy decisions, not engineering decisions, and they belong in a separate doc (`docs/policies/cleaner-onboarding-policy.md`) that I'd recommend writing before or during 4a setup.

---

## 1. Summary

After Phase 3a, the system has customers but no cleaners to clean for them. Phase 4 builds the entire pipeline that turns "someone who wants to be a cleaner" into "an approved, payable, bookable cleaner."

The pipeline has 6 stages from the cleaner's perspective:

1. **Apply.** Multi-step form (11 steps) collects all the information PureTask needs.
2. **Verify identity.** Stripe Identity confirms the cleaner is who they say they are.
3. **Background check.** Checkr verifies criminal history and other disqualifying factors.
4. **Set up payouts.** Stripe Connect Express creates a payable account.
5. **Photo etiquette training.** Gated step the cleaner must complete (WF 49).
6. **Admin approval.** A human reviews the full application before approval.

Only after stage 6 does the cleaner have a `cleaner_profiles` row and become discoverable.

The admin tooling (WF 55) is built **as part of Phase 4**, not deferred to a "Phase 11 admin tools" mythical future. Cleaners cannot be approved without it; it's a hard dependency.

---

## 2. Acceptance criteria

A new applicant who creates a cleaner-role account must be able to do all of the following on production URL:

### Cleaner-side criteria

- [ ] Sign up via cleaner-flagged sign-up flow → `users` row created with `primary_role = 'cleaner'` → `cleaner_applications` row created in `draft` state via trigger or first-form-step
- [ ] Complete the 11-step application form across multiple sessions (draft state persists; can save and continue later)
- [ ] Submit application → state transitions from `draft` to `submitted`; `submitted_at` timestamp set
- [ ] Complete Stripe Identity verification flow → `identity_verifications` row created with state managed by Stripe Identity webhooks
- [ ] Complete Checkr background check consent and submission → `background_checks` row created in `requested` state; transitions through Checkr's webhook lifecycle
- [ ] See real-time status of background check on WF 33 (background check status page) — `requested` → `pending` → `in_progress` → `clear` (or other terminal states)
- [ ] Complete Stripe Connect Express onboarding via Stripe-hosted flow (WF 63) → `pending_stripe_account_id` and `stripe_onboarding_completed_at` populated
- [ ] Complete photo etiquette training (WF 49) — gated step that prevents approval until completed
- [ ] Provide tax information (W-9 collection — WF 34) — captured and persisted

### Admin-side criteria

- [ ] Admin can see a queue of submitted applications (WF 55) sorted by submission date
- [ ] Admin can open an individual application and see all its data, identity verification result, background check result, Connect onboarding status, training completion
- [ ] Admin can transition application state: submitted → in_review (claim the application)
- [ ] Admin can transition: in_review → approved (with required prerequisites — see below)
- [ ] Admin can transition: in_review → rejected (with required `rejection_reason`)
- [ ] Admin can transition: in_review → needs_info (with `info_request_message` to the applicant)
- [ ] On approval: `cleaner_profiles` row is automatically created via trigger or transaction; `approved_at` set; `cleaner_profile_id` back-reference populated

### Approval prerequisites (enforced at application + DB level)

- [ ] Cannot approve unless `identity_verification.state = 'verified'`
- [ ] Cannot approve unless `background_check.state = 'clear'` OR admin has reviewed a `'consider'` and explicitly approved
- [ ] Cannot approve unless `stripe_onboarding_completed_at IS NOT NULL`
- [ ] Cannot approve unless photo etiquette training completion timestamp set
- [ ] Cannot approve unless tax information (W-9 data) captured

### Cross-cutting criteria

- [ ] All forms render mobile-first (≥360px viewport)
- [ ] RLS prevents an applicant from reading or modifying another applicant's data
- [ ] RLS allows admins to read all applications via admin role policy
- [ ] Cleaner can re-enter the application after closing the browser tab (draft state persists)
- [ ] Server-side Zod validation rejects bad input on every form step
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` all pass
- [ ] Production deploy serves correct version
- [ ] At least one full test cleaner has been onboarded end-to-end on production: signed up → applied → identity verified (using Stripe Identity test mode) → background check submitted (Checkr test mode) → Connect onboarding completed → photo training done → admin approved → `cleaner_profiles` row exists → cleaner can sign in and see their cleaner dashboard (Phase 5 territory but the approval flow ends here)

---

## 3. Database state required

Existing tables from B7 (no schema changes — these were built in B7 specifically for Phase 4):

- `cleaner_applications` — the application record itself
- `background_checks` — recurring (2-year expiration)
- `identity_verifications` — separate from background checks
- `cleaner_profiles` — created on approval

### New migration: `0012_phase4_cleaner_onboarding.sql`

This migration adds:

1. **Trigger or function** for application creation when a cleaner-role user signs up:
   ```sql
   -- When a user with primary_role = 'cleaner' is inserted,
   -- automatically create a cleaner_applications row in 'draft' state.
   -- Uses application_number generator (sequence-based).
   ```

2. **Approval trigger** that creates `cleaner_profiles` when an application transitions to `approved`:
   ```sql
   -- When cleaner_applications.state transitions to 'approved',
   -- INSERT a cleaner_profiles row with data from the application,
   -- set cleaner_applications.cleaner_profile_id to the new row.
   -- This is atomic — must be in a single transaction.
   ```

3. **Application number sequence** for human-readable IDs (`APP-2025-001234`):
   ```sql
   CREATE SEQUENCE cleaner_application_number_seq;
   -- Generator function that produces "APP-{YYYY}-{seq:6}"
   ```

4. **RLS policies on `cleaner_applications`:**
   - SELECT: applicant can read own application; admin can read all
   - UPDATE: applicant can update own draft (state = 'draft' only); admin can update any
   - INSERT: blocked (handled by trigger)
   - DELETE: blocked

5. **RLS policies on `background_checks`:**
   - SELECT: subject can read own; admin can read all
   - INSERT/UPDATE: only via webhook handler (uses service role) or admin
   - DELETE: blocked

6. **RLS policies on `identity_verifications`:**
   - Same pattern as background_checks

7. **RLS policies on `cleaner_profiles` (extending Phase 3a pattern):**
   - SELECT: cleaner can read own; admin can read all; customer-facing read is added in Phase 5 (NOT here)
   - UPDATE: cleaner can update own (limited columns — bio, hourly_rates, etc.)
   - INSERT: blocked (only the approval trigger inserts)
   - DELETE: blocked

### New migration: `0013_phase4_admin_role_setup.sql`

Phase 4 introduces the first real admin tooling. This migration:

1. Adds an `admin_profiles` row creation path for users flagged as admin
2. Adds an `is_admin()` SQL function used by RLS policies (`auth.uid() IN (SELECT user_id FROM admin_profiles)`)
3. Updates Phase 3a's customer_profiles RLS to allow admin reads (defense in depth — admins need to be able to look up customer details when reviewing disputes)

---

## 4. Files to create

This is the largest file list of any phase so far. Roughly 50+ files. Organizing carefully matters.

### App routes — Cleaner-facing (~10 files)

```
src/app/(app)/cleaner/                                  # Cleaner-only route group
├── apply/
│   ├── page.tsx                                        # Application landing / resume
│   ├── step-[step]/page.tsx                            # Dynamic step routing (1-11)
│   └── submit/page.tsx                                 # Final submission confirmation
├── verify-identity/page.tsx                            # Stripe Identity launcher
├── background-check/page.tsx                           # WF 33: Background check status
├── tax-info/page.tsx                                   # WF 34: Tax info collection (W-9)
├── connect-onboarding/page.tsx                         # WF 63: Stripe Connect launcher
└── photo-training/page.tsx                             # WF 49: Photo etiquette training
```

The `(app)/cleaner/...` route group has middleware that checks the user has `primary_role = 'cleaner'` AND a cleaner_applications row. Customers and admins get redirected away.

### App routes — Admin-facing (~5 files)

```
src/app/(admin)/                                        # Admin-only route group
├── layout.tsx                                          # Admin layout with nav
├── applications/
│   ├── page.tsx                                        # WF 55: Application queue
│   └── [id]/page.tsx                                   # Application detail / review
└── settings/page.tsx                                   # Admin settings (placeholder)
```

The `(admin)/...` route group has middleware that checks `admin_profiles` row existence. Non-admins get a 404 (deliberately not a redirect — don't leak that the route exists).

### Feature module — Cleaner application (~15 files)

```
src/features/cleaner/
├── application/
│   ├── actions.ts                                      # Application server actions
│   ├── validation.ts                                   # Zod schemas for each step
│   ├── queries.ts                                      # Application reads
│   ├── types.ts                                        # Step types, draft data shape
│   ├── steps/                                          # Each of the 11 step components
│   │   ├── Step01BasicInfo.tsx                         # Languages, intro
│   │   ├── Step02ServiceArea.tsx                       # Home ZIP, travel radius, service ZIPs
│   │   ├── Step03Availability.tsx                      # Weekly hours
│   │   ├── Step04Experience.tsx                        # Years, services, specialties
│   │   ├── Step05WhyPureTask.tsx                       # Free-text essay
│   │   ├── Step06Identity.tsx                          # Triggers Stripe Identity
│   │   ├── Step07Background.tsx                        # Triggers Checkr consent + run
│   │   ├── Step08Connect.tsx                           # Triggers Stripe Connect
│   │   ├── Step09TaxInfo.tsx                           # W-9 collection
│   │   ├── Step10PhotoTraining.tsx                     # Photo etiquette training
│   │   └── Step11Review.tsx                            # Final review + submit
│   ├── ApplicationStepper.tsx                          # Progress indicator
│   ├── ApplicationLayout.tsx                           # Wraps each step
│   └── ApplicationResume.tsx                           # "Pick up where you left off"
└── shared/
    ├── components/
    └── hooks/
```

### Feature module — Stripe Identity integration (~3 files)

```
src/features/cleaner/identity/
├── stripe-identity-launcher.tsx                        # Client component opening Stripe Identity
├── webhook-handler.ts                                  # Server-side webhook receiver
└── actions.ts                                          # Create Verification Session, etc.

src/app/api/webhooks/stripe-identity/route.ts           # Webhook endpoint
```

### Feature module — Checkr integration (~4 files)

```
src/features/cleaner/checkr/
├── checkr-consent-form.tsx                             # FCRA disclosures + consent (PENDING_LAWYER_REVIEW)
├── checkr-launcher.tsx                                 # Submits to Checkr after consent
├── webhook-handler.ts                                  # Receives Checkr status updates
├── actions.ts                                          # Create candidate, run report, etc.
└── policies.ts                                         # Adverse action decision logic

src/app/api/webhooks/checkr/route.ts                    # Webhook endpoint
```

### Feature module — Stripe Connect (~3 files)

```
src/features/cleaner/connect/
├── connect-launcher.tsx                                # WF 63: Hosted onboarding wrapper
├── webhook-handler.ts                                  # Account.updated, capability changes
└── actions.ts                                          # Create Express account, generate onboarding link

src/app/api/webhooks/stripe-connect/route.ts            # Webhook endpoint
```

### Feature module — Admin tooling (~8 files)

```
src/features/admin/
├── applications/
│   ├── ApplicationQueue.tsx                            # WF 55: Sortable, filterable list
│   ├── ApplicationDetail.tsx                           # Full application view
│   ├── ApplicationActions.tsx                          # Approve / reject / needs info buttons
│   ├── ApplicationFilters.tsx                          # By state, ZIP, submission date
│   ├── actions.ts                                      # Admin server actions
│   ├── validation.ts                                   # Decision schemas
│   ├── queries.ts                                      # Admin queries (uses admin RLS bypass)
│   └── types.ts
└── shared/
    └── AdminLayout.tsx
```

### Library code (~5 files)

```
src/lib/stripe/
├── identity.ts                                         # Stripe Identity client wrapper
├── connect.ts                                          # Stripe Connect client wrapper
└── webhooks.ts                                         # Webhook signature verification

src/lib/checkr/
├── client.ts                                           # Checkr API client
└── webhooks.ts                                         # Checkr webhook verification
```

### Database migrations (2 files)

```
db/migrations/0012_phase4_cleaner_onboarding.sql
db/migrations/0013_phase4_admin_role_setup.sql
```

### Types (regenerated)

```
src/types/database.types.ts                             # Regenerate after migrations
```

### Docs (5 files)

```
docs/phases/phase-4-spec.md                             # This document
docs/phases/phase-4-explainer.md                        # Plain-English breakdown
docs/phases/phase-4-progress-update.md                  # End-of-phase doc
docs/policies/cleaner-onboarding-policy.md              # State coverage, BC thresholds, appeals
docs/integrations/checkr-fcra-disclosures.md            # FCRA forms (PENDING_LAWYER_REVIEW)
```

**Total: ~55 new files plus regenerated types.** This is substantially larger than Phase 3a (23 files).

---

## 5. Implementation order

Three weeks of work, broken into the 7 sub-phases. Build in this exact order — each depends on the previous.

### Sub-phase 4a — External account setup (calendar week 1, parallel to other prep)

(See Section 0 above. Most of this is human work, not code.)

**End of 4a:**
- Stripe account active with Identity and Connect enabled
- Checkr account approved with API access
- Test API keys saved to `.env.local` and Vercel
- Cleaner ToS draft started with lawyer

### Sub-phase 4b — Application form + draft persistence (~5 days)

The 11-step form is the largest UI piece. Build it before any external integrations so you have a place to launch them from.

**Steps within 4b:**

1. Apply migration `0012_phase4_cleaner_onboarding.sql`
2. Manually verify trigger creates draft application on cleaner-role user signup
3. Build `ApplicationLayout`, `ApplicationStepper`, `ApplicationResume`
4. Build all 11 step components (one per file)
5. Build server actions: `saveDraftStep`, `submitApplication`
6. Implement draft persistence: each step saves on Next, not just on final submit
7. Implement resume logic: on entering /apply, redirect to last incomplete step

**Verify 4b:**
- Cleaner can complete steps 1-5 (basic info through "why PureTask"), close browser, come back, resume at step 6
- Step navigation respects validity (can't skip ahead past unfilled required fields)
- Final submit transitions state from draft to submitted
- All required fields are validated server-side

### Sub-phase 4c — Stripe Identity (~3 days)

**Steps within 4c:**

1. Build `src/lib/stripe/identity.ts` (Stripe Identity client wrapper)
2. Implement Step06Identity component that creates a Stripe Identity Verification Session and launches the Stripe-hosted flow
3. Build webhook handler at `src/app/api/webhooks/stripe-identity/route.ts`
4. Webhook updates `identity_verifications.state` based on `verification_session.verified` events
5. Webhook signature verification (critical — never trust unsigned webhook payloads)

**Verify 4c:**
- Cleaner reaches step 6 → clicks button → Stripe Identity flow launches → uses Stripe test mode (test SSN + driver's license) → returns to app → status updates to `verified`
- Webhook signature verification rejects unsigned/badly-signed payloads (test by sending crafted curl request)

### Sub-phase 4d — Checkr (~4 days)

**Steps within 4d:**

1. Build `src/lib/checkr/client.ts`
2. Build FCRA disclosure / consent form component (PENDING_LAWYER_REVIEW for the actual disclosure text — Checkr provides templates, lawyer should review)
3. Implement Step07Background: consent form → on submit, create Checkr Candidate via API → Initiate background check → store `background_checks.id`
4. Build webhook handler for Checkr status updates
5. Implement `policies.ts` — decision logic for `consider` outcomes (initially: all consider results route to admin review)
6. Implement WF 33 (background check status page) reading `background_checks.state`

**Verify 4d:**
- Cleaner submits consent → Checkr API call succeeds in test mode → status flows through requested → pending → clear
- Webhook updates background_checks.state correctly
- WF 33 displays correct status with appropriate copy for each state
- Test consider state: simulated consider result routes to admin review queue

### Sub-phase 4e — Stripe Connect Express (~3 days)

**Steps within 4e:**

1. Build `src/lib/stripe/connect.ts`
2. Implement Step08Connect: creates Stripe Express account → generates account onboarding link → redirects to Stripe-hosted onboarding (WF 63 is essentially a launcher screen for this)
3. Build webhook handler for `account.updated` events
4. Webhook tracks capability acquisition (charges_enabled, payouts_enabled)
5. On return from Stripe onboarding (Stripe redirects back to your app), update `stripe_onboarding_completed_at`

**Verify 4e:**
- Cleaner reaches step 8 → onboarding link generated → redirected to Stripe Connect → completes Stripe's hosted onboarding (test mode) → returns to app → `stripe_onboarding_completed_at` set
- Webhook receives account.updated events and tracks capability state

### Sub-phase 4f — Admin application review (~4 days)

This is the biggest single piece of admin tooling we'll build for a while. Take time.

**Steps within 4f:**

1. Apply migration `0013_phase4_admin_role_setup.sql`
2. Manually create an admin user (you) by inserting into `admin_profiles`
3. Build admin layout and authentication check
4. Build `ApplicationQueue` (WF 55) — sortable by submission date, filterable by state and home ZIP
5. Build `ApplicationDetail` page — shows all application data, identity status, background check result, Connect status, photo training completion, tax info
6. Build admin actions:
   - Claim (submitted → in_review)
   - Approve (in_review → approved, with prerequisite validation)
   - Reject (in_review → rejected, requires rejection_reason)
   - Request info (in_review → needs_info, with info_request_message)
7. Implement approval trigger in DB or transaction in app code: on state = approved, INSERT cleaner_profiles row with data from application

**Verify 4f:**
- Admin sees queue of submitted applications
- Admin can claim an application
- Admin cannot approve unless all 5 prerequisites met (server-side check)
- Admin approves → cleaner_profiles row appears with correct data → application has cleaner_profile_id back-reference
- Admin rejects → applicant can see rejection reason in their portal

### Sub-phase 4g — Photo training + tax info + final glue (~3 days)

The smaller pieces and final integration testing.

**Steps within 4g:**

1. Build photo etiquette training (WF 49) — multi-section content with completion tracking
2. Build tax info collection (WF 34) — W-9 fields, validation
3. Build final-step Review screen showing all collected data
4. Build "approval prerequisites checklist" UI — applicant sees what's still pending
5. End-to-end test: full pipeline from signup to approval

**Verify 4g:**
- Real test cleaner walks through entire 11-step pipeline on production
- All 5 approval prerequisites enforced
- Admin reviews and approves
- Approved cleaner can sign in and see they have a cleaner_profiles row

### Sub-phase 4h — Phase verification + closeout (~1 day)

- Walk through every acceptance criterion on production
- Take screenshots
- Write phase-4-progress-update.md
- Tag phase-4-complete

---

## 6. Specific gotchas

Phase 4 has more gotchas than any prior phase. Each is a real, concrete problem.

### Gotcha A — Webhook signature verification is not optional

Stripe and Checkr both sign webhooks. **Never trust unsigned or improperly-signed webhook payloads.** An attacker can hit your webhook endpoint with a crafted "background check passed" payload if you don't verify signatures.

Each provider has a different verification mechanism. Stripe uses `Stripe-Signature` header with HMAC SHA-256. Checkr uses `X-Checkr-Signature` with their own scheme. Read each provider's docs and implement signature verification on day one of integration.

### Gotcha B — Checkr "consider" state is the hardest UX

Background checks return `clear`, `consider`, or `failed`. `Consider` means "we found something; you decide." Examples: a misdemeanor from 8 years ago, a traffic infraction, a name match that might or might not be the same person.

What you do with `consider`:
- Route to admin review (NOT auto-rejection — that's an FCRA violation)
- Show the admin the relevant report excerpts
- Admin makes individualized assessment per FCRA requirements
- If rejecting based on consider result: must follow FCRA adverse action process (pre-adverse notice, 7-day waiting period, adverse action notice)

This is not an engineering problem; it's a legal compliance problem. **Don't auto-reject on consider results.** Don't even hint that the system might. Build the workflow correctly from day one.

### Gotcha C — Cleaner sign-up flow needs role flag

When a customer signs up via Phase 2's `/auth/sign-up`, `users.primary_role` is set to `'customer'`. For cleaners, you need a different sign-up entry point — probably `/auth/sign-up?role=cleaner` or a dedicated `/cleaners/apply` landing page that initiates sign-up with the cleaner flag.

The role flag is used by the customer_profiles trigger (Phase 3a) to skip cleaners, and by a new cleaner_applications trigger (Phase 4) to create the application.

**Don't let users self-select role mid-application.** Once you're a cleaner, you're a cleaner. Switching mid-application creates messy data.

### Gotcha D — Stripe Identity vs Stripe Connect Identity verification

Stripe Identity is a standalone product. Stripe Connect Express also does identity verification as part of its KYC. **These are separate flows that produce separate records.** Don't conflate them.

PureTask uses both:
- Stripe Identity (early in pipeline) — verifies the cleaner is a real person whose ID matches their face
- Stripe Connect KYC (later) — collects tax info, payout setup, AND re-verifies identity for payment processing requirements

Yes, this means the cleaner uploads ID twice. There's no way around it currently — Stripe doesn't share Identity data with Connect. Document this clearly in the application UI so cleaners aren't confused.

### Gotcha E — Application data: JSONB during draft, columns after submit

Per the schema (B7 line 113):
> Stored as a single JSONB blob during draft state for flexibility. Promoted to dedicated columns once submitted for indexability.

This means:
- During draft: write all step data into `application_data` JSONB. Schema-on-read.
- On submit: extract key fields into dedicated columns (`home_zip`, `submitted_at`, etc.) AND keep the original JSONB for audit.

**Why:** drafts change shape during development; submitted applications need indexable columns for admin filtering. The B7 schema already designed this; honor it.

### Gotcha F — Application_number generation must be sequential and human-readable

Format: `APP-{YYYY}-{seq:6}`. Example: `APP-2025-001234`.

Use a Postgres sequence, not a random UUID converted to a number. Sequences guarantee ordering and no gaps. Insert with the format function:

```sql
'APP-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('cleaner_application_number_seq')::TEXT, 6, '0')
```

Sequence resets behavior: don't reset annually. Just keep incrementing. Year is informational, not enforced.

### Gotcha G — Approval is a multi-table transaction

When admin approves an application:

1. UPDATE cleaner_applications SET state = 'approved', approved_at = NOW(), reviewed_by_admin_id = ?
2. INSERT INTO cleaner_profiles (user_id, ...) VALUES (?, ...) RETURNING id
3. UPDATE cleaner_applications SET cleaner_profile_id = (RETURNING id from step 2)

These three statements MUST be in a single transaction. If step 2 succeeds and step 3 fails, you have an orphaned cleaner_profile with no application back-reference. Use Postgres BEGIN/COMMIT or Supabase's RPC functions.

### Gotcha H — Re-applying after rejection

A rejected applicant might want to reapply later (e.g., expungement of an old offense, additional time elapsed). Phase 4 does NOT need to handle re-application UX — but the schema allows it (state is per-application; an applicant can have multiple application rows over time).

Document this as a known UX gap. Phase 11 or post-launch can add the re-apply flow.

### Gotcha I — Admin RLS bypass pattern

Admins need to read all applications, all profiles, all bookings. RLS policies for admins should NOT use a giant OR clause checking admin status on every table. Instead:

```sql
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid());
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
```

Then in policies:
```sql
CREATE POLICY ... USING (user_id = auth.uid() OR is_admin());
```

The function caches its result per query; doesn't hammer admin_profiles.

### Gotcha J — Admin actions must be logged

The B6 schema includes `admin_actions` table for audit logging. Every admin transition (approve, reject, request info) must be logged. Build this into the admin actions from day one — don't defer logging to "Phase 11 audit hardening."

### Gotcha K — Test mode discipline

Stripe Identity test mode, Stripe Connect test mode, Checkr test mode are all separate from production mode. Use test mode through Phase 4 development. **Switch to production mode only after lawyer reviews FCRA disclosures, ToS, etc.** The temptation will be "let's just test with my real ID once" — don't. Test data in production accounts is messy.

---

## 7. Out of scope for Phase 4

Defer to later phases:

- **Cleaner profile editing UI** (WF 26) — Phase 5 territory; cleaners can't edit until they're approved anyway
- **Cleaner availability calendar** (WF 27) — Phase 6c (when cleaners need to manage availability for booking acceptance)
- **Cleaner dashboard** (WF 2, 2b) — Phase 5 (post-approval landing page)
- **Cleaner job inbox** (WF 3, 3b) — Phase 6c
- **Cleaner earnings & payouts** (WF 6) — Phase 9
- **Re-application flow** for rejected applicants — post-launch
- **Bulk admin actions** (approve/reject multiple applications at once) — post-launch
- **Application analytics dashboard** for admins — post-launch
- **Cleaner tier assignment automation** — Phase 7 (trust system); Phase 4 sets all approved cleaners to `rising_pro`
- **Insurance verification badge** (WF 32) — Phase 7 trust system
- **Background check renewal** (the recurring 2-year cycle) — built into schema but not surfaced in UI until Phase 11 or pre-launch hardening

---

## 8. Test plan

Before declaring Phase 4 complete:

### Code health
- [ ] `pnpm lint` exits 0
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm build` exits 0
- [ ] Both migrations apply cleanly

### Application flow
- [ ] New cleaner-role user signs up → `cleaner_applications` draft row appears
- [ ] Cleaner completes steps 1-5, closes browser, resumes at step 6
- [ ] Cleaner submits application → state transitions submitted, submitted_at set
- [ ] Application data correctly extracted from JSONB to dedicated columns on submit

### Identity verification
- [ ] Stripe Identity test mode: cleaner uses test ID → returns verified
- [ ] Webhook signature verification rejects forged requests
- [ ] identity_verifications row state matches Stripe's session state

### Background check
- [ ] Checkr test mode: clear result flows through correctly
- [ ] Checkr test mode: consider result routes to admin review (does NOT auto-reject)
- [ ] WF 33 displays each state with appropriate copy
- [ ] Webhook signature verification rejects forged requests

### Stripe Connect
- [ ] Express account created via API
- [ ] Onboarding link generated and redirects work
- [ ] Cleaner returns from Stripe → stripe_onboarding_completed_at set
- [ ] account.updated webhook tracks capability acquisition

### Admin tooling
- [ ] Admin sees application queue (WF 55) sorted by submission date
- [ ] Admin can filter by state and home ZIP
- [ ] Admin can claim an application
- [ ] Admin cannot approve unless all 5 prerequisites met (server-enforced)
- [ ] Approval creates cleaner_profiles row in same transaction
- [ ] Rejection requires rejection_reason
- [ ] Needs_info sends info_request_message to applicant

### Cross-cutting
- [ ] All forms render mobile-first (≥360px viewport)
- [ ] RLS: applicant cannot see another applicant's data
- [ ] RLS: admin can see all applications
- [ ] Server-side Zod validation on every form step
- [ ] All admin actions logged to admin_actions table

### Production verification
- [ ] Test cleaner onboarded end-to-end on production URL
- [ ] All test data created in test-mode external accounts
- [ ] Screenshots taken for each verification step
- [ ] phase-4-progress-update.md written
- [ ] Tag phase-4-complete

---

## 9. Phase 4 deliverable verification

Phase 4 is complete when, on the production URL, with real test cleaner accounts and test-mode external accounts (Stripe Identity test mode, Checkr test mode, Stripe Connect test mode), every acceptance criterion has been verified with screenshots or logged evidence.

Cursor: Phase 4 has more places to fake completion than prior phases. The temptation to mark "Stripe Identity integration done" because the launcher renders without crashing is real. **Do not do this.** Verification means a real test cleaner went through the real flow and the real status updated correctly.

If any acceptance criterion cannot be verified on production with end-to-end flow, Phase 4 is not done.

---

## 10. Files of interest (for the Phase 4 PR)

Given the file count, the PR description should list files by sub-phase rather than as a flat list. Use the file structure in Section 4 as the template.

---

## 11. Known limitations of this spec

(I am being explicit about these because the spec was written ahead of implementation.)

1. **External API surfaces will have changed** by the time Phase 4 starts. Stripe Identity, Stripe Connect, and Checkr all evolve their APIs. When Phase 4 begins, do a focused review of each provider's current docs and update integration code accordingly. This spec describes intent; current API specifics belong in Cursor's implementation.

2. **State coverage decisions are punted** to the policies doc. This spec assumes US-only, with state-specific quirks deferred to the policies doc and Section 0.4 decisions.

3. **The 11-step form structure is a proposal**, not a final design. Steps may be combined or split during implementation based on what feels right when you actually build it. The schema's `application_data` JSONB is flexible enough to support changes.

4. **Lawyer-dependent items are flagged but not blocking**. Phase 4 ships with PENDING_LAWYER_REVIEW placeholders. Lawyer engagement should be advanced enough by phase end that you have a credible path to replacing the placeholders before launch.

5. **Customer Reliability scoring** is a Phase 7 thing. Cleaners-rate-customers is also Phase 7. Phase 4 does not touch any of this.
