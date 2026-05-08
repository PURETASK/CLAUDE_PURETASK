# Phase 5 — Comprehensive Build Guide & Overview

This document merges **`phase-5-spec.md`**, **`phase-5-explainer.md`**, and **`phase-5-master-outline.md`** into a single implementation reference: what to design, build, migrate, verify, and in what order.

**Phase outcome:** An authenticated customer can discover cleaners (homepage + browse + profile), understand ranking via transparency, optionally favorite cleaners, and land on a customer dashboard—all **server-side ranked** with geocoded distance. Booking is **Phase 6** (placeholder CTA acceptable until then).

---

## 1. Executive summary

| Item | Detail |
|------|--------|
| **Goal** | Customer-facing browse, discovery, Match Score transparency, dashboard, favorites |
| **Duration (spec)** | 3–4 weeks focused; explainer suggests ~23–26 days with UX iteration |
| **Hard deps** | Phase 4 done (`cleaner_profiles`), Phase 3a done (customer addresses + default), geocoding account, ~5–10 test cleaners |
| **Centerpiece** | Match Score (6 factors, server-only, deterministic, normalized display) |
| **Closeout rule** | **Production** verification of every Section 2 acceptance criterion (screenshots / evidence)—not local-only |

---

## 2. Dependencies & prerequisites (before coding)

### 2.1 Product / data

- [ ] Approved cleaners exist with populated `cleaner_profiles` (Phase 4).
- [ ] Customers have at least one service address and a **default** address (Phase 3a).
- [ ] Seed or create **5–10** realistic test cleaners across ZIPs for meaningful ranking/filter tests.

### 2.2 External: geocoding (Section 0 / master outline §0)

- [ ] Choose provider (spec recommends **Google Maps Geocoding**; Mapbox fallback OK).
- [ ] GCP project, Geocoding API enabled, billing on file.
- [ ] API key restricted (HTTP referrer + IP allowlist as appropriate).
- [ ] Env: `GOOGLE_MAPS_API_KEY` in `.env.local` + Vercel.
- [ ] *(Optional)* Places API + `places.ts` for address autocomplete enhancement to Phase 3a forms.

### 2.3 Documentation to add alongside code (master outline)

- [ ] `docs/integrations/google-maps-setup.md` — setup notes for the team.
- [ ] `.env.example` — `GOOGLE_MAPS_API_KEY=`.

---

## 3. Wireframes & UX surfaces (inventory)

| Wireframe | Route (spec) | Purpose |
|-----------|--------------|---------|
| **WF 1** | `(app)/page.tsx` | Customer homepage: catalog, recent bookings stub, top 3 recommendations |
| **WF 8** | `(app)/cleaners/page.tsx` | Browse list: filters, sort, cards, empty vs no-coverage |
| **WF 7** | `(app)/cleaners/[id]/page.tsx` | Profile + transparency + sticky “Request to book” |
| **WF 11** | `(app)/dashboard/page.tsx` | Customer dashboard (many sections empty until Phase 6) |
| **WF 25** | `(app)/favorites/page.tsx` | Favorites list (defer if schedule slips) |
| **Waitlist** | `(app)/waitlist/page.tsx` | Unserved ZIP fallback (`waitlist_signups`) |

> **Routing note:** The repo today may use `src/app/(app)/app/...` for the authenticated shell. During implementation, reconcile with AGENTS/playbooks: Phase 5 spec assumes `(app)/page.tsx` at authenticated root—either relocate the customer homepage to match spec or document an intentional path alias (e.g. `/app` vs `/`) to avoid duplicated homepages.

---

## 4. Database work (both migrations — full checklist)

### 4.1 `db/migrations/0014_phase5_geocoding_and_browse.sql`

**Purpose:** Enable distance queries, safer public cleaner reads, and customer visibility of approved cleaners.

| # | Deliverable | Notes |
|---|-------------|--------|
| 1 | Document NULL lat/lng | Migration **does not** magically fill coords; app/script backfills |
| 2 | `CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;` | No PostGIS required for MVP |
| 3 | Partial **GiST** index on addresses | `ll_to_earth(latitude, longitude)` WHERE `deleted_at IS NULL AND lat/lng NOT NULL` |
| 4 | `distance_miles(lat1,lng1,lat2,lng2)` | SQL `IMMUTABLE` helper using `earth_distance` ÷ 1609.34 |
| 5 | RLS on `cleaner_profiles` | Policy: authenticated can SELECT approved cleaners (via `cleaner_applications.state = 'approved'` + `deleted_at IS NULL`) — **align exact policy text with spec** |
| 6 | **`cleaner_profiles_public` VIEW** | Strict column whitelist; **no** phone/email/exact home/payout ids |
| 7 | Optional indexes | Spec mentions tier index if filtering/sorting heavy |

**Schema reality check:** Before writing the view, diff against live `cleaner_profiles` columns in `database.types.ts` — spec examples use names like `display_name`, `current_zip_locked_badges`, `specialties`; **map to actual columns** or join `cleaner_specialties` / badge tables.

### 4.2 `db/migrations/0015_phase5_customer_favorites_rls.sql`

| Policy | Rule |
|--------|------|
| SELECT | Owner customer only |
| INSERT | Owner customer only |
| DELETE | Owner only — **hard delete** (explicit exception to soft-delete pattern) |

---

## 5. Match Score algorithm (build contract)

**Location:** `src/features/discovery/match-score.ts` (server-only).

### 5.1 Inputs (conceptual)

- Cleaner public profile row (+ joined specialties, ZIP badges if applicable).
- Customer context: default address lat/lng, requested service type(s), optional availability window.
- Distance in miles between customer address and cleaner **home** address (from addresses table).

### 5.2 Six factors (spec §1 / §5c)

| # | Factor | Logic (v1 spec) |
|---|--------|-----------------|
| 1 | **Distance** | `1 - (miles / 25)` clamped to [0,1]; beyond 25mi → 0 |
| 2 | **Tier** | rising_pro **0.5**, proven_specialist **0.75**, top_performer **0.9**, all_star_expert **1.0** (use **actual enum** names from schema) |
| 3 | **Availability** | 0 or 1 float until Phase 6c calendar exists → **graceful default** (often treat as available / neutral) |
| 4 | **ZIP-locked badge** | ×**1.5** if badge matches customer ZIP else ×**1.0** |
| 5 | **Specialty match** | ×**1.2** if specialty matches requested service type else ×**1.0** |
| 6 | **Cold-start** | ×**1.3** if `total_completed_jobs < 10` **and** approved within **60 days**; else ×**1.0** |

### 5.3 Combine & normalize

```text
base = distance * 0.4 + tier * 0.3 + availability * 0.3
raw = base * zipBadge * specialty * coldStart
display = normalize(raw) → e.g. 0–100
```

### 5.4 Tie-breakers (spec Gotcha I)

1. Match Score DESC  
2. `total_completed_jobs DESC`  
3. `cleaner_profiles.created_at ASC` (or approval timestamp if stored—**pick one deterministic column** and document)

### 5.5 Transparency payload

Expose **per-factor scores and explanations** to the UI, **never** expose internal weights/multipliers/constants in network responses (Gotcha A). Transparency card wording is **product copy**, not legal.

### 5.6 Types (spec sketch)

Implement `MatchScoreFactors` (+ `totalScore`, normalized score) in `types.ts`; `MatchScoreCard.tsx` consumes it.

---

## 6. Geocoding & addresses (Section 5a — detailed build)

### 6.1 Library

| File | Responsibility |
|------|----------------|
| `src/lib/google-maps/client.ts` | Shared fetch/config |
| `src/lib/google-maps/geocoding.ts` | Structured geocode → lat/lng |
| `src/lib/google-maps/places.ts` | *(Optional)* Autocomplete |

### 6.2 Async pattern (Gotcha B)

- On `createAddress` (Phase 3a): insert row → respond success → **enqueue** geocode (do not block UX).
- Retries/backoff on transient failures; persist something like **`geocoding_failed_at`** if schema supports it—or add column in migration if missing.
- Browse query: exclude cleaners missing home coordinates.

### 6.3 Backfill job

| File | Responsibility |
|------|----------------|
| `src/server/jobs/backfill-geocoding.ts` | One-time crawl `addresses` WHERE coords NULL; rate-limit; log failures |

Operational step: run against dev Supabase after `0014`, then production once migrated.

---

## 7. Feature modules & files (complete inventory)

### 7.1 `src/features/discovery/`

| File | Build |
|------|--------|
| `actions.ts` | `toggleFavorite`, any future mutations |
| `queries.ts` | Browse query, homepage top-3, profile fetch via **public view** |
| `validation.ts` | Zod schemas for filters/sorts (mirror server & URL searchParams) |
| `types.ts` | Filters, sort enums, ranking types |
| `match-score.ts` | Pure algorithm functions |
| `geocoding.ts` | Thin wrapper used by discovery/customer flows if not only in lib |
| **components/** | See below |

**Components:**

| Component | Responsibility |
|-----------|----------------|
| `HomepageHero.tsx` | WF 1 hero |
| `ServiceCatalog.tsx` | 4 tiles: Standard / Deep / Move-out / Airbnb |
| `CleanerCard.tsx` | Name, photo, rating, hourly, distance, top 3 specialties, availability badge |
| `CleanerListFilters.tsx` | Service multi-select, max distance {5/10/15/25}, min rating tiers, hourly range, availability window |
| *(optional)* `EmptyStates.tsx` | Split **no-results** vs **no-coverage** |
| `CleanerProfileHero.tsx` | WF 7 header |
| `MatchScoreCard.tsx` | “Why am I seeing this cleaner?” |
| `ReviewsList.tsx` | Last 5 reviews **or** empty placeholder until Phase 6f |
| `FavoriteButton.tsx` | Heart + optimistic UI |

Master outline additionally suggests **`CleanerServicesList.tsx`**, **`CleanerStatsBar.tsx`**, **`BadgesPlaceholder.tsx`** — fold into profile page if not standalone.

### 7.2 `src/features/customer/dashboard/`

| Component | Responsibility |
|-----------|----------------|
| `DashboardHero.tsx` | Welcome + highlights |
| `PastBookingsList.tsx` | Empty until Phase 6 |
| `RecentCleanersList.tsx` | Empty until bookings exist (Gotcha J) |
| `FavoritesPreview.tsx` | Top 3 favorites + link to `/favorites` |

---

## 8. Sub-phase build order (Goal / Design / Build / Verify)

### 8.1 Parallel **Section 0** — External setup

- **Goal:** Geocoding API ready.
- **Design:** Provider choice finalized.
- **Build:** GCP + env + integration doc + `.env.example`.
- **Verify:** Test curl/HTTP geocode succeeds; key restricted.

### 8.2 **5a** — Geocoding + migration (~3 days)

- **Goal:** Coords on addresses; distance works.
- **Design:** Async geocode vs blocking; retry policy; excluding null coords from browse.
- **Build:** `0014`, google-maps lib, backfill job, extend `createAddress` to trigger async geocode.
- **Verify:** Migration applies; indexes exist; distances sane; backfill succeeds on dev data.

### 8.3 **5b** — Homepage + browse (~5 days)

- **Goal:** WF 1 + WF 8 + waitlist UX.
- **Design:** Pagination vs infinite scroll; mobile filter sheet; default filters (outline: distance 25mi, rating ≥4.5, all services); sort modes.
- **Build:** Routes + discovery queries + filters + cards + **`serviced_areas` pre-check** for no-coverage.
- **Verify:** Perf <2s end-to-end; empty vs no-coverage correct; filters AND correctly; mobile 360px; pagination.

### 8.4 **5c** — Match Score (~5 days)

- **Goal:** Deterministic server ranking + transparency payloads.
- **Design:** Tune parameters later; tie-breakers frozen in code/comments.
- **Build:** `match-score.ts`, wire default sort into browse + homepage recommendations.
- **Verify:** Factors visible in UI; deterministic; inspect network/responses expose **breakdown**, not constants.

### 8.5 **5d** — Profile (~3 days)

- **Goal:** WF 7 complete UX.
- **Design:** Sensitive field boundary; sticky CTA; Phase 7 badge placeholders.
- **Build:** `[id]` page + hero + services/stats blocks + MatchScoreCard + ReviewsList placeholder + badges placeholder + book CTA → Phase 6 route (or `/app/cleaners/.../book` placeholder).
- **Verify:** Correct data loading; sticky CTA; mobile; navigation from browse; **browse filter state optional on back** — implement via query/session if required by spec wording.

### 8.6 **5e** — Dashboard + favorites (~3 days)

- **Goal:** WF 11 + WF 25.
- **Design:** Ship dashboard if cutting scope; optimistic favorite toggle; hard-delete favorites exception documented in code comments.
- **Build:** `0015`, `/dashboard`, `/favorites`, `toggleFavorite`, share `FavoriteButton` on cards/profile.
- **Verify:** RLS isolation; optimistic toggle; favorites list correctness.

### 8.7 **5f** — Closeout (~1 day)

- **Goal:** Tagged `phase-5-complete`.
- **Build:** `docs/phases/phase-5-progress-update.md`.
- **Verify:** Execute spec Section 9 walkthrough **on production**; screenshots; lint/typecheck/build green; regenerate `database.types.ts` after migrations (`pnpm supabase gen types typescript` per AGENTS.md).

---

## 9. Acceptance criteria traceability (spec §2 ↔ build)

Copy this table into `phase-5-progress-update.md` and tick with evidence URLs/screenshots:

| Bucket | Criteria count | Evidence type |
|--------|----------------|-----------------|
| WF 1 Homepage | 4 bullets | Screenshots `/` |
| WF 8 Browse | 11 bullets | Screenshots + query logs/timing |
| Match Score | 5 bullets | Unit tests / deterministic snapshots + UI |
| WF 7 Profile | 8 bullets | Screenshots `/cleaners/[id]` |
| WF 11 Dashboard | 4 bullets | Screenshots `/dashboard` |
| WF 25 Favorites | 4 bullets | Screenshots + RLS SQL checks |
| Cross-cutting | 8 bullets | Geocode samples, Lighthouse/mobile, lint/build |

---

## 10. Out of scope (do not slip in)

Booking (Phase 6), real reviews (Phase 6f), availability calendar UI (Phase 6c — factor 3 handles missing gracefully), tier/insurance badge truth (Phase 7), SEO public profiles (Phase 10), keyword search, saved searches, recommendation ML from bookings (post-launch).

---

## 11. Consolidated gotchas checklist

- [ ] **A:** Algorithm server-only — no weights/constants in client bundles or API payloads.
- [ ] **B:** Geocode async — never fail address UX on Google outages.
- [ ] **C:** Customer reads **`cleaner_profiles_public`** — never widen columns without intentional review.
- [ ] **D:** Cold-start window is **approval-based**, not gaming-friendly (document cleaner-facing later).
- [ ] **E:** Browse perf — indexes, `.limit()`, measure before Redis.
- [ ] **F:** **Two** empties — filter miss vs ZIP not serviced.
- [ ] **G:** Public/unauth profile deferred to Phase 10.
- [ ] **H:** Favorites = **hard delete** (document exception).
- [ ] **I:** Tie-breakers deterministic.
- [ ] **J:** Recent cleaners empty pre-Phase-6 — intentional empty state.

---

## 12. Open questions (carry into kickoff — from master outline §Open questions)

1. Final numeric weights/multipliers acceptable for seed data volume?
2. Cold-start thresholds (60d / <10 jobs) correct for marketplace stage?
3. Default filter presets match target customers?
4. Is **cutting WF 25** acceptable if slipping?
5. Google vs Mapbox final decision?

---

## 13. Canonical spec sources in repo

Place the three authoring documents in-repo when ready:

- `docs/phases/phase-5-spec.md`
- `docs/phases/phase-5-explainer.md`
- `docs/phases/phase-5-master-outline.md`

This **build guide** is the fourth file: condensed execution view + traceability without replacing the originals.

---

**Last generated:** synthesized from Phase 5 spec, explainer, and master outline provided for implementation planning.
