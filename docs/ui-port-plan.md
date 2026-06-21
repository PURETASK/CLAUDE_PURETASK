# PureTask UI Port Plan — adopt the `pure-task-trust` design on the hardened backend

**Goal:** make the live app look and feel like your designed app (`pure-task-trust`, the Lovable build) while keeping the production backend already built in `CLAUDE_PURETASK` (Stripe Connect, manual-capture payments, webhooks, notifications, crons, RLS).

**Status:** plan — agreed direction, not yet executed. Wave 0 (proof) is the first build.

---

## Decisions locked

1. **Navigation → match the design.** Replace the desktop top-header with **mobile bottom-tabs (5 per role) + desktop sidebar**, exactly like `pure-task-trust`.
2. **Bubble layer → merge, don't delete.** `pure-task-trust` is the skeleton and most screens; the existing "bubble experience" becomes a **tasteful personality accent on top**:
   - Keep **Dash** (both apps already use Dash) — present on dashboards, empty states, and celebration moments.
   - Keep gentle **bubble ambience** (floating orbs) on hero/dashboard surfaces.
   - Keep the **pop transition** but **softened**, and **sound OFF by default** (opt-in in settings).
   - Reserve the **full bubble-pop + Dash celebration** for delight moments (booking confirmed, payment released, milestones, tier-ups).
3. **Source of truth = `pure-task-trust`** for layout/screens/brand; `CLAUDE_PURETASK` stays the source of truth for data + money + auth.

## Why this is a port, not a redesign

Both apps are **React + Tailwind + shadcn/ui** and **share the same "Clean Aero Glow" tokens** (Electric Blue `#169af5`, Clean Aqua `#40e8e0`, Anchor Navy `#072a55`, identical tier-1/2/3 navy shadows) **and the same Dash mascot.** So porting transfers as **markup + styles + assets**, with the real engineering in **rewiring data** (Lovable hooks → our Supabase server actions) and the **shell/form-factor**.

**Direct asset reuse** (copy from `pure-task-trust/src/assets` → `CLAUDE_PURETASK/public/brand`):
Dash poses (`dash-hummingbird/front/side/celebrate/silhouette/icon-framed`), hero photos (`spring-cleaning-hero`, `discover-bg`, `auth-split`, `cleaner-hero`, `client-hero`, segment heroes), tier shields, backgrounds.

---

## Waves

### Wave 0 — proof (small)

Port **one screen 1:1** so you can see/approve the direction before the big commit.

- **Chosen screen: marketing home (`/`)** — public, highly visible (it's the page you were looking at), low-risk (mostly static), and it exercises the asset pipeline + the "merge" look. Mirrors `pure-task-trust/src/pages/Index.tsx`: photo hero + proof bar + "why safer" + 4-step process, with a subtle bubble accent + Dash.

### Wave 1 — shell + feel (medium)

- New **app shell**: `BottomTabBar` (mobile, 5 role-aware tabs) + `AppSidebar` (desktop), replacing the top-header bubble shell. Re-tune `AppBubbleShell` into this.
- Settle the **merged bubble**: soften pop, sound off by default, Dash placement.
- Align **display fonts** (Poppins/Outfit for headings, Inter body).
- Ship the Wave 0 home + re-skin the other marketing pages (pricing, for-cleaners, how-it-works).

### Wave 2 — core flows (large)

- **6-step booking flow** (Service → When/Where → Scope → Cleaner → Review → Payment) using the FlowShell pattern, wired to our booking server actions + Stripe.
- **State-rich customer dashboard** (`UpcomingCleaningCard` with empty/future/on-the-way/in-progress/awaiting-approval/urgent states, quick-rebook carousel, wallet snapshot).
- **Discover** grid + **CleanerProfileV2** (availability calendar, reviews, specialties, service-area map).
- **Cleaner dashboard** polish (score cards, tier progress, earnings).

### Wave 3 — breadth (incremental)

Segment landing pages (Families/Airbnb/Retirees/Pros), Cost & Earnings calculators, wallet, loyalty/gamification/referral, help center, admin re-skin.

---

## Screen-by-screen mapping

| `pure-task-trust` screen                         | → CLAUDE_PURETASK route                              | Action                                                            | Wave | Effort |
| ------------------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------- | ---- | ------ |
| `Index` (home)                                   | `(marketing)/page.tsx`                               | Re-skin to photo-hero + proof bar + why-safer + steps             | 0    | S      |
| App shell (bottom-tabs + sidebar)                | `(app)/layout.tsx`, new `BottomTabBar`/`AppSidebar`  | Replace top-header shell                                          | 1    | M      |
| `Auth`                                           | `auth/sign-in`, `auth/sign-up`                       | Re-skin split-hero auth                                           | 1    | S      |
| Marketing: pricing/for-cleaners/how-it-works     | `(marketing)/*`                                      | Re-skin                                                           | 1    | M      |
| `Dashboard` (client)                             | `(app)/app/dashboard`                                | Rebuild state-rich `UpcomingCleaningCard` + quick-rebook + wallet | 2    | L      |
| `Book` (6-step)                                  | `(app)/app/cleaners/[id]/book` (+ new `/app/book`)   | Build FlowShell 6-step, wire to actions+Stripe                    | 2    | L      |
| `Discover`                                       | `(app)/app/cleaners`                                 | Re-skin grid, ZIP bar, filters, favorite hearts                   | 2    | M      |
| `CleanerProfileV2`                               | `(app)/app/cleaners/[id]`                            | Calendar picker, reviews, specialties, map                        | 2    | L      |
| Cleaner `Dashboard`/`Jobs`/`Earnings`/`Score`    | `(app)/app/cleaner/*`                                | Re-skin to design                                                 | 2    | L      |
| `MyCleanings`/`BookingStatus`/`Job`              | `(app)/app/bookings/[id]`                            | Re-skin timeline + actions                                        | 2    | M      |
| `Wallet`                                         | `(app)/app/settings/payment-methods` (+ wallet view) | Build wallet snapshot/escrow view                                 | 3    | M      |
| Segment landings (Families/Airbnb/Retirees/Pros) | new `(marketing)/for-*`                              | Build from design + heroes                                        | 3    | M      |
| Calculators (Cost/Earnings)                      | new `(marketing)/*`                                  | Build                                                             | 3    | S each |
| Loyalty / gamification / referral                | new `(app)/app/*`                                    | Build                                                             | 3    | M      |
| Help center                                      | `(marketing)/help/*`                                 | Re-skin                                                           | 3    | M      |
| Admin (25+ dashboards)                           | `admin/*`                                            | Re-skin to design (keep our data)                                 | 3    | L      |

Effort key: **S** ≈ a focused sitting · **M** ≈ a session · **L** ≈ multi-session. The backend already exists for most of these — effort is UI + data wiring, not new business logic.

---

## Data rewiring notes

`pure-task-trust` reads through Lovable Cloud hooks (`useCleanersByZip`, `useFavoriteActions`, availability blocks, etc.). When porting each screen, swap those for `CLAUDE_PURETASK`'s equivalents:

- Lovable data hooks → our **server actions** / `createSupabaseServerClient` queries.
- Lovable auth → our Supabase auth + `(app)` layout role-gating.
- Lovable storage → our `booking-photos` bucket + storage helpers.
- Stripe: reuse our PaymentIntents (manual capture) + Connect — the design's "Payment" step plugs into existing logic.

Keep each screen's **markup/styles from the design**, its **data from our backend**.

---

## Risks / watch-list

- **Form-factor shift** (top-header → bottom-tabs+sidebar) touches every authed page's chrome — do it once in the shell (Wave 1), not per page.
- **Scope:** `pure-task-trust` has ~40+ screens; not all are launch-critical. Waves 0–2 deliver the experience that matters; Wave 3 is breadth we can pace.
- **Two design dialects of the same tokens** — reconcile to one set in `globals.css` so we don't fork the palette.
- Don't regress the **money/notification/cron** backend while re-skinning — UI changes only touch presentation + data reads/writes already covered by tests.
