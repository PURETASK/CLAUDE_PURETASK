# Phase 3a — Plain-English Breakdown

This document walks through every section of `phase-3a-spec.md` and explains:
- What each thing means in plain English
- What needs to be designed (decisions to make)
- What needs to be built (actual files and components)
- Why it matters
- Beginner-trap warnings where they apply

Read it section by section, not all at once. The spec is for execution; this is for understanding.

---

# Section 1 — Summary

## What it means in plain English

Phase 2 made it possible for someone to sign up and have an account. But an account is not a customer — it's just an authenticated user. Phase 3a is the bridge that turns "person who can sign in" into "customer who could book a cleaning if booking existed."

Three concrete things happen by the end of Phase 3a:

1. **Every customer has a `customer_profiles` row.** This is the database row that holds customer-specific stuff: their default address, default payment method, photo policy. Without this row, nothing else hangs together.
2. **Customers can manage service addresses.** The cleaner has to come somewhere. Adding, editing, and choosing a default address is in scope.
3. **Customers can configure their photo policy.** The Master Guide is firm that photo policy must be configurable before any photo capture happens. Phase 3a builds the UI; actual photo enforcement lives in Phase 6.

The settings page itself is also built — but most sections are *placeholders* (stub cards) that say "Coming in Phase X." That's intentional. We're not building Notifications, Payment methods, or Security in Phase 3a. They're real work for Phase 3b. The stubs make the architecture visible without fake-completing it.

## Why this is one phase, not three

Each of the three deliverables is small on its own. Bundling them makes sense because:
- They all depend on the same `customer_profiles` row existing
- They all live in the same `/settings` UI surface
- Verifying them together (one test customer goes through all three) is cheaper than three separate verifications

## What about Phase 3b?

Phase 3b is a planned future phase that completes everything in WF 28 and WF 29. It's not part of Phase 3a. It can run in parallel with later phases, or be slotted in pre-launch. The master outline document explains 3b in detail.

---

# Section 2 — Acceptance criteria (the 14 checkboxes)

Each checkbox is a literal, testable thing. Phase 3a is "done" only when every one passes on production with a real test account.

## Walking through them, briefly

### "After sign-up, navigate to /settings and see name, email, joined date"

Confirms the trigger ran (profile row exists) AND the page reads it correctly. End-to-end smoke test.

### "All 5 WF 28 sections visible, with 3 stub cards clearly labeled"

The page must look like the eventual product, not a half-built mess. Sections shown: Profile (real), Notifications (stub), Service addresses (real, our addition), Payment methods (stub), Security (stub), Privacy + data (real link).

### "Edit name and phone via /settings/profile; changes persist"

Smoke test for the profile section's CRUD. If editing doesn't persist, nothing else downstream works.

### "Add a US address with full validation"

Validation must be server-side, not browser-side. Browser-side is a courtesy; server-side is the only validation that's safe.

### "Set a default; default badge moves"

Tests the `setDefaultAddress` action and the UI reflecting it.

### "Edit an address; changes persist"

Same as profile, for addresses.

### "Soft-delete an address; default auto-promotes if needed"

This is the most complex address operation because of the chicken-and-egg with default reassignment. See Gotcha C in the spec.

### "Photo policy: default / skip named rooms / skip all + waiver — each with correct DB state"

Three sub-tests. Each policy has different DB consequences. Skip-all-with-waiver requires the modal flow.

### "After choosing skip all + waiver, waiver_accepted_at populated"

Specific DB-level check. The constraint enforces this; the test confirms the UI honors it.

### "Forms render without horizontal scroll on 360px viewport"

Mobile-first. Test in DevTools mobile emulator OR an actual phone. Most cleaning-service customers will be on phones.

### "Server-side Zod validation rejects bad input with friendly errors"

The error message users see should never be a raw database error or stack trace. It should say "Please enter a 5-digit ZIP code" not "ZipCodeError: regex_failed at /src/features/customer/validation.ts:42".

### "RLS verification passes"

User A cannot read User B's data, even via direct API calls. This is the single most important security property in Phase 3a. Manual SQL editor verification is the standard pattern.

### "pnpm lint, pnpm typecheck, pnpm build pass"

Self-explanatory. Code that doesn't build can't ship.

### "Production deploy serves correct version"

Phase 1 taught us that "deployed" doesn't always mean "the new code is live." Verify with cache-bust query param to ensure CDN isn't serving stale content.

### "Real test customer end-to-end with screenshots"

The big one. Cursor will want to mark Phase 3a complete based on local testing. Don't let it. Screenshots from production URL with a real test account is the only acceptable evidence.

---

# Section 3 — Database state and migrations

## What the existing tables look like

The `customer_profiles` and `addresses` tables already exist from B1 schema migrations. Phase 3a doesn't create them — it just starts populating and protecting them.

Quick reminder of what's there:

**`customer_profiles`** has columns including:
- `user_id` (FK to users)
- `default_address_id` (nullable FK to addresses)
- `default_payment_method_id` (nullable FK to payment_methods)
- `photo_policy` (enum: 'default', 'skip_named_rooms', 'skip_all_with_waiver')
- `skip_photo_rooms` (text array)
- `waiver_accepted_at` (timestamp)
- Plus stats columns and standard timestamps

**`addresses`** has columns including:
- `owner_user_id` (FK to users)
- `address_type` (enum)
- `street_1`, `street_2`, `city`, `state`, `zip_code`, `country`
- `latitude`, `longitude` (nullable — for Phase 5)
- `label`, `access_instructions`
- Standard timestamps + `deleted_at`

## What migration 0010 does (and why each piece matters)

### The trigger function

```sql
CREATE OR REPLACE FUNCTION handle_new_customer_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO customer_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Walk through this:
- `CREATE OR REPLACE FUNCTION` — defines the function. `OR REPLACE` makes it safe to re-run.
- `RETURNS TRIGGER` — this function is meant to be called by a trigger.
- `INSERT INTO customer_profiles (user_id) VALUES (NEW.id)` — creates the customer profile row using the new user's ID.
- `ON CONFLICT (user_id) DO NOTHING` — if a profile already exists for this user, don't error. Defensive.
- `SECURITY DEFINER` — runs with the function creator's privileges, not the user's. This matters because RLS would otherwise prevent the user from inserting their own profile during signup.

**Why a trigger and not application code?** It's atomic, it runs regardless of how the user was created, and it can't be forgotten. The database guarantees the invariant.

### The trigger itself

```sql
CREATE TRIGGER on_user_inserted_create_customer_profile
AFTER INSERT ON users
FOR EACH ROW
WHEN (NEW.primary_role = 'customer')
EXECUTE FUNCTION handle_new_customer_user();
```

- `AFTER INSERT ON users` — fires after a row is inserted into users
- `FOR EACH ROW` — runs once per row (not once per statement)
- `WHEN (NEW.primary_role = 'customer')` — only fires for customer-role users. Cleaners and admins don't get customer profiles.
- `EXECUTE FUNCTION handle_new_customer_user()` — call our function

### The backfill query

```sql
INSERT INTO customer_profiles (user_id)
SELECT id FROM users
WHERE primary_role = 'customer'
  AND id NOT IN (SELECT user_id FROM customer_profiles)
  AND deleted_at IS NULL
ON CONFLICT (user_id) DO NOTHING;
```

This handles users who already exist before the trigger was created. The `NOT IN` clause excludes users who already have a profile. The `ON CONFLICT DO NOTHING` is belt-and-suspenders.

**Why include the backfill in the migration?** Migrations are how the database evolves over time. If you ran 0010 on a fresh database, the backfill does nothing (no users yet). If you ran it on an existing database with test users, it catches them up. Either way, it's correct.

## What migration 0011 does

Adds RLS policies on `addresses`. Policies are explained more in the next subsection.

## RLS — the most important security concept in this build

### What RLS is

Row-Level Security is a Postgres feature where the database itself enforces "this user can only see rows that belong to them." Without RLS, the query `SELECT * FROM addresses` returns every address in the database. With RLS, the same query automatically filters to only the current user's addresses.

### How Supabase exposes the current user

When a user signs in, Supabase issues a JWT token containing their user ID. Supabase exposes this in SQL as `auth.uid()`. Your RLS policies use `auth.uid()` to check ownership.

### The four policies you need

Postgres RLS works on four operations: SELECT, INSERT, UPDATE, DELETE. Each operation needs its own policy or it's denied by default. Phase 3a sets:

**For `customer_profiles`:**
- SELECT: `user_id = auth.uid()` — customer reads own profile
- UPDATE: `user_id = auth.uid()` — customer updates own profile
- INSERT: blocked entirely (the trigger handles inserts)
- DELETE: blocked entirely (no hard delete; soft delete via UPDATE only)

**For `addresses`:**
- SELECT: `owner_user_id = auth.uid() AND deleted_at IS NULL`
- INSERT: `owner_user_id = auth.uid()`
- UPDATE: `owner_user_id = auth.uid()`
- DELETE: blocked (soft delete via UPDATE)

### Cleaner-side address access — explicitly NOT in this phase

In Phase 6, when a booking is created, the assigned cleaner needs to read the customer's address. That's a *booking-scoped* policy, not a general policy. Phase 3a's RLS does NOT grant cleaners any access. That's a Phase 6 concern, intentionally separated.

### A note on RLS and `SECURITY DEFINER`

The trigger function is `SECURITY DEFINER` — it runs with the function creator's privileges, bypassing RLS. This is the only legitimate way to insert a customer_profiles row during signup, since the user's own auth context can't (because INSERT is blocked).

This is one of those Postgres patterns that feels weird at first. The mental model: RLS protects normal queries; trigger functions running as `SECURITY DEFINER` are how you create rows that RLS would otherwise block, in a controlled way.

---

# Section 4 — The 23 files to create

These break into four groups: routes, feature module, database, and docs. Let's walk through each group.

## App routes (8 files)

### What "App Router" means

Next.js 15's App Router uses file-based routing. The folder structure inside `src/app/` literally becomes URLs:
- `src/app/page.tsx` → `/`
- `src/app/(app)/settings/page.tsx` → `/settings` (the `(app)` parentheses are a *route group*, organizing files but not appearing in the URL)

### Why all settings routes live in `(app)`

The `(app)` route group has authentication middleware applied. Anything inside `(app)` requires the user to be signed in. The middleware was set up by Cursor in Phase 2 (see `src/middleware.ts`).

### The 8 routes broken down

1. **`src/app/(app)/settings/page.tsx`** → `/settings`
   - The settings hub. Renders all 5 WF 28 sections (3 stubs + Profile + Privacy link) plus our addresses card.
   - Server component (fetches data on the server)

2. **`src/app/(app)/settings/profile/page.tsx`** → `/settings/profile`
   - Edit name, phone (display fields)
   - Email is read-only here

3. **`src/app/(app)/settings/addresses/page.tsx`** → `/settings/addresses`
   - List all addresses with [Edit] [Default] [Delete] actions
   - "+ Add address" button at the top

4. **`src/app/(app)/settings/addresses/new/page.tsx`** → `/settings/addresses/new`
   - The form for creating a new address
   - On save: address created; if it's the customer's first, it auto-becomes default

5. **`src/app/(app)/settings/addresses/[id]/page.tsx`** → `/settings/addresses/abc-123`
   - The `[id]` is a dynamic segment — captures the address ID from the URL
   - Edit form pre-filled with existing data
   - Server-side check: if the address doesn't belong to the user (or doesn't exist), 404

6. **`src/app/(app)/settings/privacy/page.tsx`** → `/settings/privacy`
   - Photo policy form (real)
   - Photo info copy from WF 29 (real, educational text)
   - Link to /legal/photography-policy
   - 4 stub cards: Data export, Earlier photo deletion, CCPA opt-out, Account deletion

7. **`src/app/legal/photography-policy/page.tsx`** → `/legal/photography-policy`
   - Placeholder page reading "Coming pre-launch — pending legal review"
   - Note: this lives at `/legal/...`, not `/(app)/...` — the policy page should be readable by non-signed-in users (potential customers reviewing the policy before signing up)

## Feature module (15 files)

### What `src/features/customer/` is for

In our codebase, `src/features/` contains code organized by feature, not by file type. Everything related to "customer stuff" lives in `src/features/customer/`. Easier to find related code; easier to refactor a single feature later.

### Logic files (4)

**`actions.ts`** — Server actions. These are functions that the browser can call to mutate data on the server. Each action validates input, checks auth, runs the database write, returns success/failure.

**`validation.ts`** — Zod schemas for runtime validation.

**`queries.ts`** — Server-side read helpers. Called from server components.

**`types.ts`** — Shared TypeScript types for this feature (e.g., the `ActionResult` type).

### Component files (11)

**`SettingsLayout.tsx`** — Renders all 6 sections of the settings page in order.

**`StubCard.tsx`** — Reusable component for "Coming in Phase X" cards. Props: title, description, phase label.

**`ProfileHeader.tsx`** — Read-only display of name/email/joined date with [Edit] button.

**`ProfileForm.tsx`** — Edit form for name + phone.

**`AddressList.tsx`** — Renders the array of addresses; handles empty state.

**`AddressCard.tsx`** — Single row in the address list; shows label, address, default badge, and action buttons.

**`AddressForm.tsx`** — Shared form used for both new and edit pages. Smart enough to handle both modes via a prop.

**`PhotoPolicyForm.tsx`** — Three-radio policy picker with conditional UI.

**`RoomMultiSelect.tsx`** — Multi-select component for "skip named rooms" option.

**`WaiverModal.tsx`** — Modal that opens when user picks "skip all + waiver." Shows waiver text + explicit checkbox.

## Database (2 files)

`db/migrations/0010_phase3a_customer_profile_bootstrap.sql` and `db/migrations/0011_phase3a_addresses_rls.sql`. Detailed in section 3 above.

## Types (1 file regenerated)

`src/types/database.types.ts` — Auto-generated TypeScript types from your Supabase schema. Regenerate after applying migrations so types reflect new RLS behavior.

```bash
pnpm dlx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > src/types/database.types.ts
```

## Docs (2 files)

The spec itself, plus a progress update written at the end of Phase 3a (matches the format of the Phase 1 progress doc).

---

# Section 5 — Implementation order (10 steps)

Following the order matters. Each step depends on the previous being correct.

## Step 1 — Apply migrations (1 day)

**Why first:** Everything else assumes the database is in the right state. UI built on a wrong schema produces confusing bugs.

**What to do:**
1. Write `0010` migration locally in `db/migrations/`
2. Apply via Supabase dashboard SQL editor (paste and run) OR via Supabase CLI (`supabase db push` if you've set that up)
3. **Manually verify the trigger:** sign up a brand-new test user → check `customer_profiles` table → confirm row appeared
4. **Manually verify backfill:** check that any pre-existing test users from Phase 2 verification now have profile rows
5. Write `0011` migration
6. Apply
7. **Manually verify RLS:** SQL editor test that User A can't see User B's data
8. Regenerate types

**Beginner trap:** Don't skip the manual verification. Migrations can run successfully but not work as intended (trigger conditions can be wrong, RLS policies can have logic errors). Always verify by actually doing the thing, not just reading the migration output.

## Step 2 — Validation schemas (0.5 days)

**Why second:** Server actions depend on validation. Validation depends on schemas being defined first.

**What Zod is:** A TypeScript library that defines runtime validation schemas. You write something like:
```typescript
const addressSchema = z.object({
  street_1: z.string().min(3).max(200),
  zip_code: z.string().regex(/^\d{5}(-\d{4})?$/),
  // ...
});
```
And you get both:
- A TypeScript type: `type Address = z.infer<typeof addressSchema>`
- A runtime validator: `const result = addressSchema.safeParse(input)`

**Cross-field validation with `.refine()`:**

The photo policy schema needs conditional validation. If policy is `'skip_named_rooms'`, then `skip_photo_rooms` must be non-empty. If policy is `'skip_all_with_waiver'`, then `waiver_acknowledgment` must be true. Use `.refine()`:

```typescript
const photoPolicySchema = z.object({
  policy: z.enum(['default', 'skip_named_rooms', 'skip_all_with_waiver']),
  skip_photo_rooms: z.array(z.string()).default([]),
  waiver_acknowledgment: z.boolean().default(false),
}).refine((data) => {
  if (data.policy === 'skip_named_rooms' && data.skip_photo_rooms.length === 0) {
    return false;
  }
  if (data.policy === 'skip_all_with_waiver' && !data.waiver_acknowledgment) {
    return false;
  }
  return true;
}, { message: 'Policy state is inconsistent' });
```

## Step 3 — Server actions (1 day)

**Why third:** Now that you can validate inputs, define the contract between UI and database.

**What server actions are:** Next.js feature where you mark a function with `'use server'` and the browser can call it directly. Under the hood, it's an HTTP POST, but the developer experience feels like calling a function.

**The standard contract for every action:**
```typescript
type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };
```

Every action returns this shape. Never throws. Never lets DB errors leak to the client.

**Why no throws:** If a server action throws, the browser sees a generic 500 error. The user has no idea what went wrong. Returning a result object lets you give a friendly message ("This address already exists") while logging the real error server-side for debugging.

**The standard structure for every action:**
```typescript
'use server';

export async function updateProfile(input: ProfileUpdateInput): Promise<ActionResult> {
  // 1. Parse input
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' };
  }
  
  // 2. Auth check
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  // 3. Mutate (RLS ensures user can only update own profile)
  const { error } = await supabase
    .from('customer_profiles')
    .update(parsed.data)
    .eq('user_id', user.id);
  
  if (error) {
    console.error('updateProfile failed:', error);
    return { success: false, error: 'Could not update profile. Please try again.' };
  }
  
  // 4. Revalidate
  revalidatePath('/settings/profile');
  
  return { success: true };
}
```

## Step 4 — Query helpers (0.5 days)

**Why fourth:** With actions building writes, queries handle reads. Build the read paths so the UI in step 5+ has data to render.

**Queries are simpler than actions:**
- Get server-side Supabase client
- Filter by ownership AND `deleted_at IS NULL` where applicable
- Return null/empty array on not-found

```typescript
export async function getAddresses(userId: string): Promise<Address[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('addresses')
    .select('*')
    .eq('owner_user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  return data ?? [];
}
```

## Step 5 — Address management UI (2 days)

**Why fifth (first among UI):** Most complex piece. Build it before simpler stuff so the hardest thing is done while you're freshest.

**Build order within step 5:**
1. AddressForm — the shared form component
2. AddressCard — single address rendering
3. AddressList — the array renderer with empty state
4. The three pages wiring them together

**Test end-to-end as you go:**
- Add address → see in list
- Click edit → form pre-fills
- Edit → save → verify update
- Set as default → badge moves
- Delete default → another auto-promotes
- Refresh after each — state persists

## Step 6 — Profile section UI (0.5 days)

**Why sixth:** Simplest of the three deliverables. Build after addresses so you can apply patterns established there.

**ProfileForm has 2 fields:** name (required) and phone (optional). That's it.

**Email is read-only** — display it but don't edit it. Email changes are an auth flow that lives in Phase 2 territory.

## Step 7 — Settings shell page (0.5 days)

**Why seventh:** Now that profile and addresses are real, you can build the settings landing page that shows them off.

**StubCard pattern matters here.** A stub card looks like this conceptually:

```tsx
<StubCard
  title="Notifications"
  description="Push, email, and SMS notification preferences."
  phaseLabel="Coming in Phase 10"
/>
```

It renders visually as a real card with a small badge. Click does nothing or shows a tooltip. **Looks intentional, not broken.**

The settings page renders 6 sections in order:
1. Profile header (real)
2. Notifications (stub: Phase 10)
3. Service addresses (real, our addition — link to /settings/addresses)
4. Payment methods (stub: Phase 6)
5. Security (stub: post-launch)
6. Privacy + data (real link → /settings/privacy)
7. Sign out (probably already from Phase 2)

## Step 8 — Photo policy + privacy page (1 day)

**Why eighth (last UI):** Most UX nuance. The waiver flow has legal weight. Build last after you're comfortable with patterns.

**Critical detail: waiver text is `PENDING_LAWYER_REVIEW`.**

The waiver modal contains placeholder text:

```html
<!-- PENDING_LAWYER_REVIEW: Final waiver language must be lawyer-drafted before launch -->
<p>I understand and acknowledge that:</p>
<ul>
  <li>My cleaner will not take photos during the cleaning</li>
  <li>...</li>
</ul>
```

This is good enough to ship Phase 3a. It's not good enough to launch with. Lawyer must review before public launch. The marker comment makes the dependency findable.

**Three options of the photo policy form, conditional UI:**

- "Default" — selected by default. No additional UI.
- "Skip named rooms" — RoomMultiSelect appears below
- "Skip all photos + waiver" — clicking this option opens the WaiverModal

**The waiver modal flow:**
1. User clicks "Skip all" radio
2. WaiverModal opens immediately
3. Shows placeholder waiver text
4. Has checkbox: "I waive the right to dispute solely on cleaning quality without providing my own photo evidence."
5. "Confirm" button is DISABLED until checkbox is checked
6. On Confirm: form state updates, action will set `waiver_accepted_at` on save
7. On Cancel: form reverts to previous policy selection

**Why this UX matters:** The user is making a real decision with real consequences. The modal can't be dismissable by clicking outside. The checkbox can't be auto-checked. Every interaction must be deliberate.

## Step 9 — RLS verification (0.5 days)

This is testing, not building. The actual policies were added in step 1.

**The procedure:**
1. Create User A and User B via production sign-up
2. Each adds an address and configures a photo policy
3. In Supabase SQL editor:
   ```sql
   -- Set auth context to User A
   SELECT set_config('request.jwt.claim.sub', '<USER_A_UUID>', true);
   
   -- These should return ONLY User A's data
   SELECT * FROM customer_profiles;
   SELECT * FROM addresses;
   
   -- This should affect 0 rows
   UPDATE customer_profiles SET photo_policy = 'default'
     WHERE user_id = '<USER_B_UUID>';
   ```
4. Repeat for User B

**If any test fails:** RLS is broken. Phase 3a is not done. Fix before continuing.

## Step 10 — Production verification + closeout (1 day)

**Why this is its own step:** Phase 1 taught us that "deployed" doesn't mean "working in production." Don't skip this.

**Procedure:**
1. Push everything to `main`. Vercel auto-deploys.
2. Wait ~5 minutes. Check Vercel dashboard for green Ready status.
3. Open production URL **in incognito** with cache-bust query: `?nocache=12345`. Incognito + cache-bust ensures you see the actual deployed version, not a CDN-cached old version.
4. Sign up a fresh test customer.
5. Walk through every acceptance criterion from section 2. **Each one. Don't skip.**
6. Take screenshots. Or paste terminal outputs. Or both.
7. Write `phase-3a-progress-update.md` with results — same format as Phase 1's progress doc.
8. Commit, push.
9. Tag `phase-3a-complete` in git: `git tag phase-3a-complete && git push origin phase-3a-complete`
10. Open PR with the files-of-interest list from spec section 10.

---

# Section 6 — Specific gotchas (8 things that will break)

Each is a real, predictable problem. Address each deliberately.

## Gotcha A — Backfill catches existing users

The trigger fires on new INSERT. Test users from Phase 2 predate the trigger. The migration's backfill query handles this. **Verify the backfill ran by checking that pre-existing customer-role users now have customer_profiles rows.** Without backfill, those users will hit "profile not found" errors when they navigate to settings.

## Gotcha B — Default address auto-assignment

A new customer has zero addresses. The first address they add must auto-become default. Otherwise they're stuck with no default and the booking flow (Phase 6) won't know which address to use.

Implement in `createAddress` action:
1. Insert the address
2. Check `customer_profiles.default_address_id`
3. If null, set this address as default
4. Return success

## Gotcha C — Soft-deleting the default address

When the default address gets soft-deleted, you have to handle the `default_address_id` reference:

In `softDeleteAddress` action:
1. Verify ownership
2. Set `addresses.deleted_at = NOW()` for the address
3. Read `customer_profiles.default_address_id`
4. If it equals the deleted address's ID:
   - Find another non-deleted address belonging to the user
   - If found, set it as the new default
   - If none, set `default_address_id = null`
5. Revalidate paths

The B8 schema migration provides DB-level safety (the FK is `ON DELETE SET NULL`), but doing it explicitly in the action gives the UI deterministic behavior.

## Gotcha D — Photo policy + waiver consistency

Database constraint: `photo_policy = 'skip_all_with_waiver'` requires `waiver_accepted_at` to be set.

UI must enforce the same:
- WaiverModal is the only path to this policy
- Modal has explicit checkbox; button disabled until checked
- On confirm, `updatePhotoPolicy` action sets `waiver_accepted_at = NOW()`
- **If user later switches policy back to 'default'**, do NOT clear `waiver_accepted_at`. It's a record of the prior acknowledgment. Keep it.

## Gotcha E — Address validation is intentionally loose

It's tempting to add Google Maps autocomplete, USPS validation, or geocoding. Don't.

Phase 3a validation:
- ZIP regex (5 or 5+4)
- State enum (50 valid US codes + DC)
- Country locked to 'US'
- Other fields are length-bounded strings

That's it. No third-party APIs. No verification services. Phase 5 introduces all that.

## Gotcha F — Phone format is E.164

E.164 is the international phone number format. `+15551234567`. No spaces, no dashes, country code prefix.

In the form:
1. Accept loose user input: `(555) 123-4567`, `555.123.4567`, `5551234567`
2. Normalize on submit:
   - Strip all non-digits
   - If 10 digits, prepend `+1`
   - If 11 digits and starts with `1`, prepend `+`
   - Otherwise, validation error
3. Store and display the normalized E.164 value

## Gotcha G — RLS testing is non-optional

Step 9 cannot be skipped. RLS bugs are the highest-severity bugs in this system. Manual SQL editor verification is the standard pattern.

**Why automated tests are not enough:** RLS bugs often slip through automated tests because the tests run with elevated privileges (service role key). Manual testing through the dashboard with real auth context is the canonical way to verify RLS.

## Gotcha H — Stub cards must look intentional

Stub cards must visually match real cards in size, padding, typography. The differences are:
- Small colored badge ("Coming in Phase 6")
- Slightly lower opacity on description text (e.g., `text-zinc-500` vs `text-zinc-700`)
- Click does nothing or shows a tooltip — **never throws an error or 404s**

The user should perceive a roadmap, not a broken page. Stubs that look like errors are worse than missing sections.

---

# Section 7 — Out of scope for Phase 3a

Cursor's failure mode is enthusiastic over-execution. It will see WF 28 and want to build Notifications because "the toggles are right there in the wireframe." Hold the line.

The list in spec section 7 is opinionated and deliberate. Each deferred item has a phase assigned. None of them belong in Phase 3a.

If Cursor pushes back ("this is just a few hours of work"), the answer is no. The build plan exists for a reason.

---

# Section 8 — Test plan

This is a literal checklist. After Phase 3a is built, walk through each item one at a time. Don't skip any.

**Highest-importance items:**

- "Both migrations apply cleanly on a fresh dev Supabase project" — ensures migrations are self-contained
- "Sign up a new test user from production URL → customer_profiles row appears automatically" — trigger working
- "In Supabase SQL editor as User A: cannot SELECT or UPDATE User B's profile" — RLS working
- "Soft delete the default address (with another address present) → other becomes default" — Gotcha C handled
- "Set photo policy to skip_all_with_waiver via modal → waiver_accepted_at is now()" — Gotcha D handled

Skipping any of these invites a Phase 6 bug that traces back to Phase 3a foundation.

---

# Section 9 — Phase 3a deliverable verification

This section exists because of what happened in Phase 1. Cursor declared completion based on local builds passing while production was still serving the wrong page for hours.

The rule for Phase 3a:
- "It builds locally" doesn't mean done
- "Tests pass" doesn't mean done
- "Cursor wrote a progress doc" doesn't mean done
- **The only definition of done is: a real test customer can do every acceptance criterion on production URL**

Take screenshots. Paste terminal outputs. Don't accept verbal claims of completion from Cursor.

---

# Section 10 — Files of interest

This section is for the eventual Phase 3a PR description. The "files of interest" list helps reviewers (you, me, future-you) quickly see what changed.

Cursor will want to put this list in a polished PR description. That's fine — but the PR description is the *outcome* of completing Phase 3a, not the *evidence* of it. Always check that the actual files exist and the actual production URL works.

---

# What to do next, in order

If you're at the start of Phase 3a:

**Day 1:**
- Read this explainer end to end
- Read `phase-3a-spec.md`
- Hand the spec to Cursor with the instruction: "Read this carefully. Do not start implementing yet. First, respond with: any acceptance criteria you find unrealistic; any technical decisions you'd push back on; confirmation that you've read section 3 (database state); three questions you have before starting."
- Wait for Cursor's response, work through it with me if anything's contentious

**Day 2:**
- Cursor writes migration 0010
- You review the SQL before applying
- Apply to dev Supabase, manually verify the trigger and backfill
- Cursor writes migration 0011, you apply, verify RLS

**Day 3-4:**
- Cursor builds validation, server actions, query helpers
- You spot-check at least one action's full implementation

**Day 5:**
- Cursor builds the address management UI (the hardest piece)
- Test locally before moving on

**Day 6:**
- Cursor builds profile section, settings shell, photo policy UI
- Test locally

**Day 7:**
- Push to main, verify Vercel deploy
- Walk through every acceptance criterion on production
- Fix anything broken; re-verify
- Tag `phase-3a-complete`
- Open PR

This is a happy path. Most phases run a day or two over. Plan for ~10 working days, not 7.

---

# A reminder about the bigger picture

Phase 3a is foundation work. It doesn't feel as exciting as Phase 6 (the booking transaction) or Phase 7 (trust systems). But Phase 6 and 7 fall apart if customer profile bootstrapping is broken, or if RLS leaks data, or if addresses don't soft-delete cleanly.

Build it carefully. The compounding cost of a Phase 3a bug found in Phase 8 is ~10x the cost of catching it in Phase 3a verification.

The spec exists to make verification easy. Use it.
