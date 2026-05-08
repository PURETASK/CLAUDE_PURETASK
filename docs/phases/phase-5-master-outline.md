# PureTask — Phase 5 Master Outline

**Purpose:** A single navigation document for everything in Phase 5 (browse, discovery, and matching), organized by sub-phase. Goal / Design / Build / Verify format for each section.

**Status:** Outline-level navigation. Detailed acceptance criteria, specific code, and gotchas live in `phase-5-spec.md`. The why-behind-every-decision lives in `phase-5-explainer.md`.

**Phase scope:** A customer can browse and filter cleaners, view profiles with Match Score transparency, and favorite cleaners they like. Match Score algorithm ranks by 6 factors with full transparency. Cold-start mechanism gives new cleaners visibility. By end of Phase 5, the customer-facing discovery experience is complete and ready for Phase 6 booking.

**Phase duration:** 3-4 weeks of focused engineering.

**Phase depends on:**
- Phase 4 complete and verified (cleaners with `cleaner_profiles` rows exist)
- Phase 3a complete (customers have addresses with default set)
- Google Maps API account active with Geocoding API enabled
- At least 5-10 approved test cleaners for meaningful testing

---

## How to read this document

Each sub-phase has the four-heading format:
- **Goal** — what this sub-phase accomplishes in plain English
- **Design** — decisions to make before writing code
- **Build** — concrete files, components, migrations
- **Verify** — how you know it works

---

## Phase 5 sub-phase overview

| Sub-phase | Name | Days | What changes by the end |
|---|---|---|---|
| **0** | External account setup | parallel to Phase 4 | Google Maps API active |
| **5a** | Geocoding setup + backfill | ~3 days | All addresses have lat/lng; new addresses geocode automatically |
| **5b** | Customer homepage + browse list | ~5 days | WF 1 + WF 8 working; filters working; empty/no-coverage states |
| **5c** | Match Score algorithm | ~5 days | Server-side ranking with 6 factors; deterministic; cold-start working |
| **5d** | Cleaner profile + transparency card | ~3 days | WF 7 working; transparency card explains scoring |
| **5e** | Customer dashboard + favorites | ~3 days | WF 11 + WF 25 working; favorites toggle |
| **5f** | Verification + closeout | ~1 day | All criteria verified on production; tagged |

**Total: ~20 working days of code work, plus parallel external setup.**

---

# Section 0 — External account setup

## Goal

Have Google Maps API account active with Geocoding API enabled by the time Phase 5 begins. No business approval needed (unlike Checkr in Phase 4) — just a credit card on file with Google Cloud.

## Design

One decision: which geocoding provider?

| Provider | Pick if... |
|---|---|
| **Google Maps** | You want maximum US accuracy and don't mind GCP setup |
| **Mapbox** | You want transparent pricing and good developer ergonomics |
| **Nominatim (OSM)** | You're prototyping only; not for production |

**Recommendation: Google Maps.** Standard for US marketplaces; free tier covers more than launch volume.

## Build

Minimal code in this section:

```
.env.example additions                                # Document new env vars
docs/integrations/google-maps-setup.md                # Setup notes for future-you
```

Add to `.env.example`:
```
GOOGLE_MAPS_API_KEY=
```

## Verify

- Can sign in to GCP console, see Geocoding API enabled
- API key generated with HTTP referrer + IP allowlist restrictions
- Test API call from local works: `curl "https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway+Mountain+View+CA&key=YOUR_KEY"` returns valid JSON
- Billing enabled (Google requires payment method even for free tier)

---

# Sub-phase 5a — Geocoding setup + address backfill

## Goal

Every address in the database has lat/lng populated. New addresses get coordinates automatically on creation. Distance calculations work.

## Design

Decisions:

1. **Sync vs async geocoding on address creation.** Async is recommended — don't block the user's address-add flow on Google's API response. Pattern: insert address → return success to user → background job fetches coordinates → update row.
2. **Failure handling.** Mark failed addresses with `geocoding_failed_at` timestamp. Daily background job retries failures.
3. **Backfill strategy.** Run a one-time script after migration `0014` ships. Iterate over addresses with NULL lat/lng, geocode, update. Handle rate limits with backoff.

## Build

Database migration:

```
db/migrations/0014_phase5_geocoding_and_browse.sql
```

Migration adds:
- Postgres `earthdistance` extension
- Index on `(latitude, longitude)` for distance queries
- `distance_miles()` SQL helper function
- `cleaner_profiles_public` view (excludes sensitive fields)
- RLS update for `cleaner_profiles` (authenticated users can read approved cleaner public data)

Library code:

```
src/lib/google-maps/
├── client.ts                                 # Maps API client setup
├── geocoding.ts                              # Address → lat/lng
└── places.ts                                 # Optional: autocomplete (Phase 5+ enhancement)
```

Background job:

```
src/server/jobs/backfill-geocoding.ts        # One-time script
```

Update Phase 3a's `createAddress` action to trigger async geocoding after insert.

## Verify

- Apply migration; verify extensions installed
- Run backfill script against dev Supabase; check that test addresses now have lat/lng
- Add a new address through UI; verify lat/lng populates within 5-10 seconds
- Distance function returns sensible values for known address pairs (e.g., NYC to Boston ≈ 215 miles)
- API key restrictions in place

---

# Sub-phase 5b — Customer homepage + cleaner browse list

## Goal

Customer can land on `/` (after Phase 2 auth) and see service catalog + recommended cleaners. Customer can navigate to `/cleaners` and see filterable, sortable list of all cleaners. Empty state and no-coverage state work.

## Design

Decisions:

1. **Pagination vs infinite scroll.** Infinite scroll for mobile-first UX; load 20 cleaners at a time. Pagination acceptable as fallback for accessibility.
2. **Filter UI on mobile.** Desktop: sticky filter sidebar. Mobile: filter sheet (full-screen drawer triggered by "Filters" button).
3. **Default filter values.** Distance: 25 miles (max). Rating: 4.5+. Service type: all. These should match what most customers actually want.
4. **Sort options.** Match Score (default), Distance ascending, Rating descending, Price ascending.

## Build

App routes:

```
src/app/(app)/page.tsx                       # WF 1: Customer homepage
src/app/(app)/cleaners/page.tsx              # WF 8: Cleaner browse list
src/app/(app)/waitlist/page.tsx              # No-coverage fallback
```

Feature module:

```
src/features/discovery/
├── queries.ts                                # Browse query (joins, filters, distance)
├── validation.ts                             # Filter input schemas
├── types.ts                                  # Filter types
└── components/
    ├── HomepageHero.tsx                      # WF 1: hero + service catalog
    ├── ServiceCatalog.tsx                    # 4-service picker
    ├── CleanerCard.tsx                       # Reusable card layout
    ├── CleanerListFilters.tsx                # Filter sidebar/sheet
    └── EmptyStates.tsx                       # No results / no coverage
```

The browse query pattern (in `queries.ts`):
1. Check `serviced_areas` for customer's ZIP. If not active → return no-coverage state.
2. Apply filters as WHERE clauses on `cleaner_profiles_public`
3. Calculate distance from customer's default address to each cleaner's home
4. Filter by max distance
5. Sort (Match Score uses Sub-phase 5c; others are simple ORDER BY)
6. Paginate

## Verify

- Homepage renders for authenticated customer
- Service catalog shows 4 services (Standard, Deep, Move-Out, Airbnb)
- Browse list loads in <2 seconds
- Each filter works in isolation
- Filters combine with AND logic
- Empty state shows for filters with no matches
- No-coverage state shows for customers in unserved ZIP
- Mobile viewport (360px) works without horizontal scroll
- Pagination/infinite scroll works

---

# Sub-phase 5c — Match Score algorithm

## Goal

Server-side ranking algorithm that combines 6 factors into a single Match Score. Deterministic, performant, and never exposed to the client. Powers the default sort on browse list and the transparency card on cleaner profiles.

## Design

Decisions:

1. **Weighting.** Initial weights are educated guesses; tune post-launch with real data:
   - Distance: 40% of base score
   - Tier: 30% of base score
   - Availability: 30% of base score
   - ZIP-locked badge: 1.5x multiplier
   - Specialty match: 1.2x multiplier
   - Cold-start: 1.3x multiplier

2. **Cold-start window.** 60 days from approval AND fewer than 10 completed jobs. Boost ends when either condition fails.

3. **Tiebreakers.** Ties resolved by `total_completed_jobs DESC`, then `created_at ASC`.

4. **Server-side only.** Algorithm never crosses the client boundary.

## Build

```
src/features/discovery/match-score.ts        # The algorithm
src/features/discovery/types.ts              # MatchScoreFactors type
src/features/discovery/components/MatchScoreCard.tsx  # Transparency card
```

Algorithm function signature:
```typescript
function calculateMatchScore(
  cleaner: CleanerProfile,
  customer: CustomerContext,
): MatchScoreFactors {
  // Returns full breakdown with totalScore + per-factor details
}
```

The transparency card consumes `MatchScoreFactors` and renders the breakdown.

## Verify

- Algorithm returns deterministic results (same inputs → same output)
- Distance contribution falls to 0 at 25 miles
- Tier ordering produces visible ranking change
- ZIP-locked badge produces visible ranking change
- Cold-start boost visible (new cleaners rank higher than tier alone would suggest)
- Browse list default sort uses Match Score
- Transparency card displays correct factor breakdown
- Algorithm not visible in browser network tab (only factor results, not weights)

---

# Sub-phase 5d — Cleaner profile + transparency card

## Goal

Each cleaner has a customer-facing profile page accessible at `/cleaners/[id]`. Profile shows full cleaner info plus Match Score transparency card explaining why this cleaner is being shown to this customer.

## Design

Decisions:

1. **What to show in profile.** Photo, name, bio, services + hourly rates, languages, response time, completion rate, total jobs, rating, review count, badges (placeholder), reviews list (Phase 6 will populate).

2. **What NOT to show.** Phone, email, exact home address, payout account info. These are sensitive and live in the non-public `cleaner_profiles` table.

3. **Sticky CTA.** "Request to book" button stays visible as user scrolls. Mobile-friendly.

4. **Reviews handling pre-Phase-6.** Reviews list shows empty state ("No reviews yet — this cleaner is new to PureTask").

## Build

```
src/app/(app)/cleaners/[id]/page.tsx         # Profile page
src/features/discovery/components/
├── CleanerProfileHero.tsx                   # Photo, name, key stats
├── MatchScoreCard.tsx                       # (already built in 5c)
├── CleanerServicesList.tsx                  # Services + rates
├── CleanerStatsBar.tsx                      # Response time, completion rate, etc.
├── ReviewsList.tsx                          # Phase 6 will populate
└── BadgesPlaceholder.tsx                    # Phase 7 will replace
```

## Verify

- Profile renders with all data fields
- Customer-facing read uses `cleaner_profiles_public` view (no sensitive fields)
- Match Score card shows correct breakdown
- Sticky CTA visible on scroll
- Mobile viewport works
- Linking from browse list to profile works
- Back button returns to browse list with filters preserved

---

# Sub-phase 5e — Customer dashboard + favorites

## Goal

Customer has a dashboard at `/dashboard` showing their activity (active bookings, past bookings, favorites, recent cleaners). Can favorite/unfavorite cleaners with optimistic UI updates.

## Design

Decisions:

1. **Dashboard sections.** Active bookings (Phase 6), past bookings (Phase 6), favorites preview (top 3), recent cleaners (Phase 6 booking history). Most are empty pre-Phase-6 — that's expected.

2. **Favorites is hard delete.** Unlike addresses (soft delete), favorites use DELETE FROM. Simpler toggle UX, not audit-relevant.

3. **Optimistic UI.** When user clicks heart, UI updates immediately, server call happens in background. If server fails, revert and show error toast.

4. **Cut decision.** If Phase 5 runs long, cut favorites first. Dashboard alone is more valuable.

## Build

Database migration:

```
db/migrations/0015_phase5_customer_favorites_rls.sql
```

App routes:

```
src/app/(app)/dashboard/page.tsx             # WF 11
src/app/(app)/favorites/page.tsx             # WF 25
```

Feature module additions:

```
src/features/customer/dashboard/
├── DashboardHero.tsx
├── PastBookingsList.tsx                     # Phase 6 populates
├── RecentCleanersList.tsx                   # Phase 6 populates
└── FavoritesPreview.tsx

src/features/discovery/
├── actions.ts                                # toggleFavorite
└── components/
    └── FavoriteButton.tsx                    # Heart icon toggle
```

Add `FavoriteButton` to:
- Cleaner profile page (5d)
- Cleaner cards in browse list (5b)

## Verify

- Dashboard renders with all sections (most empty pre-Phase-6)
- Heart toggle works on profile and cards
- Optimistic UI feels instant
- Favorites list renders correctly
- Unfavorite removes cleaner
- RLS: customer cannot see another's favorites

---

# Sub-phase 5f — Verification + closeout

## Goal

Phase 5 is verified end-to-end on production with a real test customer. Tag `phase-5-complete`.

## Build

```
docs/phases/phase-5-progress-update.md
```

## Verify

Walk through the full customer journey on production:

1. Sign up fresh test customer
2. Add service address (Phase 3a flow)
3. Land on homepage — see service catalog and recommendations
4. Browse cleaners — apply filters, see ranking change
5. Click cleaner profile — see transparency card
6. Favorite the cleaner
7. Navigate to dashboard — see favorite preview
8. "Request to book" CTA — link to Phase 6 (placeholder if not yet built)

If any step fails, Phase 5 is not done.

---

# Cross-cutting concerns

## CC1 — Match Score is server-side only

Algorithm never exposed to the client. Cleaners can't reverse-engineer.

## CC2 — Sensitive fields excluded from public view

Customer-facing reads use `cleaner_profiles_public` view. Direct table access is for cleaner-self-read and admin only.

## CC3 — Mobile-first

All customer UI works at 360px viewport.

## CC4 — Performance budget

Browse query under 500ms server-side. If exceeded at launch volume, profile and tune (don't pre-optimize).

## CC5 — Geocoding async, not blocking

Address creation never blocks on Google Maps response. Background job handles failures.

## CC6 — Empty states distinct from no-coverage states

Two different conditions, two different UX. Don't conflate.

---

# Open questions for review

1. **Initial Match Score weights.** Are 0.4/0.3/0.3 for base factors and 1.5/1.2/1.3 for multipliers reasonable? These will get tuned post-launch with real data; this is just first-pass.

2. **Cold-start window.** 60 days + 10 jobs. Reasonable, or different threshold?

3. **Browse default filter values.** Distance 25mi, rating 4.5+ — match what most customers want?

4. **Cut favorites if needed.** If Phase 5 runs long, cut favorites and ship dashboard-only? Recommended yes; favorites can be Phase 5.5.

5. **Geocoding service.** Recommended Google Maps. Acceptable, or prefer Mapbox?

---

# What we'll produce after this outline is approved

(Already approved if you're reading this — this outline is the answer to "what does Phase 5 contain?")

The Phase 5 explainer document is the next document. Walks through the spec section-by-section in plain English with beginner-friendly explanations.

Phase 5 detailed sub-phase specs don't need to exist separately. The phase-5-spec.md covers them at the right level.
