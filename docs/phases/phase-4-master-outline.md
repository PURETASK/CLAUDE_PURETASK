# Phase 4 Master Outline

## Goal
Build the cleaner onboarding pipeline so a cleaner can be approved and converted into a `cleaner_profiles` record.

## Sub-phases
- **0** external account prerequisites (Stripe + Checkr + legal prep)
- **4b** application form and draft persistence
- **4c** Stripe Identity verification
- **4d** Checkr background check
- **4e** Stripe Connect Express onboarding
- **4f** admin review tooling and decision transitions
- **4g** photo training + tax info + final review UX
- **4h** production verification and closeout docs

## Build Artifacts
- Routes:
  - `src/app/(app)/cleaner/...`
  - `src/app/(admin)/...`
- Feature modules:
  - `src/features/cleaner/application/...`
  - `src/features/admin/applications/...`
  - integration modules for Stripe Identity, Checkr, and Stripe Connect
- Migrations:
  - `db/migrations/0012_phase4_cleaner_onboarding.sql`
  - `db/migrations/0013_phase4_admin_role_setup.sql`
- Policy/docs:
  - `docs/policies/cleaner-onboarding-policy.md`
  - `docs/integrations/checkr-fcra-disclosures.md`

## Verification Standard
No phase completion without production proof of end-to-end cleaner onboarding in test mode integrations.
