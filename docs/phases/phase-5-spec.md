# Phase 5 — Browse, Discovery & Matching

## Goal

A customer can browse active cleaners, filter by ZIP and service type, see a Match Score for each, and view a full cleaner profile with a score breakdown.

No new DB migrations — all tables already exist.

---

## Acceptance criteria

- [ ] `/app` shows a real homepage: service type cards + "Find a Cleaner" CTA
- [ ] `/app/cleaners` lists active cleaners with ZIP + service type filters
- [ ] Each cleaner card shows: name, tier badge, rating, review count, starting rate
- [ ] Cleaners are ranked by Match Score (desc)
- [ ] `/app/cleaners/[id]` shows full profile: bio, services + rates, tier, rating, badges, specialties
- [ ] Match Score breakdown ("Why am I seeing this?") visible on profile page
- [ ] Nav updated: "Find a Cleaner" link added to shell
- [ ] `pnpm lint && pnpm typecheck && pnpm build` all pass

---

## Match Score (6 factors, 100 pts total)

| Factor | Max pts | Source column |
|---|---|---|
| Tier | 25 | `cleaner_profiles.current_tier` |
| Rating | 25 | `cleaner_profiles.average_rating` |
| Reliability | 20 | `cleaner_profiles.current_score` |
| ZIP coverage | 15 | `cleaner_service_zips` |
| Experience | 10 | `cleaner_profiles.review_count` |
| Veteran | 5 | `cleaner_profiles.is_veteran` |

**Tier points:** rising_pro=5, proven_specialist=12, top_performer=20, all_star_expert=25
**Rating points:** `(average_rating / 5) * 25`, rounded. NULL (no reviews) = 0.
**Reliability points:** `(current_score / 100) * 20`, rounded.
**ZIP coverage:** 15 if customer's zip is in `cleaner_service_zips`, else 0. (15 if no ZIP filter applied.)
**Experience points:** `Math.min(review_count, 20) / 20 * 10`, rounded.
**Veteran:** 5 if `is_veteran`, else 0.

---

## Files

### New

| File | Description |
|---|---|
| `src/features/discovery/queries.ts` | `listCleaners`, `getCleanerProfile` |
| `src/features/discovery/scoring.ts` | `computeMatchScore`, `MatchScoreInput` type |
| `src/features/discovery/components/TierBadge.tsx` | Tier pill |
| `src/features/discovery/components/CleanerCard.tsx` | Card in list |
| `src/features/discovery/components/CleanerFilters.tsx` | ZIP + service filter form (client) |
| `src/features/discovery/components/MatchScoreBreakdown.tsx` | Score breakdown table |
| `src/app/(app)/app/cleaners/page.tsx` | List page (server) |
| `src/app/(app)/app/cleaners/[id]/page.tsx` | Profile page (server) |

### Modified

| File | Change |
|---|---|
| `src/app/(app)/app/page.tsx` | Real customer homepage |
| `src/app/(app)/layout.tsx` | Add "Find a Cleaner" nav link |

---

## DB tables used

| Table | Operations | RLS |
|---|---|---|
| `cleaner_profiles` | SELECT | Public read (active cleaners) |
| `users` | SELECT (join) | Public read (full_name only) |
| `cleaner_service_zips` | SELECT | Public read |
| `cleaner_badges` | SELECT | Public read |
| `cleaner_specialties` | SELECT | Public read |
| `specialties` | SELECT | Public read |

All reads via regular server client (anon key + session). No writes in Phase 5.

---

## Definition of done

Phase 5 is complete when all acceptance criteria above are checked.
