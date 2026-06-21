# PureTask Screen Build Spec — wireframes → live app

**The single doc we build from.** It maps every wireframe to a real route, says what already exists, and gives the build order. Source of truth for the UI rebuild.

> **Key fact:** the backend + ~85% of pages already exist and are wired (35 server actions, all major flows live). This is a **re-skin of existing routes to your wireframes + a new mobile shell**, not a from-scratch build.

---

## 1. Locked decisions

- **Design source of truth:** the **HTML wireframes** in `PURETASK-MASTER-FILE/wireframes and b1-b7 docs/` (NOT the Lovable `pure-task-trust` build). Cross-reference brand PDFs (Component Anatomy, Dash Asset Pack) for component details.
- **Styling:** recreate each wireframe's **layout + content + restraint** (clean, minimal, thin borders, whitespace), painted in **Clean Aero Glow** tokens — brand blue `#169af5` reserved for primary actions/accents. Not the heavy gradient/photo treatment.
- **Form factor:** **mobile-first**, responsive up to desktop. Per-role **bottom tab bar** on mobile + **sidebar** on desktop.
- **Bubble/Dash:** merged as a light accent — Dash on empty states + celebration moments; no heavy pop/sound by default.
- **Backend:** keep CLAUDE_PURETASK as the data/money/auth source of truth. **Re-skin only touches presentation + existing data reads/writes.**

## 2. Navigation (from the wireframes)

| Role         | Mobile bottom tabs                               | Desktop                       |
| ------------ | ------------------------------------------------ | ----------------------------- |
| **Customer** | **Home** · **Browse** · **Inbox** · **Profile**  | Sidebar, same items           |
| **Cleaner**  | **Home** · **Jobs** · **Earnings** · **Profile** | Sidebar, same items           |
| **Admin**    | —                                                | Web sidebar/topbar (existing) |
| **Public**   | Top bar (logo + Sign in) + footer link grid      | Top nav                       |

## 3. How to build each screen (the recipe)

1. Open the **wireframe** file → note sections top-to-bottom, content, CTAs, states.
2. Find the **target route** + **existing server action/data** in the matrix below.
3. Rebuild the page UI faithfully with our tokens + shared components (§5). **Keep the existing data wiring** (server action calls, queries) — only the markup changes.
4. `pnpm typecheck && pnpm build` green → PR (one screen or one tight group per PR).

---

## 4. Master screen matrix

Status = current repo state. Action: **Re-skin** (exists, restyle to wireframe) · **Extend** (exists, add wireframe features) · **New** (build).
Routes are the **actual** CLAUDE_PURETASK routes (wireframe "suggested routes" differ — we keep the wired ones).

### Public / Marketing

| Screen             | Wireframe                     | Route                        | Status                   | Action                 | Wave |
| ------------------ | ----------------------------- | ---------------------------- | ------------------------ | ---------------------- | ---- |
| Homepage           | `puretask_mobile_homepage_v2` | `/`                          | BUILT                    | Re-skin ✅ done        | 1    |
| Pricing            | `wireframes_batch4b_batch5a`  | `/pricing`                   | BUILT                    | Re-skin                | 4    |
| About              | `wireframes_batch4b_batch5a`  | `/about`                     | STUB                     | New                    | 4    |
| Help center        | `wireframes_batch4b_batch5a`  | `/help`, `/help/[topic]`     | STUB/BUILT               | Re-skin                | 4    |
| FAQ                | `wireframes_batch4b_batch5a`  | `/faq`                       | STUB                     | New                    | 4    |
| Coverage           | `wireframes_batch4b_batch5a`  | `/coverage`                  | BUILT                    | Re-skin                | 4    |
| City × Service SEO | `wireframes_batch4b_batch5a`  | `/cleaning/[city]/[service]` | PARTIAL                  | Extend                 | 4    |
| Become a cleaner   | `become_a_cleaner_mobile_v1`  | `/for-cleaners`              | PARTIAL                  | Re-skin                | 3    |

### Auth + onboarding

| Screen                   | Wireframe                    | Route                                  | Status | Action  | Wave |
| ------------------------ | ---------------------------- | -------------------------------------- | ------ | ------- | ---- |
| Sign in                  | (batch)                      | `/auth/sign-in`                        | BUILT  | Re-skin | 1    |
| Sign up                  | (batch)                      | `/auth/sign-up`                        | BUILT  | Re-skin | 1    |
| Forgot password          | `wireframes_batch3b_batch4a` | `/auth/forgot-password`                | BUILT  | Re-skin | 1    |
| Email verification (OTP) | `wireframes_batch3b_batch4a` | `/auth/verify-email`                   | BUILT  | Re-skin | 1    |
| Reset password           | —                            | `/auth/reset-password`                 | BUILT  | Re-skin | 1    |
| Push-permission prompt   | `wireframes_batch3b_batch4a` | component/modal                        | —      | New     | 4    |
| Role select              | —                            | `/onboarding/role-select`              | BUILT  | Re-skin | 1    |
| Welcome / cleaner tour   | —                            | `/onboarding/welcome`, `/cleaner-tour` | BUILT  | Re-skin | 3    |

### Customer

| Screen                                                         | Wireframe                          | Route                               | Status         | Backend                              | Action                  | Wave |
| -------------------------------------------------------------- | ---------------------------------- | ----------------------------------- | -------------- | ------------------------------------ | ----------------------- | ---- |
| Dashboard (next clean, rebook, recurring nudge, recent)        | `customer_dashboard_v1`            | `/app/dashboard` (+ `/app`)         | BUILT          | bookings, recurring                  | Re-skin ✅ (PR #54)     | 2    |
| Browse / cleaner list (filters, new, top, all)                 | `customer_cleaner_list_v3`         | `/app/cleaners`                     | BUILT          | discovery, ZIP                       | Re-skin ✅ (PR #55)     | 2    |
| Cleaner profile (bio, stats, gallery, services, reviews, area) | `customer_cleaner_profile_v1`      | `/app/cleaners/[id]`                | BUILT          | profile, reviews                     | Re-skin ✅ (PR #54)     | 2    |
| Booking flow (4-step: When→Details→Payment→Review)             | `customer_booking_flow_v1`         | `/app/cleaners/[id]/book`           | BUILT (1 form) | `createBookingAction`, Stripe        | **Extend → multi-step** | 2    |
| Active job tracking (live timeline + photos)                   | `customer_active_job_v1`           | `/app/bookings/[id]/tracking`       | BUILT          | verification, photos                 | Re-skin ✅ (PR #57)     | 2    |
| Approve & pay (photo review, approve/dispute)                  | `customer_approve_pay_v1`          | `/app/bookings/[id]`                | BUILT          | `approveBookingAction`               | Re-skin ✅ (PR #57)     | 2    |
| Cancel (penalty schedule)                                      | `customer_cancel_v1`               | `/app/bookings/[id]/cancel`         | PARTIAL        | `cancelBookingAction`                | Re-skin                 | 2    |
| Reschedule (+ sent state)                                      | `customer_reschedule_v1`           | `/app/bookings/[id]/reschedule`     | PARTIAL        | `rescheduleBookingAction`            | Re-skin                 | 2    |
| Review prompt (stars + tags + tip + favorite)                  | `customer_review_prompt_v1`        | `/app/bookings/[id]/review`         | BUILT          | `submitReviewAction`, `addTipAction` | Re-skin ✅ (PR #58)     | 2    |
| Tip prompt (standalone)                                        | `customer_tip_prompt_v1`           | `/app/bookings/[id]/tip`            | PARTIAL        | `addTipAction`                       | Re-skin ✅ (PR #58)     | 2    |
| Rebook nudge                                                   | `customer_rebook_nudge_v1`         | `/app/bookings/[id]/rebook` (modal) | —              | `createBookingAction`                | New                     | 2    |
| Dispute filing                                                 | `customer_dispute_filing_v1`       | `/app/bookings/[id]/dispute`        | BUILT          | `fileDisputeAction`                  | Re-skin                 | 2    |
| Messaging thread                                               | `messaging_thread_v1`              | `/app/bookings/[id]/messages`       | BUILT          | `sendMessageAction`                  | Re-skin                 | 2    |
| Inbox (message list — bottom tab)                              | (dashboard tab)                    | `/app/inbox`                        | —              | messages                             | **New (gap)**           | 2    |
| Favorites                                                      | `customer_favorites_v1`            | `/app/favorites`                    | PARTIAL        | `toggleFavoriteAction`               | Re-skin                 | 2    |
| Recurring setup                                                | `customer_recurring_setup_v1`      | `/app/recurring/new`                | BUILT          | recurring                            | Re-skin                 | 2    |
| Recurring management                                           | `customer_recurring_management_v1` | `/app/recurring/[id]`               | BUILT          | recurring                            | Re-skin                 | 2    |
| Settings                                                       | `customer_settings_v1`             | `/app/settings`                     | BUILT          | profile                              | Re-skin                 | 2    |
| Privacy & photos                                               | `customer_privacy_v1`              | `/app/settings/privacy`             | PARTIAL        | `updatePhotoPolicyAction`            | Re-skin                 | 2    |

### Cleaner

| Screen                                                                 | Wireframe                                                | Route                                | Status  | Backend                   | Action  | Wave |
| ---------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------ | ------- | ------------------------- | ------- | ---- |
| Cleaner dashboard (score+tier, next job, week, visibility, badges)     | `cleaner_dashboard_mobile_v1`                            | `/app/cleaner`                       | BUILT   | bookings, score           | Re-skin | 3    |
| Job inbox (new/upcoming/past, accept/decline)                          | `cleaner_job_inbox_mobile_v1`                            | `/app/cleaner/bookings`              | BUILT   | accept/decline            | Re-skin | 3    |
| Active job (timer, photo grid, clock-out)                              | `cleaner_active_job_mobile_v1`                           | `/cleaner/jobs/[id]/active`          | BUILT   | verification, photos      | Re-skin | 3    |
| On my way                                                              | (batch1)                                                 | `/cleaner/jobs/[id]/on-my-way`       | PARTIAL | `startTransitAction`      | Re-skin | 3    |
| Earnings & payouts                                                     | `cleaner_earnings_mobile_v1`                             | `/app/cleaner/earnings`              | BUILT   | payouts                   | Re-skin | 3    |
| Profile detail / editor (bio, languages, specialties, rates, services) | `cleaner_profile_detail_v1`, `cleaner_profile_editor_v1` | `/app/cleaner/settings/profile`      | PARTIAL | profile                   | Re-skin | 3    |
| Settings                                                               | `cleaner_settings_v1`                                    | `/app/cleaner/settings`              | BUILT   | —                         | Re-skin | 3    |
| Insurance upload                                                       | `cleaner_insurance_upload_v1`                            | `/app/cleaner/settings/insurance`    | PARTIAL | `uploadInsuranceDocument` | Re-skin | 3    |
| Tax info                                                               | `wireframes_batch3b_batch4a`                             | `/cleaner/tax-info`                  | BUILT   | `saveTaxInfo`             | Re-skin | 3    |
| Background check                                                       | `wireframes_batch3b_batch4a`                             | `/cleaner/background-check`          | BUILT   | Checkr                    | Re-skin | 3    |
| Score breakdown / tiers / appeal                                       | `wireframes_batch1_v3`                                   | `/app/cleaner/score*`                | BUILT   | score                     | Re-skin | 3    |
| Application (11-step)                                                  | `cleaner_application_mobile_v1`                          | `/app/apply/step/[step]`             | BUILT   | `saveStepAction`          | Re-skin | 3    |
| Profile setup (post-approval checklist)                                | `cleaner_profile_setup_mobile_v1`                        | `/app/cleaner/setup`                 | —       | onboarding                | New     | 3    |
| Dispute response                                                       | `cleaner_dispute_response_v1`                            | `/app/cleaner/bookings/[id]/dispute` | BUILT   | `cleanerRespondAction`    | Re-skin | 3    |

### Admin (existing; re-skin later)

| Screen                                                                                | Wireframe                 | Route      | Status        | Wave |
| ------------------------------------------------------------------------------------- | ------------------------- | ---------- | ------------- | ---- |
| Dashboard, applications, bookings, disputes, support, refund, customer/cleaner detail | `wireframes_batch7_admin` | `/admin/*` | BUILT/PARTIAL | 4    |

### Shared states & components (from `wireframes_batch3b_batch4a`, `_batch4b_batch5a`)

| Item                                                               | Build                          | Wave |
| ------------------------------------------------------------------ | ------------------------------ | ---- |
| Empty states (no bookings / no jobs / no cleaners in ZIP)          | `EmptyState` component         | 1    |
| Error states (payment declined / booking conflict / network / 404) | error boundaries + `not-found` | 4    |
| Loading skeletons (dashboard, list, photo upload)                  | `Skeleton` components          | 1    |

---

## 5. Build first — the shell + shared primitives (Wave 1)

Everything below depends on these, so they come first:

1. ✅ **App shell** (PR #53) — `AppShell` with role-aware `BottomTabBar` (mobile) + `AppSidebar` (desktop) + slim `AppHeader` (brand, notification bell) + `MobileNavDrawer`. Replaces the dark bubble shell in `(app)/layout.tsx`. Customer/cleaner tab sets per §2. Code in `src/components/app-shell/`.
2. ✅ **Design primitives** (PR #53) — added `ListRow`, `SectionHeader`, `Stars`, `MoneyRow`, `StatusBadge`, `Stepper` + dependency-free `cn()`. (`Card`, `Chip`, `Badge`, `Progress`, `EmptyState`, `Skeleton` already existed.)
3. ✅ **Token reconcile** — tokens were already unified ("Clean Aero Glow" in `globals.css`: `brand-50…900`, `neutral-*`, `shadow-tier*`); the shell now paints on the light `neutral-50` canvas instead of the navy bubble scene.
4. Re-skin **marketing home** ✅ done (PR #52) + **auth/onboarding** screens (next in Wave 1) to validate the primitives.

## 6. Build waves

- **Wave 1 — Foundation:** shell (bottom-tabs + sidebar), primitives, token reconcile, marketing home, auth/onboarding entry. _After this the app feels like the wireframes._
- **Wave 2 — Customer funnel:** dashboard → browse → profile → booking (multi-step) → active job → approve/pay → review/tip/rebook → cancel/reschedule → messaging/inbox → favorites → recurring → settings/privacy.
- **Wave 3 — Cleaner app:** dashboard → job inbox → on-my-way → active job → earnings → profile/editor → settings → insurance/tax/background → score → application/setup → dispute response.
- **Wave 4 — Marketing, states, admin:** pricing/about/FAQ/help/coverage/SEO, error/empty/loading states, push prompt, admin re-skin.

## 7. Known gaps / decisions

- **Inbox tab** (customer + cleaner bottom-nav "Inbox") has no unified message-list route yet — add `/app/inbox` (and cleaner equivalent). Backend has per-booking threads to aggregate.
- **Rebook nudge**, **standalone tip**, **cleaner profile-setup checklist**, **push-permission prompt** are in wireframes but thin/absent in the repo → build new.
- **Route names** stay as the repo's wired paths (e.g. `/app/cleaners/[id]`), not the wireframes' shorthand (`/cleaner/[id]`).
- Wireframes are **mobile (360px)**; on desktop, single-column sections widen into the sidebar layout with multi-column grids (cleaner cards, service cards).

## 8. Assets

Dash mascot + hero/segment photos + tier shields available in `pure-task-trust/src/assets` (and copied subset in `public/brand/`). Reuse as **content/imagery** even though layout comes from wireframes. Icons via `lucide-react`.
