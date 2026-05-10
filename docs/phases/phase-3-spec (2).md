# Phase 3 — Customer Onboarding Specification

**Phase goal:** A customer can complete their profile, add a service address, and configure privacy preferences — establishing all customer-side data needed for browse/booking flows in Phase 5.

**Estimated duration:** 1 week (per Master Guide).

**Depends on:** Phase 2 complete (auth working end-to-end). Specifically requires `auth.users` → `public.users` sync (the `0009_phase2_auth_user_sync.sql` migration must be applied and verified).

**Wireframes covered:** WF 28 (Customer settings), WF 29 (Customer privacy settings).

---

## 1. Summary

After a user completes sign-up in Phase 2, they exist in `auth.users` and `public.users`. They do **not** yet have a customer profile or any addresses. Phase 3 turns a freshly authenticated user into a customer who can book.

Three deliverables:

1. **Customer profile bootstrap** — auto-create a `customer_profiles` row on first customer-side login (or via explicit "complete your profile" flow). Populate with sensible defaults.
2. **Address management** — let customers add, edit, set-default, and soft-delete service addresses.
3. **Privacy preferences (photo policy)** — let customers configure how cleaners handle photos in their home.

---

## 2. Acceptance criteria

A new customer, freshly signed up, must be able to:

- [ ] Complete the customer settings page (WF 28) and have changes persist
- [ ] Add a US service address with street, city, state, ZIP, optional access instructions and label
- [ ] Set one address as their default service address
- [ ] Edit an existing address
- [ ] Soft-delete an address (it disappears from their view but is preserved in the database)
- [ ] Choose a photo policy from the three locked options (default / skip named rooms / skip all + waiver)
- [ ] When choosing "skip all + waiver," explicitly accept the dispute waiver
- [ ] When choosing "skip named rooms," select which rooms to skip
- [ ] All changes are reflected on a refresh
- [ ] Server-side validation rejects bad data (invalid ZIP, missing required fields, etc.)
- [ ] RLS prevents the customer from reading or modifying any other customer's profile or addresses
- [ ] All forms work on mobile width (≥360px) without horizontal scroll
- [ ] Build passes: `pnpm lint`, `pnpm typecheck`, `pnpm build`
- [ ] Production deploy on Vercel shows working customer settings page
- [ ] At least one test customer has been created end-to-end on production: signed up → completed profile → added address → set photo policy

---

## 3. Database state required

These tables already exist in the schema (B1) and need no changes for Phase 3:

- `users` — created in Phase 2 by `0009_phase2_auth_user_sync.sql` trigger
- `customer_profiles` — Phase 3 will create rows in this table
- `addresses` — Phase 3 will create rows in this table

### New migration required: `0010_phase3_customer_onboarding.sql`

This migration adds:

1. **Trigger to auto-create `customer_profiles` row** when a customer-role user is created. Default values per the table schema (photo_policy = 'default', empty skip_photo_rooms, etc.). Implementation note: the trigger should fire on insert into `users` when `primary_role = 'customer'`. If the user changes role later, that's a separate path not in scope for Phase 3.

2. **RLS policies on `customer_profiles`:**
   - SELECT: customer can read their own profile (`user_id = auth.uid()`)
   - UPDATE: customer can update their own profile
   - INSERT: handled by trigger; no direct insert allowed
   - DELETE: not allowed at all (soft delete via UPDATE only)

3. **RLS policies on `addresses`:**
   - SELECT: owner can read their own addresses (`owner_user_id = auth.uid()`)
   - INSERT: owner can insert addresses for themselves
   - UPDATE: owner can update their own addresses
   - DELETE: not allowed (soft delete via UPDATE setting `deleted_at`)
   - Cleaner reads on customer addresses come from a *booking-scoped* policy added in Phase 6, not Phase 3.

4. **Geocoding hook (placeholder).** Phase 3 leaves `latitude` and `longitude` null on insert. Phase 5 introduces the geocoding service that backfills these. Document this as a known gap.

---

## 4. Files to create

### App routes

```
src/app/(app)/settings/page.tsx               — Customer settings landing (WF 28)
src/app/(app)/settings/profile/page.tsx       — Edit name, phone (display name only; auth fields stay in Phase 2)
src/app/(app)/settings/addresses/page.tsx     — List of addresses with add/edit/delete
src/app/(app)/settings/addresses/new/page.tsx — Add new address form
src/app/(app)/settings/addresses/[id]/page.tsx — Edit existing address
src/app/(app)/settings/privacy/page.tsx       — Photo policy preferences (WF 29)
```

All routes live inside the `(app)` route group from Phase 2 — they require authentication via the existing middleware route guard.

### Feature module

```
src/features/customer/
├── actions.ts                — Server actions: updateProfile, createAddress, updateAddress, softDeleteAddress, setDefaultAddress, updatePhotoPolicy
├── validation.ts             — Zod schemas for each form
├── queries.ts                — Server-side helpers: getCustomerProfile, getAddresses, getAddress
└── components/
    ├── ProfileForm.tsx       — Name, phone display
    ├── AddressList.tsx       — Renders addresses with actions
    ├── AddressForm.tsx       — Shared add/edit form
    ├── PhotoPolicyForm.tsx   — Three-option policy picker with conditional sub-states
    └── WaiverModal.tsx       — Confirmation modal for "skip all + waiver" option
```

### Database

```
db/migrations/0010_phase3_customer_onboarding.sql
```

### Types

```
src/types/database.types.ts   — Regenerate from Supabase to include new RLS-aware types
```

### Spec / docs

```
docs/phases/phase-3-spec.md           — This document
docs/phases/phase-3-progress-update.md — Created at end of phase (mirrors Phase 1 format)
```

---

## 5. Implementation order

Build in this exact sequence. Do not skip ahead; each step depends on the previous.

### Step 1: Apply the migration
- Write `0010_phase3_customer_onboarding.sql`
- Apply to dev Supabase
- Manually verify: signing up a new test user creates a `customer_profiles` row automatically
- Manually verify: RLS prevents user A from selecting user B's profile (test in Supabase SQL editor)

### Step 2: Server actions and validation
- Implement `src/features/customer/validation.ts` with Zod schemas for:
  - Profile update (display name, phone)
  - Address (street_1, street_2, city, state, zip_code, country='US', label, access_instructions)
  - Photo policy (policy enum, optional skip_photo_rooms array, optional waiver acceptance flag)
- Implement `src/features/customer/actions.ts` with server actions for each mutation
- Each action: parse input with Zod → check authentication → execute with server-side Supabase client → revalidate paths
- Each action returns `{ success: true } | { success: false, error: string }` — no thrown errors leaking to client

### Step 3: Query helpers
- `src/features/customer/queries.ts` — server-side reads
- These are called from page components, not client components
- Each query checks auth and returns null on failure rather than throwing

### Step 4: Address management UI
- Build `AddressList`, `AddressForm` components
- Build the three address pages: list, new, edit
- Test end-to-end: add address → see it in list → edit → set default → delete
- Verify default address is correctly tracked in `customer_profiles.default_address_id`

### Step 5: Profile UI
- Build `ProfileForm` component
- Build settings landing page and profile page
- Display name and phone are editable; email stays read-only (changes go through auth flow, not Phase 3)

### Step 6: Photo policy UI
- Build `PhotoPolicyForm` component with three radio options
- Conditional UI:
  - "default" → no extra fields
  - "skip_named_rooms" → multi-select of common room names (kitchen, living room, bathroom, bedroom, office, garage, basement, other)
  - "skip_all_with_waiver" → show waiver modal; require explicit checkbox confirmation; on save, set `waiver_accepted_at` to now
- Database constraint already enforces waiver requirement; UI must match

### Step 7: Verify acceptance criteria
- Run through all checkboxes in section 2
- Fix anything broken
- Only then update progress doc and tag `phase-3-complete`

---

## 6. Specific gotchas to watch for

These are the places this phase will most likely break. Address them deliberately, not reactively.

**a. The customer_profiles trigger has to handle the "user exists but profile does not" case gracefully.** If a user was created in Phase 2 before this trigger existed (likely true for any test users created during Phase 2 verification), the trigger does not retroactively create their profile. Either backfill these users in the migration, or build the customer profile pages defensively to handle missing rows by creating one on first access. Recommend backfill: it's a one-time script.

**b. `default_address_id` is a chicken-and-egg problem.** A new customer has no addresses. When they create their first address, you must either:
- Auto-set it as default if no default exists yet (recommended), or
- Force them to explicitly mark one default (worse UX)

Implement the auto-default logic in the `createAddress` action.

**c. Soft delete of the default address.** If a customer soft-deletes the address that is currently their default, you must clear `default_address_id` (or set it to another existing address). The B8 migration handles cleanup but Phase 3 actions need to be aware of this transition. Recommend: in the `softDeleteAddress` action, after setting `deleted_at`, check if it was the default and either clear or reassign.

**d. Photo policy + waiver consistency.** The database enforces the constraint that `photo_policy = 'skip_all_with_waiver'` requires `waiver_accepted_at`. The UI must present this as a meaningful decision, not a checkbox to dismiss. Show the waiver text in a modal with explicit "I understand I waive my right to dispute based on photo evidence" copy. Do not let users select this option without seeing the consequence.

**e. Address validation is intentionally loose at this stage.** ZIP code regex (5 digits or 5+4), state must be a valid US state code, country is locked to 'US'. Do *not* implement geocoding in Phase 3 — that's Phase 5. Leave latitude/longitude null.

**f. Phone format is E.164 throughout.** If the user entered phone in Phase 2 sign-up in a friendlier format, the normalization happens at the auth layer in Phase 2. Phase 3 displays whatever is in `users.phone` and accepts edits in E.164 only. Document the format expectation in the form.

**g. RLS testing is non-optional.** Before declaring Phase 3 done, write at least one SQL-level test that user A cannot select user B's profile or addresses. RLS bugs in customer data are the highest-severity bugs in the system.

---

## 7. Out of scope for Phase 3

These belong to later phases. Do not build them here.

- Address geocoding (Phase 5)
- Customer-facing booking history dashboard, WF 11 (Phase 5)
- Customer favorites management, WF 25 (Phase 5)
- Customer notifications (Phase 10)
- Email-based communication preferences (Phase 10)
- Account deletion / account closure flow (post-launch)
- Multi-country addresses (post-launch — US only at launch per Master Guide)
- Payment methods (Phase 6a — Stripe customer payment)

---

## 8. Test plan

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes
- [ ] Migration applies cleanly on a fresh dev Supabase project
- [ ] Sign up a new test user from production URL — `customer_profiles` row appears automatically
- [ ] Add an address via the production UI — row appears in `addresses` table with correct `owner_user_id`
- [ ] Edit the address — changes persist on refresh
- [ ] Set photo policy to "skip all + waiver" — `waiver_accepted_at` is populated
- [ ] Set photo policy to "skip named rooms" — `skip_photo_rooms` array is populated
- [ ] Try to query another user's profile via the Supabase client (should be blocked by RLS)
- [ ] Soft-delete the default address — `customer_profiles.default_address_id` is cleared or reassigned
- [ ] All forms render without horizontal scroll on a 360px-wide viewport

---

## 9. Phase 3 deliverable verification (the actual "is it done" check)

Phase 3 is complete when **a freshly signed-up customer can go from `/auth/sign-up` to a fully configured profile with a default service address and photo policy, on the production URL, without any developer intervention.**

Cursor: do not mark Phase 3 complete based on local testing alone. Do not mark Phase 3 complete based on the build passing. Phase 3 is complete only when the production verification in section 8 has been executed against the live Vercel deployment with a real test account, and screenshots or terminal output confirms each acceptance criterion in section 2.

If any item in section 2 is not verifiable on production, Phase 3 is not done.

---

## 10. Files of interest (for the eventual PR)

When opening the Phase 3 PR, list these as the files of interest:

- `db/migrations/0010_phase3_customer_onboarding.sql`
- `src/app/(app)/settings/page.tsx`
- `src/app/(app)/settings/profile/page.tsx`
- `src/app/(app)/settings/addresses/page.tsx`
- `src/app/(app)/settings/addresses/new/page.tsx`
- `src/app/(app)/settings/addresses/[id]/page.tsx`
- `src/app/(app)/settings/privacy/page.tsx`
- `src/features/customer/actions.ts`
- `src/features/customer/validation.ts`
- `src/features/customer/queries.ts`
- `src/features/customer/components/ProfileForm.tsx`
- `src/features/customer/components/AddressList.tsx`
- `src/features/customer/components/AddressForm.tsx`
- `src/features/customer/components/PhotoPolicyForm.tsx`
- `src/features/customer/components/WaiverModal.tsx`
- `src/types/database.types.ts` (regenerated)
- `docs/phases/phase-3-spec.md`
- `docs/phases/phase-3-progress-update.md`
