# Phase 5 — Implementation Blueprint

This document expands **`phase-5-build-guide.md`** into a detailed plan: **what must be designed**, **what must be built**, and **how** each piece is implemented. It stays aligned with **`phase-5-spec.md`**, **`phase-5-explainer.md`**, and **`phase-5-master-outline.md`**. Canonical acceptance language remains in the spec (Section 2); this blueprint adds execution detail.

---

## How to use this document

| Role | Use it to… |
|------|-------------|
| **Engineering** | Sequence work, name files, avoid scope creep, satisfy gotchas explicitly. |
| **Design / PM** | See which UX surfaces need mocks, copy, and mobile behavior before build. |
| **QA / closeout** | Map verification steps back to spec bullets and production evidence. |

**Convention in each subsection:** **Design** → **Build** → **How (approach)** → **Verify**.

---

## 1. Analysis of the build guide (structure & risks)

The build guide correctly orders work around **data first** (geocoding + Postgres distance + safe public projection), then **browse UI**, then **ranking transparency**, then **profile**, then **dashboard/favorites**.

**Strengths:**

- Clear separation of migration `0014` (distance + browse safety) vs `0015` (favorites RLS).
- Match Score documented as **server-only** with a transparency payload that omits weights (Gotcha A).
- Explicit **two empty states** (no filter matches vs ZIP not serviced) — easy to regress.
- Routing note forces a deliberate decision between spec’s `(app)/page.tsx` and the repo’s possible `(app)/app/...` shell.

**Primary risks this blueprint mitigates:**

1. **`cleaner_profiles` RLS** today is cleaner-self-only (`0012`); Phase 5 must add **authenticated customer read paths** without exposing PII. The view + policies must be implemented together and tested under RLS, not only as superuser SQL.
2. **Column drift:** Spec examples may not match actual `cleaner_profiles` / join tables — the view and TS types must mirror **`src/types/database.ts`** after **`pnpm supabase gen types typescript`** post-migration.
3. **Geocoding coupling:** Blocking UX on Google failures violates Gotcha B; the async enqueue pattern must be part of address mutation from day one.

---

## 2. Executive summary — expanded obligations

### 2.1 Design

- **Information architecture:** Single authenticated customer “home,” browse, profile detail, dashboard, favorites, optional waitlist — URLs finalized after routing reconciliation (build guide §3 note).
- **Trust UX:** Match Score explained per cleaner in context (browse + profile) without revealing internal constants.
- **Mobile:** All listed surfaces usable at ≥360px; filter UX needs a documented pattern (sheet vs full-page).

### 2.2 Build

- Postgres: `earthdistance`, helper `distance_miles`, indexes, **`cleaner_profiles_public`**, RLS adjustments, favorites table policies.
- Application: `src/lib/google-maps/*`, discovery + dashboard feature folders, Thin **App Router** pages in `src/app/...`.
- Jobs: Backfill script for missing coordinates.
- Ops/docs: Integration setup doc, env template updates.

### 2.3 How

- Implement in sub-phase order **Section 0 → 5a → 5b → 5c → 5d → 5e → 5f** (see §10), overlapping only where safe (e.g. types shared early).
- Keep algorithm and ranking on the **server** (Server Actions / route loaders / RPC-style queries — never `'use client'` computation of weights).

### 2.4 Verify

- Production walkthrough per spec §2; saved evidence in `phase-5-progress-update.md`.
- `pnpm lint`, `pnpm typecheck`, `pnpm build` green after `database.types` regeneration.

---

## 3. Dependencies & prerequisites — detailed

### 3.1 Product / data (build guide §2.1)

| Item | Design | Build | How | Verify |
|------|--------|-------|-----|--------|
| Approved cleaners + `cleaner_profiles` | Seed personas (tier spread, specialties, ZIPs) | Seed SQL or staging script; ensure applications `approved` | Use Phase 4 approval path or admin tooling; document seed IDs | Count query: N cleaners with public-visible fields populated |
| Customer addresses + default | At least one service address per test customer | Phase 3a tables + UI already create rows | Confirm `is_default` (or equivalent) semantics in schema | Integration test: customer has default lat/lng after geocode path |
| 5–10 test cleaners | Variety for distance/rating/specialty matrices | Scripts / manual inserts | Across multiple ZIP codes; include cold-start-eligible cleaner | Browse filters return non-empty deterministic sets |

### 3.2 Geocoding provider (§2.2, spec §0)

| Item | Design | Build | How | Verify |
|------|--------|-------|-----|--------|
| Provider choice | Document decision (Google recommended) | GCP project, billing, API enable | Restrict key by referrer/IP; separate dev/prod keys if needed | Scripted geocode succeeds; quotas visible in console |
| Env | Naming in `src/lib/env.ts` (zod) | `GOOGLE_MAPS_API_KEY` in `.env.local`, Vercel | Fail fast at startup if required in deployed envs | Deploy preview boot without silent undefined |
| Optional Places | Decide if Phase 5 ship or backlog | `places.ts` stub or full | Shares same GCP project pattern | Manual: autocomplete in address form |

### 3.3 Documentation (§2.3)

| Item | Design | Build | How | Verify |
|------|--------|-------|-----|--------|
| `docs/integrations/google-maps-setup.md` | Outline: billing, APIs, keys, quotas, rotation | Markdown in repo | Same tone as other integration docs | New engineer can configure in one sitting |
| `.env.example` | Placeholder key line | Edit committed template | No real secrets | Example matches `env.ts` schema |

---

## 4. Wireframes, routes & routing reconciliation

### 4.1 Target surfaces (inventory from build guide §3)

| WF | Spec route | Design — what appears | Build — pages / layouts | How | Verify |
|----|-------------|-------------------------|---------------------------|-----|--------|
| **WF 1** | `(app)/page.tsx` | Hero, 4 service tiles, recent bookings stub, top 3 recommendations, browse CTA | Server page imports feature sections | Compose small Server Components; data via `discovery/queries` | Screenshots + data matches ranking |
| **WF 8** | `(app)/cleaners/page.tsx` | Filters (service, distance, rating, price, availability), sort, grid of `CleanerCard`, empties | `searchParams` for shareable filters; optional `loading.tsx` | **AND** semantics for filters; default per master outline | <2s; mobile filter UX |
| **WF 7** | `(app)/cleaners/[id]/page.tsx` | Hero, stats, services, badges placeholder, reviews placeholder, **`MatchScoreCard`**, sticky book CTA | Dynamic segment; validate UUID/slug per schema | Fetch row from **`cleaner_profiles_public`** + joins | No PII leak; sticky CTA |
| **WF 11** | `(app)/dashboard/page.tsx` | Sections: active/past bookings empty, favorites preview, recent cleaners empty | Dashboard feature folder | Honest empty states (Gotcha J) | Screenshots |
| **WF 25** | `(app)/favorites/page.tsx` | List like browse | Uses shared card + unfavorite | RLS tenant isolation | CRUD favorites |
| **Waitlist** | `(app)/waitlist/page.tsx` | Form + success for unserved ZIP | Uses `waitlist_signups` if present in schema; else migrate | Tie to browse “no coverage” CTA | E2E happy path |

### 4.2 Routing reconciliation (mandatory engineering decision)

| Design | Build | How | Verify |
|--------|-------|-----|--------|
| One canonical customer entry URL | Either move WF 1 to `/` under authenticated group **or** keep `/app` and add **redirects** (`next.config` or middleware) **or** document product URL as `/app` and update spec copy | Decide in kickoff; avoid duplicate competing homepages | Single sitemap truth; bookmarks work |

---

## 5. Database — `0014_phase5_geocoding_and_browse.sql`

### 5.1 Row-level goals

| # | Deliverable | Design | Build | How | Verify |
|---|-------------|--------|-------|-----|--------|
| 1 | NULL lat/lng documented | Comments in migration + runbook | Migration does not invent coords | App + backfill own population | Spot-check nullable columns |
| 2 | `earthdistance` extension | Operational note on Supabase limits | `CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE` | No PostGIS for MVP per guide | `SELECT ll_to_earth(...)` works |
| 3 | Partial GiST index on addresses | Index definition on `(latitude,longitude)` earth point | Partial `WHERE deleted_at IS NULL AND lat/lng NOT NULL` | Match actual address column names | `EXPLAIN` uses index for proximity-style filters |
| 4 | `distance_miles(...)` IMMUTABLE SQL function | Numeric precision agreed | Implement with `earth_distance` / meters→miles constant | Single source for SQL + app parity tests | Unit test distances vs known ZIP pairs (approximate) |
| 5 | RLS on `cleaner_profiles` for customers | Policy text matches spec/legal intent | `SELECT` for `authenticated` when application approved & not deleted | Subquery/exists on `cleaner_applications`; keep cleaner self policies | JWT as customer sees only approved others |
| 6 | `cleaner_profiles_public` VIEW | **Whitelist** columns: display, bio, tier, aggregates, badges flags, rates public fields — **exclude** phone, email, exact home street if stored on profile | `CREATE VIEW ...` with explicit column list | Join specialty summary if needed; no accidental `SELECT *` | Attempt to query sensitive columns fails |
| 7 | Optional indexes | EXPLAIN-driven | tier / common filter columns | Add if browse query plans justify | Perf budget met |

### 5.2 Implementation sequence (how migrations are applied safely)

1. Add extension + helper + indexes (transaction).
2. Create view (depends on finalized column list).
3. Add/adjust policies; **test as non-owner roles** immediately after.

### 5.3 Post-migration codegen

Run **`pnpm supabase gen types typescript`**; fix any TS breakage before UI wiring.

---

## 6. Database — `0015_phase5_customer_favorites_rls.sql`

*Prerequisite:* `customer_favorites` (or similarly named) table exists with `customer_user_id`, `cleaner_profile_id`, timestamps — **confirm name and FK** from schema before writing migration.

| Policy | Design intent | Build | How | Verify |
|--------|----------------|-------|-----|--------|
| SELECT | Tenant = owning customer only | Policy using `auth.uid()` → maps to profile | Join through `customer_profiles.user_id` or equivalent | Customer A cannot select B’s rows |
| INSERT | Same scope | WITH CHECK mirrors USING | Prefer FK to `cleaner_profiles` | Duplicate favorite handled gracefully (unique constraint + UX) |
| DELETE | Owner only; **hard delete** exception | Explicit `DELETE` policy; code comment cites AGENTS vs soft-delete | `toggleFavorite` uses delete, not tombstone | Row gone; audits considered |

---

## 7. Match Score — full implementation contract

**Module:** `src/features/discovery/match-score.ts` (server-importable only — import from Server Components / server actions / route handlers only).

### 7.1 Data inputs — design

| Input | Source | Notes |
|------|--------|--------|
| Cleaner public projection | View + joins | Prefer pre-joined DTO prepared in `queries.ts` |
| Customer default coords | Addresses table | Must be non-null for distance factor; exclude cleaners without home coords |
| Requested services / filters | Browse `searchParams` / homepage preset | Specialty match aligns to filter intent |
| Customer ZIP | From default address string or dedicated column | For ZIP-lock badge multiplier |
| Approval / tenure | From profile or applications | Cold-start eligibility window |

### 7.2 Factor implementation — build & how

| # | Factor | Build (functions) | How |
|---|--------|-------------------|-----|
| 1 | Distance | Pure fn `(miles) => clamped_linear` | `1 - miles/25` clamp [0,1]; miles from SQL `distance_miles` OR precomputed server-side identical to SQL |
| 2 | Tier | Map enum → numeric | Uses **exact** DB enum literals; centralized map for testability |
| 3 | Availability | Float 0–1 until Phase 6c | Neutral **1** or configurable constant; document in transparency as “until schedule connected” |
| 4 | ZIP-locked badge | Multiplier ×1.5 / ×1.0 | Depends on badge representation in schema |
| 5 | Specialty | ×1.2 / ×1.0 | Set intersection specialty tags vs requested service types |
| 6 | Cold-start | ×1.3 / ×1.0 | `jobs < 10` AND approved within 60 days (use deterministic approval timestamp column) |

### 7.3 Combine, normalize, sort — build & how

| Step | Build | How |
|------|-------|-----|
| Base weighted sum | `base = distance*0.4 + tier*0.3 + availability*0.3` | Unit tests snapshot |
| Raw | `base * zip * specialty * coldStart` | No premature rounding |
| Display | Normalize to **0–100** integer or 1 decimal | Monotonic preserve ordering |
| Tie-break | Stable sort comparator | Jobs DESC → created/approval ASC (**document column**) |

### 7.4 Transparency payload — design constraints (Gotcha A)

**Include:** Human labels per factor (“Closer to you”, “Experience tier”, …), **relative strength** buckets (high/medium/low) or normalized subscores suitable for UX, optional short explanation strings.

**Exclude:** Weight values (`0.4`, …), multiplier constants (`1.3`, …), formula text replicating internals.

### 7.5 Testing strategy

| Test type | Responsibility |
|-----------|----------------|
| Unit | Pure functions per factor + combine + tie-break equality |
| Property-ish | Same inputs → same outputs (determinism) |
| Integration | Query ordering matches sort comparator snapshot on seeded DB |

---

## 8. Geocoding & addresses — Section 5a detail

### 8.1 Library layout (`src/lib/google-maps/`)

| File | Design | Build | How | Verify |
|------|--------|-------|-----|--------|
| `client.ts` | Single place for API base, key injection, timeouts | Thin wrapper | Reads validated env only | Throws controlled errors internally; never exposes key |
| `geocoding.ts` | Normalize Google response → `{ lat, lng, placeId? }` | Parse + narrow types | Map Google status codes → retry vs dead-letter | Fixtures in unit tests |
| `places.ts` (optional) | Autocomplete UX contract | Separate from Required geocode path | Behind feature flag or Phase 5 stretch | Manual QA |

### 8.2 Async enqueue pattern (Gotcha B)

| Step | Build | How |
|------|-------|-----|
| Address INSERT success | Persist row immediately | Phase 3a `createAddress` (or sibling) kicks background work |
| Enqueue geocode | `queueMicrotask` / DB “pending geocode” / serverless-compatible pattern | Prefer **explicit job row** `geocoding_status` (`pending`|`ok`|`failed`) if not present — extend migration |
| Retry | Exponential backoff with max attempts | Cron or `backfill-geocoding` picks up stalled |
| User browse | Exclude NULL coords cleaners | `.not('latitude', 'is', null)` joins |

### 8.3 Backfill job (`src/server/jobs/backfill-geocoding.ts`)

| Design | Build | How | Verify |
|--------|-------|-----|--------|
| One-time crawl | CLI or script invoked with service role credentials | Reads addresses missing coords where appropriate | Rate-limit + respect Google QPS |
| Operational runbook | Document in integrations doc | Run on dev staging first | Row counts updated; failures logged |

**Security:** Never log raw addresses fully if policy forbids (AGENTS §14); prefer IDs + hashed or truncated forms in logs.

---

## 9. Feature modules — file-by-file build plan

### 9.1 `src/features/discovery/`

| File / folder | Design | Build | How |
|---------------|--------|-------|-----|
| `queries.ts` | Read-only accessors returning DTOs with distance + breakdown | **`from('cleaner_profiles_public')`**, parameterized filters | Postgres filters push max work; pagination (`range`) |
| `actions.ts` | Mutations returning `{ ok, error }` | `toggleFavorite` | `revalidatePath` on success |
| `validation.ts` | Zod mirrors URL params | Coerce enums, bounded radius | Same schema reused in loader + UI |
| `types.ts` | `BrowseFilters`, `SortMode`, `MatchScoreTransparency` types | Exported named types only | Consume in components |
| `match-score.ts` | Pure algo | Imports only other pure modules | forbid client bundle (lint rule optional) |
| `components/HomepageHero.tsx` | WF1 header | Stateless where possible | |
| `components/ServiceCatalog.tsx` | Four tiles linking to filtered browse/searchParams | Accessible buttons/links | |
| `components/CleanerCard.tsx` | Contract from spec WF8 | Compose `FavoriteButton`, distance, rating stars | |
| `components/CleanerListFilters.tsx` | Controlled from URL (`searchParams`) | Mobile sheet variant | Debounce hourly range minimally |
| `components/EmptyStates.tsx` | Two distinct visuals | Routed by `serviced_areas` pre-check branch | Copy per spec strings |
| `components/CleanerProfileHero.tsx` | WF7 top | Responsive image | |
| `components/MatchScoreCard.tsx` | Consumes transparency DTO only | Explain copy from product | |
| `components/ReviewsList.tsx` | Last 5 placeholder | Empty state until Phase 6f | |
| `components/FavoriteButton.tsx` | Optimistic UI | Rolls back on error | Uses server action |

**Optional composites from master outline:** `CleanerServicesList.tsx`, `CleanerStatsBar.tsx`, `BadgesPlaceholder.tsx` — split if profile grows past ~200 lines TSX.

### 9.2 `src/features/customer/dashboard/`

| Component | Design | Build | How |
|-----------|--------|-------|-----|
| `DashboardHero.tsx` | Welcome + quick links | Read display name via server | Avoid PII leakage |
| `PastBookingsList.tsx` | Empty state | Skeleton optional | Stub query hook for Phase 6 |
| `RecentCleanersList.tsx` | Explicit empty messaging (Gotcha J) | Neutral card | |
| `FavoritesPreview.tsx` | Join favorites top 3 + link `/favorites` | Reuse card | |

---

## 10. Sub-phases — Goal / Design / Build / Verify (expanded)

### 10.1 Section 0 — External setup

| Phase | Goal | Design | Build | Verify |
|-------|------|--------|-------|--------|
| 0 | Reliable geocoding & secrets | GCP project layout & key rotation docs | Credentials + env docs | HTTP geocode succeeds under restrictions |

### 10.2 5a — Geocoding + migration (~3 days)

| Phase | Goal | Design | Build | Verify |
|-------|------|--------|-------|--------|
| 5a | Coords populate; distance infra live | Retry & status columns | `0014`, libs, enqueue, backfill script | Indexes present; bounded round-trip distance sane |

### 10.3 5b — Homepage + browse (~5 days)

| Phase | Goal | Design | Build | Verify |
|-------|------|--------|-------|--------|
| 5b | WF1 + WF8 + waitlist | Pagination strategy; defaults | Routes, queries, filter UX, **`serviced_areas`** branch | Perf + mobile + BOTH empties |

### 10.4 5c — Match Score (~5 days)

| Phase | Goal | Design | Build | Verify |
|-------|------|--------|-------|--------|
| 5c | Server ranking everywhere | Transparency DTO finalized | Algorithm + wired sorts + homepage top 3 | No constants in payloads; deterministic tests |

### 10.5 5d — Profile (~3 days)

| Phase | Goal | Design | Build | Verify |
|-------|------|--------|-------|--------|
| 5d | WF7 complete | Sticky CTAs breakpoints | Profile page + overlays + placeholders | Navigate from browse; optional filter restore via query/session if required |

### 10.6 5e — Dashboard + favorites (~3 days)

| Phase | Goal | Design | Build | Verify |
|-------|------|--------|-------|--------|
| 5e | WF11 + WF25 | Favorite optimistic UX vs server truth | `0015`, pages, toggle | Hard delete semantics; RLs |

### 10.7 5f — Closeout (~1 day)

| Phase | Goal | Design | Build | Verify |
|-------|------|--------|-------|--------|
| 5f | Shippable Phase 5 | Evidence checklist | Progress doc updates | Prod walkthrough screenshots; CI green |

---

## 11. Acceptance criteria traceability — how each bucket is satisfied

Maps build guide §9 to concrete evidence:

| Spec bucket | Design proof | Code proof | Runtime proof |
|-------------|--------------|------------|---------------|
| WF1 | Wireframe annotated | SSR components list | Screenshots URLs |
| WF8 | Interaction spec defaults | Loader uses SQL filters + EXPLAIN archived | Lighthouse optional + timing |
| Match Score | Transparency copywriting | Tests + middleware inspection | Responses JSON audited |
| WF7 | Sticky behavior spec CSS | Snapshot tests layout | Screenshots sticky |
| WF11/J | Explicit empty mocks | Queries return [] OK | Screenshots dashboard |
| Favorites | Abuse cases | Policies in repo | JWT cross-attempt SQL |
| Cross-cutting | Responsive checklist | Lint/type/build | Prod deploy artifact hash |

Populate rows in **`docs/phases/phase-5-progress-update.md`** with links.

---

## 12. Out of scope — guardrails during implementation

**Do not merge under Phase 5 label:** Booking flows (Phase 6), persisted reviews aggregation (Phase 6f UI real data), calendars (Phase 6c UI), truthful Phase 7 badge verification, SEO public SSR profiles (Phase 10), elastic/keyword search, saved searches ML recommendations.

Guardrail: Flag PRs referencing `book/` completion or payment as out-of-phase.

---

## 13. Gotchas — implementation responses

| ID | Translation to engineering task |
|----|--------------------------------|
| **A** | Split `MatchScorePublic` vs `MatchScoreInternal` types; ESLint forbid importing internal in `'use client'` files (optional). |
| **B** | Mutation path returns success independent of Google; statuses drive retries. |
| **C** | All customer discovery reads go through **`cleaner_profiles_public`** in `queries.ts` — code review checklist. |
| **D** | Document cold-start thresholds in transparency copy + internal ADR snippet in `puretask-decisions.md` if behavior novel. |
| **E** | Add `.limit()`, measure p95 latency before infra (Redis defer). |
| **F** | Central `resolveBrowseEmptyStateReason()` branching function with tests. |
| **G** | No ISR public profile routes without Phase 10 spec. |
| **H** | Comment + migration note on hard-delete favorites exception. |
| **I** | Comparator extracted + reused in browse + homepage query ordering. |
| **J** | Dashboard recent cleaners intentional empty illustration + concise copy block. |

---

## 14. Open questions — resolution before merge of 5b/5c

| # | Decision needed | Recommendation process |
|---|----------------|------------------------|
| 1 | Weights/multipliers sanity | Simulate on seed cleaners; stakeholder sign-off numeric range |
| 2 | Cold-start thresholds | Competitive review + fairness note |
| 3 | Default filter presets | UX test 3–5 real NorCal ZIP personas |
| 4 | WF25 slip | Tag issue `phase-5-deferred`; hide nav entry if deferred |
| 5 | Provider lock | GCP vs Mapbox cost table at 100k geocodes/mo assumption |

---

## 15. Document map

| Document | Purpose |
|----------|---------|
| `phase-5-spec.md` | Authoritative WHAT + acceptance |
| `phase-5-explainer.md` | Rationale narrative |
| `phase-5-master-outline.md` | Executive structure / checklist |
| `phase-5-build-guide.md` | Condensed sequencing + inventories |
| **This blueprint** | Design/build/how detail per subsection; **Appendix A** = spec §2 one-row traceability |

---

## Appendix A — `phase-5-spec.md` §2 acceptance checklist (one row per bullet)

Use **`AC-ID`** columns when ticking **`docs/phases/phase-5-progress-update.md`** (copy rows or reference IDs). Canonical wording remains in **`phase-5-spec.md` §2**; summaries here stay short **for traceability only**.

**Coverage:** **40** rows — one per unchecked bullet in **`phase-5-spec.md` §2** (WF 1 ×4, WF 8 ×10, Match Score ×5, WF 7 ×5, WF 11 ×4, Favorites ×4, Cross-cutting ×8).

---

### WF 1 — Customer homepage (`phase-5-spec.md` §2)

| AC-ID | Summary (mirror spec §2) | Design | Build | How | Blueprint refs | Closeout evidence |
|-------|-------------------------|--------|-------|-----|----------------|-------------------|
| **WF1-01** | Service catalog: Standard, Deep, Move-Out, Airbnb Turnover | 4 tiles: labels, hierarchy, navigation target (browse presets) | `ServiceCatalog.tsx` + homepage layout | Tiles link/deep-link with `searchParams`; auth-only page | §4 WF1 · §9.1 · §10.3 5b | Screenshot authenticated home showing four tiles + correct URLs |
| **WF1-02** | Recent bookings: last **3**, empty state for new customers | Empty vs partial list states; typography | Component + stub query Phase 6 | Server query returns ≤3 rows; skeleton optional | §4 WF1 · §9.2 · §10.3 5b | Screenshot new customer empty; optional seeded user with fake rows later |
| **WF1-03** | Recommended cleaners: **top 3** by Match Score vs **default address** | Card layout parity with browse; loading | Homepage query wraps same ranking as §7 + default coords | Exclude null-coord cleaners; tie-break §7 | §4 WF1 · §7 · §10.4 5c | Screenshot 3 cards; sanity log/order matches browse default sort snapshot |
| **WF1-04** | “Browse all cleaners” → list | Primary CTA placement | Hero/link to `(app)/cleaners` (path per routing decision §4.2) | Single canonical route | §4 WF1 · §4.2 | Screen recording navigate; URL matches reconciliation doc |

---

### WF 8 — Cleaner list (`phase-5-spec.md` §2)

| AC-ID | Summary (mirror spec §2) | Design | Build | How | Blueprint refs | Closeout evidence |
|-------|-------------------------|--------|-------|-----|----------------|-------------------|
| **WF8-01** | Load **\<2s** default filters / home ZIP | Perf budget UX (skeleton vs blocking) | SQL + indexes `.limit()`, avoid over-fetch | `EXPLAIN ANALYZE` archived; realistic prod-like data volume | §5 indexes · §7 · §13 E,F · §10.3 5b | HAR/network timing screenshot or scripted p95 \<2s on prod |
| **WF8-02** | Filter **service type** (multi-select) | Multi-select UX; URL encoding | Zod schema + SQL ` overlaps ` / junction join | **`AND`** with other filters | §9.1 validation · §10.3 | Screenshot + query param serialization |
| **WF8-03** | Max distance **5/10/15/25 mi** | Control pattern (radio or segmented) | Server applies `distance_miles` cutoff | Harmonize SQL distance with algo miles | §5 · §7 F1 · §10.3 | Screenshot + SQL distance spot-check |
| **WF8-04** | Min rating **4.5+ / 4.7+ / 4.9+** | Presets | Filter on aggregated rating column or view field | Decide source of rating (Phase 6 may refine) | §4 WF8 · §9.1 | Screenshot presets changing result set |
| **WF8-05** | **Hourly** price range | Range inputs; validation bounds | BETWEEN on cents BIGINT | Mirrors money rules from AGENTS | §9.1 | Screenshot extremes + edge empty |
| **WF8-06** | **Availability window** filter | Interpretation until Phase 6c calendar | Neutral pass-through or pragmatic stub | Transparency factor 3 already neutral/default per §7 | §7 F3 · §10.3 | Document chosen stub in progress note + screenshot behavior |
| **WF8-07** | Sort: Match (**default**), distance, rating, price | Persist sort in URL | Server-side `order by` branches | Same comparator as homepage for Match | §7 · §10.4 | Demo each sort altering order deterministically |
| **WF8-08** | Card: **name, photo, rating, hourly, distance, top 3 specialties, “Available [day]”** | Card system shared with favorites | `CleanerCard.tsx` | Data from **`cleaner_profiles_public`** + joins; availability copy until Phase 6c per §WF8-06 row | §4 WF8 · §9.1 · §13 C | Screenshot card annotated |
| **WF8-09** | Empty when **filters** exclude all: copy **“No cleaners match…”** | Visual distinct from coverage empty | `EmptyStates.tsx` branch | Returned when serviced but query empty **after filters** | §9.1 · §13 F · §10.3 | Production screenshot captioned **filter empty** |
| **WF8-10** | No-coverage (**unserved ZIP**) + waitlist CTA copy | Messaging + UX flow | **`serviced_areas`** pre-check + `/waitlist` link | Same `resolveBrowseEmptyStateReason()` branch as §13 F | §4 waitlist · §13 F · §10.3 | Prod screenshot **ZIP not serviced** path |

These two correspond to **`phase-5-spec.md` §2** ninth and tenth bullets under Cleaner list (**WF 8**).

---

### Match Score — Algorithm (`phase-5-spec.md` §2)

| AC-ID | Summary (mirror spec §2) | Design | Build | How | Blueprint refs | Closeout evidence |
|-------|-------------------------|--------|-------|-----|----------------|-------------------|
| **MS-01** | **All 6 factors** contributing | Transparency labels per factor map 1–1 | `match-score.ts` + DTO wiring | Factors per §7.2 incl. stubs documented | §7 · §11 | Unit test snapshot + transparency UI screenshot |
| **MS-02** | **Deterministic** rank | Freeze tie-break §7 | Pure functions + stable SQL order | Comparator reused browse + WF1 | §7.3 · §13 I · §14 Q1–2 | Re-run compares identical output |
| **MS-03** | **Normalized display** (~0–100) | Decide integer vs decimal UX | Normalize after raw combine | Ordering unchanged by monotonic map | §7.3 · §11 | Screenshot displaying score + assertions |
| **MS-04** | Scores refresh when cleaner data updates | Invalidate cache/tag or rely on SSR no-store | Prefer `revalidatePath`/`Tag` patterns | No indefinite caching of leaderboard rows | §7 · §13 E | Demonstrate tier change reorder after edit (staging) |
| **MS-05** | Cold-start (**\<10 jobs** boost / spec “first **10 jobs** visibility”) | Customer-facing wording does not imply pay-to-win | Multiply per §7.2 F6 threshold | Tie to approval timestamp §7 column choice | §7 · §13 D · §14 Q2 | Test fixture cleaner toggles multiplier boundary |

---

### WF 7 — Cleaner profile (`phase-5-spec.md` §2)

| AC-ID | Summary (mirror spec §2) | Design | Build | How | Blueprint refs | Closeout evidence |
|-------|-------------------------|--------|-------|-----|----------------|-------------------|
| **WF7-01** | Full header/stats grid: bio, services, hourly, languages, response, completion%, jobs, rating, review count | Information hierarchy responsive | `[id]` page + `CleanerProfileHero` + stats/services blocks | Populate only from whitelist view + safe joins | §4 WF7 · §5 view · §9.1 · §13 C | Mobile + desktop screenshots |
| **WF7-02** | **Last 5 reviews** (Phase 6f OK empty) | Placeholder typography | `ReviewsList.tsx` + query stub | Returns [] gracefully until bookings/reviews Phase 6f | §9.1 · §12 out-of-scope | Empty state screenshot; optional seeded staging later |
| **WF7-03** | **Transparency** card factor contributions | UX copy buckets (no constants) | `MatchScoreCard.tsx` | Uses **public DTO only** Gotcha **A** | §7.4 · §13 A | Inspect network JSON free of weights + screenshot UI |
| **WF7-04** | Sticky **“Request to book”** | Accessible fixed/floating bar styling | Phase 6 placeholder route/link | SSR safe link target documented | §4 WF7 · §10.5 | Scroll GIF/video sticky visible |
| **WF7-05** | **Badges placeholders** Background / ZIP / Insurance | Visual chips muted “coming soon” | `BadgesPlaceholder.tsx` integration | Clearly non-authoritative Phase 7 | §9.1 optional components · §12 | Screenshot chips |

---

### WF 11 — Customer dashboard (`phase-5-spec.md` §2)

| AC-ID | Summary (mirror spec §2) | Design | Build | How | Blueprint refs | Closeout evidence |
|-------|-------------------------|--------|-------|-----|----------------|-------------------|
| **DB-01** | **Active bookings** empty until Phase 6 | Section scaffold | Query returns [] OK | Transparent copy referencing future phase | §4 WF11 · §9.2 · §13 | Screenshot placeholder |
| **DB-02** | **Past bookings** | Same pattern | Stub query | Mirrors Phase 6 | §9.2 | Screenshot |
| **DB-03** | **Favorites** entry → management | Preview top 3 + link | `FavoritesPreview.tsx` links `/favorites` | Empty → CTA browse | §4 WF25 · §9.2 · §10.6 | Screenshot linking |
| **DB-04** | **Recent cleaners** (prior booked only) empty pre-Phase-6 | Dedicated empty UX | Explicit empty per **Gotcha J** | Avoid fake fillers | §4 WF11 · §9.2 · §13 J | Screenshot intentional empty narrative |

---

### WF 25 — Favorites (`phase-5-spec.md` §2)

| AC-ID | Summary (mirror spec §2) | Design | Build | How | Blueprint refs | Closeout evidence |
|-------|-------------------------|--------|-------|-----|----------------|-------------------|
| **FAV-01** | Favorite from **profile** | Heart affordance accessibility | Server action optimistic | `toggleFavorite` + RLS INSERT | §6 `0015` · §9.1 · §10.6 | Recording start profile favorited row exists |
| **FAV-02** | **Unfavorite** profile + list paths | Confirmation optional | DELETE hard per **Gotcha H** | Duplicate policy clarity | §6 · §13 H | Demo both surfaces |
| **FAV-03** | Favorites **list uses browse card layout** | Reuse `CleanerCard.tsx` composition | Same DTO hydration | Avoid duplicate JSX drift | §4 WF25 · §9.1 | Screenshot parity vs browse grid |
| **FAV-04** | Favorites scoped; **RLS** | Abuse matrix | Postgres policies `0015` | Try cross-customer JWT in SQL/console | §6 · §11 | Policy evidence + failed cross-read log |

---

### Cross-cutting (`phase-5-spec.md` §2)

| AC-ID | Summary (mirror spec §2) | Design | Build | How | Blueprint refs | Closeout evidence |
|-------|-------------------------|--------|-------|-----|----------------|-------------------|
| **CC-GEO-01** | Customer + cleaner home coords + working distance | Operational monitoring | Migration `0014` + async geocode + browse exclusion | Addresses lat/lng not null validated before distance filter | §5 · §8 · §10.2 5a | Rows in DB + screenshot distance on card |
| **CC-GEO-02** | **Backfill** historical NULL coords | Ops runbook | `backfill-geocoding.ts` | Runnable command documented | §8.3 · §3.3 doc | Logs + counts before/after (sanitized) |
| **CC-UX-01** | **≥360px** layouts | Responsive QA checklist breakpoints | Tailwind layout tokens | Chromatic/playwright smoke optional stretch | §3.2 implicitly · §14 Q3 | 360 screenshot capture |
| **CC-SEC-01** | RLS prevents wrong exposure; authenticated profile read sans contact leakage | Threat review | Policies + **`cleaner_profiles_public`** | Automated RLS smoke optional | §5 · §11 · §13 C | JWT tests notes in progress doc |
| **CC-RANK-01** | Ranking **never** client-side algo | Boundary enforcement | Imports server-only algo | Lint / code review | §7 · §13 A | Bundler absent `match-score` in client chunks (spot-check build) |
| **CC-QA-01** | **`pnpm lint` `typecheck` `build`** | CI parity | Scripts pass | Gates before Phase 5 tag | §2.4 · §10.7 5f · AGENTS.md §13 | CI green link / screenshot |
| **CC-REL-01** | Production serves **correct** deploy | Release hygiene | Tagged deploy + env | Hash commit vs Vercel | §10.7 5f | Deployment SHA capture |
| **CC-E2E-01** | Prod path **canonical home** → browse → profile transparency | Scripted walkthrough URL list | Adjust if `/` reconciliation opts to `/app` | Document final URLs in appendix footnote³ | §4.2 · §7.4 · §11 | Narrated screen capture on prod |

**³** If routing reconciliation **§4.2** adopts `/app` instead of `/`, replace first hop in CC-E2E-01 checklist with **`/app` → cleaners → `[id]`** and record that decision next to WF1-* rows.

---

**Last updated:** Added Appendix A (**spec §2 one-row traceability**) and clarified WF8 ninth/tenth bullets as filter-empty vs ZIP-coverage. Amend when reconciliation doc finalizes canonical paths.
