# Phase 5 Progress Update

_Last updated: 2026-05-07_

This tracks implementation progress for Phase 5 against:

- `docs/phases/phase-5-spec.md`
- `docs/phases/phase-5-build-guide.md`
- `docs/phases/phase-5-implementation-blueprint.md` (Appendix A AC-IDs)

## Scope Implemented

- Added migrations:
  - `db/migrations/0014_phase5_geocoding_and_browse.sql`
  - `db/migrations/0015_phase5_waitlist_customer_insert.sql`
- Added geocoding flow + backfill tooling:
  - `src/lib/google-maps/geocoding.ts`
  - `src/features/customer/geocode-address-queue.ts`
  - `src/server/jobs/backfill-geocoding.ts`
  - Address create/update actions now queue geocoding
- Added spec-aligned match scoring:
  - `src/features/discovery/match-score.ts`
  - `src/features/discovery/browse-ranking.ts`
  - migrated old scoring tests to new API
- Reworked discovery queries + filtering + ranking:
  - `src/features/discovery/queries.ts`
  - `src/features/discovery/validation.ts`
- Updated customer-facing pages:
  - `src/app/(app)/app/page.tsx` (WF 1)
  - `src/app/(app)/app/cleaners/page.tsx` (WF 8)
  - `src/app/(app)/app/cleaners/[id]/page.tsx` (WF 7)
  - `src/app/(app)/app/dashboard/page.tsx` (WF 11)
  - `src/app/(app)/app/favorites/page.tsx` (WF 25)
  - `src/app/(app)/app/waitlist/page.tsx`
- Added favorites mutation + UI:
  - `src/features/discovery/actions.ts`
  - `src/features/discovery/components/FavoriteButton.tsx`
- Updated nav shell for dashboard/favorites entry points:
  - `src/app/(app)/layout.tsx`
- Updated env and DB types:
  - `.env.example`
  - `src/lib/env.ts`
  - `src/types/database.types.ts`

## Validation Status

- [x] `corepack pnpm lint`
- [x] `corepack pnpm typecheck`
- [ ] `corepack pnpm build`
- [ ] Production verification walkthrough complete (all AC-ID evidence captured)
- [ ] RLS cross-user verification complete in Supabase SQL editor

---

## Acceptance Criteria Checklist (Appendix A AC-IDs)

### WF 1 — Customer homepage

- [x] `WF1-01` Service catalog visible
- [x] `WF1-02` Recent bookings section + empty state
- [x] `WF1-03` Top 3 recommendations shown
- [x] `WF1-04` Browse CTA to cleaner list

### WF 8 — Cleaner list

- [ ] `WF8-01` Perf under 2s validated in production
- [x] `WF8-02` Service filter
- [x] `WF8-03` Distance filter options
- [x] `WF8-04` Minimum rating filter options
- [x] `WF8-05` Price range filter hooks (query model + ranking support)
- [x] `WF8-06` Availability filter accepted (neutral/stub behavior)
- [x] `WF8-07` Sort modes: match/distance/rating/price
- [x] `WF8-08` Cleaner card metadata present
- [x] `WF8-09` No-results empty state
- [x] `WF8-10` No-coverage state with waitlist CTA

### Match Score algorithm

- [x] `MS-01` Six factors implemented
- [x] `MS-02` Deterministic ranking path
- [x] `MS-03` Normalized display score
- [x] `MS-04` Ranking updates with cleaner attributes
- [x] `MS-05` Cold-start boost path implemented

### WF 7 — Cleaner profile

- [x] `WF7-01` Profile detail sections render
- [x] `WF7-02` Reviews section (empty/fill behavior)
- [x] `WF7-03` Transparency card renders per factor
- [x] `WF7-04` Request-to-book CTA present
- [x] `WF7-05` Badge display section present

### WF 11 — Customer dashboard

- [x] `DB-01` Active bookings section scaffolded
- [x] `DB-02` Past bookings section scaffolded
- [x] `DB-03` Favorites preview + link
- [x] `DB-04` Recent cleaners empty-state section

### WF 25 — Favorites

- [x] `FAV-01` Favorite from profile
- [x] `FAV-02` Unfavorite from profile/list action path
- [x] `FAV-03` Favorites list using cleaner cards
- [ ] `FAV-04` RLS isolation manually verified in SQL editor

### Cross-cutting

- [x] `CC-GEO-01` Geocode pipeline + distance calculations implemented
- [x] `CC-GEO-02` Backfill job added
- [ ] `CC-UX-01` 360px responsive QA pass evidence captured
- [ ] `CC-SEC-01` RLS privacy checks verified in production/staging
- [x] `CC-RANK-01` Ranking computed server-side
- [x] `CC-QA-01` lint/typecheck passing
- [ ] `CC-REL-01` production deploy version evidence captured
- [ ] `CC-E2E-01` full production flow evidence captured

---

## Notes / Remaining Closeout Tasks

1. Run and validate `db/migrations/0014...` and `0015...` against dev/staging/prod.
2. Confirm `GOOGLE_MAPS_API_KEY` exists in deployed envs and geocoding works end-to-end.
3. Capture Appendix A evidence (screenshots, timings, SQL policy checks).
4. Run `corepack pnpm build` as final gate before Phase 5 completion tag.

---

## Evidence Matrix (Signoff Template)

Use this table during closeout. Add real URLs/paths/queries before marking Phase 5 complete.

| AC-ID | Status | Evidence type | Evidence link/path/query | Owner | Notes |
|-------|--------|---------------|--------------------------|-------|-------|
| `WF1-01` | Implemented | Screenshot | TODO | TODO | Homepage service catalog visible |
| `WF1-02` | Implemented | Screenshot | TODO | TODO | Recent bookings empty state |
| `WF1-03` | Implemented | Screenshot + data check | TODO | TODO | Top 3 recommendations populated |
| `WF1-04` | Implemented | Clickthrough recording | TODO | TODO | Browse CTA nav works |
| `WF8-01` | Pending evidence | Perf capture (HAR/p95) | TODO | TODO | Must prove `<2s` on production |
| `WF8-02` | Implemented | Screenshot | TODO | TODO | Service filter works |
| `WF8-03` | Implemented | Screenshot | TODO | TODO | Distance filter works |
| `WF8-04` | Implemented | Screenshot | TODO | TODO | Min rating filter works |
| `WF8-05` | Implemented | Screenshot | TODO | TODO | Price range hooks active |
| `WF8-06` | Implemented | Screenshot + note | TODO | TODO | Availability accepted as neutral/stub |
| `WF8-07` | Implemented | Screenshot | TODO | TODO | Sort modes all wired |
| `WF8-08` | Implemented | Screenshot | TODO | TODO | Cleaner card metadata present |
| `WF8-09` | Implemented | Screenshot | TODO | TODO | No-results empty state |
| `WF8-10` | Implemented | Screenshot | TODO | TODO | No-coverage + waitlist CTA |
| `MS-01` | Implemented | Code + test reference | TODO | TODO | Six factors implemented |
| `MS-02` | Implemented | Test/output snapshot | TODO | TODO | Deterministic behavior |
| `MS-03` | Implemented | Screenshot | TODO | TODO | Normalized display score |
| `MS-04` | Implemented | Data mutation check | TODO | TODO | Score responds to data changes |
| `MS-05` | Implemented | Fixture/test | TODO | TODO | Cold-start boost path |
| `WF7-01` | Implemented | Screenshot | TODO | TODO | Profile detail sections |
| `WF7-02` | Implemented | Screenshot | TODO | TODO | Reviews section behavior |
| `WF7-03` | Implemented | Screenshot | TODO | TODO | Transparency card |
| `WF7-04` | Implemented | Screenshot | TODO | TODO | Request CTA visible |
| `WF7-05` | Implemented | Screenshot | TODO | TODO | Badges section present |
| `DB-01` | Implemented | Screenshot | TODO | TODO | Active bookings scaffold |
| `DB-02` | Implemented | Screenshot | TODO | TODO | Past bookings scaffold |
| `DB-03` | Implemented | Screenshot | TODO | TODO | Favorites preview + link |
| `DB-04` | Implemented | Screenshot | TODO | TODO | Recent cleaners empty state |
| `FAV-01` | Implemented | Recording | TODO | TODO | Favorite from profile |
| `FAV-02` | Implemented | Recording | TODO | TODO | Unfavorite path |
| `FAV-03` | Implemented | Screenshot | TODO | TODO | Favorites list card layout |
| `FAV-04` | Pending evidence | SQL RLS check | TODO | TODO | Cross-user isolation proof required |
| `CC-GEO-01` | Implemented | Query + UI screenshot | TODO | TODO | Coordinates + distance flow |
| `CC-GEO-02` | Implemented | Job log | TODO | TODO | Backfill script run evidence |
| `CC-UX-01` | Pending evidence | Mobile screenshots | TODO | TODO | ≥360px QA proof required |
| `CC-SEC-01` | Pending evidence | SQL/RLS checks | TODO | TODO | Privacy and RLS validation |
| `CC-RANK-01` | Implemented | Code reference | TODO | TODO | Server-side ranking only |
| `CC-QA-01` | Implemented | Command logs | `corepack pnpm lint`, `corepack pnpm typecheck` | AI+Human | Build still pending |
| `CC-REL-01` | Pending evidence | Deploy SHA/URL | TODO | TODO | Production version proof |
| `CC-E2E-01` | Pending evidence | End-to-end recording | TODO | TODO | Production customer flow |
