# Phase 5 — Plain-English Breakdown

This document walks through every section of `phase-5-spec.md` and explains:
- What each thing means in plain English
- What needs to be designed (decisions to make)
- What needs to be built (actual files)
- Why each decision matters
- Beginner-trap warnings where they apply

Phase 5 is the customer-facing discovery experience. After Phase 4 produces approved cleaners, Phase 5 makes them findable. Read section by section.

---

# Section 0 — External account prerequisites

## What it means in plain English

Phase 5 needs one external service: a **geocoding provider**. Geocoding is the process of converting an address ("123 Main St, Los Angeles, CA 90001") into latitude/longitude coordinates (34.0522, -118.2437).

Why we need this: customers want to see cleaners near them. To rank cleaners by distance, we need coordinates for both the customer's address and the cleaner's home address. Storing addresses as strings isn't enough — we need lat/lng for distance math.

Three providers are reasonable. The spec recommends Google Maps because it's the standard for US marketplaces, has the most accurate US data, and the free tier covers significantly more than launch volume.

## Why this is much simpler than Phase 4's prerequisites

Phase 4 had three external services with business approval timelines (Stripe, Checkr, lawyer). Phase 5 has one service with self-serve API access. You can set this up in an hour.

## Lawyer items

Phase 5 has minimal legal exposure. Match Score transparency copy is product copy ("Why am I seeing this cleaner?"), not legal copy. Continue lawyer engagement on remaining Phase 4 items in parallel.

---

# Section 1 — Summary

## What it means in plain English

Phase 4 made cleaners exist. Phase 3a made customers exist. **But customers can't find cleaners yet** — there's no UI for it. Phase 5 is the bridge.

By the end of Phase 5, a customer can:

1. **Land on a homepage** with services and recommendations (WF 1)
2. **Browse a list of cleaners** with filtering and sorting (WF 8)
3. **View any cleaner's profile** with bio, services, reviews, and Match Score transparency (WF 7)
4. **See their dashboard** showing activity (WF 11) — mostly empty pre-Phase-6 because there's no booking history yet
5. **Favorite cleaners** they like (WF 25) — lightweight, can be cut if Phase 5 runs long

The technical centerpiece is the **Match Score algorithm** — the ranking system that decides which cleaners appear at the top of the browse list for each customer.

## Why "Match Score" deserves so much attention

Two-sided marketplaces live or die by their matching quality. If customers can't find good cleaners, they leave. If cleaners can't get visibility, they leave. The algorithm that ranks cleaners affects both sides simultaneously.

PureTask's Match Score has 6 factors:

1. **Distance** — how close the cleaner lives
2. **Tier** — cleaner reliability tier (rising_pro / proven / top_rated / all_star)
3. **Availability** — does cleaner's schedule match customer's request?
4. **ZIP-locked badge** — has cleaner earned a badge for the customer's ZIP code?
5. **Specialty match** — does cleaner specialize in customer's service type?
6. **New cleaner cold-start boost** — gives new cleaners visibility while they build a track record

Plus a transparency card on every cleaner profile that explains exactly which factors contributed to that cleaner's score for the current customer. **This is intentional.** Most platforms hide their algorithms; PureTask exposes them. The reasoning: hiding the algorithm creates "shadow algorithm" anxiety on both sides ("am I being penalized? am I being shown bad cleaners?"). Transparency reduces that anxiety.

## What "cold-start" means

A "cold-start" problem in marketplaces: when a new participant joins, they have no track record, so the algorithm can't rank them well. Without intervention, new cleaners never get visibility, never get bookings, never build a track record, and quit. Supply side stalls.

Cold-start mechanism: temporarily boost new cleaners' visibility for a window (60 days from approval, or until they complete 10 jobs). After that, they rank purely on merit.

This is borrowed from successful marketplaces (DoorDash, Uber, Airbnb all do variations of this). It's a known pattern.

---

# Section 2 — Acceptance criteria

The spec lists ~25 acceptance criteria organized by deliverable. Walking through the most important categories:

## Customer homepage (WF 1)

The first thing a customer sees after Phase 2 sign-in. Should immediately answer "what can I do here?"

Three sections on the homepage:
- **Service catalog** — 4 services (Standard, Deep, Move-Out, Airbnb Turnover) as picker tiles
- **Recent bookings** — last 3 bookings (empty for new customers; populates from Phase 6)
- **Recommended cleaners** — top 3 by Match Score for customer's default address

The "Browse all cleaners" CTA links to the full browse list.

**Why three sections, not more:** mobile-first design says the first screen should be scannable in 5 seconds. Adding a fourth section adds cognitive load. Keep it tight.

## Cleaner browse list (WF 8)

The "heavy filtering query" — the most complex query in Phase 5.

Filters:
- **Service type** — multi-select. Most customers want one service, but some want multiple (e.g., "I need either Deep or Move-Out").
- **Maximum distance** — 5/10/15/25 mi options.
- **Minimum rating** — 4.5+ / 4.7+ / 4.9+.
- **Price range** — hourly rate slider.
- **Availability window** — when the customer wants the cleaning done.

Sort options:
- **Match Score** (default)
- **Distance ascending**
- **Rating descending**
- **Price ascending**

Each cleaner card shows: name, photo, rating, hourly rate, distance, top 3 specialties, "Available [day]" badge.

**Two distinct empty states**:
- **Empty state** — filters returned no results. Action: "Try widening distance or relaxing filters."
- **No-coverage state** — customer's ZIP is not yet served. Action: "Join the waitlist."

These are different conditions and need different UX. See gotcha F in the spec.

## Match Score algorithm

Specific acceptance criteria for the algorithm:

- **All 6 factors implemented.** No skipping factor 6 because cold-start feels complicated.
- **Deterministic.** Same inputs always produce same score. No randomness in production.
- **Score range normalized.** 0-100 range for display purposes.
- **Updates when data changes.** When a cleaner's tier changes, scores update.
- **New cleaner cold-start visible.** A new cleaner ranking higher than tier alone would suggest = cold-start working.

## Cleaner profile (WF 7)

Customer-facing view of a cleaner. Shows:
- Photo, name, bio
- Services offered + hourly rates
- Languages spoken
- Response time average
- Completion rate %
- Total jobs completed
- Star rating + review count
- Reviews list (last 5)
- Badges (Background Checked, ZIP-Locked, Insurance Verified — placeholders until Phase 7)
- "Why am I seeing this cleaner?" transparency card
- Sticky CTA: "Request to book"

**The sticky CTA matters.** On mobile, scrolling can get long. The CTA should always be reachable without scrolling back to the top.

## Customer dashboard (WF 11)

Customer landing page when they navigate to `/dashboard` after browsing or coming back to the app. Sections:
- Active bookings (Phase 6 territory)
- Past bookings (Phase 6 territory)
- Favorites preview
- Recent cleaners (booked before)

Most sections are empty pre-Phase-6. That's expected. Don't try to fake content.

## Favorites (WF 25)

The "lightweight, defer-friendly" deliverable. Customer can favorite a cleaner from any cleaner card or profile page. Favorites list shows all favorited cleaners.

If Phase 5 runs long, **cut favorites first**. Dashboard alone is more valuable.

---

# Section 3 — Database state and migrations

## What already exists

The schema (B1, B7) was designed for Phase 5. Tables already present:

- `cleaner_profiles` — populated by Phase 4 approvals
- `addresses` — populated by Phase 3a customer flow
- `cleaner_specialties` — populated by Phase 4 application data
- `serviced_areas` — Phase 5 may populate this if it isn't already
- `waitlist_signups` — for unserved ZIP fallback
- `customer_favorites` — for WF 25

Phase 5 doesn't create these tables. It populates and queries them.

## What 0014 migration adds

### `earthdistance` extension

```sql
CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;
```

This is a Postgres extension that gives you simple lat/lng distance calculations without requiring full PostGIS.

**Why not PostGIS:** PostGIS is a heavy extension that adds geometry types, polygons, routing, and lots more. Overkill for marketplace ranking. We just need straight-line distance between two points. `earthdistance` is much smaller and sufficient.

### Spatial index

```sql
CREATE INDEX idx_addresses_coordinates 
ON addresses USING gist (ll_to_earth(latitude, longitude))
WHERE deleted_at IS NULL AND latitude IS NOT NULL;
```

Walk through this:
- `gist` is the index type for spatial data
- `ll_to_earth(latitude, longitude)` converts lat/lng pair to a 3D earth point that GIST can index
- The `WHERE` clause makes this a *partial index* — only includes non-deleted addresses with coordinates. Saves space and speeds up queries.

Without this index, a query like "find all cleaners within 10 miles of customer X" would do a full table scan. With it, the query uses spatial lookup — fast.

### Distance helper function

```sql
CREATE OR REPLACE FUNCTION distance_miles(lat1 FLOAT, lng1 FLOAT, lat2 FLOAT, lng2 FLOAT)
RETURNS FLOAT AS $$
  SELECT (earth_distance(ll_to_earth(lat1, lng1), ll_to_earth(lat2, lng2)) / 1609.34)::FLOAT;
$$ LANGUAGE SQL IMMUTABLE;
```

Walk through:
- `earth_distance(...)` returns meters
- Divide by 1609.34 to get miles (1609.34 meters per mile)
- `IMMUTABLE` tells Postgres this function always returns the same output for the same inputs (allows query optimization)

Now in queries you can write:
```sql
SELECT * FROM cleaner_profiles
WHERE distance_miles($cust_lat, $cust_lng, home_lat, home_lng) < 25;
```

### `cleaner_profiles_public` view

```sql
CREATE VIEW cleaner_profiles_public AS
SELECT id, user_id, display_name, bio, languages, hourly_rates, photo_url, ...
  -- DELIBERATELY EXCLUDED: phone, email, exact_home_address, payout_account_id
FROM cleaner_profiles
WHERE deleted_at IS NULL;
```

**Why a view:** customer-facing queries should never accidentally select sensitive cleaner fields. The view is the customer-safe interface.

Pattern going forward:
- Customer reads → use `cleaner_profiles_public` view
- Cleaner reads own data → use `cleaner_profiles` table directly (RLS scopes them)
- Admin reads → use `cleaner_profiles` table directly (RLS allows admin-all)

This is a defense-in-depth pattern. Even if someone forgets to filter columns in application code, the view enforces the boundary.

### RLS update for `cleaner_profiles`

Phase 4 set up RLS as: cleaner reads own + admin reads all. Phase 5 adds:

```sql
CREATE POLICY "authenticated users can read approved cleaner profiles"
ON cleaner_profiles FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  deleted_at IS NULL AND
  EXISTS (SELECT 1 FROM cleaner_applications WHERE cleaner_profile_id = cleaner_profiles.id AND state = 'approved')
);
```

Walk through:
- Any authenticated user can SELECT
- Only non-deleted profiles
- Only profiles whose application is in `approved` state (so freshly-approved cleaners appear; not-yet-approved don't)

**The view doesn't bypass RLS.** Postgres applies RLS to the table, then the view operates on the post-RLS rowset. So even when customers query the view, they only see approved cleaners.

## What 0015 migration adds

RLS for `customer_favorites`:
- SELECT: own only
- INSERT: own only
- DELETE: own only (note: DELETE is allowed here, unlike addresses — see gotcha H)

---

# Section 4 — The 30+ files to create

Phase 5 has fewer files than Phase 4 (no external integrations besides geocoding). Walking through the structure.

## App routes

Six new pages inside `(app)/` route group:

```
src/app/(app)/page.tsx                        # Homepage
src/app/(app)/cleaners/page.tsx               # Browse list
src/app/(app)/cleaners/[id]/page.tsx          # Profile
src/app/(app)/dashboard/page.tsx              # Customer dashboard
src/app/(app)/favorites/page.tsx              # Favorites list
src/app/(app)/waitlist/page.tsx               # Unserved ZIP fallback
```

The `(app)/page.tsx` is the customer homepage — replaces whatever lands at `/` after Phase 2 auth (currently the smoke test page from Phase 1).

## Feature module — discovery

```
src/features/discovery/
├── actions.ts                                # toggleFavorite
├── queries.ts                                # Browse query
├── validation.ts                             # Filter schemas
├── types.ts                                  # Filter and ranking types
├── match-score.ts                            # Algorithm
├── geocoding.ts                              # Async geocoding helper
└── components/
    ├── HomepageHero.tsx
    ├── ServiceCatalog.tsx
    ├── CleanerCard.tsx
    ├── CleanerListFilters.tsx
    ├── CleanerProfileHero.tsx
    ├── MatchScoreCard.tsx
    ├── ReviewsList.tsx
    └── FavoriteButton.tsx
```

`discovery` is a new feature module. Phase 3a established `customer/` feature module; Phase 4 added `cleaner/` and `admin/`. Phase 5 adds `discovery/` because browse, ranking, and favorites are cross-cutting (used by both customer and cleaner-side flows).

## Feature module — customer dashboard

These extend the existing `src/features/customer/` from Phase 3a:

```
src/features/customer/dashboard/
├── DashboardHero.tsx
├── PastBookingsList.tsx
├── RecentCleanersList.tsx
└── FavoritesPreview.tsx
```

## Library code

```
src/lib/google-maps/
├── client.ts                                 # Maps API client
├── geocoding.ts                              # Address → lat/lng
└── places.ts                                 # Optional autocomplete
```

The `lib/google-maps/` folder is new. Pattern matches `lib/stripe/` and `lib/checkr/` from Phase 4 — thin wrappers around the SDK.

## Background jobs

```
src/server/jobs/backfill-geocoding.ts
```

A one-time script. Runs after migration `0014`. Iterates over addresses with NULL coordinates, calls Google Maps API, populates the columns. Handles rate limits and failures.

Phase 5 introduces the `src/server/jobs/` pattern. This will reused for Phase 6 photo cleanup, Phase 7 score calculation jobs, etc.

---

# Section 5 — Implementation order (sub-phases)

The spec breaks Phase 5 into 6 sub-phases (5a through 5f). Walking through the rationale:

## 5a first — geocoding before anything else

Why geocoding first? Because every later sub-phase depends on coordinates. The browse list ranks by distance. The Match Score factor 1 is distance. The cleaner profile shows distance from customer.

Without coordinates, none of this works. Build the coordinate infrastructure first.

The async pattern matters: don't block address creation on Google's API response. Insert address → return success → background job fetches lat/lng → updates row. If geocoding fails, the address still exists; failure is recoverable.

## 5b second — homepage and browse list

After 5a, you have data. Now build the UI that displays it.

Build order within 5b:
1. Server-side query (joins, filters, distance, ranking)
2. Filter components (service type, distance, rating, price, availability)
3. CleanerCard (the reusable card)
4. Browse list page wiring everything together
5. Empty state and no-coverage state
6. Homepage with simpler version of the same query (top 3 recommended)

The browse query is the single hardest piece of code in Phase 5. Test it heavily before moving on.

## 5c third — Match Score

Why third? Because by 5c you have basic ranking working (default sort by distance, tier, etc.). 5c replaces basic ranking with the full Match Score algorithm.

This sequencing means you can test browsing in 5b without the full algorithm complexity. Then 5c upgrades the ranking.

The transparency card component lives here too — it consumes the algorithm output.

## 5d fourth — cleaner profile

Browse list shows cleaners; profile is the deep dive into one cleaner. Build after browse so you can navigate cleanly between them.

Profile reuses much of what 5c built (Match Score card, factor breakdowns). It's mostly a layout exercise on top of existing data.

## 5e fifth — dashboard and favorites

Dashboard is a different layout consuming similar data (cleaner cards). Favorites adds a small write path (toggle).

If Phase 5 runs long, cut favorites first.

## 5f sixth — verification

Production verification. Same pattern as Phase 1, 3a, 4. Walk through every acceptance criterion on production with screenshots.

---

# Section 6 — Specific gotchas

## Gotcha A — Match Score is server-side only

This is the single most important architectural rule in Phase 5.

**Why:** if cleaners can see the algorithm weights, they'll game them. "Oh, distance is 40% — let me move closer to a city center." "Oh, cold-start boost is 1.3x — let me delay accepting bookings to stay in the boost window." Marketplaces with leaked algorithms have real problems with this.

**Implementation rule:** the algorithm code lives in `match-score.ts`, called only from server queries and server actions. The browser receives the *output* (factor breakdowns for transparency card) but never the *weights* or *thresholds*.

The transparency card shows things like "Distance: 4.2 miles · contributes 0.85" — it shows the score for each factor but not how the score was calculated. Customers see the *result* of transparency without seeing the *weights*.

## Gotcha B — Geocoding rate limits and failures

Google Maps Geocoding API has rate limits (50 requests per second on free tier) and occasionally returns errors (5xx, network timeouts).

**The pattern:** treat geocoding as eventually-consistent, not transactional.

```typescript
// On address insert:
async function createAddress(input) {
  const address = await db.insert('addresses', input);
  
  // Don't await this; run in background
  geocodingQueue.add({ addressId: address.id });
  
  return { success: true };  // User flow not blocked
}

// Background job:
async function geocodeAddress(addressId) {
  const address = await db.get('addresses', addressId);
  try {
    const coords = await googleMaps.geocode(address);
    await db.update('addresses', addressId, { latitude: coords.lat, longitude: coords.lng });
  } catch (err) {
    await db.update('addresses', addressId, { geocoding_failed_at: NOW() });
    // Daily retry job will pick this up
  }
}
```

For browse list, exclude cleaners with NULL coordinates (rather than showing them at unknown distance).

## Gotcha C — Cleaner profile public view excludes sensitive fields

Already covered in Section 3. The pattern: customer-facing reads from view; admin/self reads from table.

**The trap:** a developer notices `cleaner_profiles_public` doesn't have `phone`, decides "I need phone for this customer-facing flow," queries the table directly, RLS lets it through (because authenticated reads are allowed), and now phone numbers are leaking.

**The fix:** never SELECT from `cleaner_profiles` directly in customer-facing code. If you need a column not in the view, ask "should this be customer-facing at all?" If yes, add to the view. If no, don't expose it.

## Gotcha D — New cleaner cold-start can be gamed

The boost is for cleaners with <10 jobs AND approved within 60 days.

**The risk:** a cleaner could deliberately delay accepting bookings to stay in the cold-start window longer, getting more visibility.

**The mitigation:** the 60-day window is from approval date, not from first job. After 60 days, cold-start ends regardless of job count. So delaying jobs only keeps you in the boost for the time you'd be in it anyway.

Document this clearly in the cleaner-facing tier system explainer (WF 51, Phase 7) so cleaners know they can't game it.

## Gotcha E — Browse query performance

The browse query is the most complex query in your app so far. It joins:
- `cleaner_profiles_public`
- `addresses` (cleaner home)
- `cleaner_specialties`
- `cleaner_zip_badges`

Plus distance calculation against customer's address. Plus filters. Plus sort.

**Performance budget:** 500ms server-side, 2 seconds end-to-end including network.

**Do:**
- Use the spatial index from migration 0014
- Index on `cleaner_profiles.tier`
- Limit results to 50 per query
- Paginate beyond that

**Don't:**
- Pre-optimize with caching layers (Redis, etc.) — add this only if needed at launch volume
- Denormalize data into a "search index" table — only if needed
- Build complex query optimization before measuring

Phase 5 ships with the simple version. If query exceeds budget at real launch volume, profile and tune. Most likely it'll be fine.

## Gotcha F — Empty state vs no-coverage state

Two distinct empty states, easy to confuse:

| State | When | UX |
|---|---|---|
| Empty state | Filters returned no results | "No cleaners match. Try widening distance or relaxing filters." |
| No-coverage state | Customer's ZIP not in `serviced_areas` | "We're not in your ZIP yet. Join the waitlist." |

The query needs to know which to render:

```typescript
async function browseQuery(customerZip, filters) {
  const servicedArea = await db.get('serviced_areas', { zip: customerZip });
  if (!servicedArea || servicedArea.status !== 'active') {
    return { type: 'no-coverage', servicedArea };
  }
  
  const cleaners = await db.query(/* full browse query */);
  if (cleaners.length === 0) {
    return { type: 'empty', filters };
  }
  
  return { type: 'success', cleaners };
}
```

Don't conflate the two. They have different actions and different psychological impacts on the customer.

## Gotcha G — Cleaner profile must work for unauthenticated users (eventually)

Phase 5 builds the profile inside `(app)/` route group, which requires auth. Correct for Phase 5.

**But:** Phase 10 (marketing pages) may want public cleaner profiles for SEO. Different cleaners want different visibility — some want public profiles, some don't.

**Not in Phase 5 scope.** Document the future need:
- Add a `is_publicly_visible` boolean to `cleaner_profiles` (Phase 10 migration)
- Build a `/cleaners/[slug]` public route in Phase 10
- The public route uses an even-more-restricted view than `cleaner_profiles_public`

Phase 5 just builds the auth-required version.

## Gotcha H — Customer favorites is hard delete

Phase 3a established soft-delete-only for addresses. Phase 5's favorites use **hard delete** (`DELETE FROM customer_favorites`).

**Why:** favorites aren't audit-relevant. Customer un-favoriting doesn't need history tracking. Hard delete simplifies the toggle UX (no need to filter `WHERE deleted_at IS NULL` on every read).

This is the only Phase 5 exception to project-wide soft-delete. Document it in code comments.

## Gotcha I — Match Score ties

Two cleaners can have identical Match Score. Default browse sort needs a deterministic tiebreaker.

**Recommendation:**
1. Primary sort: Match Score DESC
2. Secondary sort: `total_completed_jobs DESC` (more experienced wins ties)
3. Tertiary sort: `created_at ASC` (earlier-approved wins further ties)

Without explicit tiebreakers, Postgres returns rows in arbitrary order, which means cleaner ordering changes between page loads. Bad UX.

## Gotcha J — Recent cleaners requires Phase 6

The "Recent cleaners" section on customer dashboard pulls cleaners from past bookings. Phase 5 ships before Phase 6 — so this section is empty for new customers.

**That's expected.** Build the section with empty state ("Your recent cleaners will appear here once you book."). Phase 6 makes the query return data automatically because the schema is in place.

Don't try to fake content here.

---

# Section 7 — Out of scope for Phase 5

The deferred items list. Walking through the most relevant ones:

## Booking flow (Phase 6)

This is the next big phase. Phase 5 builds discovery; Phase 6 builds the actual booking transaction.

When customer clicks "Request to book" on a cleaner profile in Phase 5, the link goes to Phase 6's booking flow. If Phase 6 isn't built yet, the link goes to a placeholder ("Coming in Phase 6") page.

## Reviews and ratings (Phase 6f)

Reviews are written after a booking is complete. Phase 5 displays reviews placeholder; Phase 6f populates real ones.

## Cleaner availability calendar (Phase 6c)

The Match Score factor 3 (availability) requires checking cleaner's calendar. Phase 5 implements the factor but the calendar itself is Phase 6c. Until calendar exists, factor 3 always returns 1 (assume available) — gracefully handle the missing data.

## Trust badges (Phase 7)

Background Checked, ZIP-Locked, Insurance Verified badges. Phase 5 shows placeholders. Phase 7 makes them real.

## Public marketing pages (Phase 10)

SEO-optimized cleaner profiles for unauthenticated visitors. Phase 5 is auth-required.

---

# Section 8 — Test plan

The spec lists ~30 test items. Most important categories:

## Geocoding
- Backfill works for existing addresses
- New addresses get coordinates async
- Failed geocoding doesn't break address creation
- Distance calculation returns sensible values

## Browse list
- Default load fast and ranked correctly
- Each filter works in isolation and combination
- Empty/no-coverage states render correctly
- Performance under budget
- Pagination works

## Match Score
- Algorithm deterministic
- All 6 factors produce sensible values
- Cold-start visible
- Algorithm not exposed to client

## Cleaner profile
- Renders all data
- Transparency card accurate
- Sticky CTA works
- Reviews placeholder OK

## Customer dashboard and favorites
- Sections render with appropriate empty states
- Favorites toggle works
- Optimistic UI feels instant

## Cross-cutting
- Mobile-first
- Sensitive fields not leaked
- RLS enforces data scoping
- Server-side ranking
- Production verification

---

# Section 9 — Phase 5 deliverable verification

Same rule as every prior phase: not done until verified on production with a real test customer.

The full verification scenario in Section 9 of the spec is the literal walkthrough. 12 steps. Walk all of them. Take screenshots.

Cursor will want to mark Phase 5 complete based on local builds. Don't accept that.

---

# Section 10 — Files of interest for the PR

Same pattern as Phase 4. Files organized by sub-phase, listed in PR description.

---

# Section 11 — Known limitations of this spec

The candid section. Five things will likely need adjustment when you actually build Phase 5:

1. **Match Score weights are first-pass.** 0.4/0.3/0.3 + 1.5/1.2/1.3 multipliers are educated guesses. Tune post-launch with real data.
2. **Cold-start window is simple.** 60 days + 10 jobs may be wrong threshold. Tune post-launch.
3. **No A/B testing infrastructure.** Phase 5 ships with one algorithm. A/B testing is post-launch.
4. **Performance assumptions.** Browse query is fine at <100 cleaners. Profile and tune at scale.
5. **Geocoding API choice may change.** Mapbox is reasonable fallback if Google costs surprise you.

---

# What to do next, in order

If you're at the start of Phase 5:

**Pre-Phase-5 (during Phase 4):**
- Set up Google Maps API account
- Plan to start Phase 5 immediately after Phase 4 closeout

**Day 1:**
- Read spec
- Read explainer
- Read master outline
- Hand spec to Cursor with "respond before coding" prompt

**Days 2-4 (sub-phase 5a):**
- Geocoding setup
- Migration + backfill
- Async geocoding on address creation

**Days 5-9 (sub-phase 5b):**
- Homepage
- Browse list with filters
- Empty/no-coverage states

**Days 10-14 (sub-phase 5c):**
- Match Score algorithm
- Transparency card

**Days 15-17 (sub-phase 5d):**
- Cleaner profile page
- Reviews placeholder

**Days 18-20 (sub-phase 5e):**
- Customer dashboard
- Favorites (cut if running long)

**Day 21 (sub-phase 5f):**
- Production verification
- Tag and close

This is happy path. Realistic estimate: 23-26 working days because of UX iteration on the browse list (most complex UI yet).

---

# The bigger picture: why Phase 5 is a milestone

Phase 5 is the first phase where the customer side of PureTask feels like a real product. Until now:

- Phase 1 was a smoke test page
- Phase 2 was auth screens
- Phase 3a was settings management
- Phase 4 was cleaner-side onboarding (customer never saw it)

Phase 5 is the customer landing on a homepage with services and seeing real cleaners they could hire. It's the first time the product looks like the product.

If you can demo Phase 5 to a friend or potential investor, it'll click for them. "I sign up, I add my address, I see cleaners near me, I see why they're recommended, I can favorite them." That's a real product story.

It's also the first phase where ranking quality matters. Match Score with reasonable weights = good user experience. Match Score with bad weights = customers see weird recommendations and bounce. Take the algorithm seriously. Test with real (test) data, not just synthetic data.

Phase 5 doesn't have the legal complexity of Phase 4 or the integration complexity of Phase 6. It does have the most subjective complexity: what makes a "good" ranking? You won't know until you have real customers and real cleaners. Phase 5 ships a reasonable v1; v1.1 tunes based on data.

---

# A note on this document being written ahead of time

I (Claude) wrote this explainer before Phase 4 was even built, much less Phase 5. The Match Score weights I propose, the cold-start parameters, the filter defaults — all educated guesses based on marketplace patterns, not on real PureTask data.

When you actually start Phase 5, the first thing to do:

1. Look at how many approved cleaners you actually have (could be 5, could be 50)
2. Look at customer geography distribution (could be tight cluster, could be spread)
3. Adjust Match Score parameters accordingly

If you have 5 cleaners, distance dominates because there isn't much else to differentiate. If you have 50 cleaners in one ZIP, distance becomes less useful and tier matters more. The algorithm parameters should adjust to reality.

Don't ship Phase 5 with my parameters and assume they're optimal. Ship with my parameters as a starting point, then watch real customer behavior and tune.
