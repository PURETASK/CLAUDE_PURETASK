# Phase 3 Progress Update

## Scope Implemented

- Added `db/migrations/0010_phase3_customer_onboarding.sql` for:
  - `customer_profiles` bootstrap trigger on `public.users`
  - one-time backfill for existing customer users
  - RLS policies on `customer_profiles` and `addresses`
- Added spec-aligned settings routes:
  - `src/app/(app)/settings/page.tsx`
  - `src/app/(app)/settings/profile/page.tsx`
  - `src/app/(app)/settings/addresses/page.tsx`
  - `src/app/(app)/settings/addresses/new/page.tsx`
  - `src/app/(app)/settings/addresses/[id]/page.tsx`
  - `src/app/(app)/settings/privacy/page.tsx`
- Added missing components:
  - `src/features/customer/components/PhotoPolicyForm.tsx`
  - `src/features/customer/components/WaiverModal.tsx`
- Enhanced Phase 3 customer actions:
  - auto-default first address on create
  - explicit set-default action
  - default-address cleanup on soft-delete
  - photo policy update with waiver handling
- Updated middleware and shell navigation to include `/settings` paths.
- Kept legacy `/app/settings` pages as redirects to the new `/settings` hierarchy.

## Validation Status

- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`
- [ ] Production verification checklist completed
- [ ] RLS cross-user manual verification completed in Supabase SQL editor
- [ ] End-to-end production customer onboarding evidence captured

## Notes

- Phase 3 should only be marked complete after the production checks from
  `docs/phases/phase-3-spec.md` section 8 and section 9 are executed and documented.
