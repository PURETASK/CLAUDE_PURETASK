# Wave 4 Build Guide — Public, Admin & Global States (the final wave)

**The single doc we build Wave 4 from.** Bring the last three surfaces onto the design system: the **public/marketing** pages, the **admin** console, and the app's **global states** (errors, 404, loading, empty) — plus the one missing piece, a **push-permission prompt**. Companion to [`screen-build-spec.md`](./screen-build-spec.md) and the Wave 3 guide; same rules.

> **Key facts (from a full repo inventory):**
> - **Design system is mature** — 16 primitives in `src/components/ui/*` (`Card`, `Button`, `Badge`, `ListRow`, `SectionHeader`, `EmptyState`, `StatusBadge`, `TrustCallout`, `Stepper`, `Chip`, `Stars`, `MoneyRow`, `Progress`, skeletons…). Reuse, don't reinvent.
> - **Marketing layout** (`src/app/(marketing)/layout.tsx`) header + footer are already polished. The **home page is done** (PR #52).
> - **Admin is functional but on a topbar nav** — the wireframe (`wireframes_batch7_admin`) wants a **desktop sidebar** shell (sections: main / Directory / Finance / System), dense tables, KPI cards. That shell is the main admin work.
> - **Global states mostly exist** (root `error.tsx` + `not-found.tsx`, app-level `error.tsx`/`loading.tsx`, a few route skeletons) — needs a consistency pass + a couple of additions.
> - **Push-permission prompt is missing** — only a settings toggle (`PushSubscriptionToggle`) exists; the first-run **prompt UI is New**.
> - **Wireframes are sparse** for marketing (only the homepage exists) → this wave is mostly *applying the established system*, not pixel-matching. The admin batch (`wireframes_batch7_admin`, screens 54–60) is the exception — follow it.

---

## 1. Locked decisions (unchanged)

- **Tokens:** Clean Aero Glow; brand blue `#169af5` on primary actions only. Reuse the primitives above + `cn()`.
- **Marketing** pages use the marketing layout chrome (header/footer) — full-bleed sections, `max-w-5xl`/`max-w-3xl` centered, hero + card grids. No app shell.
- **Admin** pages use the admin layout — re-skin it to a **sidebar** shell; keep pages dense and table-first ("function over form", per the wireframe note).
- **Backend untouched.** Presentation only; preserve every server action / query / FormData field. Admin decision/refund/dispute actions are sensitive — verify wiring before editing.
- **Verify** each screen with `tsc` + `eslint` (run the local binaries directly; `pnpm` isn't on PATH). Local `next build` ENOSPCs on the full dev disk → **Vercel is the build check**. For `tsc`, use `NODE_OPTIONS=--max-old-space-size=3072` to avoid the disk-induced OOM (SIGABRT/exit 134).

## 2. Master matrix

Action: **Re-skin** (exists, restyle) · **Extend** (add features) · **New** (build) · **Polish** (already close, minor pass).

### A — Public / marketing
| # | Screen | Route | Status | Action | Batch |
| --- | --- | --- | --- | --- | --- |
| 1 | Home / landing | `/` | DONE (PR #52) | — | — |
| 2 | Pricing | `/pricing` | BUILT (plain) | Re-skin → KPI grid + commission table cards | A1 |
| 3 | About | `/about` | STUB | **New** — hero + pillars + facts | A1 |
| 4 | FAQ | `/faq` | STUB | **New** — accordion Q&A (needs an `Accordion`/`<details>` pattern) | A1 |
| 5 | How it works | `/how-it-works` | BUILT (plain) | Re-skin → customer + cleaner step cards | A1 |
| 6 | Coverage | `/coverage` | BUILT | Re-skin → metro/city status cards (keep its Supabase query) | A2 |
| 7 | Help center | `/help` | PARTIAL | Re-skin → topic cards + popular articles | A2 |
| 8 | Help article | `/help/[topic]` | BUILT (plain) | Re-skin → article layout + back link | A2 |
| 9 | Trust badges ×5 | `/trust/background-checked`, `/neighborhood-expert`, `/specialties`, `/specialty-endorsed`, `/zip-locked` | BUILT | Polish → centered explainer Card (shared component) | A2 |
| 10 | City × Service SEO | `/cleaning/[city]/[service]` | PARTIAL | Extend → hero + cleaner grid + CTA (keep query) | A2 |
| 11 | Become a cleaner | `/for-cleaners` | DONE (Wave 3) | — | — |

### B — Admin console (`wireframes_batch7_admin`, screens 54–60)
| # | Screen | Route | Status | Action | Batch |
| --- | --- | --- | --- | --- | --- |
| 12 | **Admin shell** (sidebar nav: Dashboard/Applications/Bookings/Disputes · Directory: Cleaners/Customers · Finance: Payouts/Refunds · System: Settings/Logs) | `(admin)/layout.tsx` | topbar only | **Re-skin → sidebar** (the keystone) | B |
| 13 | Dashboard (KPIs · GMV sparkline · activity · needs-attention · funnel) | `/admin` | BUILT | Re-skin to wireframe | B |
| 14 | Applications queue (filter pills + table) | `/admin/applications` | BUILT | Re-skin (table) | B |
| 15 | Application detail | `/admin/applications/[id]` | BUILT | Polish | B |
| 16 | Bookings lookup (filter pills + table + pagination) | `/admin/bookings` | BUILT | Re-skin (table) | B |
| 17 | Refund form | `/admin/bookings/[id]/refund` | BUILT | Polish | B |
| 18 | Disputes list + mediation detail | `/admin/disputes`, `/admin/disputes/[id]` | BUILT | Re-skin (table + mediation 2-col) | B |
| 19 | Support list + detail | `/admin/support`, `/admin/support/[id]` | BUILT | Polish | B |
| 20 | Cleaner / customer detail (KPI cards + score history) | `/admin/cleaners/[id]`, `/admin/customers/[id]` | BUILT | Polish | B |

### C — Global states & push
| # | Item | Where | Status | Action | Batch |
| --- | --- | --- | --- | --- | --- |
| 21 | Root error boundary | `src/app/error.tsx` | BUILT | Polish (token pass) | C |
| 22 | Root 404 | `src/app/not-found.tsx` | BUILT | Polish | C |
| 23 | App error boundary | `src/app/(app)/error.tsx` | BUILT | Polish | C |
| 24 | Loading skeletons | `src/app/(app)/**/loading.tsx` + `ui/skeletons.tsx` | BASIC | Polish / unify; add where high-traffic routes lack one | C |
| 25 | Empty states | `ui/empty-state.tsx` | BUILT | Polish copy/icon; ensure reuse | C |
| 26 | **Push-permission prompt** | new `src/components/PushPermissionPrompt.tsx` | — | **New** — dismissible first-run prompt that calls the existing subscribe flow (`PushSubscriptionToggle` logic / `/api/push/subscribe`) | C |

## 3. Genuine new builds
1. **`/about`** (A1) — hero + 3–4 value pillars (Card grid) + a facts/strip section.
2. **`/faq`** (A1) — categorized Q&A using a native `<details>`/accordion pattern (add a small `Accordion` or inline it).
3. **Admin sidebar shell** (B) — the desktop left-nav with grouped sections + active state + count badges (Applications, Disputes). Collapses/hides on mobile (admin is desktop-first).
4. **Push-permission prompt** (C) — a small dismissible banner/modal (localStorage "dismissed" flag) that triggers the browser permission + existing subscribe; reuses `PushSubscriptionToggle`'s subscribe logic.

## 4. Shared components to add (only if reused ≥2×)
- **`Accordion`** (`src/components/ui/accordion.tsx`) — for FAQ (+ reusable on help). Native `<details>` is fine.
- **`AdminSidebar`** (`src/features/admin/components/AdminSidebar.tsx`) — the grouped nav, with active link + badge support.
- **`AdminTable`** primitives or a simple `thead/trow` pattern — optional; the wireframe tables are plain grids, so inline grids may suffice.
- A small **marketing `Section`/`Hero`** wrapper only if the pages repeat the same scaffold enough to warrant it.

## 5. Build order (sub-batches → one PR each, verified)
- **A1 — Marketing core:** pricing · about (new) · faq (new) · how-it-works. _High-visibility public pages._
- **A2 — Marketing rest:** coverage · help + help/[topic] · trust badges ×5 (shared explainer) · city×service SEO.
- **B — Admin:** sidebar shell first (keystone), then dashboard → applications → bookings → disputes/mediation → support → detail pages.
- **C — Global states + push:** error/404/loading/empty polish + the new push-permission prompt.

(If A2 or B get large, split further — keep each PR reviewable. Tick this guide's rows ✅ (PR #) as they land.)

## 6. The build recipe (per screen)
1. Read the page (+ the admin wireframe for B). Note sections, content, CTAs, states, and the existing query/action.
2. Rebuild UI with tokens + primitives. **Preserve all data wiring + FormData keys.**
3. `eslint --fix` the files, then `NODE_OPTIONS=--max-old-space-size=3072 tsc --noEmit`. Green → commit → PR.

## 7. After Wave 4
The full UI rebuild (Waves 1–4) is complete: customer app, cleaner app, public site, admin, and states all on the Clean Aero Glow system. Remaining product work is feature/logic, not design.
