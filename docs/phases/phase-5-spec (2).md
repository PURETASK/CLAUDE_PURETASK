# Phase 5 — Browse, Discovery, and Matching Specification

> **Author note (transparency):** This spec is being written ahead of when Phase 5 will actually be built — at minimum 4-5 weeks from now (after Phase 3a + Phase 4 complete). The spec is correct as of the current date but will need a refresh when implementation actually starts, particularly for: geocoding service choice (Google Maps vs Mapbox vs alternatives), Match Score weighting tuning based on real cleaner data, and the cold-start mechanism behavior with actual cleaner volume. Treat this document as an **aggressive draft**.

**Phase goal:** A customer can browse, filter, and view cleaner profiles. The Match Score algorithm ranks cleaners by 6 factors with full transparency. New cleaners get a cold-start boost. By end of Phase 5, the customer-facing discovery experience is complete and ready for Phase 6 booking.

**Estimated duration:** 3-4 weeks of focused work.

**Depends on:**
- Phase 4 complete (cleaners exist with `cleaner_profiles` rows)
- Phase 3a complete (customers have addresses with default set)
- Geocoding service account active (Google Maps API or Mapbox — see Section 0)
- At least 5-10 approved test cleaners in the database for meaningful testing

**Wireframes covered:** WF 1 (customer homepage), WF 7 (cleaner profile, customer-facing), WF 8 (cleaner list — the heavy filtering query), WF 11 (customer dashboard), WF 25 (customer favorites — lightweight, defer-friendly).

**Critical structural note:** Phase 5 has **5 logical sub-phases**. They run mostly in sequence with some natural overlap.

- **5a** — Geocoding service setup + address backfill (you, manual + small code)
- **5b** — Customer homepage + cleaner browse list (WF 1 + WF 8)
- **5c** — Match Score algorithm + ranking
- **5d** — Cleaner profile page (customer-facing) + transparency card (WF 7)
- **5e** — Customer dashboard + favorites (WF 11 + WF 25)
- **5f** — Phase verification + closeout

---

## 0. External account prerequisites

Lighter than Phase 4. One service to set up: **a geocoding provider.**

### 0.1 Geocoding service choice

Three reasonable options:

| Provider | Pros | Cons |
|---|---|---|
| **Google Maps Platform** | Most accurate US addresses, large free tier, high rate limits | Requires billing-enabled GCP account, can get expensive at scale |
| **Mapbox** | Pricing transparent, generous free tier, good API ergonomics | Slightly less accurate for some US addresses |
| **Nominatim (OpenStreetMap)** | Free, no API key needed | Rate-limited heavily, less reliable for production |

**Recommendation:** Google Maps Geocoding API. It's the standard for US marketplace platforms, the free tier covers significantly more than launch volume will need, and accuracy on US addresses is best in class. You'll need to set up a Google Cloud Platform account if you don't have one.

Setup steps:
- Create GCP project at console.cloud.google.com
- Enable Geocoding API and (optionally) Places API for autocomplete
- Generate API key with appropriate restrictions (HTTP referrer + IP allowlist)
- Add billing (Google requires a payment method even for free tier usage)
- Save key to `.env.local` and Vercel: `GOOGLE_MAPS_API_KEY=...`

**Time cost:** 1-2 hours of your time. No business approval timeline.

### 0.2 Optional: Places Autocomplete API

If you want address autocomplete in the address form (Phase 3a built it without autocomplete), enable Places API in the same GCP project. This is a Phase 5 enhancement, not strictly required.

### 0.3 No lawyer items block Phase 5

Unlike Phase 4, Phase 5 has minimal legal exposure. Match Score transparency copy is product copy, not legal copy. Continue lawyer engagement on the remaining Phase 4 items in parallel.

---

## 1. Summary

After Phase 4, the database has approved cleaners with `cleaner_profiles` rows. After Phase 3a, customers have addresses. **But customers cannot find cleaners yet.** Phase 5 is the bridge.

Three core capabilities by end of Phase 5:

1. **Customer homepage with service catalog** (WF 1) — landing page for authenticated customers showing services, recent bookings, and personalized recommendations
2. **Cleaner browse list** (WF 8) — the heavy query: filter by service type, distance, rating, price; rank by Match Score
3. **Cleaner profile page** (WF 7) — single cleaner view with bio, services, reviews, and "Why am I seeing this cleaner?" transparency card

Plus two supporting deliverables:

4. **Customer dashboard** (WF 11) — landing page for active customers with bookings, favorites, recent cleaners
5. **Favorites management** (WF 25) — lightweight, can be cut if Phase 5 runs long

The Match Score algorithm is the technical centerpiece of Phase 5. It ranks cleaners by 6 factors:

1. Distance from customer's service address
2. Tier (higher tier ranks higher, but doesn't dominate)
3. Availability (matches customer's requested window)
4. ZIP-locked badge match (huge boost if cleaner has badge for customer's ZIP)
5. Specialty match (deep-clean specialists for deep-clean bookings)
6. New cleaner spotlight boost (cold-start mechanism)

Every cleaner profile shows a transparency card explaining which factors contributed to their score for the current customer. This is a deliberate trust signal — reduces "shadow algorithm" anxiety on both sides.

---

## 2. Acceptance criteria

A real test customer must be able to do all of the following on production URL:

### Customer homepage (WF 1)
- [ ] Authenticated customer landing page renders with service catalog (Standard, Deep, Move-Out, Airbnb Turnover)
- [ ] Recent bookings section shows last 3 bookings (empty state for new customers)
- [ ] Recommended cleaners section shows top 3 cleaners by Match Score for the customer's default address
- [ ] "Browse all cleaners" CTA navigates to cleaner list

### Cleaner list (WF 8)
- [ ] List loads in under 2 seconds for typical query (default filters, customer's home ZIP)
- [ ] Filter by service type (multi-select)
- [ ] Filter by maximum distance (5/10/15/25 mi)
- [ ] Filter by minimum rating (4.5+, 4.7+, 4.9+)
- [ ] Filter by price range (hourly rate)
- [ ] Filter by availability window
- [ ] Sort by Match Score (default), distance, rating, price
- [ ] Each cleaner card shows: name, photo, rating, hourly rate, distance, top 3 specialties, "Available [day]" badge
- [ ] Empty state when no cleaners match filters: "No cleaners match. Try widening your distance or relaxing filters."
- [ ] No-coverage state when customer is in unserved ZIP: "We're not in your ZIP yet. Join the waitlist to be notified."

### Match Score algorithm
- [ ] All 6 factors implemented and producing scores
- [ ] Match Score is deterministic (same inputs always produce same score)
- [ ] Match Score range is normalized (0-100 or similar)
- [ ] Scores update when cleaner data changes (tier change, ZIP-locked badge added, etc.)
- [ ] New cleaner cold-start boost implemented (first 10 jobs get visibility boost)

### Cleaner profile (WF 7)
- [ ] Profile page renders with: photo, name, bio, services offered, hourly rates, languages, response time, completion rate, total jobs, rating, review count
- [ ] Reviews section shows last 5 reviews (Phase 6f data; can be empty pre-Phase-6)
- [ ] "Why am I seeing this cleaner?" transparency card explains each factor's contribution
- [ ] Sticky CTA: "Request to book" button always visible (even on scroll)
- [ ] Cleaner badges shown (Background Checked, ZIP-Locked, Insurance Verified — Phase 7 territory; placeholders for now)

### Customer dashboard (WF 11)
- [ ] Active bookings section (Phase 6 will populate; empty pre-Phase-6)
- [ ] Past bookings section
- [ ] Favorites section (links to favorites management)
- [ ] Recent cleaners section (cleaners customer has previously booked)

### Favorites (WF 25 — can be cut if Phase 5 runs long)
- [ ] Customer can favorite a cleaner from profile page
- [ ] Customer can unfavorite from profile or favorites list
- [ ] Favorites list shows favorited cleaners with same card layout as browse list
- [ ] Favorites are scoped to customer (RLS enforced)

### Cross-cutting
- [ ] Geocoding works: customer's address has lat/lng populated; cleaner's home address has lat/lng populated; distance calculations work
- [ ] Backfill script populates lat/lng for any pre-Phase-5 addresses
- [ ] All UI renders mobile-first (≥360px viewport)
- [ ] RLS prevents customer from seeing data they shouldn't (cleaner profile is public to authenticated users; cleaner contact info is private)
- [ ] Server-side ranking — Match Score never computed client-side
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` all pass
- [ ] Production deploy serves correct version
- [ ] Test customer can go from `/` → browse list → click cleaner profile → view transparency card on production

---

## 3. Database state required

### Existing tables (no schema changes)

- `cleaner_profiles` — populated by Phase 4
- `addresses` — populated by Phase 3a
- `customer_profiles` — populated by Phase 3a
- `cleaner_specialties` — populated by Phase 4 (cleaner skill tags)
- `serviced_areas` — Phase 5 may populate this if it isn't already
- `waitlist_signups` — for unserved ZIP fallback
- `customer_favorites` — for WF 25

### New migrations

#### `db/migrations/0014_phase5_geocoding_and_browse.sql`

This migration:

1. **Backfill geocoding for existing addresses.** For any addresses where `latitude` or `longitude` is NULL, this migration leaves them — application code (Section 5a) handles backfill via API calls. Migration just documents the gap.

2. **Postgres extensions for geo queries:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;
   ```
   `earthdistance` provides simple lat/lng distance calculations without requiring full PostGIS. Sufficient for marketplace ranking (we don't need polygons or routing).

3. **Index on cleaner home address coordinates** for efficient distance queries:
   ```sql
   CREATE INDEX idx_addresses_coordinates 
   ON addresses USING gist (ll_to_earth(latitude, longitude))
   WHERE deleted_at IS NULL AND latitude IS NOT NULL;
   ```

4. **Helper function for distance calculation:**
   ```sql
   CREATE OR REPLACE FUNCTION distance_miles(lat1 FLOAT, lng1 FLOAT, lat2 FLOAT, lng2 FLOAT)
   RETURNS FLOAT AS $$
     SELECT (earth_distance(ll_to_earth(lat1, lng1), ll_to_earth(lat2, lng2)) / 1609.34)::FLOAT;
   $$ LANGUAGE SQL IMMUTABLE;
   ```

5. **RLS update for `cleaner_profiles`.** Phase 4's cleaner_profiles RLS only allowed cleaner to read own + admin to read all. Phase 5 needs customer-facing read access:
   ```sql
   CREATE POLICY "authenticated users can read approved cleaner profiles"
   ON cleaner_profiles FOR SELECT
   USING (
     auth.role() = 'authenticated' AND
     deleted_at IS NULL AND
     EXISTS (SELECT 1 FROM cleaner_applications WHERE cleaner_profile_id = cleaner_profiles.id AND state = 'approved')
   );
   ```
   This grants any authenticated user (customer) the right to read approved cleaner profiles. **Sensitive fields like phone/email/exact home address must NOT be in this read** — handle via SELECT column scoping in application code or a public view.

6. **`cleaner_profiles_public` view** (recommended pattern):
   ```sql
   CREATE VIEW cleaner_profiles_public AS
   SELECT id, user_id, display_name, bio, languages, hourly_rates, photo_url,
          tier, average_rating, total_completed_jobs, response_time_avg_minutes,
          completion_rate_pct, current_zip_locked_badges, specialties
     -- DELIBERATELY EXCLUDED: phone, email, exact_home_address, payout_account_id
   FROM cleaner_profiles
   WHERE deleted_at IS NULL;
   ```
   Customer-facing queries use this view. Internal admin queries use the table directly.

#### `db/migrations/0015_phase5_customer_favorites_rls.sql`

RLS policies for `customer_favorites`:

- SELECT: customer reads own favorites
- INSERT: customer favorites a cleaner (their `customer_user_id`)
- DELETE: customer unfavorites their own favorite (Phase 5 uses hard delete here — favorites aren't audit-relevant)

---

## 4. Files to create

Smaller file count than Phase 4 (~30 files vs ~55). Organized by sub-phase.

### App routes — Customer-facing browse (~6 files)

```
src/app/(app)/page.tsx                                # WF 1: Customer homepage
src/app/(app)/cleaners/page.tsx                       # WF 8: Cleaner browse list
src/app/(app)/cleaners/[id]/page.tsx                  # WF 7: Cleaner profile
src/app/(app)/dashboard/page.tsx                      # WF 11: Customer dashboard
src/app/(app)/favorites/page.tsx                      # WF 25: Favorites list
src/app/(app)/waitlist/page.tsx                       # Unserved ZIP fallback
```

The `(app)/` route group already exists from Phase 2/3a. Phase 5 adds these new pages within it.

### Feature module — Discovery (~12 files)

```
src/features/discovery/
├── actions.ts                                        # Toggle favorite, etc.
├── queries.ts                                        # Cleaner browse queries
├── validation.ts                                     # Filter input schemas
├── types.ts                                          # Filter types, ranking types
├── match-score.ts                                    # The Match Score algorithm
├── geocoding.ts                                      # Google Maps wrapper
└── components/
    ├── HomepageHero.tsx                              # WF 1: hero/service catalog
    ├── ServiceCatalog.tsx                            # 4-service picker
    ├── CleanerCard.tsx                               # Reusable card for browse list
    ├── CleanerListFilters.tsx                        # Filter sidebar/sheet
    ├── CleanerProfileHero.tsx                        # WF 7: profile header
    ├── MatchScoreCard.tsx                            # "Why am I seeing this cleaner?"
    ├── ReviewsList.tsx                               # Reviews on cleaner profile
    └── FavoriteButton.tsx                            # Heart toggle component
```

### Feature module — Customer dashboard (~4 files)

```
src/features/customer/dashboard/
├── DashboardHero.tsx                                 # Welcome + active bookings
├── PastBookingsList.tsx                              # Phase 6 will populate
├── RecentCleanersList.tsx                            # Cleaners booked before
└── FavoritesPreview.tsx                              # Top 3 favorites with link
```

### Library code (~3 files)

```
src/lib/google-maps/
├── client.ts                                         # Google Maps API wrapper
├── geocoding.ts                                      # Address → lat/lng
└── places.ts                                         # Optional: autocomplete
```

### Background jobs (1 file)

```
src/server/jobs/backfill-geocoding.ts                 # One-time job to backfill addresses
```

This is a script that runs once after migration `0014` ships. Iterates over addresses with NULL lat/lng, calls Google Maps Geocoding API, populates the columns. Handles rate limits and failures gracefully.

### Database migrations (2 files)

```
db/migrations/0014_phase5_geocoding_and_browse.sql
db/migrations/0015_phase5_customer_favorites_rls.sql
```

### Types (regenerated)

```
src/types/database.types.ts                           # Regenerate after migrations
```

### Docs (3 files)

```
docs/phases/phase-5-spec.md                           # This document
docs/phases/phase-5-explainer.md                      # Plain-English breakdown
docs/phases/phase-5-progress-update.md                # End-of-phase doc
```

---

## 5. Implementation order

### Sub-phase 5a — Geocoding setup + backfill (~3 days)

The dependency layer for everything else. Without coordinates, distance ranking is impossible.

**Steps:**

1. Set up Google Maps API account (Section 0.1)
2. Add API key to `.env.local` and Vercel
3. Apply migration `0014_phase5_geocoding_and_browse.sql`
4. Build `src/lib/google-maps/client.ts` and `src/lib/google-maps/geocoding.ts`
5. Build `backfill-geocoding.ts` script
6. Run backfill against dev Supabase — populate lat/lng for all existing addresses
7. Update Phase 3a's `createAddress` action: after insert, async-fetch lat/lng and update the row
8. Verify in dev: a new address gets lat/lng populated within ~5 seconds of creation

**Verify 5a:**
- Existing addresses have lat/lng populated
- New addresses get lat/lng populated automatically
- API key restrictions in place (HTTP referrer + IP allowlist)
- Distance calculation function returns sensible values for known addresses

### Sub-phase 5b — Customer homepage + cleaner browse list (~5 days)

The biggest UI surface in Phase 5.

**Steps:**

1. Build `src/app/(app)/page.tsx` — homepage with service catalog
2. Build `HomepageHero` and `ServiceCatalog` components
3. Build `src/app/(app)/cleaners/page.tsx` — browse list page
4. Build `CleanerListFilters` (filter UI for service type, distance, rating, price, availability)
5. Build `CleanerCard` (reusable card layout)
6. Build server-side query in `queries.ts` — joins addresses, applies filters, returns paginated results
7. Build empty state and no-coverage state
8. Build `src/app/(app)/waitlist/page.tsx` — for unserved ZIP fallback (uses `waitlist_signups` table from B7)
9. Mobile-first responsive testing

**Verify 5b:**
- Homepage renders with service catalog
- Browse list renders with default filters and shows cleaners
- Each filter works independently and in combination
- Empty state appears when filters return no results
- No-coverage state appears for customers in unserved ZIPs
- Test customer in unserved ZIP can sign waitlist
- Mobile viewport (360px) works without horizontal scroll
- Pagination works (or infinite scroll, depending on implementation)

### Sub-phase 5c — Match Score algorithm (~5 days)

The heart of Phase 5. Implement carefully.

**Steps:**

1. Build `match-score.ts` with the 6 factors:

   - **Factor 1: Distance.** `1 - (distance_miles / 25)` clamped to [0, 1]. Cleaners >25mi away get 0.
   - **Factor 2: Tier.** `rising_pro: 0.5`, `proven: 0.75`, `top_rated: 0.9`, `all_star: 1.0`.
   - **Factor 3: Availability.** Boolean as float: `0` or `1` if cleaner has availability matching customer's requested window. (Will require checking `cleaner_availability` table from Phase 6c — handle gracefully if not yet present.)
   - **Factor 4: ZIP-locked badge.** `1.5` if cleaner has badge for customer's ZIP, `1.0` otherwise. (Multiplier, not addend.)
   - **Factor 5: Specialty match.** `1.2` if cleaner has specialty matching customer's service type, `1.0` otherwise.
   - **Factor 6: New cleaner cold-start boost.** `1.3` if cleaner has fewer than 10 completed jobs AND was approved within last 60 days; `1.0` otherwise.

2. Combine factors:
   ```typescript
   matchScore = (distance * 0.4 + tier * 0.3 + availability * 0.3) 
              * zipBadge 
              * specialty 
              * coldStart;
   ```
   Returns a number in roughly [0, 2.0]. Normalize to [0, 100] for display.

3. Build TypeScript type:
   ```typescript
   type MatchScoreFactors = {
     distance: { score: number; miles: number };
     tier: { score: number; tier: TierEnum };
     availability: { score: number; matches: boolean };
     zipBadge: { score: number; matched: boolean };
     specialty: { score: number; matched: boolean };
     coldStart: { score: number; isNewCleaner: boolean };
     totalScore: number;
   };
   ```
   The full breakdown is what the transparency card displays.

4. Build `MatchScoreCard.tsx` component that renders the breakdown.

5. Update browse query to use `matchScore` for ranking when sort = "Match Score".

6. **Critical:** Match Score is server-side only. Never expose the algorithm to the client (would let cleaners reverse-engineer and game it).

**Verify 5c:**
- Match Score is deterministic (same inputs → same output)
- All 6 factors produce sensible values
- New cleaner spotlight visible (new cleaners rank higher than their tier alone would suggest)
- ZIP-locked badge match produces visible ranking change
- Distance contribution falls off correctly at 25mi
- Transparency card shows each factor's contribution accurately

### Sub-phase 5d — Cleaner profile + transparency card (~3 days)

**Steps:**

1. Build `src/app/(app)/cleaners/[id]/page.tsx` — server component fetching cleaner data
2. Build `CleanerProfileHero` — photo, name, key stats, sticky CTA
3. Build `MatchScoreCard` — already designed in 5c, integrate here
4. Build `ReviewsList` — placeholder data until Phase 6 produces real reviews
5. Add badges placeholder (Background Checked, ZIP-Locked, Insurance Verified) — actual badges are Phase 7
6. "Request to book" CTA — links to Phase 6 booking flow (not yet built; route to a placeholder page or "Coming in Phase 6" if Phase 6 hasn't shipped yet)
7. Mobile-first responsive testing

**Verify 5d:**
- Profile renders with all data fields populated
- Match Score transparency card shows correct breakdown for current customer
- Sticky CTA stays visible on scroll
- Mobile viewport works
- Linking from browse list to profile works (URL contains cleaner ID)
- Linking back from profile to browse list works (back button + breadcrumb)

### Sub-phase 5e — Customer dashboard + favorites (~3 days)

**Steps:**

1. Apply migration `0015_phase5_customer_favorites_rls.sql`
2. Build `src/app/(app)/dashboard/page.tsx` — customer dashboard
3. Build `DashboardHero`, `PastBookingsList`, `RecentCleanersList`, `FavoritesPreview` components
4. Build favorites toggle:
   - `FavoriteButton` component (heart icon)
   - Server action `toggleFavorite(cleanerId)` in `actions.ts`
   - Optimistic UI update (toggle immediately, server confirms)
5. Build `src/app/(app)/favorites/page.tsx` — favorites list page (reuses CleanerCard)
6. Add favorite button to cleaner profile page (5d) and cleaner cards in browse list (5b)

**Note:** If Phase 5 is running long when you reach 5e, **cut favorites first.** The dashboard itself is more valuable than the favorites system. Keep dashboard, defer favorites to Phase 5.5 or post-launch.

**Verify 5e:**
- Dashboard renders with all sections (most empty pre-Phase-6 — that's OK)
- Customer can favorite a cleaner from profile or browse list
- Favorites list shows correct cleaners
- Unfavoriting removes the cleaner
- RLS: customer cannot see another customer's favorites

### Sub-phase 5f — Phase verification + closeout (~1 day)

**Steps:**

1. Push everything to `main`. Vercel auto-deploys.
2. Verify deployment succeeded.
3. Open production URL in incognito with cache-bust.
4. Sign up a fresh test customer.
5. Walk through every acceptance criterion from Section 2.
6. Take screenshots.
7. Write `docs/phases/phase-5-progress-update.md`.
8. Tag `phase-5-complete` in git.
9. Open PR.

---

## 6. Specific gotchas

Phase 5 has fewer gotchas than Phase 4 (no FCRA, fewer integrations) but the ones it has are real.

### Gotcha A — Match Score is server-side only

**Never expose the algorithm to the client.** Two reasons:
1. Cleaners would reverse-engineer it and try to game ranking
2. Algorithm tweaks should be deployable without a client release

Implementation rule: Match Score calculation lives entirely in `match-score.ts`, called only from server queries and server actions. The browser receives the *output* (factor breakdowns for transparency card) but never the *weights* or *thresholds*.

### Gotcha B — Geocoding rate limits and failures

Google Maps Geocoding API has rate limits and occasionally returns errors. Don't assume every geocoding call succeeds.

**Pattern:**
- Async geocoding on address creation (don't block the user's address-add flow on geocoding response)
- Retry with exponential backoff on transient failures
- Mark addresses with `geocoding_failed_at` timestamp on persistent failure
- Background job re-tries failed addresses daily
- For browse list, exclude cleaners with no coordinates (rather than showing them at unknown distance)

### Gotcha C — Cleaner profile public view excludes sensitive fields

The `cleaner_profiles_public` view in migration 0014 deliberately excludes phone, email, exact home address, and payout account ID.

**Why this matters:** if a customer-side query accidentally selects from `cleaner_profiles` directly (not the public view), and RLS is permissive, sensitive data leaks. Always select from the public view for customer-facing reads.

Cleaner-side queries (cleaner viewing their own data) use the table directly because RLS scopes them to their own row.

### Gotcha D — New cleaner cold-start can be gamed

The cold-start boost is for cleaners with <10 jobs AND approved within 60 days. The intent is to give new cleaners visibility while they build a track record.

**Risk:** A cleaner could deliberately delay accepting bookings to stay in the cold-start window longer.

**Mitigation:** Cold-start window is 60 days from approval, not from first job. Once 60 days pass, cold-start boost ends regardless of job count. Document this in the cleaner-facing tier system explainer (WF 51, Phase 7).

### Gotcha E — Browse query performance at scale

The browse query joins multiple tables: `cleaner_profiles_public`, `addresses` (cleaner home address), `cleaner_specialties`, `cleaner_zip_badges`. Distance calculation against customer's address. Multiple filter conditions.

**Performance budget:** under 500ms server-side, under 2s including network.

**Mitigations:**
- Index on `cleaner_profiles.tier` (filter by tier)
- Index on `addresses (latitude, longitude)` using `gist` (distance queries)
- Limit results to 50 per query (paginate beyond that)
- Cache Match Score results per (customer, cleaner) pair in a Redis-like layer (post-launch optimization, NOT Phase 5)
- Pre-compute distance per (cleaner_home_zip, customer_address_zip) pair for ZIP-locked cleaners

If query exceeds budget at launch volume, profile and tune. Don't pre-optimize.

### Gotcha F — Empty state vs no-coverage state

Two distinct empty states, easy to confuse:

- **Empty state:** customer's filters return no results. UX: "No cleaners match. Try widening distance or relaxing filters." Actionable.
- **No-coverage state:** customer's ZIP is in `serviced_areas` with status `pending` or doesn't exist. UX: "We're not in your ZIP yet. Join the waitlist." Different action.

The query needs to know which state to render. Pattern:
1. Query `serviced_areas` for customer's ZIP first
2. If status != `active`, render no-coverage state
3. If active, run the cleaner browse query
4. If browse query returns empty, render empty state

### Gotcha G — Cleaner profile page must work for unauthenticated users (eventually)

Phase 5 builds the profile page inside the `(app)/` route group, which requires auth. That's correct for Phase 5.

**But:** in Phase 10 (marketing pages), you may want to expose select cleaner profiles as SEO content. That requires a public version of the profile page outside the auth-required route group.

This is NOT in scope for Phase 5. Document the future need but don't build it.

### Gotcha H — Customer favorites is hard delete, not soft delete

Phase 3a established soft-delete-only for addresses. Phase 5's favorites use **hard delete** (DELETE FROM customer_favorites).

**Why:** favorites aren't audit-relevant. A customer un-favoriting a cleaner doesn't need to be tracked in history. Allowing hard delete simplifies the toggle UX.

This is the only Phase 5 exception to the project-wide soft-delete pattern. Document it.

### Gotcha I — Match Score ties

Two cleaners can have the same Match Score. The default browse query needs a tiebreaker.

**Recommendation:** secondary sort by `total_completed_jobs DESC` (more experienced cleaner ranks higher in ties). Tertiary sort by `created_at ASC` (earlier-approved cleaner ranks higher).

Document this in the algorithm so future tweaks don't break expected ordering.

### Gotcha J — Recent cleaners on dashboard requires Phase 6 booking history

The "Recent cleaners" section on customer dashboard pulls cleaners from past bookings. Phase 5 ships before Phase 6, so this section is empty for new customers — that's expected.

For Phase 5 verification, build the section with empty state ("Your recent cleaners will appear here once you book."). When Phase 6 ships, the section populates automatically because the query already exists.

---

## 7. Out of scope for Phase 5

Defer to later phases:

- **Booking flow** (Phase 6 — the next big phase)
- **Reviews and ratings** (Phase 6f post-job)
- **Cleaner availability calendar** (Phase 6c — needed for booking, not browse)
- **Tier badges** beyond placeholder (Phase 7 trust system)
- **ZIP-locked badge UI** beyond placeholder (Phase 7)
- **Insurance verified badge** beyond placeholder (Phase 7)
- **Specialty endorsements** detail page (Phase 7)
- **Public marketing pages** for cleaners (Phase 10)
- **Search by name/keyword** beyond filters (post-launch — adds complexity, low value at launch)
- **Saved searches** (post-launch)
- **Cleaner recommendations from past bookings** (post-launch, requires booking history)

---

## 8. Test plan

### Code health
- [ ] `pnpm lint` exits 0
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm build` exits 0
- [ ] Both migrations apply cleanly

### Geocoding
- [ ] Existing addresses backfilled with lat/lng
- [ ] New addresses geocoded automatically on creation
- [ ] Failed geocoding doesn't break address creation
- [ ] Distance calculation returns sensible values

### Browse list
- [ ] Default load returns cleaners ranked by Match Score
- [ ] Each filter works in isolation
- [ ] Filters combine correctly (AND logic)
- [ ] Empty state appears when filters return no results
- [ ] No-coverage state appears for unserved ZIPs
- [ ] Performance: query under 500ms server-side
- [ ] Pagination/infinite scroll works

### Match Score
- [ ] All 6 factors produce sensible values
- [ ] Score is deterministic
- [ ] New cleaner cold-start visible in rankings
- [ ] ZIP-locked badge produces visible ranking change
- [ ] Algorithm not exposed to client (verify by inspecting browser network tab — only factor breakdowns, no weights)

### Cleaner profile
- [ ] Profile renders with all stats
- [ ] Transparency card shows correct factor breakdown
- [ ] Sticky CTA visible on scroll
- [ ] Reviews placeholder OK (Phase 6 populates)

### Customer dashboard
- [ ] All sections render
- [ ] Empty states appropriate for new customer
- [ ] Favorites preview shows correct cleaners
- [ ] Recent cleaners empty pre-Phase-6 (expected)

### Favorites
- [ ] Heart toggle works on profile page and browse cards
- [ ] Optimistic UI update feels instant
- [ ] Server confirms within reasonable time
- [ ] Favorites list shows correct cleaners
- [ ] RLS: cannot see another customer's favorites

### Cross-cutting
- [ ] All UI mobile-first (360px)
- [ ] All cleaner data flows through `cleaner_profiles_public` view (no sensitive field leaks)
- [ ] Server-side ranking — Match Score never computed client-side
- [ ] Production deploy serves correct version
- [ ] Test customer can complete full flow on production

---

## 9. Phase 5 deliverable verification

Phase 5 is complete when, on production URL with a real test customer account, every acceptance criterion in Section 2 has been verified with screenshots or logged evidence.

The verification scenario:
1. Sign up a fresh test customer
2. Add a service address (Phase 3a flow)
3. Land on customer homepage (WF 1) — see service catalog and recommended cleaners
4. Click "Browse all cleaners" — see browse list (WF 8)
5. Filter by service type "Deep Clean" — list updates
6. Filter by distance "10mi" — list further filters
7. Sort by "Highest rated" — list re-orders
8. Click a cleaner card — navigate to cleaner profile (WF 7)
9. See transparency card explaining Match Score factors
10. Click favorite heart — cleaner appears in favorites
11. Navigate to dashboard (WF 11) — see customer dashboard with favorites preview
12. Click "Request to book" on a profile — link to Phase 6 (placeholder if Phase 6 not yet built)

If any step fails, Phase 5 is not done.

---

## 10. Files of interest (for the Phase 5 PR)

When opening the Phase 5 PR, list files by sub-phase:

**5a — Geocoding:**
- `src/lib/google-maps/client.ts`
- `src/lib/google-maps/geocoding.ts`
- `src/server/jobs/backfill-geocoding.ts`
- Updates to `src/features/customer/actions.ts` (createAddress)

**5b — Homepage and browse list:**
- `src/app/(app)/page.tsx`
- `src/app/(app)/cleaners/page.tsx`
- `src/app/(app)/waitlist/page.tsx`
- All discovery components in `src/features/discovery/components/`

**5c — Match Score:**
- `src/features/discovery/match-score.ts`
- `src/features/discovery/types.ts`

**5d — Cleaner profile:**
- `src/app/(app)/cleaners/[id]/page.tsx`
- `MatchScoreCard.tsx`, `CleanerProfileHero.tsx`, `ReviewsList.tsx`

**5e — Dashboard and favorites:**
- `src/app/(app)/dashboard/page.tsx`
- `src/app/(app)/favorites/page.tsx`
- All dashboard components

**Database:**
- `db/migrations/0014_phase5_geocoding_and_browse.sql`
- `db/migrations/0015_phase5_customer_favorites_rls.sql`

**Docs:**
- `docs/phases/phase-5-spec.md`
- `docs/phases/phase-5-explainer.md`
- `docs/phases/phase-5-progress-update.md`

---

## 11. Known limitations of this spec

1. **Match Score weights are first-pass.** The 0.4/0.3/0.3 weighting and the 1.5x/1.2x/1.3x multipliers are educated guesses. After launch, you'll have real data on which factors actually predict good matches. Plan to revisit weights in v1.1.

2. **Cold-start mechanism is simple.** The 60-day window + 10-job threshold is a starting point. Real-world tuning may favor a more gradual decay (linear from 1.3x to 1.0x over 60 days) or a job-count-only threshold (drop boost after 10 jobs regardless of time).

3. **No A/B testing infrastructure.** Phase 5 ships with one Match Score algorithm and one ranking. A/B testing of variations is post-launch.

4. **Browse query performance assumed acceptable at launch volume.** With <100 cleaners, query performance is a non-issue. With 1000+, profiling and possible caching layer needed.

5. **Geocoding API choice may change.** Google Maps is recommended, but Mapbox is a reasonable fallback if costs surprise you.
