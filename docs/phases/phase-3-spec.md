# Phase 3 — Customer Onboarding Spec

> **Goal:** A customer can complete their profile and manage service addresses.
> **Estimated time:** 1 week.
> **Prerequisite:** Phase 2 complete (auth flows working, users synced to public.users).

---

## Acceptance criteria — Phase 3 is "done" when:

- [ ] Authenticated customer can view and update their profile (full_name, phone)
- [ ] Customer can add a service address
- [ ] Customer can edit an existing address
- [ ] Customer can soft-delete an address
- [ ] Addresses are scoped to the authenticated user (RLS enforced)
- [ ] Settings nav link is present in the app shell
- [ ] `public.users.id` equals `auth.uid()` so all RLS policies work correctly
- [ ] `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass
- [ ] Production deploy succeeds

---

## Scope (this phase only)

In scope:

- Profile settings page (`/app/settings`)
- Address management page (`/app/settings/addresses`)
- Migration fixing auth user ID alignment (RLS prerequisite)

Out of scope:

- Profile photo upload
- Phone verification (SMS OTP)
- Address geocoding / map picker
- Timezone preference UI
- Cleaner onboarding (Phase 4)

---

## RLS prerequisite — Migration 0010

The Phase 2 trigger sets `public.users.id = gen_random_uuid()`, but all existing RLS
policies check `id = auth.uid()`. This means every DB read/write will return 0 rows
for regular users. Migration 0010 fixes the trigger so `public.users.id = auth.users.id`.

**After applying 0010:** delete any existing test auth users from the Supabase dashboard
and re-register, so they get a correctly linked public.users row.

Migration path: `db/migrations/0010_phase3_fix_user_id_rls.sql`

---

## Implementation tasks

### Task 1 — Migration

Apply `0010_phase3_fix_user_id_rls.sql`:
- Updates `handle_new_auth_user` to set `id = new.id` on INSERT

### Task 2 — Customer feature module

Create `src/features/customer/`:

- `queries.ts` — server-side helpers: `getCurrentUser`, `getUserAddresses`
- `validation.ts` — `updateProfileSchema`, `addressSchema`
- `actions.ts` — `updateProfileAction`, `addAddressAction`, `updateAddressAction`, `deleteAddressAction`
- `components/ProfileForm.tsx`
- `components/AddressForm.tsx`
- `components/AddressList.tsx`

### Task 3 — Routes

- `src/app/(app)/settings/page.tsx` — profile settings
- `src/app/(app)/settings/addresses/page.tsx` — address management

### Task 4 — App shell nav

Add Settings link to `src/app/(app)/layout.tsx`.

### Task 5 — Verify flows

- Update profile → change persists on reload
- Add address → appears in list
- Edit address → updated values persist
- Delete address → removed from list
- Unauthenticated access to `/app/settings` redirects to sign-in

### Task 6 — Quality checks

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

---

## DB tables used

| Table              | Operations         | RLS policy                              |
|--------------------|--------------------|-----------------------------------------|
| `public.users`     | SELECT, UPDATE     | `id = auth.uid()`                       |
| `public.addresses` | SELECT, INSERT, UPDATE, DELETE | `owner_user_id = auth.uid()`  |

`address_type` enum values: `customer_service`, `cleaner_home`, `business`
— Phase 3 always uses `customer_service` for customer addresses.

---

## Definition of done

Phase 3 is complete only when all acceptance criteria above are checked and validated
in both local and deployed environments.
