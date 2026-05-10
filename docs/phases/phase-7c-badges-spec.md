# Phase 7c — Badges Specification (ZIP-Locked + Specialty)

> **Author note (transparency):** This spec is being written ahead of when Phase 7c will actually be built. The spec is correct as of the current date but will need a refresh when implementation actually starts, particularly for: badge threshold tuning based on real cleaner distribution, decay rule UX feedback (cleaners losing badges = sensitive), and Phase 5 Match Score multiplier validation. Treat this as an aggressive draft.

**Phase goal:** Two parallel badge systems wired and visible. ZIP-locked badges (Top-rated in [ZIP], Trusted by neighbors in [ZIP], Customer favorite in [ZIP]) reward sustained local excellence. Specialty badges (Eco-friendly, Pet-friendly, Move-out specialist, Airbnb expert, Allergen-aware, On-time pro) reward customer-confirmed traits. Both display on cleaner cards (Phase 5) and profile (WF 7) with priority logic. Phase 5 Match Score consumes badge data.

**Estimated duration:** ~2 weeks of focused engineering (10 working days).

**Depends on:**
- Phase 7a complete (`reliability_score_snapshots`, `tier_assignments` populated)
- Phase 6f complete (reviews + review_traits exist)
- Phase 6g complete (recurring_schedules exist for "Customer favorite" badge)
- Phase 4 cleaner specialties self-listed (`cleaner_specialties` populated)
- B4 schema deployed (`badges`, `cleaner_badges` tables)

**Wireframes covered:** WF 65 (ZIP-locked badge detail), WF 66 (specialty endorsement detail), WF 7 (cleaner profile badges section).

**Phase 7c sub-sections (mostly parallel within 7c):**

- **7c-1** — ZIP-locked badge system (~4 days)
- **7c-2** — Specialty badge system (~3 days)
- **7c-3** — Badge display integration with Phase 5 + WF 7 (~2 days)
- **Closeout + integration** (~1 day)

---

## 0. External account prerequisites

Phase 7c has **no new vendors.** Pure application logic + cron scheduling.

### 0.1 Verify cron infrastructure

Phase 7c adds 2 new daily crons. Verify Vercel Cron / pg_cron capacity. Don't overload.

### 0.2 No lawyer items

Badges inherit Phase 5 lawyer-reviewed copy. No new lawyer items.

---

## 1. Summary

Phase 7c is **the recognition layer.** Concretely, by the end of Phase 7c:

1. **ZIP-locked badges work.** Daily cron evaluates each cleaner's per-ZIP performance. Awards badges based on locked thresholds. 6-month re-evaluation.

2. **Specialty badges work.** Daily cron checks self-listed specialty + customer trait tagging. Awards badge when criteria met. 90-day decay rule.

3. **Badges display on cleaner cards (Phase 5) and profile (WF 7).** Top 3 prioritized: ZIP-matching badge first, specialty badge for customer's selected service, then by recency.

4. **WF 65 + WF 66 detail pages live.** Badge detail explains earning criteria + cleaner's qualifying stats.

5. **Phase 5 Match Score consumes badge data.** ZIP-matching badge = 1.5x multiplier. Specialty matching customer's service = 1.2x.

6. **6 specialty types locked + 3 ZIP-locked types locked.** No mid-flight additions.

What Phase 7c does NOT do:
- Badge creation by admin (defer to Phase 11 if custom badges needed)
- Cleaner-self-grants (badges are earned, not claimed)
- Tier-based badge variants (defer)

---

## 2. Acceptance criteria

### 7c-1 ZIP-locked badges

- [ ] Daily cron at 5 AM Pacific (after Phase 7a tier eval) evaluates ZIP badges
- [ ] **Top-rated in [ZIP]**: 25+ cleanings in ZIP + 4.7+ avg rating + active last 90 days
- [ ] **Trusted by neighbors in [ZIP]**: 10+ cleanings + 4.5+ avg rating
- [ ] **Customer favorite in [ZIP]**: 5+ active recurring relationships in ZIP
- [ ] Same cleaner can hold multiple ZIP-locked badges (one per ZIP active in)
- [ ] Profile shows top 3 ZIP-locked badges by recency
- [ ] Each badge has `expires_at = earned_at + 6 months`
- [ ] At expiry, re-evaluate; renew if criteria met; end if not
- [ ] WF 65 detail page shows: badge type, ZIP scope, earning criteria, cleaner's qualifying stats

### 7c-2 Specialty badges

- [ ] 6 specialty types: eco_friendly, pet_friendly, move_out, airbnb, allergen_aware, on_time_pro
- [ ] Earning criteria: cleaner self-listed in `cleaner_specialties` AND 15+ reviews tagged matching trait
- [ ] Daily cron at 5:30 AM Pacific evaluates specialty badges
- [ ] Decay: rolling 90-day window. If recent reviews don't continue tagging at sufficient rate, badge fades
- [ ] Specialty applies platform-wide (not ZIP-locked)
- [ ] WF 66 detail page shows: specialty icon + name, earning criteria, cleaner's tagging count

### 7c-3 Badge display integration

- [ ] Cleaner card top 3 priority:
  - ZIP-matching badge for customer's current ZIP (if applicable) — highest priority
  - Specialty matching customer's selected service
  - General badges by recency
- [ ] Cleaner profile (WF 7) shows ALL active badges grouped: ZIP-locked first, then specialty
- [ ] Tap badge on card → opens WF 65 (ZIP) or WF 66 (specialty) detail
- [ ] Phase 5 Match Score multipliers active:
  - ZIP-matching badge: 1.5x
  - Specialty matching service: 1.2x
- [ ] Badge query performance: <50ms p95 per cleaner card render

### Cross-cutting

- [ ] All Phase 7c code has unit tests; coverage ≥80%
- [ ] RLS: anyone can read cleaner_badges (public for browsing); cleaner reads own (auditing earning); admin all
- [ ] Both crons run reliably for 14 consecutive days post-deploy
- [ ] Performance: 1000-cleaner ZIP eval <3 minutes; specialty eval <3 minutes

---

## 3. Database state required

### Existing tables

- `badges` (B4) — badge type registry
- `cleaner_badges` (B4) — cleaner ↔ badge join
- `cleaner_specialties` (B4) — self-listed specialties
- `review_traits` (Phase 6f) — customer trait tagging
- `recurring_schedules` (Phase 6g) — for "Customer favorite" detection

### New migrations (Phase 7c)

```sql
-- Phase 7c migration

-- ZIP scope on cleaner_badges
ALTER TABLE cleaner_badges
  ADD COLUMN IF NOT EXISTS zip_code TEXT;
CREATE INDEX IF NOT EXISTS idx_cleaner_badges_zip
  ON cleaner_badges (cleaner_id, zip_code)
  WHERE zip_code IS NOT NULL;

-- Earning + expiry timestamps (verify in B4)
ALTER TABLE cleaner_badges
  ADD COLUMN IF NOT EXISTS earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE cleaner_badges
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE cleaner_badges
  ADD COLUMN IF NOT EXISTS last_evaluated_at TIMESTAMPTZ;
ALTER TABLE cleaner_badges
  ADD COLUMN IF NOT EXISTS qualifying_stats JSONB DEFAULT '{}'::JSONB;
-- Stats: {cleanings_count, avg_rating, recurring_count, trait_tag_count, etc}

-- Active status
ALTER TABLE cleaner_badges
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_cleaner_badges_active
  ON cleaner_badges (cleaner_id) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_cleaner_badges_expiring
  ON cleaner_badges (expires_at) WHERE expires_at IS NOT NULL AND active = TRUE;
```

### Seed data — badge types

```sql
-- ZIP-locked badge types
INSERT INTO badges (key, name, type, icon) VALUES
  ('top_rated_zip', 'Top-rated', 'zip_locked', '⭐'),
  ('trusted_by_neighbors_zip', 'Trusted by neighbors', 'zip_locked', '🏘️'),
  ('customer_favorite_zip', 'Customer favorite', 'zip_locked', '💚')
ON CONFLICT (key) DO NOTHING;

-- Specialty badge types
INSERT INTO badges (key, name, type, icon) VALUES
  ('eco_friendly', 'Eco-friendly', 'specialty', '🌿'),
  ('pet_friendly', 'Pet-friendly', 'specialty', '🐈'),
  ('move_out_specialist', 'Move-out specialist', 'specialty', '📦'),
  ('airbnb_expert', 'Airbnb expert', 'specialty', '🏠'),
  ('allergen_aware', 'Allergen-aware', 'specialty', '🤧'),
  ('on_time_pro', 'On-time pro', 'specialty', '⏰')
ON CONFLICT (key) DO NOTHING;
```

---

## 4. Files to create

### App routes (~2 files)

- `/app/cleaner-badges/[badge_id]/page.tsx` — WF 65 / WF 66 detail (route handles both types)
- `/app/api/cleaner-badges/[cleaner_id]/route.ts` — GET cleaner's active badges

### Components (~4 files)

- `/features/badges/components/BadgeRow.tsx` — single badge display
- `/features/badges/components/BadgeGrid.tsx` — multiple badges (WF 7 profile)
- `/features/badges/components/BadgeDetailZipLocked.tsx` — WF 65
- `/features/badges/components/BadgeDetailSpecialty.tsx` — WF 66

### Library code (~6 files)

- `/lib/reliability/zip_badge_calculator.ts` — pure function: cleaner + ZIP → eligible badges
- `/lib/reliability/specialty_badge_calculator.ts` — pure function: cleaner → eligible specialties
- `/lib/reliability/badge_decay_check.ts` — 90-day rolling decay for specialties
- `/lib/reliability/badge_expiry_handler.ts` — 6-month renewal for ZIP badges
- `/lib/reliability/badge_priority_sorter.ts` — top 3 priority for cleaner card
- `/lib/reliability/badge_match_score_multiplier.ts` — Phase 5 integration

### Server actions (~2 files)

- `/app/api/badges/types/route.ts` — GET all badge type definitions
- `/app/api/cleaner/[id]/badges/route.ts` — GET cleaner's badges with filtering

### Background jobs (~2 files)

- `/jobs/zip_badge_evaluator.ts` — daily 5 AM Pacific cron
- `/jobs/specialty_badge_evaluator.ts` — daily 5:30 AM Pacific cron

### Phase 5 integration

Modify Phase 5 cleaner card + Match Score:
- Cleaner card uses Phase 7c badge data via `BadgeRow` / `BadgeGrid`
- Match Score reads badge data; applies 1.5x / 1.2x multipliers

### Database migrations (1 file)

- `migrations/2026XXXXXX_phase_7c_schema.sql`

### Docs (3 files)

- (Phase 7 overview already exists)
- `phase-7c-badges-spec.md` — this file
- `phase-7c-badges-walkthrough.md`

---

## 5. Implementation order

### 7c-1 — ZIP-locked badges (~4 days)

**Day 1 — Schema + seed badge types.** Migration. Insert badge type rows. Test.

**Day 2 — ZIP badge calculator.** Build `lib/reliability/zip_badge_calculator.ts`. Unit test all 3 badge types with synthetic cleaner data.

**Day 3 — ZIP badge cron.** Build `jobs/zip_badge_evaluator.ts`. Daily 5 AM Pacific. Test on staging cleaners.

**Day 4 — 6-month expiry handler.** Build `lib/reliability/badge_expiry_handler.ts`. Re-evaluate at expiry; renew if criteria met.

### 7c-2 — Specialty badges (~3 days)

**Day 5 — Specialty badge calculator.** Build `lib/reliability/specialty_badge_calculator.ts`. Reads `cleaner_specialties` + counts `review_traits`.

**Day 6 — Specialty badge cron.** Build `jobs/specialty_badge_evaluator.ts`. Daily 5:30 AM Pacific.

**Day 7 — Decay logic.** Build `lib/reliability/badge_decay_check.ts`. Rolling 90-day window check.

### 7c-3 — Display integration (~2 days)

**Day 8 — Components + WF 65 / WF 66.** Build `BadgeRow`, `BadgeGrid`, detail pages.

**Day 9 — Phase 5 integration.** Wire `BadgeRow`/`BadgeGrid` into Phase 5 cleaner cards. Match Score multipliers active.

### Closeout (~1 day)

**Day 10 — End-to-end testing.** Full flow: cleaner accumulates qualifying performance → cron awards → display on profile + cleaner card → Match Score boost.

---

## 6. Specific gotchas

### Gotcha A — Cleaner active in many ZIPs

**The problem:** Cleaner serves 8 ZIPs. Earns Top-rated in 3, Trusted in 5. Profile shows all 8 — overwhelming.

**The fix:** Cleaner profile shows top 3 by recency or relevance to viewing customer. Cleaner card shows 1 (best match for customer's ZIP).

### Gotcha B — Specialty badge whiplash

**The problem:** Cleaner barely meets 15-tag threshold. Loses 1 tag (90-day decay). Badge fades. Customer who saw badge 2 weeks ago confused.

**The fix:** Decay grace period: 105 days instead of 90 (15-day buffer). Once badge faded, must rebuild from scratch.

### Gotcha C — New cleaner can't earn ZIP badge

**The problem:** New cleaner takes months to reach 25 cleanings in any single ZIP. Discouraging.

**The fix:** Tiered approach: Trusted by neighbors (10 cleanings) is the entry-level badge. Top-rated (25 cleanings) is aspirational. Customer favorite (5 recurring) is achievable for relationship-builders.

### Gotcha D — Recurring customer in different ZIP

**The problem:** Customer favorite requires "5+ active recurring relationships in ZIP." Customer's recurring is at their address, but they have second home in different ZIP. Counts in which ZIP?

**The fix:** Counts in the address ZIP. If customer has bookings in both ZIPs, both might qualify. Phase 6g schedule's address determines.

### Gotcha E — Badge calculator slow on large cleaners

**The problem:** Cleaner with 500+ historical bookings + 50+ reviews + 10 active recurring. Eval slow.

**The fix:** Cache aggregate counts on `cleaner_profiles.cached_metrics JSONB`. Refresh during eval. Don't re-aggregate from scratch.

### Gotcha F — Phase 5 Match Score multiplier cascade

**The problem:** Customer's ZIP matches cleaner's Top-rated badge (1.5x). Customer's service matches cleaner's Eco-friendly specialty (1.2x). Multiplied = 1.8x. Score inflates.

**The fix:** Multipliers don't compound. Apply max single multiplier. Document.

### Gotcha G — Badge eval during cleaner suspension

**The problem:** Cleaner suspended for misconduct. Cron still runs; awards badge. Customer sees inappropriate badge on suspended cleaner.

**The fix:** Eval cron skips cleaners with `cleaner_suspensions.active = TRUE`. Suspended cleaners' active badges marked `active = FALSE` until reinstated.

### Gotcha H — Trait tag inflation from Phase 6f

**The problem:** Customer ticks all 11 trait tags every review (Phase 6f Lock). Specialty badges become meaningless.

**The fix:** Phase 6f enforces max 4 tags per review. Phase 7c trusts that constraint.

---

## 7. Testing strategy

### Unit tests
- `lib/reliability/zip_badge_calculator.ts`: each threshold (24/25/26 cleanings, 4.6/4.7/4.8 ratings)
- `lib/reliability/specialty_badge_calculator.ts`: 14/15/16 trait tags
- `lib/reliability/badge_decay_check.ts`: 90-day rolling window edges
- `lib/reliability/badge_priority_sorter.ts`: priority ordering

### Integration tests
- Synthetic cleaner with 26 cleanings + 4.8 in 94110 → Top-rated 94110 awarded
- Cleaner with eco_friendly self-listed + 16 trait tags → Eco-friendly badge
- 90 days no eco trait tags → badge fades

### Manual QA
- Real cleaner data on staging
- Cleaner card shows correct top 3 for different customer ZIPs
- Match Score multiplier verified

---

## 8. Deployment plan

### Pre-deploy
- [ ] Migrations applied
- [ ] Badge type seed data inserted
- [ ] Phase 7a operational (score data available)
- [ ] Phase 6f reviews + traits flowing
- [ ] Cron infrastructure stable

### Deployment order
1. Migrations + seed data
2. Library code
3. Crons (ZIP eval + specialty eval)
4. UI components
5. Phase 5 integration
6. Soft launch: 7 days monitoring

### Rollback
- App code revert if bugs surface
- Don't roll back schema (badge history)
- Crons can pause independently

---

## 9. Phase 7c → handoff

Phase 7c is largely terminal — outputs consumed by Phase 5 (Match Score) and customer browsing experience. No further phases depend on it.

Phase 7c closes Phase 7 sub-phases.

---

## 10. Open questions

1. **Multiplier compounding policy.** Recommend max single. Lock.
2. **ZIP badge minimum cleanings.** 25/10/5 thresholds locked. Re-evaluate post-launch with real data.
3. **Decay grace period.** Recommend 105 days (15-day buffer). Lock.
4. **Custom badges via admin.** Defer to Phase 11+.

---

This spec is the canonical Phase 7c build reference. Walkthrough lives in `phase-7c-badges-walkthrough.md`.
