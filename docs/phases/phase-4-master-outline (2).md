# PureTask — Phase 4 Master Outline

**Purpose:** A single navigation document for everything in Phase 4 (cleaner onboarding pipeline), organized by sub-phase. Goal / Design / Build / Verify format for each section.

**Status:** Outline-level navigation. Detailed acceptance criteria, specific code, and gotchas live in `phase-4-spec.md`. The why-behind-every-decision lives in `phase-4-explainer.md`.

**Phase scope:** A new cleaner can apply, complete identity verification + background check + Connect onboarding + photo training + tax info, and be approved by an admin. Approved cleaner has a `cleaner_profiles` row and is discoverable in Phase 5.

**Phase duration:** 3 weeks of focused engineering, but ~4-5 calendar weeks because of external integration approval timelines (especially Checkr business verification, which can take 1-2 weeks of waiting on Checkr's side).

**Phase depends on:**
- Phase 3a complete and verified end-to-end
- Phase 2 auth working for cleaner-role users (separate sign-up entry point)
- Stripe account active with Identity + Connect enabled
- Checkr business account approved (the longest-pole item — start applying on Day 1 of Phase 3a)
- Lawyer engagement meaningfully underway

---

## How to read this document

Each sub-phase has the four-heading format:

- **Goal** — what this sub-phase accomplishes in plain English
- **Design** — decisions to make before writing code
- **Build** — concrete files, components, migrations, integrations
- **Verify** — how you know it works

If a section doesn't list a Design step, decisions are settled in the schema or wireframes. Just build to spec.

---

## Phase 4 sub-phase overview

| Sub-phase | Name | Days | What changes by the end |
|---|---|---|---|
| **0** | External account prerequisites | parallel to 3a | Stripe + Checkr accounts active, lawyer engaged |
| **4a** | (deprecated label — was "external setup") | — | Combined with Section 0 above |
| **4b** | Application form + draft persistence | ~5 days | 11-step form works; draft saves; submit transitions state |
| **4c** | Stripe Identity verification | ~3 days | Cleaner can complete ID verification; webhooks update DB |
| **4d** | Checkr background check | ~4 days | FCRA-compliant consent; check submitted; status displayed |
| **4e** | Stripe Connect Express onboarding | ~3 days | Cleaner has payable Express account; capabilities tracked |
| **4f** | Admin application review | ~4 days | Admin queue + detail + claim/approve/reject/needs_info |
| **4g** | Photo training + tax info + glue | ~3 days | All remaining pieces; full pipeline integrated |
| **4h** | Verification + closeout | ~1 day | Phase 4 verified end-to-end; tag `phase-4-complete` |

**Total: ~23 working days of code work**, plus parallel external setup.

---

# Section 0 — External account prerequisites

> Read `phase-4-spec.md` Section 0 for the full breakdown. This is the most important pre-work for Phase 4 because the wait times are out of your control.

## Goal

Have all three external service accounts (Stripe Identity, Stripe Connect Express, Checkr) active and approved by the time Phase 4 begins. Have lawyer engagement progressed far enough that PENDING_LAWYER_REVIEW placeholders have a credible path to replacement.

## Design

Three policy decisions that need to be made before code starts:

1. **Launch state coverage.** California-only at launch is the simplest path. Multi-state requires per-state FCRA disclosures and varying background check requirements. Pick one.
2. **Background check threshold policy.** What `consider` results auto-route to admin review vs auto-reject? Document this in `docs/policies/cleaner-onboarding-policy.md`. Note: auto-rejecting on a Checkr "consider" result without admin review is an FCRA violation in many states. Default to "all considers go to admin."
3. **Appeals process.** A rejected applicant has FCRA rights. Document the appeals workflow even if it's just "email support@puretask.com."

## Build

This sub-phase has minimal code:

```
docs/policies/cleaner-onboarding-policy.md           # Policy decisions
docs/integrations/checkr-fcra-disclosures.md         # FCRA copy (PENDING_LAWYER_REVIEW)
.env.example additions                               # Document required new env vars
```

Add to `.env.example`:
```
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_IDENTITY_WEBHOOK_SECRET=
STRIPE_CONNECT_WEBHOOK_SECRET=
CHECKR_API_KEY=
CHECKR_WEBHOOK_SECRET=
```

## Verify

- Can sign in to Stripe dashboard, see Identity and Connect activated
- Can sign in to Checkr dashboard, have API access
- Test API keys saved to `.env.local` (development) and Vercel project settings
- Test mode webhook URLs registered with Stripe and Checkr (using ngrok for local dev or directly against deployed preview URL)
- Lawyer has at minimum reviewed Cleaner ToS draft and is queued to review FCRA disclosures

---

# Sub-phase 4b — Application form + draft persistence

## Goal

A new cleaner-role user can complete an 11-step application across multiple sessions. Draft data persists between sessions (resume where they left off). Final submit transitions state from `draft` to `submitted`. Admin can see the application in Phase 4f.

## Design

Decisions to make:

1. **The 11-step structure.** No wireframe exists, so we design it. Spec proposes this order:
   - Step 1: Basic info (languages, intro)
   - Step 2: Service area (home ZIP, travel radius, service ZIPs)
   - Step 3: Availability (weekly hours)
   - Step 4: Experience (years, services offered, specialties)
   - Step 5: Why PureTask (free-text essay)
   - Step 6: Identity verification (launches Stripe Identity)
   - Step 7: Background check (consent + Checkr launch)
   - Step 8: Connect onboarding (launches Stripe Connect Express)
   - Step 9: Tax info collection (W-9 fields)
   - Step 10: Photo etiquette training
   - Step 11: Review and submit
2. **Step splitting/combining.** During implementation, you may decide steps 1-2 should combine, or step 4 should split. The schema's JSONB application_data is flexible enough to support changes.
3. **Resume vs restart UX.** When the cleaner returns mid-application, do they resume at the last completed step (default) or see a summary screen and pick where to continue (more complex)?
4. **Step navigation rules.** Can the cleaner jump forward to step 7 if they completed step 5 but skipped 6? Recommendation: linear-only, must complete in order.

## Build

Database migration:

```
db/migrations/0012_phase4_cleaner_onboarding.sql
```

Contains:
- Trigger: when a `users` row is inserted with `primary_role = 'cleaner'`, automatically create a `cleaner_applications` draft row
- Sequence + function for `application_number` generation (`APP-2025-001234`)
- RLS policies on `cleaner_applications` (applicant reads own draft, admin reads all)
- RLS policies on `background_checks` and `identity_verifications`

App routes:

```
src/app/(app)/cleaner/apply/
├── page.tsx                                  # Resume / start
├── step-[step]/page.tsx                      # Dynamic step routing
└── submit/page.tsx                           # Final review + submit
```

Feature module — application core:

```
src/features/cleaner/application/
├── actions.ts                                # saveDraftStep, submitApplication
├── validation.ts                             # Per-step Zod schemas
├── queries.ts                                # getApplication, getDraftStep
├── types.ts                                  # Step types, draft data shape
├── ApplicationLayout.tsx                     # Wraps each step
├── ApplicationStepper.tsx                    # Progress indicator
├── ApplicationResume.tsx                     # Resume logic
└── steps/
    ├── Step01BasicInfo.tsx
    ├── Step02ServiceArea.tsx
    ├── Step03Availability.tsx
    ├── Step04Experience.tsx
    ├── Step05WhyPureTask.tsx
    └── Step11Review.tsx
```

Steps 6-10 (identity, background, connect, tax, training) are stubs in 4b — they get filled in by 4c through 4g. Stub means: the step component exists and renders "Coming next: identity verification" so the navigation works, but the actual integration is in subsequent sub-phases.

## Verify

- Apply migration to dev Supabase
- Sign up a new cleaner-role user → confirm draft `cleaner_applications` row appears
- Verify `application_number` generated correctly (`APP-2025-NNNNNN` format)
- Cleaner completes steps 1-5, closes browser, returns → resumes at step 6 stub
- Step navigation respects validity (can't skip ahead past required fields)
- Submit transitions state draft → submitted, submits_at populated
- Application data extracted from JSONB to dedicated columns on submit (`home_zip`, etc.)
- All required fields validated server-side via Zod
- 360px viewport renders without horizontal scroll

---

# Sub-phase 4c — Stripe Identity verification

## Goal

Cleaner reaches step 6 → clicks "Verify identity" → completes Stripe Identity hosted flow → returns to app → `identity_verifications` row reflects verified state.

## Design

Decisions:

1. **Verification type.** Stripe Identity supports `document` (ID + selfie) and `id_number` (just SSN). Use `document` for full verification.
2. **Required documents.** Driver's license is sufficient for US cleaners. Don't require passport.
3. **Failure handling UX.** If Stripe Identity returns `requires_input` (couldn't read the document), show a "try again" path. Don't trap the cleaner on a failed step.
4. **Re-verification.** If a verification fails terminally, do you let the cleaner retry within the same application, or do they need a fresh application? Recommendation: 3 attempts within a single application, then require admin involvement.

## Build

Library wrapper:

```
src/lib/stripe/identity.ts                    # Stripe Identity client wrapper
```

Webhook endpoint:

```
src/app/api/webhooks/stripe-identity/route.ts # Receives identity events
```

Feature module:

```
src/features/cleaner/identity/
├── actions.ts                                # createVerificationSession
├── stripe-identity-launcher.tsx              # Client component opens hosted flow
└── webhook-handler.ts                        # Server-side webhook handler
```

Step component update:

```
src/features/cleaner/application/steps/Step06Identity.tsx  # Real implementation replacing 4b stub
```

Critical: webhook signature verification using `Stripe-Signature` header and `STRIPE_IDENTITY_WEBHOOK_SECRET`.

## Verify

- Cleaner reaches step 6 → button creates verification session via API → redirects to Stripe-hosted flow
- Test mode: use Stripe's test ID (`Verify Now` button in test mode auto-passes)
- Cleaner returns to app → step 6 marked complete
- `identity_verifications.state = 'verified'` in DB
- Test failure path: in test mode, choose "Don't verify" → state = `requires_input` → app shows retry option
- Webhook signature verification rejects unsigned/forged requests (test by sending crafted curl request without valid signature)

---

# Sub-phase 4d — Checkr background check

## Goal

Cleaner reaches step 7 → completes FCRA consent + disclosure form → background check submitted to Checkr → status updated via webhooks → cleaner sees status on WF 33.

## Design

Decisions (these are legally significant):

1. **FCRA disclosure copy.** Use Checkr's templates, but lawyer review is non-negotiable before going to production. Mark PENDING_LAWYER_REVIEW.
2. **Checkr package selection.** Choose the appropriate Checkr package (`tasker_pro` is common for gig platforms; check current Checkr pricing for what fits).
3. **Consider result handling.** All `consider` results route to admin review (no auto-rejection). Admin must follow FCRA adverse action process if rejecting.
4. **Adverse action workflow.** When a cleaner is rejected based on background check:
   - Send pre-adverse action notice
   - Wait 7 days (FCRA-mandated minimum, may be longer in some states)
   - If applicant doesn't dispute, send adverse action notice
   - Update application state to rejected
   This workflow is partially deferred to later sub-phases (admin review handles the trigger; the timing logic is a cron job in 4f).

## Build

Library wrapper:

```
src/lib/checkr/
├── client.ts                                 # Checkr API client
└── webhooks.ts                               # Webhook signature verification
```

Webhook endpoint:

```
src/app/api/webhooks/checkr/route.ts          # Receives report events
```

Feature module:

```
src/features/cleaner/checkr/
├── actions.ts                                # createCandidate, runReport
├── checkr-consent-form.tsx                   # FCRA disclosure (PENDING_LAWYER_REVIEW)
├── checkr-launcher.tsx                       # Submits after consent
├── webhook-handler.ts                        # Status update logic
└── policies.ts                               # Decision logic for consider results
```

App route:

```
src/app/(app)/cleaner/background-check/page.tsx        # WF 33 status page
```

Step component update:

```
src/features/cleaner/application/steps/Step07Background.tsx  # Real implementation
```

## Verify

- Cleaner reaches step 7 → sees FCRA consent form (with placeholder copy)
- On consent submit: Checkr Candidate created → background_checks row created in `requested` state
- Webhook fires when Checkr starts processing → state updates to `pending` → `in_progress`
- Test mode `clear` result: state → `clear`
- Test mode `consider` result: state → `consider`, application routes to admin review (does NOT auto-reject)
- WF 33 displays correct status with appropriate copy for each state
- Webhook signature verification rejects forged requests
- `policies.ts` correctly routes consider results to admin review queue

---

# Sub-phase 4e — Stripe Connect Express onboarding

## Goal

Cleaner reaches step 8 → completes Stripe Connect Express hosted onboarding → returns to app → has a payable Express account → capabilities tracked via webhooks.

## Design

Decisions:

1. **Account type.** Express (not Custom or Standard). Express is the right product for marketplace contractor onboarding — Stripe handles KYC, identity verification (separate from Stripe Identity in 4c), and tax forms (1099 generation).
2. **Required capabilities.** `transfers` (Stripe paying out to cleaner) is mandatory. `card_payments` is mandatory if you want PureTask to charge customers via the cleaner's Connect account (most marketplace patterns do this; check Phase 6a integration).
3. **Onboarding link expiry.** Stripe-generated onboarding links expire. If the cleaner doesn't complete onboarding immediately, the link needs regeneration. Default UX: "your onboarding link expired, generate a new one" button.
4. **Return URL handling.** Stripe redirects back to your app after onboarding. The return URL must include success/refresh paths. Plan these.

## Build

Library wrapper:

```
src/lib/stripe/connect.ts                     # Stripe Connect client wrapper
```

Webhook endpoint:

```
src/app/api/webhooks/stripe-connect/route.ts  # account.updated, capability.updated events
```

Feature module:

```
src/features/cleaner/connect/
├── actions.ts                                # createExpressAccount, generateOnboardingLink
├── connect-launcher.tsx                      # WF 63: Hosted onboarding wrapper
└── webhook-handler.ts                        # Capability acquisition tracking
```

App route:

```
src/app/(app)/cleaner/connect-onboarding/page.tsx     # WF 63 launcher screen
```

Step component update:

```
src/features/cleaner/application/steps/Step08Connect.tsx  # Real implementation
```

## Verify

- Cleaner reaches step 8 → button creates Express account via API → onboarding link generated
- Cleaner redirected to Stripe-hosted Connect onboarding (test mode)
- Cleaner completes Stripe's flow (test data: simulated business info, test bank account)
- Cleaner returns to app → `stripe_onboarding_completed_at` populated
- Webhook account.updated fires → capabilities tracked (`charges_enabled`, `payouts_enabled`)
- Test expired link: generate link, wait until expiration, click → app shows "regenerate link" UX

---

# Sub-phase 4f — Admin application review

## Goal

Admin can see queue of submitted applications, claim them, review all data, and transition state to approved/rejected/needs_info. On approval, `cleaner_profiles` row created in same transaction.

## Design

Decisions:

1. **Admin role provisioning.** First admin = you, manually inserted into `admin_profiles`. Subsequent admins added via SQL or a future admin tool. Don't build admin invitation flow in 4f.
2. **Queue sort + filter.** Default sort: oldest submission first (FIFO). Filters: by state (submitted, in_review, needs_info), by home_zip, by date range.
3. **Claim semantics.** When an admin claims (transitions submitted → in_review), should other admins still be able to see/work on the application? Recommendation: yes (admins need to collaborate), but the claiming admin is recorded in `reviewed_by_admin_id`.
4. **Approval prerequisites enforcement.** All 5 prerequisites enforced both in DB constraints AND in app code:
   - `identity_verification.state = 'verified'`
   - `background_check.state = 'clear'` OR admin reviewed `consider`
   - `stripe_onboarding_completed_at IS NOT NULL`
   - photo_training_completed_at IS NOT NULL
   - tax_info collected (W-9 data present)
5. **Approval transaction.** Update application + insert cleaner_profile + back-reference must be atomic. Use Postgres transaction or Supabase RPC function.

## Build

Database migration:

```
db/migrations/0013_phase4_admin_role_setup.sql
```

Contains:
- `admin_profiles` row creation pattern
- `is_admin()` SQL function (used by RLS policies — see Gotcha I in spec)
- Update existing customer_profiles RLS to allow admin reads (defense-in-depth)

App routes:

```
src/app/(admin)/                              # Admin route group
├── layout.tsx                                # Admin layout with nav
├── applications/
│   ├── page.tsx                              # WF 55: Application queue
│   └── [id]/page.tsx                         # Application detail / review
└── settings/page.tsx                         # Admin settings (placeholder)
```

Feature module:

```
src/features/admin/
├── applications/
│   ├── ApplicationQueue.tsx                  # WF 55: Sortable, filterable list
│   ├── ApplicationDetail.tsx                 # Full application view
│   ├── ApplicationActions.tsx                # Approve / reject / needs_info buttons
│   ├── ApplicationFilters.tsx                # By state, ZIP, submission date
│   ├── actions.ts                            # claimApplication, approve, reject, requestInfo
│   ├── validation.ts                         # Decision schemas
│   └── queries.ts                            # Admin-scoped queries (uses is_admin())
└── shared/
    └── AdminLayout.tsx
```

Approval transaction (in actions.ts):

```typescript
async function approveApplication(applicationId: string) {
  // Single transaction:
  // 1. UPDATE cleaner_applications SET state = 'approved', approved_at = NOW()
  // 2. INSERT cleaner_profiles RETURNING id
  // 3. UPDATE cleaner_applications SET cleaner_profile_id = (returned id)
  // 4. INSERT admin_actions (audit log)
}
```

## Verify

- Apply migration; manually insert yourself into admin_profiles
- Visit /(admin)/applications → see queue of submitted applications
- Click into an application → see all data, identity status, background check, Connect status, training completion
- Click "Claim" → state transitions submitted → in_review, reviewed_by_admin_id set
- Try "Approve" with prerequisite missing → server rejects with explanation
- "Approve" with all prerequisites met → cleaner_profiles row created in same transaction → application has cleaner_profile_id back-reference
- "Reject" requires rejection_reason field
- "Request info" → applicant sees info_request_message
- Every admin transition logged to admin_actions table
- Non-admin user gets 404 on /(admin) routes (not redirect — don't leak existence)

---

# Sub-phase 4g — Photo training + tax info + final glue

## Goal

The remaining smaller pieces of the cleaner pipeline. Photo etiquette training (WF 49) is gated and must be completed before approval. Tax info (WF 34) collects W-9 data. Step 11 reviews everything before submit. Final integration testing across the full pipeline.

## Design

Decisions:

1. **Photo etiquette training format.** Multi-section content with completion tracking. Recommended structure: 5-7 short sections, each ending with a "next" button. Last section ends with "I have read and understood" acknowledgment. Completion stored as timestamp. NOT a quiz — too easy to game and adds dev time.
2. **Tax info storage.** W-9 data is sensitive. Store in `cleaner_applications.application_data` JSONB during draft, promote to a dedicated `cleaner_tax_info` table on submit. **Do not log this data anywhere.** Stripe Connect Express collects most of this independently for 1099 generation; this is a backup capture for PureTask records.
3. **W-9 fields.** Legal name, business name (if different), tax classification (sole prop / LLC / corp / etc.), SSN or EIN, address.
4. **Review screen content.** Step 11 shows:
   - All filled application data
   - Identity verification: complete/incomplete
   - Background check: status
   - Connect onboarding: complete/incomplete
   - Photo training: complete/incomplete
   - Tax info: complete/incomplete
   - "Submit" button enabled only when ALL items complete

## Build

Step components — final implementations:

```
src/features/cleaner/application/steps/Step09TaxInfo.tsx       # WF 34
src/features/cleaner/application/steps/Step10PhotoTraining.tsx # WF 49
src/features/cleaner/application/steps/Step11Review.tsx        # Final review
```

App routes:

```
src/app/(app)/cleaner/tax-info/page.tsx                # WF 34
src/app/(app)/cleaner/photo-training/page.tsx          # WF 49
```

Photo training content:

```
src/features/cleaner/training/
├── photo-etiquette/
│   ├── content.ts                            # Section text (PENDING_LAWYER_REVIEW for some)
│   ├── PhotoEtiquetteTraining.tsx            # Main training component
│   └── SectionRenderer.tsx                   # Renders one section
└── actions.ts                                # markTrainingComplete
```

Possibly a new migration:

```
db/migrations/0014_phase4_cleaner_tax_info.sql        # Dedicated cleaner_tax_info table
```

## Verify

- Cleaner reaches step 9 → fills W-9 fields → validation enforces required fields
- Cleaner reaches step 10 → walks through all training sections → final acknowledgment → completion timestamp set
- Cleaner reaches step 11 → review screen shows all completed items
- Submit button disabled until all 5 prerequisites met
- Submit transitions state to submitted (final), all data persisted

---

# Sub-phase 4h — Phase verification + closeout

## Goal

Phase 4 is verified end-to-end on production with real test cleaner accounts and test-mode external services. Tag `phase-4-complete`.

## Design

This is verification, not building. Process:

1. Create a test cleaner account on production
2. Walk through all 11 steps using test-mode external services
3. Verify every acceptance criterion in spec Section 2
4. Document any issues found
5. Fix and re-verify
6. Only after all criteria pass, close out

## Build

```
docs/phases/phase-4-progress-update.md                # End-of-phase doc
```

Format follows Phase 1 progress update.

## Verify

- All 23+ acceptance criteria from spec Section 2 pass on production
- Screenshots taken for each verification step
- pnpm lint, typecheck, build all green
- Vercel deploy serves correct version
- Tag `phase-4-complete` in git
- Open PR with files-of-interest list (organized by sub-phase given the file count)

---

# Cross-cutting concerns

These apply across all of Phase 4. Reference Section 6 of `phase-4-spec.md` for specific gotchas.

## CC1 — Webhook signature verification

Every webhook endpoint (Stripe Identity, Stripe Connect, Checkr) must verify signatures. Never trust unsigned payloads. Reject forged requests at the route handler level before any business logic runs.

## CC2 — FCRA compliance

Background check rejection requires the FCRA adverse action process. This is a legal compliance issue, not just engineering. Document it in policies. Implement it correctly the first time.

## CC3 — Test mode discipline

All Phase 4 development happens in test mode. Stripe Identity test mode, Stripe Connect test mode, Checkr test mode are all separate from production mode. Switch to production mode only after lawyer review of all customer-facing legal copy.

## CC4 — Admin actions are logged

Every admin transition (approve, reject, request info, claim) writes to `admin_actions` table from day one. Don't defer logging.

## CC5 — Approval is a transaction

The state transition to `approved` involves multiple table writes that MUST be atomic. Use Postgres transaction or Supabase RPC. If any step fails, all rollback.

## CC6 — Mobile-first

All cleaner-side UI tested at 360px viewport. Admin tooling is desktop-first (admin tools used at desks, not phones).

## CC7 — Lawyer-pending markers

Every customer-facing legal/compliance text in Phase 4 has `<!-- PENDING_LAWYER_REVIEW -->` markers. By phase end, lawyer engagement should be advanced enough to plan replacement.

---

# Open questions for review

1. **Step splitting.** Should the 11 steps be combined or split? Specifically: steps 1-2 might combine (basic info + service area in one step), steps 3-4 might split (availability deserves its own focused step). Decide during 4b implementation.

2. **California-only vs multi-state at launch.** This affects FCRA compliance complexity, state-specific disclosures, and timeline. My recommendation: California-only. You said earlier launch ZIP codes are TBD.

3. **Admin invitation flow.** Phase 4 doesn't include an admin invitation flow (you manually insert admins via SQL). Is this acceptable until post-launch? My recommendation: yes — invite flow is later.

4. **Re-application after rejection.** Phase 4 doesn't handle a rejected applicant re-applying. Should it? My recommendation: defer to post-launch. The schema supports it (multiple application rows per user) but the UX isn't worth building now.

5. **Background check renewal cycle.** Schema supports recurring 2-year checks but Phase 4 doesn't surface renewal in UI. Defer to Phase 11 or pre-launch hardening?

---

# What we'll produce after this outline is approved

(Already approved — this outline is the answer to "what does Phase 4 contain?")

The Phase 4 explainer document (~1500 lines) is the next document. It walks through the spec section-by-section in plain English with beginner-friendly explanations.

Phase 4 detailed specs for each sub-phase don't need to exist. The phase-4-spec.md covers them at the right level.
