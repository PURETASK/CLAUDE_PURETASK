# Phase 4 — Plain-English Breakdown

This document walks through every section of `phase-4-spec.md` and explains:
- What each thing means in plain English
- What needs to be designed (decisions to make)
- What needs to be built (actual files)
- Why each decision matters
- Beginner-trap warnings where they apply
- Where the legal/compliance landmines are (because Phase 4 has many)

Phase 4 is the most complex phase before booking. It has three external integrations, real legal compliance requirements, and the first admin tooling. Read this document section by section, not all at once.

---

# Section 0 — External account prerequisites

## What it means in plain English

Phase 4 is the first phase that depends on you having business relationships with three companies you may not have set up yet:

1. **Stripe** — for Stripe Identity (verifying who someone is) and Stripe Connect (paying contractors)
2. **Checkr** — for criminal background checks
3. **A lawyer** — for FCRA compliance, contractor agreements, and tax language

You probably can't just sign up and use these services tomorrow. Each one has business verification, approval timelines, contracts, or legal review. Stripe is fastest (hours to days). Checkr is slowest (1-2 weeks). Lawyer engagement varies.

This section is about acknowledging that **the longest-pole item in Phase 4 is not engineering — it's external account setup that you need to start as early as possible.**

## Why it's labeled Section 0 instead of 4a

Section 0 happens *before* Phase 4 code starts, ideally during Phase 3a. By the time Phase 3a finishes (~7 days), you should already have:
- Stripe account active and Identity + Connect enabled
- Checkr business application submitted (still in their queue, that's fine)
- Lawyer engaged for at least Cleaner ToS + FCRA disclosures

If you wait until Phase 3a is done to start any of this, Phase 4 will block on Checkr. Don't.

## What "Stripe Identity" is

Stripe Identity is a separate Stripe product from Stripe Payments. It does:
- ID document verification (photo of driver's license)
- Selfie matching (the person matches the ID)
- Returns a verified/unverified result

You activate it in your Stripe dashboard under Products → Identity. There's no separate signup; it uses your existing Stripe account.

**Why we need it:** Cleaners come into people's homes. We need to verify they're who they say they are. Stripe Identity is the standard tool for this in marketplace platforms.

## What "Stripe Connect" is

Stripe Connect is also a Stripe product, separate from Stripe Payments and Stripe Identity. It does:
- Marketplace payments (you charge customers, money flows to cleaners minus your platform fee)
- KYC verification of contractors (separate from Stripe Identity above)
- 1099 tax form generation
- Payout management

There are three Connect "account types": **Custom**, **Standard**, and **Express**. The spec says use **Express**. Why:

- **Custom** is for fully white-labeled platforms where you collect all the contractor data yourself. Heavier engineering.
- **Standard** is where the contractor has their own Stripe account that they connected. Less common for marketplaces.
- **Express** is the right product for cleaning marketplaces — Stripe handles most of the contractor onboarding UI, you embed it via a hosted onboarding flow.

You activate Express in your Stripe dashboard under Connect → Activate.

## What "Checkr" is

Checkr is a separate company that does criminal background checks. They're the standard provider for gig platforms (Uber, DoorDash, Instacart all use Checkr or similar).

**Why a separate company:** Background checks are a regulated industry. Doing it yourself means complying with FCRA (Fair Credit Reporting Act) directly. Using Checkr means they handle the regulated parts; you just call their API.

**Their approval process is real.** They want to know you're a legitimate business with a legitimate use case. They want to see your business documents (EIN, articles of incorporation), they want to know what your platform does, they want to negotiate pricing. Plan for 1-2 weeks of waiting on their side, not on yours.

## FCRA — the legal acronym you'll see a lot

FCRA = Fair Credit Reporting Act, a US federal law governing how background checks must be conducted.

What FCRA requires:
- Written consent from the person being checked, before the check happens
- A specific "summary of rights" disclosure (federal template)
- If you reject someone based on the check, a multi-step "adverse action" process: pre-adverse notice, 7-day waiting period, adverse action notice
- The right of the person to dispute the report

**Why this matters for Phase 4:** Background checks aren't just "submit form, get result, decide." There's a legal workflow attached. The spec calls this out as Gotcha B (consider state) and CC2 (FCRA compliance) — they're the same concept.

This is why the spec keeps saying "lawyer review is non-negotiable for FCRA disclosures." The forms have specific legal requirements.

## The lawyer items, in priority order

If you're starting lawyer engagement now, the priority order:

1. **Cleaner ToS** (independent contractor agreement) — needed for cleaner sign-up flow
2. **FCRA disclosures and consent** — needed before any background check runs in production
3. **Customer ToS** — already on the radar from earlier sessions; not Phase 4-specific but still pre-launch
4. **Tax classification language** — what your platform tells cleaners about W-9 / 1099 / their independent contractor status
5. **Identity verification consent** — what Stripe Identity collects, how it's used (lower priority because Stripe handles most disclosures)

A real California marketplace lawyer can usually deliver these in 4-6 weeks of consult + drafting + revisions. Start now.

---

# Section 1 — Summary

## What it means in plain English

Phase 3a turned signed-up users into customers. Phase 4 turns interested-applicants into approved cleaners. The two phases parallel each other architecturally — both are "user becomes a real participant in the marketplace" — but Phase 4 is significantly more complex.

The core complexity is the **6-stage pipeline**:

1. **Apply** — multi-step form (11 steps in our spec)
2. **Verify identity** — Stripe Identity confirms they're real
3. **Background check** — Checkr verifies criminal history
4. **Set up payouts** — Stripe Connect Express creates a payable account
5. **Photo etiquette training** — gated step required for approval (WF 49)
6. **Admin approval** — a human reviews everything and clicks approve

Stage 6 is the most important to internalize: **cleaners are not auto-approved.** A human must review every application before the cleaner becomes active. This is intentional — cleaning involves access to people's homes, and one bad cleaner can cause significant brand damage.

## Why all 6 stages, not fewer?

You might wonder if some stages can be skipped or combined. Let's walk through:

- **Skip identity verification?** No. Letting unverified people into customers' homes is a liability nightmare.
- **Skip background check?** No. Same reason.
- **Skip Connect onboarding?** Could you pay cleaners via PayPal or direct ACH instead? Theoretically yes, but Stripe Connect handles 1099 generation, KYC for payment processing, and integrates cleanly with the booking charge flow in Phase 6. Replacing Connect means rebuilding that entire stack manually.
- **Skip photo training?** Could you. But photo etiquette violations are a major dispute driver. Training is cheap and reduces future support load.
- **Skip admin approval?** Absolutely not. Auto-approval would put untrusted people into homes.

The 6 stages are minimal, not maximalist.

## What "approval prerequisites" means

The spec keeps mentioning that approval requires 5 prerequisites:

1. Identity verification = verified
2. Background check = clear (or admin-reviewed consider)
3. Connect onboarding completed
4. Photo training completed
5. Tax info collected

These aren't just acceptance criteria — they're enforced at the database level via constraints AND at the application level in the approve action. **An admin literally cannot approve an application missing any of these.** Defense in depth.

This matters because admin tooling without these guardrails leads to mistakes ("oh, I forgot to check the background check") which lead to bad cleaners getting approved which leads to disputes and lawsuits. Make the system enforce the rules.

---

# Section 2 — Acceptance criteria

The spec lists ~23 acceptance criteria split into cleaner-side, admin-side, and approval-prerequisite categories. Walking through the most important ones:

## Cleaner-side

### "Sign up via cleaner-flagged sign-up flow"

This is a dependency on Phase 2. Phase 2's sign-up creates customers by default. Phase 4 needs a way to flag "this signup is for a cleaner role."

Two implementation patterns:

1. **Query parameter:** `/auth/sign-up?role=cleaner` — clean URL, easy to link from cleaner-recruitment pages
2. **Dedicated landing page:** `/cleaners/apply` — initiates sign-up flow with cleaner flag pre-set

Either works. Recommendation: do `/cleaners/apply` because it's a dedicated marketing surface (you can make it look different, sell the cleaner opportunity, etc.).

### "Complete the 11-step application form across multiple sessions"

Multi-session means draft persistence. Cleaners aren't filling out an 11-step form in one sitting at 11pm on their phone. They might do steps 1-3 on lunch break, step 4 the next day, finish steps 5-11 over the weekend.

Draft persistence pattern:
- Each step's "Next" button saves data to `application_data` JSONB
- Cleaner returns at any step they last left
- Resume URL: `/cleaner/apply` redirects to the last incomplete step

### "Submit application → state transitions from draft to submitted"

This is the moment the application leaves the cleaner's hands and enters the admin queue. Once submitted:
- `submitted_at` timestamp set
- Key fields extracted from JSONB to dedicated columns (for indexing)
- Admin queue (Phase 4f) shows the application

The spec says JSONB during draft, columns after submit. Why both:
- Draft state changes shape during dev (we might add a step, remove a step, reorder)
- Submitted state needs indexable columns (admin filters by home_zip, sorts by submitted_at)

This is gotcha E in the spec. Honor it.

## Admin-side

### "Admin can see a queue of submitted applications (WF 55)"

WF 55 is wireframed. The queue is a sortable, filterable list. Default sort: oldest submission first (FIFO — first applicants reviewed first).

### "Admin can transition state: in_review → approved (with required prerequisites)"

This is where the 5 prerequisites get enforced. The approve action checks each one and rejects if any missing. Server-side check. Don't trust the client.

### "On approval: cleaner_profiles row is automatically created via trigger or transaction"

The schema design (B7) says approval triggers profile creation. The implementation is a transaction (Gotcha G in spec):

```sql
BEGIN;
UPDATE cleaner_applications SET state = 'approved', approved_at = NOW();
INSERT INTO cleaner_profiles (...) RETURNING id;
UPDATE cleaner_applications SET cleaner_profile_id = (returned id);
COMMIT;
```

If anything fails, all rollback. No orphaned profiles, no applications without cleaner_profile_id.

## Cross-cutting

### "RLS prevents an applicant from reading or modifying another applicant's data"

Same RLS principle as Phase 3a. Applications and verifications are scoped to the applicant. Admins (Phase 4f) get a separate policy.

### "At least one full test cleaner has been onboarded end-to-end"

This is the big one. **Don't trust Cursor's claim of phase completion until you've personally walked a test cleaner through the full pipeline on production.** Use Stripe test mode, Checkr test mode. End-to-end means: sign up → 11 steps → all 5 prerequisites met → admin approves → cleaner_profiles row exists → cleaner can log into Phase 5 cleaner dashboard.

If any step fails or feels broken, Phase 4 isn't done.

---

# Section 3 — Database state and migrations

## What already exists

The schema (B7) was designed for Phase 4. These tables already exist:

- `cleaner_applications` — application records
- `background_checks` — recurring 2-year checks
- `identity_verifications` — separate from background checks
- `cleaner_profiles` — created on approval

You don't create these in Phase 4. You populate them.

## What 0012 migration adds

### Trigger for application creation

Like Phase 3a's customer_profiles trigger, but for cleaners:

```sql
CREATE OR REPLACE FUNCTION handle_new_cleaner_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO cleaner_applications (user_id, application_number, state)
  VALUES (NEW.id, generate_application_number(), 'draft')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Fires on `users` INSERT when `primary_role = 'cleaner'`.

### Application number generation

`APP-{YYYY}-{seq:6}` format. Examples: `APP-2025-001234`, `APP-2026-000001`.

```sql
CREATE SEQUENCE cleaner_application_number_seq;

CREATE OR REPLACE FUNCTION generate_application_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_part TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  seq_part := LPAD(nextval('cleaner_application_number_seq')::TEXT, 6, '0');
  RETURN 'APP-' || year_part || '-' || seq_part;
END;
$$ LANGUAGE plpgsql;
```

**Why a sequence not a UUID converted to a number:** Sequences guarantee monotonic ordering. UUID-derived numbers would be random. For human-readable IDs, monotonic is what humans expect ("APP-2025-001000 came before APP-2025-001001").

**Why the year is informational, not enforced:** January 1 doesn't reset the sequence. `APP-2025-999999` could be followed by `APP-2026-000001` *or* `APP-2026-1000000` depending on volume. The year prefix is a hint, not a constraint.

### RLS policies (the standard pattern)

For each new table:
- SELECT: subject reads own; admin reads all (via `is_admin()` function)
- UPDATE: subject updates own draft state only; admin updates any
- INSERT: blocked except via triggers
- DELETE: blocked

The admin-read pattern uses the `is_admin()` SQL function (introduced in 0013). This is gotcha I in the spec.

## What 0013 migration adds

### `is_admin()` function

```sql
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid());
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
```

`SECURITY DEFINER` runs with elevated privileges (bypassing RLS on admin_profiles). `STABLE` means Postgres caches the result within a query. Without `STABLE`, every RLS check hammers admin_profiles repeatedly.

### Updates Phase 3a's customer_profiles RLS

The spec mentions adding admin reads to customer_profiles. Why:

- Phase 8 (disputes) will require admins to look up customer details
- Phase 4f admins reviewing applications might need to see if the applicant has interacted as a customer first

Defense in depth: build admin access into RLS now, so future phases that need it don't have to retrofit.

### admin_profiles row creation pattern

Different from customer_profiles and cleaner_profiles. Admins are NOT created via signup trigger — they're manually inserted by other admins (or you, the original admin, via SQL).

The spec says you manually insert yourself first:

```sql
INSERT INTO admin_profiles (user_id) VALUES ('<your-user-id>');
```

That's it. No trigger, no flow. Admin invitation flow is post-launch.

## RLS pattern for Phase 4 — the bigger picture

By end of Phase 4, your RLS scheme looks like:

| Table | Customer | Cleaner Applicant | Cleaner (approved) | Admin |
|---|---|---|---|---|
| customer_profiles | own only | n/a | n/a | all (read) |
| cleaner_applications | n/a | own only | own only | all |
| background_checks | n/a | own only | own only | all |
| identity_verifications | n/a | own only | own only | all |
| cleaner_profiles | (Phase 5: discoverable) | n/a | own (write limited) | all |
| addresses | own only | own home (own only) | own home (own only) | all (read) |

This is the access model that all later phases build on.

---

# Section 4 — The 55+ files to create

Phase 4 is the largest file count of any phase so far. Walking through the categories:

## Cleaner-facing app routes

```
src/app/(app)/cleaner/                   # New cleaner-only route group
```

The `(app)/cleaner/...` pattern means:
- `(app)` route group has authentication middleware (Phase 2)
- `cleaner` subfolder has additional middleware: must have `primary_role = 'cleaner'` AND a `cleaner_applications` row
- Customers and admins get redirected away from these routes

This is the second route group you'll add. Phase 3a added `(app)/settings/...` (settings is for any authenticated user). Phase 4 adds `(app)/cleaner/...` (cleaner-only).

The dynamic step routing pattern:

```
src/app/(app)/cleaner/apply/step-[step]/page.tsx
```

The `[step]` is a Next.js dynamic segment. URL `/cleaner/apply/step-3` renders this page with step parameter "3". The page component looks up which step component to render based on the parameter.

## Admin-facing app routes

```
src/app/(admin)/                         # Admin-only route group
```

The `(admin)` route group is brand new. Middleware must:
1. Check the user is signed in
2. Check the user has an `admin_profiles` row
3. If neither, return 404 (NOT redirect — don't leak that admin routes exist)

The 404 vs redirect choice matters. A redirect to `/auth/sign-in` tells the world "this URL is for admins." A 404 tells the world "this URL doesn't exist." Security through obscurity isn't real security, but it's still a reasonable practice for admin URLs.

## Feature module — application core

```
src/features/cleaner/application/
```

Mirrors Phase 3a's `src/features/customer/...` pattern. Same conventions:
- `actions.ts` — server actions (mutations)
- `validation.ts` — Zod schemas
- `queries.ts` — server-side reads
- `types.ts` — shared types

What's new is the `steps/` folder. Each step is its own component file. Why:

- Each step has its own validation schema, fields, and submit logic
- Steps may reuse common components (form fields, buttons) but their *content* is distinct
- Easier to reorder, split, or combine steps when each is its own file

## Library code

```
src/lib/stripe/identity.ts
src/lib/stripe/connect.ts
src/lib/checkr/client.ts
```

The lib folder holds external service clients. These are thin wrappers around the official SDKs that:
- Configure with environment variables
- Add type safety
- Centralize error handling
- Make testing easier (mock the lib folder, not the SDK directly)

You'll use these wrappers throughout Phases 4, 6, and 9.

## Webhook endpoints

```
src/app/api/webhooks/stripe-identity/route.ts
src/app/api/webhooks/stripe-connect/route.ts
src/app/api/webhooks/checkr/route.ts
```

Webhooks are HTTP POST endpoints that external services call to notify your app of events. Each provider hits a specific URL with an event payload.

**Critical security:** every webhook route MUST verify the signature before processing. This is gotcha A in the spec. Pattern:

```typescript
export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_IDENTITY_WEBHOOK_SECRET!);
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }
  
  // Now process event safely
}
```

Without signature verification, anyone on the internet could hit your webhook URL with fake events. "Background check passed" forgery, "payment captured" forgery — bad.

## Admin tooling

```
src/features/admin/applications/
```

The admin feature module has its own conventions:
- Admin server actions use `is_admin()` check at the top
- Admin queries use elevated read scope (RLS allows admin-all-read)
- All admin actions log to `admin_actions` table from day one (gotcha J)

Don't share admin code with cleaner code. Different audiences, different patterns.

---

# Section 5 — Implementation order (sub-phases)

The spec breaks Phase 4 into 7 sub-phases. The master outline expands them. Walking through the rationale:

## 4b first — application form before integrations

Why build the form before any external integrations? Because integrations need a place to launch from. Step 6 (identity) launches Stripe Identity. Step 7 (background) launches Checkr. Step 8 (connect) launches Stripe Connect. Without the form scaffolded, you'd be testing integrations in isolation with no real flow.

Build the form with stub integrations (`Coming next: identity verification`), verify draft persistence works, then fill in the integrations.

## 4c, 4d, 4e in this order — Identity first, Checkr second, Connect third

Why this order:

- **Identity** is the simplest integration and the lowest legal stakes. Get the webhook + signature verification pattern working here first, then reuse the pattern for Checkr and Connect.
- **Checkr** has the most legal complexity (FCRA). Doing it second means you've already got the webhook pattern working, you can focus on FCRA compliance.
- **Connect** is the most complex Stripe product but doesn't have legal compliance specific to itself. Last.

The dependency order also makes operational sense: identity check happens before background check (verify the person before running their record). Background check happens before payouts setup (don't waste Connect onboarding on someone who won't pass background).

## 4f for admin tooling — late, but still in Phase 4

Admin tooling could theoretically be built first (so you can manually approve test cleaners as you build). But:

- Without applications to review, admin tooling has nothing to test against
- Admin tooling depends on the application data being structured correctly (which 4b establishes)
- Admin RLS depends on the `is_admin()` function (which 0013 introduces, alongside 4f)

Build it after the cleaner pipeline pieces are in place. Then admin tooling is real verification of the pipeline.

## 4g for the smaller pieces — last

Photo training, tax info, final review screen. These are smaller pieces that come together for the final integration test. By 4g you have all the integrations working; 4g is gluing them into the final pipeline experience.

## 4h verification — the explicit step

Just like Phase 1 and Phase 3a, Phase 4 has an explicit verification + closeout step. This is where you walk through every acceptance criterion on production with screenshots. **Don't skip this.** Cursor will be ready to mark Phase 4 complete based on local testing; the spec explicitly forbids this.

---

# Section 6 — Specific gotchas (11 things that will break)

The spec has 11 gotchas, more than any prior phase. Walking through the ones that matter most:

## Gotcha A — Webhook signature verification

Most important security thing in Phase 4. Every webhook MUST verify signatures using the provider's mechanism.

What goes wrong if you skip this: an attacker discovers your webhook URL (easy — they can just probe `/api/webhooks/checkr` on your domain). They send a forged payload claiming a background check passed. Your app marks the cleaner as cleared. Cleaner gets approved. Bad outcome.

Implement signature verification on day one of each integration. Test that it rejects forged requests with a curl command:

```bash
curl -X POST https://your-app.vercel.app/api/webhooks/checkr \
  -H "Content-Type: application/json" \
  -d '{"event": "report.completed", "report": {"status": "clear"}}'
```

This should return 400 (bad signature). If it returns 200, your webhook is unprotected.

## Gotcha B — Checkr "consider" handling

This is the most important legal thing in Phase 4.

A Checkr report comes back with one of: `clear`, `consider`, or `failed`.

- `clear` = passed
- `consider` = something on the record needs human judgment
- `failed` = failed (rare; usually you see consider first and admin decides)

What auto-rejecting on `consider` looks like: "this person has a misdemeanor from 8 years ago, automatically reject." That's an FCRA violation in many states because:

1. You didn't follow the adverse action process (pre-adverse notice, 7-day waiting period, adverse action notice)
2. You didn't make an individualized assessment (per EEOC guidance)
3. You may have violated state-specific ban-the-box laws

The spec is firm: **all consider results route to admin review.** Admin makes individualized assessment per FCRA process. This is policy as much as engineering.

Document your decision criteria in `docs/policies/cleaner-onboarding-policy.md`. Examples of criteria you might use:
- Violent felonies in last 7 years: lean reject
- Property crimes in last 5 years: lean reject
- DUI in last 3 years: lean reject (cleaning involves driving to homes)
- Old non-violent misdemeanors (>5 years): lean approve
- Anything older than 7 years: usually approve unless severity is high

These aren't rules; they're criteria for individualized assessment. The admin still makes the final call per applicant.

## Gotcha C — Cleaner sign-up needs role flag

When a customer signs up via `/auth/sign-up`, `users.primary_role = 'customer'`. For cleaners, you need a different entry point.

The spec recommends `/cleaners/apply` as a dedicated landing page. The sign-up flow inside this page sets `primary_role = 'cleaner'` on the new users row.

Implementation: pass a `role` parameter to the sign-up flow and validate server-side. Don't trust the client to set primary_role.

**Don't allow role switching mid-application.** Once someone starts as a cleaner, they're a cleaner. If they want to become a customer too, that's a future feature (multi-role accounts) that's not in scope.

## Gotcha D — Stripe Identity vs Stripe Connect KYC duplication

Both Stripe Identity (in step 6) and Stripe Connect Express (in step 8) verify identity. They're separate products with separate records.

Yes, this means the cleaner uploads ID twice. There's no way around it currently — Stripe doesn't share Identity data with Connect.

How to handle:
- Be explicit in the UI: "Step 6 verifies you're a real person. Step 8 sets up your payouts and verifies your business info for Stripe."
- Don't pretend they're the same; cleaners will get confused.
- If Stripe ever ships data sharing between these products, simplify then.

## Gotcha E — JSONB during draft, columns after submit

This is a schema design choice from B7. During draft state:
- Application data is in `application_data` JSONB column
- Schema flexible — can change shape during dev

On submit:
- Extract key fields (`home_zip`, `submitted_at`, etc.) into dedicated columns
- Keep the original JSONB for audit
- Now indexable for admin filtering

Why both: drafts evolve during dev (you might add a step, remove a field). Submitted applications need indexable columns. The schema honors both.

Implementation: in the `submitApplication` action, do an UPDATE that:
1. Sets state = 'submitted'
2. Sets submitted_at = NOW()
3. Extracts fields from application_data into columns

```sql
UPDATE cleaner_applications
SET 
  state = 'submitted',
  submitted_at = NOW(),
  home_zip = (application_data -> 'service_area' ->> 'home_zip'),
  travel_radius_miles = (application_data -> 'service_area' ->> 'travel_radius_miles')::int,
  -- ... etc
WHERE id = $1;
```

## Gotcha F — Application number sequence

Format: `APP-{YYYY}-{seq:6}`. Use a Postgres sequence, not random.

The format function:
```sql
'APP-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('cleaner_application_number_seq')::TEXT, 6, '0')
```

Year is informational. Sequence keeps incrementing across years. `APP-2025-999999` could be followed by `APP-2026-1000000`.

**Don't reset the sequence annually.** Volume isn't high enough to make 7-digit numbers ugly, and resetting creates collision risk.

## Gotcha G — Approval is a multi-table transaction

When admin approves:

```sql
BEGIN;
UPDATE cleaner_applications 
SET state = 'approved', 
    approved_at = NOW(), 
    reviewed_by_admin_id = $1
WHERE id = $2;

INSERT INTO cleaner_profiles (user_id, ...) 
VALUES (...) 
RETURNING id;

UPDATE cleaner_applications 
SET cleaner_profile_id = $3
WHERE id = $2;

INSERT INTO admin_actions (admin_user_id, action_type, ...) 
VALUES (...);

COMMIT;
```

If any step fails, all rollback. Use Postgres transaction (in a stored procedure or RPC function) or Supabase's transaction support.

**Why this matters:** if step 2 succeeds and step 3 fails, you have an orphaned cleaner_profile with no application back-reference. Subsequent debugging would be a nightmare.

## Gotcha H — Re-application after rejection

A rejected applicant might want to reapply later (e.g., a misdemeanor was expunged, additional time elapsed, life circumstances changed).

Phase 4 does NOT need to handle re-application UX. The schema allows it (multiple application rows per user over time). But the UX flow is post-launch.

Document this as a known UX gap.

## Gotcha I — Admin RLS bypass with `is_admin()`

The pattern was explained in Section 3 above. Worth repeating because it's the most reusable thing from Phase 4.

```sql
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid());
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
```

Then in policies:

```sql
CREATE POLICY "admins can read all"
ON some_table FOR SELECT
USING (user_id = auth.uid() OR is_admin());
```

Every later phase that needs admin access uses this exact pattern. Phase 4 introduces it; everything else inherits.

## Gotcha J — Admin actions logged

The B6 schema has `admin_actions` table for audit logging. Every admin transition writes a row. Build this from day one — don't defer.

What gets logged:
- Admin user ID
- Action type (claim, approve, reject, request_info)
- Target entity (application ID)
- Timestamp
- Optional notes

Why this matters: if an admin makes a bad call (approves a problematic cleaner who later causes a dispute), you have an audit trail. Admins know they're being logged, which itself is a deterrent against sloppy decisions.

## Gotcha K — Test mode discipline

Stripe Identity, Stripe Connect, Checkr all have test mode. **All Phase 4 development is test mode.** Switch to production mode only after lawyer reviews FCRA disclosures, ToS, etc.

Test mode is genuinely separate. Test mode API keys, test mode webhooks, test mode customer data. You can't use real ID in test mode (Stripe will reject it).

The temptation will be "let me just verify with my real ID once to test." Don't. Test data in production accounts is messy.

---

# Section 7 — Out of scope for Phase 4

The deferred items are listed in the spec. Some worth highlighting:

## Cleaner profile editing UI (Phase 5)

Cleaners can't edit their profile until they're approved. There's no profile to edit yet.

## Cleaner availability calendar (Phase 6c)

Availability matters for booking acceptance, not for getting approved. Defer.

## Cleaner dashboard (Phase 5)

Phase 5 builds the post-approval cleaner-side experience. Phase 4 ends with approval; Phase 5 picks up from there.

## Re-application flow (post-launch)

Schema supports it; UX doesn't yet.

## Bulk admin actions (post-launch)

Approving 50 applications at once is a nice-to-have, not a must-have. Volume at launch will be low; one-by-one review is fine.

## Cleaner tier assignment (Phase 7)

All approved cleaners start as `rising_pro` in Phase 4. Phase 7 introduces tier assignment automation.

## Insurance verification badge (Phase 7)

Trust system territory.

## Background check renewal (post-launch)

Schema supports recurring 2-year checks. UI doesn't surface renewal until pre-launch hardening.

---

# Section 8 — Test plan

The spec lists ~30 test items. The most important categories:

## Code health

`pnpm lint`, `pnpm typecheck`, `pnpm build` all green. Migrations apply cleanly to fresh dev Supabase.

## Application flow

Draft persistence, step navigation, submit transition. The 11-step form working end to end.

## External integrations

Stripe Identity test mode, Checkr test mode, Stripe Connect test mode. Each integration verified with at least one happy path and one failure path.

## Webhook signature verification

Forged requests rejected. This is the security litmus test.

## Admin tooling

Queue, claim, approve, reject, request info. Approval prerequisite enforcement. Admin actions logged.

## RLS

Applicant can't see other applicants. Admin can see all.

## Production verification

Test cleaner onboarded end-to-end on production URL. Screenshots taken. progress-update doc written. Tag applied.

---

# Section 9 — Phase 4 deliverable verification

This section exists because Phase 4 has more places to fake completion than any prior phase. The temptation patterns:

- "Stripe Identity launcher renders" → mark identity integration done
- "Checkr API call succeeded once" → mark Checkr integration done
- "Admin queue page loads" → mark admin tooling done

None of these are completion. Completion = real test cleaner went through real flow with real (test mode) external services and real status updates flowed correctly.

Verification means walking through every acceptance criterion on production. Screenshots or logged evidence for each.

---

# Section 10 — Files of interest

This is for the eventual PR. The file count (~55) is too many for a flat list. Organize by sub-phase using Section 4's structure as the template.

---

# Section 11 — Known limitations of this spec

This section is unusually candid for a spec. The reason: I (Claude) wrote this spec ahead of when Phase 4 will actually be built. By the time you build Phase 4, things will have changed:

1. **External APIs change.** Stripe Identity, Stripe Connect, Checkr all evolve. The integration code I described will be partially stale.
2. **Decisions get punted.** State coverage, exact step structure of the form, lawyer-review timing — all of these are decisions you'll make closer to implementation time.
3. **The 11-step form is a proposal, not final.** During build, you may combine or split steps. The schema's JSONB application_data is flexible enough to support this.
4. **Lawyer dependencies are flagged, not blocking.** Phase 4 ships with PENDING_LAWYER_REVIEW placeholders. By phase end, lawyer engagement should be advanced enough that you have a credible path to replacement.

The spec is an aggressive draft. When you start Phase 4, the first thing to do is review each external integration's current docs and update accordingly.

---

# What to do next, in order

If you're at the start of Phase 4:

**Week before Phase 4 (during Phase 3a):**
- Apply to Checkr business account (longest-pole)
- Activate Stripe Identity and Connect
- Engage lawyer for Cleaner ToS + FCRA disclosures

**Day 1:**
- Read the spec
- Read this explainer
- Read the master outline
- Hand the spec to Cursor with the "respond before coding" prompt

**Days 2-7 (sub-phase 4b):**
- Migration + 11-step form + draft persistence
- Verify cleaner can complete steps 1-5, resume, complete to step 11

**Days 8-10 (sub-phase 4c):**
- Stripe Identity integration
- Webhook + signature verification

**Days 11-14 (sub-phase 4d):**
- Checkr integration
- FCRA-compliant consent flow (placeholder copy)
- Webhook handler

**Days 15-17 (sub-phase 4e):**
- Stripe Connect Express integration
- Webhook handler for capability tracking

**Days 18-21 (sub-phase 4f):**
- Admin migration (`is_admin()` function)
- Admin route group + middleware
- Application queue + detail + approve/reject/needs_info actions
- Approval transaction

**Days 22-23 (sub-phase 4g):**
- Photo training, tax info, review screen

**Day 24 (sub-phase 4h):**
- Production verification with test cleaner
- Screenshots, progress update, tag

This is a happy-path 24-day timeline. Realistic estimate: 30-35 working days because of external integration debugging, admin UX iteration, and FCRA workflow refinement.

---

# Bigger picture: why Phase 4 is the architectural inflection point

Phase 4 is where PureTask stops being "an app for customers" and becomes "a real marketplace." Specifically:

- **Multi-sided UX.** Up through Phase 3a, you only built customer-side flows. Phase 4 introduces cleaner-side AND admin-side. Three audiences, three experiences.
- **External dependencies.** Up through Phase 3a, your app depended on Supabase + Vercel. Phase 4 adds Stripe Identity, Stripe Connect, Checkr, and lawyer-reviewed copy. Four new external dependencies.
- **Real legal stakes.** Up through Phase 3a, the legal stakes were "lawyer should review the photo waiver eventually." Phase 4 has FCRA compliance, contractor classification, tax forms. Real legal stakes.
- **Real admin tooling.** Up through Phase 3a, "admin" was a hypothetical role. Phase 4 makes it concrete with `admin_profiles`, `is_admin()`, application review interface. The admin tooling pattern established here gets reused for every admin tool from here on.
- **The first transactional approval flow.** The approval transaction pattern (multi-table atomic update + cleaner_profiles creation + audit log) gets reused for every state transition that creates entities.

If Phase 4 lands well, the rest of the build sequence becomes much easier. Phase 5 inherits the cleaner sign-up + admin pattern. Phase 6 inherits the webhook integration patterns. Phase 7 inherits the admin tooling structure.

If Phase 4 lands badly — half-built integrations, FCRA compliance shortcuts, transactional bugs — the rest of the build inherits those problems too.

Take the time to build it carefully.
