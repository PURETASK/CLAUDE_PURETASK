# Phase 3a Progress Update

## Implemented

- Added customer bootstrap migration:
  - `db/migrations/0010_phase3a_customer_profile_bootstrap.sql`
- Added RLS migration for customer onboarding data:
  - `db/migrations/0011_phase3a_addresses_rls.sql`
- Added settings shell with WF 28 sections + phase-labeled stubs:
  - `src/app/(app)/settings/page.tsx`
  - `src/features/customer/components/SettingsLayout.tsx`
  - `src/features/customer/components/ProfileHeader.tsx`
  - `src/features/customer/components/StubCard.tsx`
- Added full profile, addresses, and privacy routes:
  - `src/app/(app)/settings/profile/page.tsx`
  - `src/app/(app)/settings/addresses/page.tsx`
  - `src/app/(app)/settings/addresses/new/page.tsx`
  - `src/app/(app)/settings/addresses/[id]/page.tsx`
  - `src/app/(app)/settings/privacy/page.tsx`
- Added privacy policy placeholder route:
  - `src/app/legal/photography-policy/page.tsx`
- Added missing customer components:
  - `src/features/customer/components/AddressCard.tsx`
  - `src/features/customer/components/RoomMultiSelect.tsx`
  - `src/features/customer/components/PhotoPolicyForm.tsx`
  - `src/features/customer/components/WaiverModal.tsx`
- Enhanced customer actions:
  - auto-default first address
  - set default address action
  - default reassignment/nulling on soft-delete
  - photo policy update with waiver enforcement

## Pending Manual Verification

- Production end-to-end customer path:
  - sign up -> settings/profile -> addresses -> privacy
- RLS cross-customer checks in Supabase SQL editor
- Mobile 360px UI checks on all settings pages
- Vercel deployment verification against production URL

## Compliance Notes

- Legal copy placeholders are marked with `PENDING_LAWYER_REVIEW`.
- Non-Phase-3a WF 28/29 sections are represented as stub cards with future phase badges.
