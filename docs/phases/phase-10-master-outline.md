# PureTask — Phase 10 Master Outline

**Purpose:** A single navigation document for everything in Phase 10 (notification infrastructure, state component library, marketing pages, polish), organized by sub-phase. Goal / Design / Build / Verify format for each section.

**Status:** Outline-level navigation. Detailed acceptance criteria, specific code, and gotchas live in `phase-10a-spec.md` (and future per-sub-phase specs). The why-behind-every-decision lives in `phase-10a-explainer.md` (and future).

**Phase scope:** Phase 10 is **the platform's final structural layer**. After Phase 9 closes the money operations, Phase 10 wraps everything in production-quality polish: notifications across push + email + in-app, reusable state components for empty/error/loading patterns, public marketing pages with SEO, customer + cleaner tours, support ticketing, accessibility review, and animation refinement. By the end of Phase 10, the platform is feature-complete and ready for sustained customer acquisition.

**Phase duration estimate:** ~6-7 weeks of focused engineering across 4 sub-phases. Some natural parallelism: 10b (state library) can run in parallel with 10a (notifications) after Day 3 of 10a; 10c (marketing) can run independently of 10a/10b.

**Phase depends on:**
- Phase 6/7/8/9 sub-phases producing notification stub trigger points (replaced by real dispatcher in 10a)
- B6 schema deployed (notifications, notification_preferences, notification_deliveries, support_tickets, support_ticket_messages tables)
- Phase 5 service area config established (10c SEO landing pages need active metro list)
- At least 10 active cleaners in production (10c marketing pages need real social proof data)
- Stripe + Checkr + Stripe Connect all stable (Phase 4 dependency confirmation)

**Wireframes covered by Phase 10:**

| Sub-phase | Primary wireframes | Theme |
|---|---|---|
| 10a | WF 19 (notification center cleaner-side), WF 28 (settings notification prefs), WF 37 (push permission), WF 53 (score notification states) | Notification infrastructure |
| 10b | WF 38 (empty states — 3 contexts), WF 39 (error states — 4 contexts), WF 40 (loading states — 3 contexts) | State component library |
| 10c | WF 1 (homepage components), WF 41 (City × Service SEO landing), WF 42 (pricing), WF 43 (about), WF 44 (help center), WF 45 (FAQ), WF 46 (coverage), WF 67 (press kit) | Marketing pages + SEO |
| 10d | WF 47 (support contact), WF 48 (customer first-time tour), WF 50 (cleaner platform tour), WF 70 (waitlist signup) | Tours + support + polish |

---

## How to read this document

Each sub-phase has the four-heading format:
- **Goal** — what this sub-phase accomplishes in plain English
- **Design** — decisions to make before writing code
- **Build** — concrete files, components, migrations, integrations
- **Verify** — how you know it works

If a section doesn't list a Design step, that means decisions are settled in the schema or wireframes — just build to spec.

---

## Phase 10 sub-phase overview

| Sub-phase | Title | Estimated weeks | Critical dependencies |
|---|---|---|---|
| **10a** | Notification infrastructure (push + email + in-app) | 2 | Phase 6/7/8/9 stubs operational |
| **10b** | State component library (empty/error/loading) | 1 | Independent (small dependency on 10a for templates) |
| **10c** | Marketing pages + SEO infrastructure | 2 | Phase 5 service area config |
| **10d** | Tours, support, polish, a11y | 1.5 | 10a (tours use notifications) + 10b (state library) |

**Critical ordering rule:** 10a is the foundation — many Phase 6/7/8/9 stubs become real notifications. 10b/10c can run in parallel with 10a after the dispatcher pattern is established. 10d sequential after others.

---

# Phase 10 — Lock-in decisions (must resolve before any sub-phase ships)

These nine decisions surfaced from wireframe deep dive + Phase 6-9 spec dependencies. Phase 10 spec **must** lock them before notifications go live.

## Lock 1 — Push notification provider

**Decision:** **Firebase Cloud Messaging (FCM)** for both Android and iOS, via Expo Notifications wrapper for cross-platform delivery.

**Rationale:** FCM is Google's standard. Apple's APNs is reachable via FCM as a unified path. Expo wraps both. Single codepath for both platforms. Avoids maintaining two separate push integrations.

**Action:** Set up Firebase project. Configure FCM. Configure Expo Push (if using Expo) or direct FCM SDK.

## Lock 2 — Email service provider

**Decision:** **Resend** for transactional email.

**Rationale:** Modern API, developer-friendly, transactional-focused (vs marketing-bloated like SendGrid), reasonable free tier (100 emails/day → starting volume), easy domain verification + DKIM. Switch to SendGrid only if scale demands.

**Action:** Resend account setup. Domain verification on `puretask.co`. SPF + DKIM + DMARC records added.

## Lock 3 — In-app notification real-time delivery

**Decision:** **Supabase Realtime** subscribed per user on app load.

**Rationale:** Already using Supabase. Realtime channels filter by user_id. Notification inserts trigger real-time push to subscriber.

**Action:** Subscribe `notifications` table changes filtered by `user_id = auth.uid()` on app initialization.

## Lock 4 — Notification batching threshold

**Decision:** **5+ same-category notifications within 30 minutes** batch into 1 summary notification.

**Rationale:** Per Phase 7b spec for score notifications. Apply broadly to other categories. Prevents notification fatigue.

**Action:** Notification dispatcher checks: if 5+ same category to same user in 30 min, emit batch instead of individual.

## Lock 5 — Notification preferences default state

**Decision:** Defaults per category:

| Category | Default | Reason |
|---|---|---|
| `booking_lifecycle` | Push + email ON | Critical — customer needs booking confirmations |
| `payment` | Push + email ON | Critical — money operations |
| `dispute` | Push + email ON | Critical — must reach affected party |
| `score_tier` | Push + email ON | Important — affects livelihood |
| `messaging` | Push ON, email OFF | High signal/noise; email = noise |
| `support` | Email ON, push OFF | Lower urgency |
| `marketing` | Email OFF, push OFF | Opt-in only |
| `system` | Push ON, email ON | Account security |

**Rationale:** Critical notifications opt-in by default; promotional opt-in only.

**Action:** `notification_preferences` table seeded with these defaults at user creation.

## Lock 6 — Email frequency cap

**Decision:** Max **5 emails per user per day** (excluding critical: dispute updates, payment failures, account security).

**Rationale:** Anti-spam. Protects deliverability and user trust.

**Action:** Notification dispatcher checks email count last 24 hours; suppresses non-critical if over cap.

## Lock 7 — Notification retention

**Decision:** **90 days** in-app notification retention. Older notifications auto-archive (delete from `notifications` table).

**Rationale:** Per B6 schema design (audit Issue 4.1). Underlying event tables keep history; notifications are time-bound display.

**Action:** Daily cron at 4 AM Pacific: `DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '90 days'`.

## Lock 8 — SEO landing page generation strategy

**Decision:** **Static generation per active metro × service combo**, revalidated nightly. URL pattern `/[city-slug]/[service-slug]`.

**Rationale:** Static generation = best SEO + fastest page loads. Nightly revalidation keeps social proof + cleaner counts fresh.

**Action:** Next.js generateStaticParams for active metros × services. Revalidate via on-demand revalidation triggered by daily cron.

## Lock 9 — Marketing page deferral

**Decision:** Phase 10c is **NOT BLOCKING for product launch**. Marketing pages improve customer acquisition but core product (book → execute → pay) works without them.

**Rationale:** Phase 10a (notifications) and Phase 10b (state library) are critical for production. Phase 10c is sustained-CAC infrastructure. Phase 10d is polish.

**Action:** Phase 10 build order: 10a → 10b → 10d → 10c. Or parallelize 10c with others after 10a stabilizes.

---

# Phase 10a — Notification infrastructure (2 weeks)

**Phase 10a goal:** A unified notification dispatcher receives events from Phase 6/7/8/9 sub-phases and delivers via push + email + in-app per user preferences. WF 19 cleaner-side notification center renders real notifications. WF 28 settings allow users to configure preferences per category. Push permission flow (WF 37) wired correctly. All Phase 6-9 notification stubs replaced with real dispatcher calls.

**Phase 10a depends on:**
- Phase 6/7/8/9 stub trigger points exist (call `dispatchNotification()` not real)
- B6 schema deployed (notifications, notification_preferences, notification_deliveries)
- FCM setup
- Resend account active
- Stripe webhook signing operational (Phase 9a) — security pattern reused

**Wireframes:** WF 19 (notification center), WF 28 (notification preferences in settings), WF 37 (push permission), WF 53 (score notification patterns from Phase 7b).

**Sub-sections of 10a:**

## 10a-1 — Push + email service setup + verification (~2 days)

### Goal
FCM is configured with valid credentials. Resend domain verified with DKIM/SPF/DMARC. Both services tested with hello-world notifications before any application code is written.

### Design

**Decisions to make:**

1. **FCM configuration approach.** Direct FCM Admin SDK in Node, OR Expo Push API as wrapper. Recommendation: Expo Push if using Expo SDK; direct FCM if not. Provides cross-platform iOS + Android.

2. **Resend domain.** `notifications.puretask.co` (subdomain) or `puretask.co` directly. Recommendation: subdomain to isolate transactional email reputation from marketing.

3. **DKIM/SPF/DMARC records.** All three required for deliverability. Lock domain DNS before Phase 10a writes any email.

4. **Push token storage.** Per device per user. Multiple devices possible. Stored in `push_tokens` table (new).

### Build

- Firebase project setup
- FCM credentials in env vars
- Resend account + API key in env vars
- DNS records added: SPF, DKIM, DMARC
- Test scripts: send hello-world push + email
- `push_tokens` migration

### Verify

- Push hello-world delivered to test device
- Email hello-world delivered to test inbox + DKIM check passes
- Tokens stored on user app launch

## 10a-2 — Notification dispatcher + templates (~3 days)

### Goal
Single `dispatchNotification()` function handles all platform notifications. Routes to push + email + in-app based on user preferences. Templates per category render correctly.

### Design

1. **Dispatcher pattern.** All Phase 6/7/8/9 stubs call `dispatchNotification({user_id, category, template_key, data})`. Dispatcher reads preferences, routes per channel.

2. **Notification categories** (locked):
   - `booking_lifecycle` (created, accepted, reminder T-24h, on the way, completed, etc.)
   - `payment` (auth, capture, refund, payout)
   - `dispute` (opened, response, resolution, escalation)
   - `score_tier` (small +1, drop, promotion, drop warning)
   - `messaging` (new message, response)
   - `support` (ticket update)
   - `marketing` (city expansion, perks, newsletter)
   - `system` (app updates, account security)

3. **Templates.** Per category, per channel, per language (English only v1). Template keys like `booking_lifecycle.confirmed.push`, `booking_lifecycle.confirmed.email`, `booking_lifecycle.confirmed.in_app`.

4. **Template variables.** Use Mustache or simple template literals. `{{cleaner_name}}`, `{{booking_total}}`, etc.

5. **Idempotency.** `dispatchNotification()` accepts `dedup_key`. Same dedup_key within 1 hour = no double-dispatch (handles retries from Phase 6 race conditions).

6. **`notifications` row inserted on every dispatch.** Even if user has push off — in-app center always gets the row. Email/push delivery logged in `notification_deliveries`.

### Build

- `lib/notifications/dispatcher.ts` — main entry point
- `lib/notifications/template_renderer.ts` — Mustache or similar
- `lib/notifications/push_sender.ts` — FCM API wrapper
- `lib/notifications/email_sender.ts` — Resend API wrapper
- `lib/notifications/in_app_writer.ts` — `notifications` row inserter
- Templates file structure: `templates/[category]/[event].push.txt`, `.email.html`, `.in_app.json`

### Verify

- `dispatchNotification()` called with sample payload → all 3 channels deliver per preferences
- Dedup key prevents double-dispatch
- `notification_deliveries` log accurate
- Templates render with variables correctly

## 10a-3 — User preferences + in-app notification center (WF 19, WF 28) (~3 days)

### Goal
Cleaner sees WF 19 notification center with real notifications. Customer + cleaner can configure WF 28 notification preferences per category. Push permission prompt (WF 37) wired correctly.

### Design

1. **WF 19 cleaner notification center.** Lists `notifications` rows for cleaner_user_id, ordered by created_at DESC. Tap → deep link from notification metadata. Mark read on view.

2. **WF 28 preferences UI.** Per category: push toggle + email toggle. Plus quiet hours (start_time, end_time) at user level (B6 schema supports).

3. **Quiet hours behavior.** Push suppressed during quiet hours. Email always sends (user controls inbox).

4. **WF 37 push permission flow.** First-time prompt UI. After OS permission granted → store FCM token in `push_tokens` table. After denial → store opt-out flag; allow re-prompt later via WF 28 settings.

5. **Read receipts.** Tap notification → `notifications.read_at` set. Mark all as read button on WF 19.

### Build

- `/notifications` route (cleaner-side WF 19)
- `/notifications/[id]` deep link handler
- `/settings/notifications` route (WF 28)
- Components: `NotificationCenterList`, `NotificationRow`, `PreferenceToggle`, `QuietHoursSelector`
- Push permission prompt component (WF 37)
- Server actions: mark read, update preferences

### Verify

- Cleaner sees real notifications in WF 19
- Toggle push for `score_tier` off → no push received for tier promotion
- Quiet hours 10 PM - 8 AM: push suppressed
- WF 37 prompts on first dashboard visit; permission stored

## 10a-4 — Batching, throttling, Phase integrations (~2 days)

### Goal
Notification batching works (5 same-category in 30 min → 1 summary). Email frequency cap enforced (5/day non-critical). All Phase 6/7/8/9 stub calls replaced with real dispatcher.

### Design

1. **Batching mechanism.** Dispatcher checks recent notifications (last 30 min). If 5+ same-category to same user, schedule batch send via cron at next 30-min mark. Suppress individual.

2. **Frequency cap.** Email sends counted per user per 24h. Non-critical (marketing, score_tier small +1) suppressed if cap reached.

3. **Critical category override.** Disputes, payment failures, account security ALWAYS deliver regardless of caps.

4. **Phase integration sweep.** Replace every `recordNotificationStub()` call across Phase 6/7/8/9 codebases with `dispatchNotification()`. Verify each works.

### Build

- `lib/notifications/batcher.ts` — same-category batching logic
- `lib/notifications/frequency_cap.ts` — daily email cap
- Cron `jobs/notification_batch_dispatcher.ts` — runs every 5 min for batched
- Phase sweep — modify Phase 6/7/8/9 files to use real dispatcher

### Verify

- 5 score events fire to cleaner in 25 min → 1 batched push at 30-min mark
- Email cap: 5 marketing emails sent today; 6th suppressed; critical still sends
- All Phase 6 booking lifecycle notifications work end-to-end

---

# Phase 10b — State component library (1 week)

**Phase 10b goal:** Reusable empty, error, and loading state components used across all phases. WF 38 patterns implemented. WF 39 patterns implemented. WF 40 patterns implemented. Phase 5/6/7 screens that previously rendered hardcoded states adopt the component library.

**Wireframes:** WF 38 (empty states — 3 contexts + ~7 implied), WF 39 (error states — 4 contexts + ~10 implied), WF 40 (loading — 3 sub-states).

## 10b-1 — Empty state component library

### Goal
A `<EmptyState>` component renders consistent empty-state UI across the platform. Specific empty cases (no bookings, no cleaners in ZIP, no favorites, etc.) compose around it.

### Design

1. **Component API:**
   ```tsx
   <EmptyState
     icon={IconComponent}
     headline="Your first cleaning is waiting"
     subtext="Browse verified cleaners and book in under a minute."
     primaryAction={{ label: "Find a cleaner", onClick: ... }}
     secondaryAction={{...}} // optional
   />
   ```

2. **Empty state contexts** (all WF 38 + implied):
   - Customer no bookings yet (WF 38.1)
   - Cleaner no incoming jobs (WF 38.2)
   - Customer no cleaners in ZIP (WF 38.3)
   - No favorites (WF 25.5)
   - No notifications (WF 19)
   - No reviews yet (WF 7)
   - No service area set (WF 27)
   - No earnings yet (WF 6b)
   - No recurring bookings
   - No messages

3. **Skeleton vs empty distinction.** Don't show empty state during loading. Show skeleton (Phase 10b-3). After data loads with 0 results → empty state.

### Build

- `<EmptyState>` component (single component)
- Specific compositions for each context
- Replace hardcoded empty markup in existing routes

### Verify

- Customer with 0 bookings sees WF 38.1 design
- Cleaner with 0 requests sees WF 38.2
- All empty states use component library

## 10b-2 — Error state component library

### Goal
A `<ErrorState>` component renders consistent error UI. Specific error cases (payment failed, booking conflict, network error, 404, etc.) compose around it.

### Design

1. **Component API:**
   ```tsx
   <ErrorState
     severity="warning" | "error" | "blocking"
     headline="Payment declined"
     detail="Your card ending in 4421 was declined. The booking is held for 10 minutes."
     primaryAction={{ label: "Update payment", onClick: ... }}
     secondaryAction={{ label: "Cancel booking", onClick: ... }}
   />
   ```

2. **Error contexts** (all WF 39 + implied):
   - Payment declined (WF 39.1) — uses booking hold timer (Phase 6a)
   - Booking conflict (WF 39.2) — race lost
   - Network error (WF 39.3)
   - 404 page not found (WF 39.4)
   - Cleaner application rejected
   - Background check consider state
   - Insurance upload rejected
   - Booking creation hard fail
   - Photo upload failed
   - Stripe Connect unverified
   - Auth session expired
   - Booking past auto-approval
   - 5xx server error
   - Rate limited

3. **Recovery actions required.** Every error state has a primary action — don't dead-end the user.

### Build

- `<ErrorState>` component
- Specific compositions per context
- Replace hardcoded error markup

### Verify

- Stripe authorization fail → WF 39.1 displayed
- Slot taken during booking → WF 39.2
- Network drop → WF 39.3 with retry

## 10b-3 — Loading state component library

### Goal
Skeleton screens render structure where content will appear. Photo upload progress UI (WF 40c) shows real-time progress.

### Design

1. **Skeleton components per major screen.**
   - `<DashboardSkeleton>` (customer + cleaner variants)
   - `<CleanerListSkeleton>` (browse list)
   - `<CleanerProfileSkeleton>`
   - `<BookingDetailSkeleton>`
   - `<NotificationCenterSkeleton>`

2. **Skeleton vs spinner threshold.** Don't render skeleton if expected load <300ms. For fast loads, content directly. For slower, skeleton first.

3. **Photo upload progress (WF 40c).** Per-room status:
   - Uploaded (green check)
   - Uploading… (with percent progress bar)
   - Required · Pending

4. **Retry queue UI.** Network drop during upload → "Will retry automatically when connection returns."

### Build

- Skeleton components per screen
- `<PhotoUploadProgress>` component (Phase 6e integration)
- Decision logic: when to show skeleton

### Verify

- Slow network (throttled) → skeleton renders first; replaced by content on load
- Fast network → no skeleton flicker
- Photo upload: per-room progress visible; auto-retry on connection drop

---

# Phase 10c — Marketing pages + SEO infrastructure (2 weeks)

**Phase 10c goal:** Public marketing surfaces drive customer acquisition. WF 41 City × Service SEO landing pages generated per active metro × service. WF 42 pricing, WF 43 about, WF 44 help center, WF 45 FAQ, WF 46 coverage, WF 67 press kit all live. Schema.org markup non-negotiable for SEO. Sitemap auto-generated.

**Wireframes:** WF 1 component reuse, WF 41-46, WF 67.

## 10c-1 — SEO landing pages (WF 41)

### Goal
For each active metro × service combo, generate a static landing page at `/[city-slug]/[service-slug]`. Schema.org markup. Local social proof (real cleaner counts + reviews). Single conversion path to WF 8 cleaner browse.

### Design

1. **URL pattern.** `/sacramento/standard`, `/sacramento/deep-clean`, etc. Active metros from Phase 5 service area config × 4 services = page count.

2. **Static generation via Next.js `generateStaticParams`.** Pages built at deploy. Revalidated nightly via on-demand revalidation.

3. **Page composition** (matches WF 41):
   - Top breadcrumb (caps): `SACRAMENTO · STANDARD CLEANING`
   - Hero H1 with neighborhood mentions
   - Local social proof (4.9 average · 312 cleanings)
   - Address input → WF 8 conversion
   - Top-rated cleaner cards (×3) — real cleaners filtered to ZIP
   - "What's included" panel (static service definition)
   - Local timing + price anchor
   - Neighborhood pills (links to potential neighborhood sub-pages, deferred)
   - Local testimonials (real reviews)
   - FAQ accordion (with schema.org markup)
   - Bottom CTA

4. **Schema.org markup:** LocalBusiness, Service, FAQPage. Critical for Google rich snippets.

5. **Open Graph + meta.** City + service in title, description, og:image.

6. **Sitemap.** Auto-generated `/sitemap.xml` listing all SEO pages.

7. **Pre-launch metros excluded.** Don't generate SEO pages for waitlist-state metros (Phase 5 metro config `state = 'active'` only).

### Build

- `/app/[city-slug]/[service-slug]/page.tsx` — static template
- `lib/seo/landing_page_generator.ts`
- `lib/seo/schema_org_renderer.ts` — generates JSON-LD blocks
- `/sitemap.xml` route
- `/robots.txt`
- Daily revalidation cron

### Verify

- Sacramento × Standard page renders with real cleaner data
- Schema.org JSON-LD validates via Google Rich Results test
- Sitemap lists all active pages
- Page load <2s p95

## 10c-2 — Static marketing pages (WF 42, 43, 44, 45, 46, 67)

### Goal
Five static marketing pages live with curated content, lawyer-reviewed copy, brand-consistent design.

### Design

1. **Pricing page (WF 42).** Tier rate ranges + worked example + booking fee value props + tip pass-through statement + tax disclosure.

2. **About page (WF 43).** Founder narrative (Nathan-named). Differentiator pillars. Coverage link. Contact emails.

3. **Help center (WF 44).** Search bar + 6-topic browse + popular articles + support fallback. Markdown-driven articles in `/content/help/`.

4. **FAQ page (WF 45).** 4 categories × 3 Q&A. Schema.org FAQPage markup.

5. **Coverage page (WF 46).** Active metros + launching soon + waitlist. Per-metro card with cleaner count + neighborhoods.

6. **Press kit (WF 67).** Caps positioning. By-the-numbers stats. Differentiator pillars. Founder section. Brand asset downloads.

### Build

- 6 static routes
- Markdown-driven content (per-page `.md` files in `/content/marketing/`)
- Lawyer-reviewed copy in place (PENDING_LAWYER_REVIEW items resolved)

### Verify

- All 6 pages render correctly
- Mobile responsive
- Lawyer items resolved
- Schema.org markup on FAQ + about (Organization)

## 10c-3 — Help articles + content authoring

### Goal
20-30 help articles in 6 categories (matching WF 44 browse). Markdown-driven. Searchable. Cross-linked.

### Design

1. **Article schema:** id, slug, title, body_markdown, category, view_count, published_at.

2. **Categories (matches WF 44):** bookings, payments, trust_safety, photos_privacy, disputes, for_cleaners.

3. **Markdown-based for v1.** Files in `/content/help/[category]/[slug].md`. Frontmatter for metadata.

4. **Search.** Algolia or local fuzzy search. Phase 11 enhancement; v1 = simple title-based search.

5. **Article view tracking.** `view_count` increment on each view. Used by WF 44 popular articles list.

### Build

- Help article CMS (Markdown + frontmatter)
- Article rendering route
- Search component
- Per-category browse routes

### Verify

- 20+ articles authored across all 6 categories
- Search returns relevant results
- View counts increment correctly

---

# Phase 10d — Tours, support, polish, a11y (1.5 weeks)

**Phase 10d goal:** Customer first-time tour (WF 48), cleaner platform tour (WF 50), support contact + ticketing (WF 47), waitlist signup (WF 70). Accessibility review + fixes. Animation polish. Performance optimization. Final pre-launch verification.

## 10d-1 — Tours (WF 48, 50)

### Goal
Customer 3-screen tour on first dashboard visit. Cleaner 5-screen tour on first post-approval login. Both skippable. Both retriggerable from settings.

### Design

1. **Customer tour (WF 48):** 3 panels on first `/dashboard` visit. Tracks `customer_profiles.first_tour_completed_at` and `first_tour_skipped_at`.

2. **Cleaner tour (WF 50):** 5 panels on first cleaner dashboard visit post-approval. Tracks `cleaner_profiles.platform_tour_completed_at` + `platform_tour_skipped_at`.

3. **Re-trigger.** Settings → "Show tour again" link.

### Build

- Tour components (carousel-style)
- Trigger logic (first-visit detection)
- Skip + complete handlers
- Settings re-trigger link

### Verify

- First customer login → WF 48 tour
- First cleaner login post-approval → WF 50 tour
- Skip works; doesn't re-prompt next session
- Settings re-trigger works

## 10d-2 — Support contact + ticketing (WF 47)

### Goal
WF 47 routing tiered by case type. General (24-48h SLA) / Booking issue (4-12h SLA) / Emergency (1h SLA). Tickets created in `support_tickets` (B6 schema).

### Design

1. **Tiered routing per WF 47.** 3 separate forms with different SLAs.

2. **Emergency 911 disclaimer.** Per WF 47 lawyer concern: "If you are in immediate physical danger, call 911" prominent.

3. **Email forwarding.** support@puretask.co receives all general inquiries. Press@ for press. Hello@ for general.

4. **Ticketing tool integration.** Initially: tickets in `support_tickets` table; admin reads in `/admin/support`. Phase 11 if scaling: integrate with Helpscout, Front, or Intercom.

### Build

- `/contact` route (WF 47)
- 3 tiered forms
- Email forwarding setup
- Admin support queue surface (extends WF 54)

### Verify

- Each tier creates correct support_ticket priority
- Emergency triggers admin alert
- Email aliases working

## 10d-3 — Waitlist signup + first-100 perks (WF 70)

### Goal
Customer in non-serviced ZIP can join waitlist with email + ZIP + service interest. First 100 per ZIP get $25 off first booking when ZIP launches.

### Design

1. **Waitlist form (WF 70).** Email + ZIP + service multi-select + frequency interest (optional).

2. **First-100-per-ZIP tracking.** Counter on `waitlist_signups` per ZIP. First 100 marked `perk_eligible = TRUE`.

3. **Launch notification.** When metro transitions to `state = 'active'`, send email to all waitlist signups in that ZIP. First 100 see $25 perk; rest see launch announcement.

4. **Perk redemption.** $25 credit applied at first booking after launch. 30-day window from launch.

### Build

- `/waitlist` route (WF 70)
- Waitlist form
- Per-ZIP counter logic
- Metro state change trigger → email blast
- Perk credit application

### Verify

- Waitlist signup creates row
- First 100 in ZIP marked eligible
- Metro launch → email blast fires
- Perk redeems on first booking; expires 30 days post-launch

## 10d-4 — Accessibility review + fixes

### Goal
WCAG 2.1 AA compliance across all customer + cleaner surfaces.

### Design

1. **Audit checklist:**
   - Color contrast (4.5:1 minimum for normal text)
   - Keyboard navigation (all interactive elements reachable + actionable)
   - Screen reader labels (aria-labels on icons, form fields, etc.)
   - Focus indicators (visible on all interactive elements)
   - Form labels (every input has a label)
   - Error messages associated with fields

2. **Tools:** axe DevTools + Lighthouse + manual screen reader testing (VoiceOver iOS, TalkBack Android).

3. **Phase audit.** Audit each phase's surfaces. Fix violations.

### Build

- Run axe + Lighthouse on every route
- Fix violations
- Document a11y patterns for future phases

### Verify

- Lighthouse a11y score >95 on all routes
- Screen reader testing of booking flow + cleaner inbox
- Keyboard-only booking E2E

## 10d-5 — Animation polish + performance optimization

### Goal
Subtle, intentional animations. Page loads optimized. Bundle sizes reviewed.

### Design

1. **Animation principles:** subtle, purposeful, respect `prefers-reduced-motion`.

2. **Performance targets:**
   - Lighthouse Performance score >90 on critical routes
   - Largest Contentful Paint <2.5s
   - First Input Delay <100ms
   - Cumulative Layout Shift <0.1

3. **Bundle review:** identify large dependencies. Tree-shake. Lazy-load non-critical.

### Build

- Animation refinement (CSS transitions, framer-motion if needed)
- Lighthouse pass + fix top issues
- Bundle analyzer + lazy-loading

### Verify

- Lighthouse Performance >90 on / and /book/[cleaner_id]
- Animation feels natural; reduced-motion respected
- Bundle sizes within budget

---

# Phase 10 verification + closeout (Phase 10e)

### Acceptance criteria

- [ ] All Phase 6/7/8/9 notification stubs replaced with real dispatcher calls
- [ ] WF 19 cleaner notification center shows real notifications
- [ ] WF 28 preferences toggle each category × channel
- [ ] WF 37 push permission flow works
- [ ] State component library used by all phases (no hardcoded empty/error/loading)
- [ ] WF 41 SEO landing pages generated for all active metros × services
- [ ] WF 42-46 marketing pages live with lawyer-reviewed copy
- [ ] WF 67 press kit live with brand assets
- [ ] WF 47 support routing works tiered by SLA
- [ ] WF 48/50 tours fire on first-visit; skippable; retriggerable
- [ ] WF 70 waitlist signup + first-100 perk tracking works
- [ ] WCAG 2.1 AA compliance verified
- [ ] Lighthouse Performance >90 on critical routes

### Performance targets

- Notification dispatch: <200ms p95 (excluding email/push delivery)
- SEO landing page load: <2s p95
- Marketing pages load: <1.5s p95
- Help article search: <500ms p95

### Cross-phase impact

- All Phase 6/7/8/9 surfaces use Phase 10b state component library
- All money operations notifications fire via Phase 10a
- All SEO traffic flows from Phase 10c → Phase 5 conversion

---

# Schema additions consolidated

B6 schema is largely sufficient. Phase 10 adds:

```sql
-- Push tokens (Phase 10a)
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  device_id TEXT,
  device_type TEXT CHECK (device_type IN ('ios', 'android', 'web')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, fcm_token)
);
CREATE INDEX idx_push_tokens_user ON push_tokens (user_id) WHERE active = TRUE;

-- Help articles (Phase 10c)
CREATE TABLE help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body_markdown TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'bookings', 'payments', 'trust_safety', 'photos_privacy', 'disputes', 'for_cleaners'
  )),
  view_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_help_articles_category ON help_articles (category, published_at DESC);

-- SEO landing visits tracking (Phase 10c, optional analytics)
CREATE TABLE seo_landing_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_slug TEXT NOT NULL,
  service_slug TEXT NOT NULL,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referrer TEXT,
  user_agent TEXT
);
CREATE INDEX idx_seo_visits_route ON seo_landing_visits (city_slug, service_slug, visited_at DESC);

-- Waitlist signups (Phase 10d)
CREATE TABLE waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  zip TEXT NOT NULL,
  city TEXT,
  services_interested JSONB DEFAULT '[]'::JSONB,
  frequency_interest TEXT CHECK (frequency_interest IN ('one_off', 'monthly', 'biweekly_plus')),
  signup_source TEXT CHECK (signup_source IN ('coverage_page', 'seo_landing', 'homepage', 'suggest_city')),
  perk_eligible BOOLEAN NOT NULL DEFAULT TRUE,
  perk_redeemed_at TIMESTAMPTZ,
  perk_amount_cents INTEGER NOT NULL DEFAULT 2500,
  notified_of_launch_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email, zip)
);
CREATE INDEX idx_waitlist_zip ON waitlist_signups (zip, created_at);

-- Tour completion tracking (column additions)
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS first_tour_completed_at TIMESTAMPTZ;
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS first_tour_skipped_at TIMESTAMPTZ;
ALTER TABLE cleaner_profiles ADD COLUMN IF NOT EXISTS platform_tour_completed_at TIMESTAMPTZ;
ALTER TABLE cleaner_profiles ADD COLUMN IF NOT EXISTS platform_tour_skipped_at TIMESTAMPTZ;
```

---

# Recommended build order

1. **Phase 10a** (2 weeks) — notifications. **Critical path.** Phase 6/7/8/9 stubs depend.
2. **Phase 10b** (1 week) — state library. Can run in parallel with 10a after Day 3.
3. **Phase 10d** (1.5 weeks) — tours/support/polish. Sequential after 10a.
4. **Phase 10c** (2 weeks) — marketing. Can run independently; not blocking for launch.

**Total wall time:** 5-6 weeks (with parallelism). 6-7 weeks sequential.

This document is the canonical Phase 10 navigation reference. Detailed acceptance criteria + code structure live in per-sub-phase spec files. Plain-English walkthroughs live in per-sub-phase explainer files.
