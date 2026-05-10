# Phase 3a — Customer Foundation Specification

**Phase goal:** A freshly authenticated customer can complete a profile, add a service address, and configure a photo policy. The settings page exists at `/settings` with all sections from WF 28 visible (most as scaffolded stub cards). Phase 5 (browse) and Phase 6 (booking) can build on top of this foundation.

**Estimated duration:** 7 working days (~1.5 calendar weeks).

**Depends on:**
- Phase 2 verified end-to-end on production (sign up, sign in, sign out work with real users)
- Phase 2 user-sync trigger creates `public.users` rows for new auth.users rows
- The `customer_profiles` and `addresses` tables exist in dev Supabase from B1 schema migrations

**Wireframes covered:** WF 28 (settings shell), WF 29 (privacy + photo policy). Address management UI is designed in this phase since no wireframe exists.

**Phase 3b (deferred):** Notifications, payment methods, security/2FA, CCPA data tools, account deletion. These appear as stub cards in Phase 3a and become real in Phase 3b. See `phase-3-master-outline.md` for 3b detail.

---

## 1. Summary

After Phase 2 makes a user sign-uppable, Phase 3a turns them into a customer who is *bookable*. Concretely, by the end of Phase 3a:

1. A `customer_profiles` row exists for every customer-role user (auto-created by trigger; backfilled for existing test users).
2. A customer can add and manage US service addresses, with one marked default.
3. A customer can configure their photo policy (default / skip named rooms / skip all + waiver).
4. The settings page at `/settings` exists with all 5 WF 28 sections visible (3 as stub cards: Notifications, Payment methods, Security).
5. The privacy page at `/settings/privacy` exists with photo policy real and 4 stub cards (Photography Policy link, Data export, Earlier photo deletion, CCPA opt-out, Account deletion).
6. RLS prevents any customer from reading or modifying another customer's data.

---

## 2. Acceptance criteria

A new customer who signs up via the production URL must be able to do all of the following:

- [ ] After sign-up, navigate to `/settings` and see their name, email, and joined date in the profile header
- [ ] See all 5 WF 28 sections on the settings page, with 3 stub cards clearly labeled "Coming in Phase X"
- [ ] Edit display name and phone via `/settings/profile`; changes persist on refresh
- [ ] Add a US service address with full validation (5-digit ZIP, valid state code, required fields enforced)
- [ ] Set an existing address as the default; see the default badge move
- [ ] Edit an existing address; changes persist
- [ ] Soft-delete an address; if it was the default, another address auto-promotes (or default clears if none remain)
- [ ] Configure photo policy to "default" / "skip named rooms" (with room selection) / "skip all + waiver" (with explicit modal confirmation)
- [ ] After choosing "skip all + waiver," `waiver_accepted_at` is populated in the database
- [ ] All forms render without horizontal scroll on a 360px-wide viewport
- [ ] Server-side Zod validation rejects bad input with user-friendly error messages
- [ ] RLS verification passes: User A cannot SELECT or UPDATE any data belonging to User B
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` all pass with zero errors
- [ ] Production deploy on Vercel serves the correct version (verified via cache-bust query param `?nocache=N`)
- [ ] At least one test customer has been created end-to-end on production: signed up → completed profile → added address → set photo policy. Screenshots or terminal output verifying each step.

---

## 3. Database state required

### Existing tables (from B1, no changes needed)

- `users` — created by Phase 2's user-sync trigger
- `customer_profiles` — Phase 3a creates rows here via new trigger
- `addresses` — Phase 3a populates this

### New migrations

#### `db/migrations/0010_phase3a_customer_profile_bootstrap.sql`

This migration:

1. Creates trigger function `handle_new_customer_user()`:
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

2. Creates the trigger on `users`:
   ```sql
   CREATE TRIGGER on_user_inserted_create_customer_profile
   AFTER INSERT ON users
   FOR EACH ROW
   WHEN (NEW.primary_role = 'customer')
   EXECUTE FUNCTION handle_new_customer_user();
   ```

3. Backfills existing customer-role users:
   ```sql
   INSERT INTO customer_profiles (user_id)
   SELECT id FROM users
   WHERE primary_role = 'customer'
     AND id NOT IN (SELECT user_id FROM customer_profiles)
     AND deleted_at IS NULL
   ON CONFLICT (user_id) DO NOTHING;
   ```

4. Adds RLS policies on `customer_profiles`:
   - SELECT: `user_id = auth.uid()` — customer reads own profile
   - UPDATE: `user_id = auth.uid()` — customer updates own profile
   - INSERT: blocked (trigger handles inserts)
   - DELETE: blocked (no hard delete)

#### `db/migrations/0011_phase3a_addresses_rls.sql`

This migration adds RLS policies on `addresses`:
- SELECT: `owner_user_id = auth.uid() AND deleted_at IS NULL` — customer reads own non-deleted addresses
- INSERT: `owner_user_id = auth.uid()` — customer inserts addresses owned by themselves
- UPDATE: `owner_user_id = auth.uid()` — customer updates own addresses (used for soft delete via `deleted_at`)
- DELETE: blocked (soft delete only)

Also: Cleaner-side address access (read access scoped to assigned bookings) is a Phase 6 concern and NOT in this migration.

---

## 4. Files to create

### App routes (8 files)

```
src/app/(app)/settings/page.tsx                       # Settings shell (WF 28)
src/app/(app)/settings/profile/page.tsx                # Edit name + phone
src/app/(app)/settings/addresses/page.tsx              # List of addresses
src/app/(app)/settings/addresses/new/page.tsx          # Add new address
src/app/(app)/settings/addresses/[id]/page.tsx         # Edit existing address
src/app/(app)/settings/privacy/page.tsx                # Privacy + photo policy (WF 29)
src/app/legal/photography-policy/page.tsx              # Placeholder page (PENDING_LAWYER_REVIEW)
```

All routes inside `(app)` are protected by Phase 2's middleware route guard.

### Feature module (15 files)

```
src/features/customer/
├── actions.ts                                         # All server actions (mutations)
├── validation.ts                                      # All Zod schemas
├── queries.ts                                         # Server-side reads
├── types.ts                                           # Shared types for this feature
└── components/
    ├── SettingsLayout.tsx                             # Section card renderer
    ├── StubCard.tsx                                   # Reusable "Coming in Phase X" card
    ├── ProfileHeader.tsx                              # Name + email + joined date display
    ├── ProfileForm.tsx                                # Edit name + phone form
    ├── AddressList.tsx                                # List of address cards
    ├── AddressCard.tsx                                # Single address row with actions
    ├── AddressForm.tsx                                # Shared add/edit form
    ├── PhotoPolicyForm.tsx                            # Three-option policy picker
    ├── RoomMultiSelect.tsx                            # For "skip named rooms" option
    └── WaiverModal.tsx                                # Explicit confirmation for "skip all"
```

### Database (2 files)

```
db/migrations/0010_phase3a_customer_profile_bootstrap.sql
db/migrations/0011_phase3a_addresses_rls.sql
```

### Types (1 file regenerated)

```
src/types/database.types.ts                            # Regenerate after migrations
```

### Docs (2 files)

```
docs/phases/phase-3a-spec.md                           # This document
docs/phases/phase-3a-progress-update.md                # Created at end of phase
```

---

## 5. Implementation order

Build in this exact sequence. Do not skip ahead.

### Step 1 — Apply migrations (1 day)

1. Write `0010_phase3a_customer_profile_bootstrap.sql`
2. Apply to dev Supabase (Supabase dashboard SQL editor or CLI)
3. **Manually verify trigger:** sign up a brand-new test user via the existing Phase 2 sign-up flow → confirm `customer_profiles` row appears
4. **Manually verify backfill:** check that any pre-existing test users from Phase 2 verification now have `customer_profiles` rows
5. Write `0011_phase3a_addresses_rls.sql`
6. Apply to dev Supabase
7. **Manually verify RLS:** in Supabase SQL editor, set auth context to a test user → run `SELECT * FROM addresses` → confirm only that user's rows return
8. Regenerate TypeScript types: `pnpm dlx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > src/types/database.types.ts`

### Step 2 — Validation schemas (0.5 days)

In `src/features/customer/validation.ts`, write Zod schemas for:

- `profileUpdateSchema`:
  - name: string, min 1, max 100, trimmed
  - phone: optional string, must match E.164 regex `/^\+[1-9]\d{1,14}$/` if provided

- `addressSchema`:
  - label: optional string, max 50
  - street_1: required, min 3, max 200
  - street_2: optional, max 100
  - city: required, min 2, max 100
  - state: required, must be valid US state 2-letter code (use enum)
  - zip_code: required, must match `/^\d{5}(-\d{4})?$/`
  - country: literal 'US'
  - access_instructions: optional, max 500

- `photoPolicySchema`:
  - policy: enum `'default' | 'skip_named_rooms' | 'skip_all_with_waiver'`
  - skip_photo_rooms: array of strings, must be non-empty if policy is 'skip_named_rooms', must be empty otherwise
  - waiver_acknowledgment: boolean, must be true if policy is 'skip_all_with_waiver'
  - Use Zod `.refine()` for cross-field conditional validation

Write tests for each schema — at minimum, one valid case and 3-4 invalid cases per schema.

### Step 3 — Server actions (1 day)

In `src/features/customer/actions.ts`, implement:

- `updateProfile(input: ProfileUpdateInput): Promise<ActionResult<void>>`
- `createAddress(input: AddressInput): Promise<ActionResult<{ id: string }>>`
- `updateAddress(id: string, input: AddressInput): Promise<ActionResult<void>>`
- `softDeleteAddress(id: string): Promise<ActionResult<void>>` — also handles default reassignment
- `setDefaultAddress(id: string): Promise<ActionResult<void>>`
- `updatePhotoPolicy(input: PhotoPolicyInput): Promise<ActionResult<void>>` — sets `waiver_accepted_at` if applicable

Standard contract for every action:
```typescript
type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };
```

Each action:
1. Calls `'use server';`
2. Parses input through Zod schema
3. Gets server-side Supabase client
4. Authenticates: `const { data: { user } } = await supabase.auth.getUser()` — if null, return error
5. Executes mutation with explicit ownership check (defense-in-depth alongside RLS)
6. Calls `revalidatePath()` for affected paths
7. Returns success or friendly error

### Step 4 — Query helpers (0.5 days)

In `src/features/customer/queries.ts`, implement:

- `getCustomerProfile(userId: string): Promise<CustomerProfile | null>`
- `getAddresses(userId: string): Promise<Address[]>` — non-deleted only
- `getAddress(id: string, userId: string): Promise<Address | null>` — single, owned by user

Each query:
1. Gets server-side Supabase client
2. Filters by user ownership AND `deleted_at IS NULL` where applicable
3. Returns null/empty on not-found rather than throwing

### Step 5 — Address management UI (2 days)

Why first among UI work: most complex piece. Build it before simpler stuff so the hardest thing is done first.

1. Build `AddressForm.tsx` — shared form, handles both new and edit modes via prop
2. Build `AddressCard.tsx` — single address with [Edit] [Set as default] [Delete] buttons
3. Build `AddressList.tsx` — array renderer + empty state ("You haven't added any addresses yet")
4. Build the three address pages:
   - `addresses/page.tsx` — server component fetching and rendering list, with "+ Add address" button
   - `addresses/new/page.tsx` — server component rendering AddressForm in "new" mode
   - `addresses/[id]/page.tsx` — server component fetching the address, then rendering AddressForm in "edit" mode
5. Wire up actions to the form (server actions return result, client component handles success/error)
6. Test end-to-end locally:
   - Add address → see it appear in list
   - Click edit → form pre-fills correctly
   - Change a field → save → verify in list
   - Click "Set as default" on second address → default badge moves
   - Click delete on default → confirm → another address auto-promotes
   - Refresh after each operation — state persists

### Step 6 — Profile section UI (0.5 days)

1. Build `ProfileHeader.tsx` — read-only display of name/email/joined date with edit button
2. Build `ProfileForm.tsx` — name + phone fields, submit calls `updateProfile`
3. Build `settings/profile/page.tsx`
4. Test: edit name, edit phone, submit invalid phone, refresh persistence

### Step 7 — Settings shell page (0.5 days)

1. Build `StubCard.tsx` — props: title, description, phaseLabel; renders consistent card with phase badge
2. Build `SettingsLayout.tsx` — orders the 6 sections: Profile (real), Notifications (stub Phase 10), Service addresses (real), Payment methods (stub Phase 6), Security (stub post-launch), Privacy + data (real link)
3. Build `settings/page.tsx` — server component fetches profile + address summary, renders SettingsLayout

### Step 8 — Photo policy + privacy page (1 day)

1. Build `RoomMultiSelect.tsx` — checkboxes for common rooms (Kitchen, Living Room, Bathroom, Master Bedroom, Other Bedrooms, Office, Garage, Basement) + "Other" free-text input
2. Build `WaiverModal.tsx`:
   - Renders `<!-- PENDING_LAWYER_REVIEW -->` placeholder waiver text
   - Has explicit checkbox: "I waive the right to dispute solely on cleaning quality without providing my own photo evidence."
   - "Confirm" button enabled only when checkbox is checked
   - "Cancel" button reverts the policy selection
3. Build `PhotoPolicyForm.tsx`:
   - Three radio options
   - Conditional render: if "skip_named_rooms" → show RoomMultiSelect; if "skip_all_with_waiver" → show WaiverModal; else nothing
   - Submit calls `updatePhotoPolicy`
4. Build `settings/privacy/page.tsx`:
   - Header with photo info copy from WF 29 (educational text — not lawyer-pending)
   - PhotoPolicyForm (real)
   - Link to `/legal/photography-policy` (placeholder page)
   - 4 stub cards: Data export, Earlier photo deletion, CCPA opt-out, Account deletion
5. Build `legal/photography-policy/page.tsx` — minimal placeholder reading "Coming pre-launch — pending legal review."

### Step 9 — RLS verification (0.5 days)

In Supabase dashboard SQL editor, perform manual cross-user tests:

1. Create User A and User B via production sign-up
2. Each adds an address and sets a photo policy
3. Run as User A:
   ```sql
   SELECT set_config('request.jwt.claim.sub', '<USER_A_ID>', true);
   SELECT * FROM customer_profiles;  -- should return ONLY User A
   SELECT * FROM addresses;          -- should return ONLY User A's addresses
   UPDATE customer_profiles SET photo_policy = 'default'
     WHERE user_id = '<USER_B_ID>';  -- should affect 0 rows
   ```
4. Repeat as User B
5. If any test fails, RLS is broken — do not declare phase complete

### Step 10 — Production verification + closeout (1 day)

1. Push everything to `main`
2. Wait for Vercel auto-deploy
3. Verify deployment succeeded (check Deployments tab in Vercel)
4. Open production URL in incognito with cache-bust: `https://claude-puretask.vercel.app/?nocache=12345`
5. Sign up a fresh test user
6. Walk through every acceptance criterion from section 2
7. Take screenshot of each verification step
8. Write `docs/phases/phase-3a-progress-update.md` with results
9. Tag `phase-3a-complete` in git
10. Open PR with files-of-interest list

---

## 6. Specific gotchas

These are predictable problems. Address each deliberately.

### Gotcha A — Trigger doesn't backfill existing users

The trigger fires only on new INSERT. Test users from Phase 2 verification predate the trigger. The migration's backfill query handles this. Verify backfill ran.

### Gotcha B — Default address chicken-and-egg

A new customer has zero addresses. When they create the first one, `createAddress` action must:
1. Insert the address
2. Check if `customer_profiles.default_address_id` is null
3. If null, set the new address as default

Don't force the customer to manually mark their first address as default — bad UX.

### Gotcha C — Soft-deleting the default address

When the customer soft-deletes their default address, the `softDeleteAddress` action must:
1. Set `deleted_at = NOW()` on the address
2. Check if this was the default (`customer_profiles.default_address_id = address.id`)
3. If yes:
   - If other non-deleted addresses exist → set one of them as default (most-recently-created)
   - If none exist → set `default_address_id = null`

Implement this in the action explicitly. The B8 migration provides DB-level safety but UI feedback should be deterministic.

### Gotcha D — Photo policy + waiver consistency

Database constraint: `photo_policy = 'skip_all_with_waiver'` requires `waiver_accepted_at` to be set. UI must enforce the same:

- WaiverModal is the only path to this policy
- Modal has explicit checkbox; no save without check
- On confirm, `updatePhotoPolicy` action sets `waiver_accepted_at = NOW()`
- If user later switches policy away from `skip_all_with_waiver`, do NOT clear `waiver_accepted_at` — keep it as a record of the prior acknowledgment

### Gotcha E — Address validation is intentionally loose

Don't add Google Maps autocomplete, don't call USPS for ZIP validation, don't try to verify the address is real. Just:
- ZIP regex (5 or 5+4)
- State enum (50 valid US codes + DC)
- Country locked to 'US'

Geocoding and verification are Phase 5.

### Gotcha F — Phone format is E.164

E.164: `+15551234567`. No spaces, no dashes, country code prefix.

In the form, accept loose user input (e.g., `(555) 123-4567`) and normalize on submit:
1. Strip all non-digits
2. If 10 digits, prepend `+1`
3. If 11 digits and starts with `1`, prepend `+`
4. Otherwise validation error

Display the normalized E.164 value back in the form after save.

### Gotcha G — RLS testing is non-optional

Step 9 cannot be skipped. RLS bugs in customer data are the highest-severity bugs in the system. Manual SQL editor verification is the standard pattern; automated tests can be added in Phase 10 hardening.

### Gotcha H — Stub cards must look intentional, not broken

Stub cards visually match real cards in size, padding, and typography. Differences:
- Small colored badge ("Coming in Phase 6")
- Slightly lower opacity on description text (e.g., 70%)
- Click does nothing or shows a tooltip — never throws an error

The user should perceive a roadmap, not a broken page.

---

## 7. Out of scope for Phase 3a

Defer to Phase 3b (or later phase as noted):

- Notifications system (Phase 3b.4 — pre-launch)
- Payment methods CRUD (Phase 3b.1 / Phase 6a — overlaps)
- Two-factor authentication (Phase 3b.5 — post-launch acceptable)
- Active sessions management (Phase 3b.5)
- Account deletion flow (Phase 3b.3 — pre-launch)
- Data export / CCPA right to access (Phase 3b.2 — pre-launch)
- "Request earlier photo deletion" (Phase 3b.2 — needs Phase 6e photo system)
- CCPA opt-out flow (Phase 3b.2)
- Address geocoding (Phase 5)
- Customer dashboard / booking history view (Phase 5 — WF 11)
- Customer favorites management (Phase 5 — WF 25)
- Communication preferences beyond push/email/SMS (post-launch)
- Multi-country addresses (post-launch — US only at launch)
- Email change flow (Phase 2 territory; not Phase 3a)

---

## 8. Test plan

Before declaring Phase 3a complete:

- [ ] `pnpm lint` exits 0
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm build` exits 0
- [ ] Both migrations apply cleanly on a fresh dev Supabase project
- [ ] Sign up a new test user from production URL → `customer_profiles` row appears automatically
- [ ] Backfill query created `customer_profiles` rows for any pre-existing customer-role users
- [ ] Add an address via the production UI → row appears in DB with correct `owner_user_id`
- [ ] Edit the address → changes persist on refresh
- [ ] Set a non-default address as default → DB and UI both update
- [ ] Soft delete the default address (with another address present) → other address becomes default
- [ ] Soft delete the only address → `default_address_id` becomes null
- [ ] Set photo policy to "default" → DB updated, no waiver, no skip rooms
- [ ] Set photo policy to "skip_named_rooms" with 2 rooms selected → DB has correct array
- [ ] Set photo policy to "skip_all_with_waiver" via modal → `waiver_accepted_at` is now()
- [ ] Switch from "skip_all_with_waiver" back to "default" → `waiver_accepted_at` retained (NOT cleared)
- [ ] In Supabase SQL editor as User A: cannot SELECT or UPDATE User B's profile or addresses
- [ ] All forms render without horizontal scroll on a 360px viewport (DevTools mobile emulator)
- [ ] Stub cards render with correct phase labels for Notifications, Payment methods, Security, Data export, CCPA, Account deletion, Earlier photo deletion
- [ ] `/legal/photography-policy` placeholder page renders with PENDING_LAWYER_REVIEW notice
- [ ] All pages render correctly when the customer has zero addresses
- [ ] All pages render correctly when the customer has 5+ addresses
- [ ] Server actions return user-friendly errors, never raw DB error messages

---

## 9. Phase 3a deliverable verification

Phase 3a is complete when, on the production URL, with a real test customer account, every acceptance criterion in section 2 has been verified with screenshots or terminal output as evidence.

Cursor: do not mark Phase 3a complete based on local builds. Do not mark Phase 3a complete based on lint/typecheck/build success alone. Do not mark Phase 3a complete based on staging or preview deployments. Only the production URL with a real test account counts.

If any acceptance criterion cannot be verified on production, Phase 3a is not done.

---

## 10. Files of interest (for the Phase 3a PR)

When opening the Phase 3a PR, these are the files to list:

**Database:**
- `db/migrations/0010_phase3a_customer_profile_bootstrap.sql`
- `db/migrations/0011_phase3a_addresses_rls.sql`

**Types:**
- `src/types/database.types.ts` (regenerated)

**Routes:**
- `src/app/(app)/settings/page.tsx`
- `src/app/(app)/settings/profile/page.tsx`
- `src/app/(app)/settings/addresses/page.tsx`
- `src/app/(app)/settings/addresses/new/page.tsx`
- `src/app/(app)/settings/addresses/[id]/page.tsx`
- `src/app/(app)/settings/privacy/page.tsx`
- `src/app/legal/photography-policy/page.tsx`

**Feature module:**
- `src/features/customer/actions.ts`
- `src/features/customer/validation.ts`
- `src/features/customer/queries.ts`
- `src/features/customer/types.ts`
- `src/features/customer/components/SettingsLayout.tsx`
- `src/features/customer/components/StubCard.tsx`
- `src/features/customer/components/ProfileHeader.tsx`
- `src/features/customer/components/ProfileForm.tsx`
- `src/features/customer/components/AddressList.tsx`
- `src/features/customer/components/AddressCard.tsx`
- `src/features/customer/components/AddressForm.tsx`
- `src/features/customer/components/PhotoPolicyForm.tsx`
- `src/features/customer/components/RoomMultiSelect.tsx`
- `src/features/customer/components/WaiverModal.tsx`

**Docs:**
- `docs/phases/phase-3a-spec.md`
- `docs/phases/phase-3a-progress-update.md`
