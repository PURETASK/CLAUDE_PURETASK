# Phase 3 — Plain-English Breakdown

This document walks through every section of `phase-3-spec.md` and explains:
- What each thing means in plain English
- What needs to be designed (decisions to make)
- What needs to be built (actual code/files)
- What needs to be tested (how you know it works)
- Beginner-trap warnings where they apply

Read this section by section, not all at once.

---

# Section 1 — Summary

## What it means in plain English

After Phase 2, a user can create an account and sign in. But all they have at that point is a username, password, and email. They are **not yet a usable customer**. They have no profile, no address to send a cleaner to, and no preferences.

Phase 3 is the bridge: it turns "a signed-up account" into "a customer who could actually book a cleaning if the booking system existed."

## The three deliverables

**1. Customer profile bootstrap**

A "profile" in this context is a row in the `customer_profiles` database table. It holds customer-specific things: their default address, their default payment method, their photo policy. Every customer has exactly one customer_profiles row.

The "bootstrap" part means: when someone signs up, we automatically create this row for them with sensible defaults. They shouldn't have to manually click "create my profile" — it should just exist when they sign in.

**2. Address management**

A customer can have multiple addresses (their home, their parent's house they sometimes book cleaning for, an Airbnb they manage, etc.). The address management UI lets them add new ones, edit existing ones, mark one as default, and delete ones they don't need anymore.

**3. Privacy preferences (photo policy)**

PureTask requires cleaners to take photos of cleaned rooms as proof of work. Some customers don't want photos taken (privacy concerns, kids in the house, etc.). The photo policy lets the customer choose:
- Default — photograph everything (most cleaners and customers expect this)
- Skip named rooms — photograph everywhere except specific rooms they list (e.g., "no photos in the master bedroom")
- Skip everything + waive disputes — no photos at all, but they accept they can't dispute job quality based on photo evidence

This is privacy-vs-protection tradeoff, and the customer makes the call.

## Why these three?

These are the absolute minimum data points needed for Phase 5 (browse/discover) and Phase 6 (booking) to work. Without an address, we can't show cleaners by ZIP code. Without a photo policy, we don't know whether to require photos during a job. Without a profile row, the customer has nothing to attach booking history to.

---

# Section 2 — Acceptance criteria (the 14 checkboxes)

Each checkbox is a literal, testable thing that has to work before Phase 3 is "done."

## Walking through each one

### "Complete the customer settings page (WF 28) and have changes persist"
**What it means:** The customer can open the settings page, change something (like their display name), click save, refresh the page, and see the change is still there. This proves data is actually being saved to the database, not just held in browser memory.

**Why it matters:** This is the dumbest possible end-to-end smoke test. If this doesn't work, nothing else can.

### "Add a US service address with street, city, state, ZIP, optional access instructions and label"
**What it means:** A form where the customer types in their address. The form needs all the standard fields (street, city, state, ZIP), and two optional fields:
- **access_instructions:** "Gate code is 4321, dog is friendly, parking on left side of driveway"
- **label:** "Home", "Mom's house", "Beach rental"

**Why optional fields matter:** Cleaners need access info before they arrive. Labels help customers tell their addresses apart in a list.

### "Set one address as their default service address"
**What it means:** Among multiple addresses, one is marked as the "use this when booking unless I pick a different one." This is stored in the customer_profiles table, not on the address row itself.

**Why this design:** A customer has many addresses, but only one default. Storing default_address_id on customer_profiles (instead of an `is_default` flag on each address) makes it impossible to have two defaults at the same time — the database itself enforces the invariant.

### "Edit an existing address"
**What it means:** Clear. The customer can change any field on an address they previously created.

### "Soft-delete an address (it disappears from their view but is preserved in the database)"
**What it means:** "Soft delete" is a programming pattern where you don't actually remove a row from the database. You set a `deleted_at` timestamp on it. The UI filters out rows where `deleted_at` is set, so the customer doesn't see them anymore — but the data is preserved.

**Why soft delete:** If a customer deletes an address that was attached to a past booking, we need to still be able to look up that booking later. Hard-deleting the address would break referential integrity (foreign keys would point to nothing). Soft delete is the standard fix for this.

**Beginner trap:** Make sure every query you write filters `WHERE deleted_at IS NULL` (or uses an indexed partial index). Forgetting this filter is one of the most common sources of "deleted things showing up again" bugs.

### "Choose a photo policy from the three locked options"
**What it means:** A radio button (or similar UI) where the customer picks one of three options. "Locked" means these are the *only* three options — we don't allow custom variations.

**Why locked:** Photo policy interacts with the dispute system. Allowing arbitrary custom policies would create dispute scenarios we haven't designed for. Three options keep it tractable.

### "When choosing 'skip all + waiver,' explicitly accept the dispute waiver"
**What it means:** If a customer picks "no photos at all," they have to actively check a box that says something like "I understand I'm waiving my right to file a dispute based on photo evidence."

**Why this exists:** Legal/operational — if someone files a dispute later saying "the cleaner didn't actually clean my kitchen," and there are no photos, we need a record that they explicitly waived photo evidence. The database constraint already enforces this (you can't have skip_all_with_waiver without a `waiver_accepted_at` timestamp). The UI just needs to surface the choice meaningfully.

### "When choosing 'skip named rooms,' select which rooms to skip"
**What it means:** If a customer picks "skip named rooms," they need a way to actually pick which rooms. Probably a multi-select with common room names (kitchen, bedroom, bathroom, etc.) and an "other" field.

### "All changes are reflected on a refresh"
**What it means:** Same as the first criterion — data persists. Listed separately because it applies to every form, not just settings.

### "Server-side validation rejects bad data"
**What it means:** If a customer submits an invalid ZIP code, an empty street name, or a state code that isn't real, the form rejects it.

**Critical detail:** Server-side validation. Not just browser-side. A bad actor could bypass browser validation by sending requests directly to your server. Server-side is the only validation that's actually safe.

**Beginner trap:** "Just trust the form" feels easier but creates real security holes later. Always validate on the server.

### "RLS prevents the customer from reading or modifying any other customer's profile or addresses"
**What it means:** RLS = Row-Level Security. It's a Postgres feature where the database itself enforces "user A can only see rows that belong to user A." Even if your application code has a bug that tries to fetch all addresses, the database refuses to return ones owned by other users.

**Why this matters:** RLS is your last line of defense against data leaks. Application code has bugs. RLS being correct means even buggy app code can't leak data between customers.

### "All forms work on mobile width (>=360px) without horizontal scroll"
**What it means:** PureTask is mobile-first. Most cleaning service customers will be on phones. The forms have to work on a 360px-wide screen (the smallest common modern phone) without elements going off the side.

### "Build passes: `pnpm lint`, `pnpm typecheck`, `pnpm build`"
**What it means:** Three commands you run from the terminal:
- `pnpm lint` — code style check (catches formatting and style issues)
- `pnpm typecheck` — TypeScript check (catches type errors)
- `pnpm build` — actually builds the production bundle

If any of these fail, the code can't ship.

### "Production deploy on Vercel shows working customer settings page"
**What it means:** Same as Phase 1's lesson — local working != production working. The settings page has to actually function on `claude-puretask.vercel.app`.

### "At least one test customer has been created end-to-end on production"
**What it means:** Before declaring Phase 3 done, you yourself sign up a test account on the production URL, complete the profile, add an address, set a photo policy. You see all three deliverables work in the real production environment. Not staging. Not local. **Production.**

This is the criterion Cursor will most want to skip. Don't let it.

---

# Section 3 — Database state and the new migration

## What it means in plain English

The schema we built (B1-B8) already has tables for customer_profiles and addresses. We don't need to *create* those tables in Phase 3 — they exist. What we need is to:

1. Auto-create a customer_profiles row when someone signs up
2. Add Row-Level Security (RLS) policies that say "users can only see their own data"
3. (Eventually) hook in geocoding so addresses get latitude/longitude — but not yet

These are wrapped in a single migration file: `0010_phase3_customer_onboarding.sql`.

## What a migration is, in plain terms

A migration is a SQL file that runs once to change the database. They're numbered (0001, 0002, etc.) so they always run in the same order. Once a migration has been applied to a database, it's never re-run — the database remembers it ran already.

This matters because: as the schema evolves over time, the migration history is the authoritative record of "how did we get from empty database to current database." Someone setting up a fresh dev environment can run all migrations in order and end up with the same database as production.

## The trigger explained

A "trigger" in Postgres is a function that runs automatically when something happens. For Phase 3, we need a trigger that runs when a row is inserted into `users` and the user is a customer — and the trigger creates the corresponding customer_profiles row.

**Why a trigger and not application code?**
- It's atomic with the user creation — there's no window where a user exists but their profile doesn't
- It works regardless of how the user was created (sign-up form, admin tool, manual SQL, etc.)
- It can't be forgotten — the database enforces it

**Beginner trap:** Triggers are powerful but invisible. If something goes wrong with profile creation, you might not realize the trigger ran (or didn't). Always log trigger actions where possible, and document them clearly.

## The RLS policies explained

RLS is the most important security concept in this project. Let me explain it carefully.

### What RLS does

Without RLS, this query:
```sql
SELECT * FROM customer_profiles
```
Returns every customer's profile in the database. If your app accidentally runs this query without filtering, every customer's data leaks.

With RLS, the same query automatically filters to only rows the current user is allowed to see. The database itself enforces it — even if you forget to add `WHERE user_id = current_user`.

### How RLS knows who the current user is

In Supabase, when a user signs in, their JWT token includes their user ID. Supabase exposes this as `auth.uid()` in SQL. Your RLS policies use `auth.uid()` to check ownership.

Example policy:
```sql
CREATE POLICY "customers can read own profile"
ON customer_profiles FOR SELECT
USING (user_id = auth.uid());
```

This says: "When someone tries to SELECT from customer_profiles, only return rows where user_id matches the authenticated user's ID." It applies automatically to every query.

### The four operations (SELECT, INSERT, UPDATE, DELETE)

Each operation needs its own policy or it's denied by default:

- **SELECT**: Customer can read their own profile and addresses
- **INSERT**: For customer_profiles, blocked entirely (the trigger handles it). For addresses, the customer can insert addresses where owner_user_id = auth.uid()
- **UPDATE**: Customer can update their own profile and addresses
- **DELETE**: Blocked entirely. Soft delete via UPDATE only.

### The geocoding gap

Addresses have `latitude` and `longitude` columns for distance calculations. We're not implementing the geocoding service in Phase 3 — that's complexity that belongs to Phase 5 when we actually need to calculate distances between cleaners and customers. For now, addresses are inserted with NULL lat/lng, and Phase 5 will backfill them.

**Why mention it now:** So Cursor doesn't try to be helpful and add geocoding ad hoc. Document the gap, leave it.

---

# Section 4 — The 15 files to create

These break into four groups: app routes, feature module, database, and types/docs.

## App routes (6 files)

### What "App Router" means in Next.js

Next.js uses file-based routing. The folder structure inside `src/app/` literally becomes the URLs of your site:
- `src/app/page.tsx` -> `/` (homepage)
- `src/app/about/page.tsx` -> `/about`
- `src/app/(app)/settings/page.tsx` -> `/settings` (the parentheses around `(app)` are a "route group" — they organize files but don't appear in the URL)

### The 6 routes for Phase 3

1. **`src/app/(app)/settings/page.tsx`** -> `/settings`
   - The settings landing page. Shows links to profile, addresses, privacy. Like a hub.
   - Wireframe: WF 28

2. **`src/app/(app)/settings/profile/page.tsx`** -> `/settings/profile`
   - Edit name, phone (display fields, not auth-related)
   - Email is read-only here — changing email is an auth flow that lives in Phase 2's territory

3. **`src/app/(app)/settings/addresses/page.tsx`** -> `/settings/addresses`
   - List of all addresses
   - Each address shows: label, full address, "default" badge if applicable, edit/delete buttons
   - "+ Add address" button at the top

4. **`src/app/(app)/settings/addresses/new/page.tsx`** -> `/settings/addresses/new`
   - The form to create a new address
   - On save: create address, optionally set as default if it's the customer's first

5. **`src/app/(app)/settings/addresses/[id]/page.tsx`** -> `/settings/addresses/abc-123`
   - The `[id]` is a dynamic segment — it captures the address ID from the URL
   - Edit form for an existing address
   - Action buttons: Save, Set as default, Delete

6. **`src/app/(app)/settings/privacy/page.tsx`** -> `/settings/privacy`
   - Photo policy picker
   - Three radio options + conditional sub-fields based on selection
   - Wireframe: WF 29

### Why all routes live inside `(app)`

The `(app)` route group has authentication middleware applied (Phase 2 set this up). Anything inside `(app)` requires the user to be signed in — if they're not, middleware redirects them to `/auth/sign-in`.

This is a security pattern. Customer settings should never be accessible to logged-out users.

## Feature module (5 component files + 3 logic files)

### What a "feature module" is

In our folder structure, `src/features/` contains code organized by feature, not by file type. Everything related to "customer stuff" lives in `src/features/customer/`. This makes it easy to find related code — when you're working on customer features, you go to that folder and see actions, validation, queries, components all together.

This is opposed to organizing by file type, which would scatter customer code across `src/components/`, `src/lib/`, `src/server/`, etc.

### The 8 files inside `src/features/customer/`

**Logic files (3):**

1. **`actions.ts`** — Server actions. These are functions that the browser can call to mutate data on the server. Each action validates input, checks auth, runs the database write, returns success/failure.
   
   Specific actions to implement:
   - `updateProfile(input)` — Update display name and phone
   - `createAddress(input)` — Add a new address
   - `updateAddress(id, input)` — Edit an existing address
   - `softDeleteAddress(id)` — Mark an address as deleted
   - `setDefaultAddress(id)` — Update customer_profiles.default_address_id
   - `updatePhotoPolicy(input)` — Change photo policy and related fields

2. **`validation.ts`** — Zod schemas. Zod is a TypeScript library for runtime validation. You define a schema (e.g., "ZIP must be 5 digits, state must be a valid US state code"), and Zod produces both a TypeScript type and a runtime validator.
   
   Schemas needed:
   - `profileUpdateSchema` — name, phone
   - `addressSchema` — all address fields with validation
   - `photoPolicySchema` — policy enum + conditional fields

3. **`queries.ts`** — Server-side read helpers. Functions like `getCustomerProfile(userId)`, `getAddresses(userId)`, `getAddress(id)`. These are called from page components to fetch data.

**Component files (5):**

4. **`ProfileForm.tsx`** — Form for name and phone
5. **`AddressList.tsx`** — Renders the list of addresses with actions
6. **`AddressForm.tsx`** — Shared form used for both new and edit (smart enough to handle both)
7. **`PhotoPolicyForm.tsx`** — Three radio options + conditional UI based on selection
8. **`WaiverModal.tsx`** — Modal that opens when user picks "skip all + waiver"; shows the waiver text and requires explicit confirmation

## Database (1 file)

`db/migrations/0010_phase3_customer_onboarding.sql` — Already explained in section 3.

## Types and docs (3 files)

- `src/types/database.types.ts` — Auto-generated TypeScript types from Supabase. Regenerate after the migration so types reflect the new RLS-aware reality.
- `docs/phases/phase-3-spec.md` — The spec doc itself
- `docs/phases/phase-3-progress-update.md` — Created at the end of phase 3, mirrors the Phase 1 progress doc format

---

# Section 5 — Implementation order (the 7 steps)

This is the actual build order. It matters because each step depends on the previous one being correct.

## Step 1 — Apply the migration (database first, always)

**Why first:** Everything else assumes the database is in the right state. If you build UI first and the migration is wrong, you'll be debugging UI bugs that are actually database bugs.

**What to do:**
1. Write the migration SQL
2. Apply it to your dev Supabase project (via Supabase dashboard SQL editor, or using a migration tool)
3. Manually test: sign up a new test user — confirm a customer_profiles row appears automatically
4. Manually test RLS: in Supabase SQL editor, switch to "user A" context, try to SELECT user B's profile — confirm it returns nothing

**Why manual testing for RLS:** Automated tests for RLS are notoriously easy to write incorrectly (you can accidentally test with elevated privileges and miss bugs). Manual testing through the dashboard is more reliable for one-time verification.

## Step 2 — Server actions and validation

**Why second:** Server actions are the contract between UI and database. Define them clearly, with validation, before building UI on top. Otherwise you'll build UI against an unstable contract and have to refactor.

**What to do:**
1. Write Zod schemas in `validation.ts`
2. Write server actions in `actions.ts` that:
   - Parse input through the Zod schema (rejects bad data immediately)
   - Check authentication (`auth.uid()` must be set)
   - Execute the database operation using a server-side Supabase client
   - Return `{ success: true }` or `{ success: false, error: string }` — never throw exceptions to the client

**Beginner trap:** Don't expose database errors directly to users. "duplicate key violation on uk_customer_profiles_user_id" is meaningless to a user and might leak schema details to attackers. Catch the error, log it server-side, return a friendly message.

## Step 3 — Query helpers (read paths)

**Why third:** Now that you can write data correctly, build the read paths. These are simpler than actions because they don't mutate state.

**What to do:**
- `getCustomerProfile(userId)` — Returns the profile or null
- `getAddresses(userId)` — Returns array of (non-deleted) addresses
- `getAddress(id, userId)` — Returns one address if it belongs to the user, else null

**Important pattern:** Every query checks ownership. Even though RLS enforces it at the database level, application-level checks are good defense-in-depth and produce better error messages.

## Step 4 — Address management UI

**Why fourth:** Address UI is the most complex piece (multiple states, default toggle, soft delete). Build it before the simpler stuff so the hardest thing is done first.

**What to build:**
- `AddressList` component — renders array of addresses with actions
- `AddressForm` component — shared between new and edit pages
- The three address pages (list, new, edit) — wire them up to the components

**What to test end-to-end:**
1. Add address -> see it appear in list
2. Click edit -> form pre-fills with existing data
3. Change a field -> save -> see updated value in list
4. Click "set as default" on a non-default -> see the default badge move
5. Click delete -> confirm -> address disappears from list
6. Refresh -> state persists

## Step 5 — Profile UI

**Why fifth:** Profile is the simplest of the three deliverables. Build it after addresses so you can apply patterns you established there.

**What to build:**
- `ProfileForm` component — single form with name and phone fields
- The settings landing page (just a hub with links)
- The profile page wrapping the form

## Step 6 — Photo policy UI

**Why last (of the three deliverables):** Photo policy has the most UX nuance — three options with different conditional UIs, and the waiver flow has legal weight. Build it after you've gotten comfortable with patterns from steps 4 and 5.

**What to build:**
- `PhotoPolicyForm` component with three radio options
- Conditional UI for each option (default = nothing extra, skip_named_rooms = multi-select, skip_all_with_waiver = waiver modal)
- `WaiverModal` component that displays the waiver text

**Critical detail on the waiver:** The user has to *actively check a box* to accept the waiver. Don't auto-check it. Don't pre-fill it. They have to click. The UX should feel deliberate — this is a real choice with real consequences.

## Step 7 — Verify acceptance criteria

**Why this is its own step:** Most builds skip verification. Phase 3 has a verification step explicitly to make sure you don't.

**What to do:**
1. Open the spec, find section 2 (acceptance criteria)
2. Go through each checkbox literally
3. For each one, verify it works on production
4. If any fail, fix and re-verify
5. Only after all pass, write the progress update doc and tag `phase-3-complete`

---

# Section 6 — Specific gotchas (7 things that will break)

Each of these is a real, predictable problem. Address each one deliberately.

## Gotcha A — Trigger doesn't backfill existing users

**The problem:** Your trigger runs when a *new* user is inserted. But you probably already created some test users in Phase 2 verification. Those users were inserted *before* the trigger existed, so they have no customer_profiles row.

**Two solutions:**

**Solution 1 (recommended): Backfill in the migration**
At the end of the migration, add a query that creates customer_profiles rows for any existing users who don't have one. This is a one-time fix. After the migration runs, the trigger handles everything going forward.

**Solution 2: Defensive UI**
The settings pages check "does this user have a profile? If not, create one." This works but adds complexity to every page. Backfill is cleaner.

## Gotcha B — Default address chicken-and-egg

**The problem:** A new customer has zero addresses. They add their first address. What's the default?

**Two solutions:**

**Solution 1 (recommended): Auto-default on first**
In the `createAddress` action: after inserting the address, check if the customer has a default. If not, set this address as default automatically.

**Solution 2: Force explicit choice**
After adding the first address, force the user to navigate to it and click "set as default." This is worse UX — the user just told us they want to use this address; making them say it twice is annoying.

## Gotcha C — Soft-deleting the default address

**The problem:** Customer has 3 addresses. Address #1 is the default. They delete address #1. Now `customer_profiles.default_address_id` points to a soft-deleted row. The booking flow will try to use it and break.

**Solution:**
In `softDeleteAddress` action, after setting `deleted_at`:
1. Check if this address was the default (compare with `customer_profiles.default_address_id`)
2. If yes:
   - If they have other addresses -> set one of them as default
   - If they have no other addresses -> set `default_address_id` to NULL

The B8 migration handles some of this at the database level, but the action should also handle it explicitly so the UI feedback is correct.

## Gotcha D — Photo policy + waiver consistency

**The problem:** The database enforces "if photo_policy = 'skip_all_with_waiver', then waiver_accepted_at must be set." If the UI doesn't enforce this matching, you'll get cryptic database errors.

**Solution:**
The UI never lets the customer save "skip_all_with_waiver" without going through the waiver modal. The waiver modal sets a state flag that, on confirmation, lets the form save with `waiver_accepted_at = NOW()`. If they cancel the modal, the form silently reverts to whatever policy they had before.

**UX detail:** The waiver text should be prominent. Don't make it a tiny disclaimer the user can ignore. Use a modal that takes up most of the screen, with the waiver in body text and a single explicit checkbox + "I understand and accept" button.

## Gotcha E — Address validation is intentionally loose

**The problem:** It's tempting to add lots of address validation (real ZIP code lookup, address verification API, etc.). Don't.

**Why not:**
- US ZIP codes change. Real-time validation makes you dependent on a third-party service.
- Address autocomplete (like Google Places) is a Phase 5 thing because that's where geocoding happens.
- For Phase 3, "5 digits" is a fine ZIP regex. State has to be a valid 2-letter US state code. That's it.

**Solution:** Loose validation. Don't add fancy services. ZIP regex, state enum, country locked to US. Move on.

## Gotcha F — Phone format is E.164

**E.164 explained:** It's the international phone number format. `+15551234567`. No spaces, no dashes, country code prefix.

**Why this matters:** Phase 2 should be normalizing phone numbers to E.164 on signup. Phase 3 displays whatever's in `users.phone` and accepts edits in E.164.

**UX detail:** Don't make the user type `+1` themselves. Have a phone input that auto-formats. But the *stored* value is always E.164.

## Gotcha G — RLS testing is non-optional

**The problem:** Most RLS bugs aren't caught by automated tests because the tests run with elevated privileges that bypass RLS.

**Solution:** Write at least one *manual* test. Use the Supabase SQL editor:

1. Sign up two test users (User A and User B)
2. Each adds an address
3. In SQL editor, set the auth context to User A:
   ```sql
   SET request.jwt.claims = '{"sub": "USER_A_UUID"}';
   ```
4. Run `SELECT * FROM customer_profiles` — should only show User A
5. Run `SELECT * FROM addresses` — should only show User A's addresses
6. Repeat for User B

If either user can see the other's data, RLS is broken. **Phase 3 is not done until this test passes.**

---

# Section 7 — Out of scope (what NOT to build)

Cursor's failure mode is enthusiastic over-execution. It will look at the customer settings page and want to add: payment methods, notification preferences, account deletion, two-factor auth, profile photos, multi-country addresses.

**None of these belong in Phase 3.** Each one is a Phase X thing where X is later. Holding the line on scope is what keeps the build shippable.

The list in section 7 of the spec is opinionated and deliberate. If Cursor pushes back ("I should add this, it's quick!"), say no. The spec is the spec.

---

# Section 8 — Test plan

This section is a literal checklist. After you build everything, you go through each item one at a time. Don't skip any.

The most important items:

- **Migration applies cleanly on a fresh dev Supabase project** — this proves the migration is self-contained and doesn't depend on existing state
- **Sign up a new test user from production URL — `customer_profiles` row appears automatically** — this is the trigger working
- **Try to query another user's profile via the Supabase client (should be blocked by RLS)** — this is RLS working
- **Soft-delete the default address — `customer_profiles.default_address_id` is cleared or reassigned** — this is gotcha C handled

Skipping any of these is asking for a Phase 6 bug that traces back to Phase 3.

---

# Section 9 — Phase 3 deliverable verification

This section exists because of what happened in Phase 1. Cursor declared completion based on local builds passing, but production was broken for hours before we caught it.

The rule for Phase 3:
- "It builds locally" doesn't mean done
- "Tests pass" doesn't mean done
- "Cursor wrote a progress doc" doesn't mean done
- **The only definition of done is: a real test customer can use it on the production URL**

Take screenshots as you verify. Or paste terminal outputs. Or both. Don't trust verbal claims.

---

# Section 10 — Files of interest for the PR

This section is for when you eventually open a pull request to merge Phase 3 into main. The "files of interest" list helps reviewers (you, me, future-you) quickly see what changed.

Cursor will want to put this list in a fancy PR description. That's fine — but the PR description is the *outcome* of completing Phase 3, not the *evidence* of it. Don't accept a polished PR description as proof. Always check the actual files exist and the actual production URL works.

---

# Putting it all together — what to actually do, in order

If you're standing at the start of Phase 3 right now, here's the actual playbook:

**Day 1:**
- Read this breakdown end to end
- Have Cursor read `phase-3-spec.md`
- Ask Cursor 3 questions about the spec before any code is written
- Cursor writes the migration; you review it before applying
- Apply the migration to dev Supabase; verify the trigger and RLS work

**Day 2:**
- Cursor builds the validation and server actions
- You review the actions; make sure they handle errors gracefully
- Cursor builds the query helpers

**Day 3:**
- Cursor builds the address management UI
- You test it locally against your dev Supabase
- Add at least 2 addresses, set default, soft-delete one — verify everything

**Day 4:**
- Cursor builds the profile and photo policy UIs
- You test these locally
- Walk through the photo policy waiver flow specifically — does the modal feel right?

**Day 5:**
- Cursor pushes everything to main
- Vercel auto-deploys
- You go to production URL and run through every acceptance criterion
- For each one that doesn't work, file what's broken and have Cursor fix
- Re-verify after fixes

**Day 6 (or 7):**
- All acceptance criteria pass on production
- Cursor writes the Phase 3 progress update doc
- Tag `phase-3-complete`
- Move to Phase 4

This is a "happy path" — most phases run a day or two over. That's normal. Plan for 7-8 working days, not 5.

---

# What to do with this document

Save this alongside `phase-3-spec.md` at `docs/phases/phase-3-explainer.md` in your repo. The spec is for execution; this explainer is for understanding. Both are useful, for different reasons.

When you (or Cursor, or a future contractor) gets confused mid-Phase-3, this document is the explanation. When you need a checklist to execute against, the spec is the source of truth.
