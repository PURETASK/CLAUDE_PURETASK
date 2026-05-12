# PureTask — Master Analysis Report
**Generated:** 2026-05-09  
**Sources:** 70 wireframes · 8 SQL schema files · 24 art assets · 20 batch deep-dive docs · 4 phase specs  
**Purpose:** Everything worth building, filtered for impact. Nothing added just because it exists in a doc.

---

## PART 1 — ART ASSETS: Full Inventory + Placement Guide

All 24 assets have been viewed. Here is exactly where each one should be used in the product.

### The 3D Icon Set (10 matching brand-aligned icons — CURRENTLY UNUSED)

These are all glossy 3D blue-to-cyan gradient icons on transparent backgrounds. They perfectly match the Clean Aero Glow brand. They should replace generic Lucide icon placeholders in key UI locations.

| File | Icon | Where to Use |
|---|---|---|
| `home_icon.jpeg` | House (blue→cyan gradient) | Address sections, booking form "your home", dashboard home tile |
| `calendar_icon.jpeg` | Calendar grid (blue→cyan) | Booking/scheduling cards, date picker header, upcoming cleanings |
| `wallet_icon.jpeg` | Wallet with cards (blue) | Earnings page header, payment method sections, payout cards |
| `notification_icon.jpeg` | Bell (blue→cyan) | Notification center header, push permission prompt hero |
| `settings_icon.jpeg` | Gear (blue→cyan) | Settings page header, account settings tiles |
| `message_icon.jpeg` | Speech bubble (blue→cyan) | Messages feature, support chat, dispute thread header |
| `contacts_icon.jpeg` | Person/user (cyan rings) | Profile sections, cleaner card avatars (fallback), contacts |
| `cleaning_icon.jpeg` | Cleaning brush in rounded square | Service tile header, booking form service selection, active job screen |
| `cleaning_icon_2.png` | Cartoon cyan broom (standalone) | Empty state for "no cleanings yet", onboarding steps |
| `checkmark_icon.png` | Checkmark (blue→cyan gradient) | Verification badges, approval states, "work approved" confirmation |
| `ai_assistant_icon.png` | Robot face in rounded square (blue) | Support chat entry point, AI help feature, help center header |

### Background Assets — Page-Specific (CURRENTLY UNUSED)

| File | Description | Use On |
|---|---|---|
| `bubbles_background.png` | Soft blue/cyan gradient with floating soap bubbles + sparkles | Homepage hero, splash/loading screens, onboarding backgrounds |
| `background_middle_empty.jpg` | Frame border of cleaning supplies + shield icons, empty white center | Section cards where text sits in middle, onboarding shell |
| `cleaning background .png` | Illustrated frame (gloves, brush, soap, headset, shield) open center | Support page hero, FAQ background, help center |
| `legal_page_background.png` | Soft gavel + documents + shield illustration (blue-green) | Terms of Service, Privacy Policy, Photography Policy pages |
| `support page_background.png` | Robot with headset + speech bubble + notebook (blue) | Support/help pages, contact page |
| `Find Your city.png` | Globe at night with city pins + cyan connection lines | Coverage page, waitlist page, expansion announcement |
| `Cleaners_wanted.png` | PureTask neon logo spotlight on cityscape at night | "For Cleaners" recruitment page, social campaign |

### Background Assets — Content Sections

| File | Description | Use On | Notes |
|---|---|---|---|
| `cleaning_supplies_background.jpg` | 3D rendered spray bottles/brushes scattered pattern | Marketing page sections, app store screenshots | Colors slightly off-brand (purple/orange) — use as decorative only |
| `money page _background.png` | Green coin/sparkle border, open center | Earnings/payout page hero | Green is off-brand — use with blue overlay or redesign page |
| `potential_wallet_page_background.png` | Cartoon wallet/coins/cash illustration | "Earn with PureTask" section | Cartoon style slightly off-brand — use sparingly |
| `cleaner banner.webp` | Photo of gloves holding cleaning tools on YELLOW bg | Social media only — NOT in-app | Yellow is completely off-brand. Do not use in product UI. |

### Primary Brand Assets

| File | Description | Status |
|---|---|---|
| `Puretask_official_logo.png` | P-house glossy 3D logo — the primary mark | Should be in nav, app icon, invoices, trust anchors |
| `dash_mascot.png` | Dash the Hummingbird — blue/cyan, in rounded container | Onboarding, success states, loading (beak fully visible ✓) |

---

## PART 2 — DATABASE SCHEMA (B1–B8): Features Not Yet Wired to the App

The schema is more complete than the app. 54 tables, 42 enums, 22-state booking machine, full audit trails. These are the gaps worth closing.

### Critical Schema Features Not Implemented

**1. In-App Messaging (`messages` table — B3)**
- 4-hour auto-purge after booking ends
- Booking-scoped (customer ↔ cleaner only)
- WF18 specifies the full UI
- Schema is READY. UI is NOT BUILT.

**2. Insurance Verified Badge (`insurance_policies` — B5)**
- Cleaner uploads Certificate of Insurance ($100k min coverage)
- 3 states: pitch → pending review → verified (with badge + renewal reminder)
- 2-year expiration with renewal workflow
- Schema is READY. UI (WF32) is NOT BUILT.

**3. Tax Info Collection (`cleaner_applications` + cleaner settings — B7)**
- SSN collection (encrypted as BYTEA via AES-256-GCM, key from `TAX_ENCRYPTION_KEY`)
- Legal name, address, tax classification (individual/LLC/corp)
- Year-to-date earnings display
- Schema is READY. WF34 specifies the UI. NOT BUILT.

**4. User Milestones (`user_milestones` — B1)**
- Tracks tutorial/onboarding step completion per user
- Enables first-time tour (WF48) and cleaner platform tour (WF50)
- Schema is READY. App does NOT write to this table.

**5. Cleaner Appeals (`cleaner_appeals` — B4)**
- Appeal mechanism for tier drops or disputed reliability events
- Polymorphic FK to `tier_assignments` or `reliability_events`
- NOT IMPLEMENTED anywhere in the app.

**6. Customer Reliability Events (`customer_reliability_events` — B4)**
- Customer-side scoring: no-shows, late cancellations, dispute history
- Schema day-1 design, UI deferred to Phase 2
- Will become important for repeat-customer trust signaling.

**7. Cancellation Policy Enforcement (booking rules — B2)**
- 48h+ before: free cancel
- 24–48h before: 50% charge
- Under 24h: 100% charge
- Schema has the rules. App needs to ENFORCE them in the cancel flow (WF15).

**8. Reschedule Policy (booking + availability — B2)**
- 1 free reschedule up to 12h before job
- Cleaner gets 4h SLA to confirm the rescheduled time
- Schema supports it. UI (WF14) is NOT BUILT.

**9. Auto-Approval Timer (bookings.auto_approve_at — B2)**
- If customer does not approve/dispute within 24h, booking auto-approves
- `auto_approve_at` column exists on bookings. Cron job needed.
- Partially wired but may not have the cron enforcement.

**10. Booking State Events (`booking_state_events` — B2)**
- APPEND-ONLY audit log of every state transition
- 22-state machine — app likely only uses a subset
- States not yet implemented: `en_route`, `arrived`, `clocked_in`, `clocked_out`, `photos_submitted`, `running_late`

**11. Photo GPS Capture (`booking_photos.capture_lat/lng` — B2)**
- Photos should capture GPS location at time of upload
- Used to verify cleaner was actually at the property
- Schema has the columns. App may not be writing them.

**12. Admin Audit Log (`admin_actions` — B6)**
- APPEND-ONLY log of every admin action with before/after JSONB
- Schema is READY. App may not be writing admin actions to this table.

**13. Notification Quiet Hours (`notification_preferences` — B6)**
- `quiet_hours_start` / `quiet_hours_end` columns on preferences
- NOT implemented in notification settings UI (WF30).

**14. Commission Records (`commission_records` — B5)**
- Fully immutable per-booking commission snapshot
- IMMUTABLE trigger blocks all UPDATEs and DELETEs
- Verify the app is writing to this table on every booking.

---

## PART 3 — WIREFRAMES: All 70 Screens, Organized by Priority

### TIER 1 — CRITICAL PATH (Product does not work without these)

These are core job flows that a cleaner and customer need to complete a booking end-to-end.

---

**WF3 / WF3b — Cleaner Job Inbox**
- Card-based inbox showing incoming booking requests and active jobs
- Accept/decline controls with 4h acceptance window
- Empty state (WF3b) for new cleaners
- **Status:** Partially built. Needs review against wireframe spec.
- **Key detail:** Declined request should trigger auto-rebooking search for customer

---

**WF4 / WF4b / WF61 — "On My Way" Screen + Arrived State**
- Cleaner opens this when leaving for the job
- Shows: customer address, entry instructions, estimated drive time, map stub
- "I've arrived" button triggers geofence confirmation (WF4b)
- Full-screen map version (WF61) with route + pins, call/message buttons
- **Running late button** (WF68 — see below)
- **Status:** NOT BUILT. This is core operational flow.
- **Key detail:** "Arrived" tap starts a grace period before clock-in opens

---

**WF5 / WF5b — Cleaner Active Job Screen**
- Clock-in (enabled after geofence arrival confirmation)
- Room-by-room photo upload with status indicators per room
- Job timer counting up
- WF5b: "Ready to clock out" state — all required rooms have photos
- Clock-out button triggers photo review and job-complete flow
- **Status:** NOT BUILT. Core operational flow.
- **Key detail:** Schema has `clocked_in_at`, `clocked_out_at`, `actual_hours_decimal` on bookings

---

**WF9 — Customer Active Job Tracker**
- Customer-side view of their job in progress
- Shows: cleaner status (on the way / at property / cleaning), ETA
- Photos arrive in real-time as cleaner uploads room by room
- Message/call buttons
- **Status:** NOT BUILT.
- **Key detail:** Should update without full page refresh (polling or realtime)

---

**WF10 — Approve & Pay Screen (Full Build)**
- Photo gallery of all before/after photos by room
- Time accounting: scheduled X hours, actual Y hours, any overage
- Charge breakdown: service + platform fee + any overage
- "Approve and release payment" primary CTA
- "File a dispute" secondary link (starts 48h window)
- **Status:** Partially built. May need photo gallery + time accounting enhancements.

---

**WF68 — Cleaner: Running Late**
- Accessed from the "On My Way" screen
- Time picker: 5/10/15/20+ minute options
- Optional reason tags: traffic, previous job/ran long, parking, personal, other
- Sends automatic notification to customer with new ETA
- **Status:** NOT BUILT.
- **Key detail:** Running late flag writes a `running_late` event to `booking_state_events`

---

### TIER 2 — HIGH VALUE (Core trust + money features)

---

**WF14 — Reschedule Flow**
- Customer requests reschedule from booking detail page
- Shows available slots based on cleaner availability
- Cleaner gets 4h SLA to confirm or decline
- If cleaner declines, customer can pick another time or cancel free
- 1 free reschedule up to 12h before job (matches schema policy)
- **Status:** NOT BUILT.

---

**WF15 — Cancel Flow with Penalty Disclosure**
- Cancel initiated from booking detail page
- System checks time-to-booking:
  - 48h+: "No charge — cancellation is free"
  - 24–48h: "50% of booking total ($XX) will be charged"
  - Under 24h: "100% of booking total ($XX) will be charged"
- "Confirm cancellation" button requires explicit acknowledgment
- **Status:** NOT BUILT. Important for trust + policy enforcement.

---

**WF18 — In-App Messaging Thread**
- Booking-scoped: only participants of that booking can message
- 4-hour auto-purge after booking ends (schema enforced)
- Message bubble UI, typing indicator
- Thread accessed from booking detail page
- "Conversation ends 4 hours after job completion" persistent notice
- **Status:** NOT BUILT. `messages` table in schema (B3) is READY.

---

**WF32 — Insurance Verified Upload Flow**
- 3 states:
  1. Pitch screen: "Upload your COI to earn the Insurance Verified badge"
  2. Pending: "Under review — typically 1–2 business days"
  3. Verified: Badge displayed, renewal reminder at 2-year mark
- Minimum $100k coverage required
- **Status:** NOT BUILT. `insurance_policies` table in schema (B5) is READY.

---

**WF34 — Tax Info Collection**
- Tax classification radio buttons (individual / LLC / S-corp / C-corp)
- SSN field (encrypted at application layer — AES-256-GCM)
- Legal name + mailing address
- Year-to-date earnings display
- **Status:** NOT BUILT. Critical for 1099 compliance. `encrypted_tax_id` column exists on `cleaner_profiles`.

---

**WF54 — Admin Dashboard with KPIs**
- KPI grid: today's bookings, GMV, new cleaner applications, open disputes
- 14-day GMV sparkline chart
- Recent activity feed
- "Needs attention" section: unreviewed applications, open disputes > 48h, failed payouts
- Booking funnel metrics (submitted → accepted → completed → approved)
- **Status:** Partially built (basic admin exists). Needs full dashboard per wireframe.

---

**WF57 — Admin Dispute Mediation Interface**
- Two-column layout: evidence left, resolution tools right
- Customer claim card with evidence photos
- Side-by-side: disputed photos vs. cleaner-submitted photos by room
- Full dispute thread with all messages
- Resolution panel: 3 options (cleaner stands by work / partial refund / full refund)
- Rationale text field (required before resolving)
- **Status:** Partially built. Needs photo comparison panel + Phase 8b spec implementation.

---

**WF62 — Admin Refund Processing**
- Admin-initiated refunds from booking detail
- Refund type options: full refund / partial (50%) / custom amount / goodwill credit
- Reason field required
- Shows who gets notified (customer + cleaner) after refund
- **Status:** NOT BUILT. `refunds` table in schema (B5) is READY.

---

### TIER 3 — IMPORTANT ENHANCEMENTS (High UX value, not critical path)

---

**WF11 — Customer Dashboard Enhancements**
- "Your next cleaning" card (if upcoming booking)
- "Book again" carousel: favorite cleaners + recently used cleaners with quick-book CTA
- Recurring suggestion nudge after 2+ bookings
- Recent cleaning history list with status + approve/review prompts
- **Status:** Partially built. Add carousel and recurring nudge.

---

**WF19 — Notification Center Full Page**
- Full page at `/notifications`
- Category tabs: All / Bookings / Payments / Disputes / System
- Unread count badge per category
- "Mark all read" button
- Each item: icon, title, body, timestamp, read/unread state
- **Status:** Has notification bell. Full page with filtering NOT BUILT.

---

**WF24 — Auto-Rebook Nudge**
- Triggered 24h after a 5-star review
- Shows pre-filled booking summary (same cleaner, service, address)
- "Book again" primary CTA with "Make this recurring?" upgrade option
- Date options: next available slots for that cleaner
- **Status:** NOT BUILT. High conversion feature.

---

**WF48 — Customer First-Time Tour**
- 3-slide carousel shown on first app visit (if `user_milestones` not yet complete)
- Slide 1: "Every cleaner is verified" (background check + ID)
- Slide 2: "Photo proof of every job"
- Slide 3: "Pay only when you approve the work"
- Skip button on each slide, "Get started" on last
- **Status:** NOT BUILT. Requires `user_milestones` table.

---

**WF50 — Cleaner Platform Tour**
- 5-screen carousel for newly approved cleaners
- Screen 1: Dashboard and score overview
- Screen 2: How to handle incoming requests
- Screen 3: The photo system
- Screen 4: Earnings and payouts
- Screen 5: How tiers work
- **Status:** NOT BUILT.

---

**WF51 — Tier System Explainer Page**
- 4 tier cards with: name, score band, platform commission, minimum hours, rate range
- Tier change mechanics explained (14-day sustained rule)
- Current tier highlighted, "your current rate" callout
- **Status:** NOT BUILT. Cleaners need this to understand the system.

---

**WF52 — Reliability Score Explainer Page**
- Large score ring (current score + band label)
- 6 metric bars with weights: on-time (25%), completion (25%), photos (15%), ratings (15%), communication (10%), reschedules (10%)
- "How to improve" suggestion based on lowest metric
- **Status:** NOT BUILT. Important for cleaner transparency.

---

**WF53 — Score Change Notification States**
- 4 push notification designs:
  1. Small positive: "+2 points — you're doing great"
  2. Score drop: warning pill with metric explanation
  3. Tier promotion: celebration with new tier name
  4. Tier drop warning: "You have 14 days before tier changes — here's how to recover"
- **Status:** NOT BUILT. Notification templates needed.

---

**WF69 — Customer Quick Rebook**
- Accessed from booking history or "Your cleaners" section
- Pre-filled: same address, same service, same notes
- "Change anything" expansion link
- YOUR TEAM section: recommended cleaner (same as last time) + alternative
- Date picker + time picker
- 1-tap booking for repeat customers
- **Status:** NOT BUILT. Major friction-reduction feature.

---

**WF63 — Stripe Connect Onboarding Wrapper**
- Clean progress checklist: Identity → Background Check → Tax Info → Bank Account → Review
- Step-by-step wrapper around Stripe Connect's native flow
- Current step highlighted, completed steps with checkmarks
- **Status:** Partially built. Needs to match the step-checklist design.

---

**WF64 — Background Checked Trust Page**
- Dedicated badge detail page
- Shield hero with "Background Checked by Checkr"
- "What we verify" section (4 items): identity, criminal records, sex offender registry, county records
- "What we don't do" section: doesn't share personal details, no ongoing surveillance
- **Status:** NOT BUILT. Trust-critical for customer confidence.

---

**WF65 — ZIP-Locked Badge Detail**
- Star badge: "Trusted in [Neighborhood]"
- "How it's earned": 25+ completed jobs in ZIP, 4.7+ average rating, active last 90 days
- Why it exists: serves as local expert signal
- Other cleaners with this badge in the area
- **Status:** NOT BUILT.

---

**WF66 — Specialty Endorsement Page**
- Badge for each specialty (eco-friendly, pet-friendly, deep clean, move-out, Airbnb)
- "How it's earned" section: customer review trait tags (15+ tags triggers specialty)
- All specialties grid
- Badge stability note: "Maintained as long as new reviews keep tagging this"
- **Status:** NOT BUILT.

---

**WF25 — Customer Favorites Management**
- Tabs: All / Regulars (recurring) / Saved
- Active recurring bookings appear in Regulars tab with "Manage recurring" button
- Saved cleaners with "Book again" + "Start recurring" CTAs
- **Status:** Partially built (favorites exist). Tab UI and Regulars section NOT BUILT.

---

**WF26 — Cleaner Profile Editor — Rate/Earnings View**
- Hourly rate slider with band context ("Top Performers typically charge $45–65/hr")
- Platform fee shown so cleaner sees their actual take-home
- Earnings preview: "At $50/hr for 4 hours: you earn $180 after 10% fee"
- Tier impact explanation: "Reach Top Performer to reduce your fee to 11%"
- **Status:** Partially built. Earnings preview and tier-impact context NOT BUILT.

---

**WF22 — Recurring Booking Management**
- Active status banner with next occurrence date
- Skip next / Pause / Change schedule / End recurring controls
- Upcoming occurrences list (next 3)
- Stats: total completions, total spent, average rating
- **Status:** Partially built. Stats and skip/pause controls may be missing.

---

### TIER 4 — MARKETING + SEO (High growth value)

---

**WF41 — City × Service SEO Landing Pages**
- Template: `/cleaning/[city]/[service]` (e.g., `/cleaning/sacramento/deep-cleaning`)
- Hero with location tag + booking widget
- Top-rated cleaners carousel in that city
- "What's included" grid by service type
- Neighborhoods served (ZIP-level)
- Local testimonials
- FAQ section with location-specific answers
- **Status:** NOT BUILT. MAJOR SEO opportunity for city-level organic traffic.
- **Note:** This is a template — one build generates hundreds of pages.

---

**WF43 — About Page**
- Mission statement
- "How we're different" (4 cards): verification, photos, approval-before-pay, reliability scoring
- Where we operate map
- Founder bio
- Press contact
- **Status:** NOT BUILT.

---

**WF44 — Help Center Index**
- Search bar
- Topic grid (6 categories): Booking, Payment, Photos & Privacy, Trust & Safety, Cleaners, Account
- Popular articles list
- **Status:** NOT BUILT (FAQ page exists but no Help Center structure).

---

**WF46 — Coverage Page**
- Map with pins: active (Sacramento), launching soon (Bay Area Q2), future (Reno waitlist)
- Click-to-waitlist for non-covered areas
- **Status:** NOT BUILT (basic waitlist exists but no coverage map UI).

---

**WF67 — Press Kit / Launch Page**
- Headline + brand stats grid (4 numbers)
- "What makes us different" cards
- Founder bio
- Brand assets download links (logo, Dash, color palette)
- **Status:** NOT BUILT.

---

**WF70 — Post-Launch Waitlist Signup**
- Email + ZIP input
- Service interest checkboxes
- Booking frequency selection
- First-100 perk info ("first 100 customers in each new city get $20 credit")
- **Status:** Partially built. Perk messaging and frequency selection NOT BUILT.

---

### TIER 5 — POLISH + EMPTY/ERROR STATES

---

**WF38 — Empty States (Multiple Contexts)**
- Pattern 1: Customer, no bookings yet → "Book your first cleaning" CTA
- Pattern 2: Cleaner, no jobs yet → "Your inbox will fill up soon" with encouragement
- Pattern 3: No cleaners in customer's ZIP → "We're not there yet" + waitlist CTA
- **Status:** Inconsistent across app. Needs standardization with brand art assets (Dash mascot + cleaning icons).

---

**WF39 — Error States**
- Payment declined: clear explanation + "Update payment method" CTA
- Booking conflict (slot taken): "This time was just taken" + "Find another time" CTA
- Network error: "Check your connection" with retry
- 404: Brand-consistent not found page with navigation
- **Status:** Partially implemented. Need brand-consistent treatment.

---

**WF40a/b/c — Skeleton Loading States**
- WF40a: Cleaner dashboard skeleton (score ring, tier badge, job card all shimmer)
- WF40b: Cleaner list skeleton (3 cleaner card skeletons with shimmer)
- WF40c: Photo upload progress (spinner + "Uploading room 3 of 5…")
- **Status:** Partially implemented. Need branded shimmer skeletons for key loading surfaces.

---

**WF33 — Background Check Status Page**
- Dedicated page for cleaner's Checkr status
- Shows: provider (Checkr), date completed, renewal date, current status
- "What we check" list: identity, criminal records, sex offender registry, county court records
- **Status:** Partially built. Needs the "what we check" explainer section.

---

## PART 4 — DISPUTE SYSTEM UPGRADES (Phase 8b + 8c)

The current dispute system is Phase 8a (basic). Two more tiers are spec'd.

### Phase 8b — Admin Mediation (Tier 2)

**What it adds:**
- Full photo comparison panel in admin UI (side-by-side: customer complaint photos vs. cleaner job photos by room)
- Dispute thread visible to admin (read-only view of customer ↔ cleaner exchange)
- Decision panel with 3 options + mandatory rationale field
- `dispute_admin_actions` table tracks admin decision history
- Notification to both parties on resolution with reason

**Key DB additions needed:**
- `dispute_resolutions` table to record each admin decision attempt
- Admin action written to `admin_actions` for audit trail
- `dispute_messages` table in B3 schema already handles the thread

**Status:** Admin dispute list (WF56) partially built. Mediation interface (WF57) NOT BUILT with photo panel.

---

### Phase 8c — Tier 3 Escalation

**What it adds:**
- Escalation path for severe cases (significant fraud, physical damage, safety incidents)
- Insurance partner integration path (routes to `insurance_policies` for cleaner coverage)
- Legal review flag — marks booking + dispute for legal team attention
- Anti-abuse detection: flags users with >3 disputes in 90 days for review
- Automatic escalation if dispute not resolved within 7 days

**Key details:**

- `customer_reliability_events` in B4 schema tracks dispute history per customer
- Anti-abuse flag writes to `admin_actions` and triggers an admin notification
- Insurance claim path requires insurance partner webhook integration (future)

**Status:** NOT BUILT. Implement after Phase 8b is solid.

---

## PART 5 — SCHEMA FEATURES WORTH ADDING TO THE APP

These are schema tables/columns that exist in B1-B8 but have NO corresponding UI or app code.

### High Priority

| Feature | Schema Location | What to Build |
|---|---|---|
| In-app messaging | `messages` (B3) | WF18 — booking-scoped thread, 4h auto-purge |
| Insurance upload | `insurance_policies` (B5) | WF32 — 3-state upload + badge flow |
| Tax info collection | `cleaner_profiles.encrypted_tax_id` | WF34 — SSN/tax classification form |
| Reschedule flow | `bookings` reschedule policy (B2) | WF14 — reschedule with cleaner 4h SLA |
| Cancel with penalty | `bookings` cancel policy (B2) | WF15 — penalty disclosure + confirm |
| Booking state events | `booking_state_events` (B2) | Write all state transitions (en_route, arrived, clocked_in, etc.) |
| Auto-approval cron | `bookings.auto_approve_at` (B2) | Cron job: approve if no action after 24h |

### Medium Priority

| Feature | Schema Location | What to Build |
|---|---|---|
| User milestones | `user_milestones` (B1) | Write milestone completions; drive first-time tours |
| Admin audit log | `admin_actions` (B6) | Write every admin action with before/after JSONB |
| Notification quiet hours | `notification_preferences.quiet_hours_*` (B6) | UI controls in notification settings |
| Booking photo GPS | `booking_photos.capture_lat/lng` (B2) | Capture device GPS on photo upload |
| Cleaner appeals | `cleaner_appeals` (B4) | Appeal form for tier drops/disputed events |

### Lower Priority (Future)

| Feature | Schema Location | Notes |
|---|---|---|
| Customer reliability events | `customer_reliability_events` (B4) | Track customer no-shows/cancellations |
| Specialty nightly update | `cleaner_specialties` (B4) | Cron updates specialties from review traits |
| Notification delivery log | `notification_deliveries` (B6) | Per-channel attempt tracking for debugging |
| Badge expiration | `cleaner_badges.expires_at` (B4) | Cron checks expiration, revokes if needed |
| Background check renewal | `background_checks.renewal_due_at` (B7) | 2-year renewal reminder system |

---

## PART 6 — WHAT NOT TO BUILD (Filtered Out)

These exist in the documents but are not worth doing now:

| Item | Why Skip |
|---|---|
| City × Service SEO pages (WF41) | High value but post-launch; needs real data first |
| Press kit page (WF67) | Nice-to-have, low urgency |
| WF43 About page | Low impact vs. effort now |
| Customer reliability scoring UI | Schema is day-1, UI is Phase 2 — wait for data |
| Insurance partner webhook | No partner yet; integrate when needed |
| Tier 3 escalation (Phase 8c) | Build after Phase 8b is solid |
| `cleaner banner.webp` usage | Yellow background is completely off-brand for in-app use |
| `money page_background.png` as-is | Green/gold is off-brand — needs redesign or overlay |

---

## PART 7 — PRIORITIZED BUILD ORDER

Based on everything above, here is the recommended build sequence:

### PHASE 17 — Active Job Flow (Most Unbuilt Critical Path)
1. Cleaner "On My Way" screen (WF4/4b/61) — GPS + geofence
2. Cleaner Active Job screen (WF5/5b) — clock in/out + room photos
3. Customer Active Job Tracker (WF9) — real-time photo updates
4. Cleaner Running Late (WF68) — notification with new ETA
5. Write all new booking states to `booking_state_events`

### PHASE 18 — Booking Lifecycle Completion
1. Reschedule flow (WF14) with 4h cleaner SLA
2. Cancel flow with penalty disclosure (WF15)
3. Auto-approval 24h cron
4. Approve & Pay photo gallery enhancements (WF10)

### PHASE 19 — In-App Messaging
1. `messages` table wiring (already in B3 schema)
2. WF18 messaging thread UI
3. 4h auto-purge enforcement (RLS policy in B8 already handles it)

### PHASE 20 — Trust & Verification Features
1. Insurance Verified upload (WF32 + `insurance_policies` B5)
2. Tax info collection (WF34 + encrypted SSN)
3. Badge detail pages (WF64/65/66)
4. Tier system explainer (WF51)
5. Reliability score explainer (WF52)
6. Score change notification templates (WF53)

### PHASE 21 — Admin Tools Completion
1. Admin KPI dashboard (WF54)
2. Dispute mediation photo panel (WF57 + Phase 8b spec)
3. Admin refund processing (WF62)
4. Admin booking/cleaner/customer detail views (WF58/59/60)
5. Admin action audit log writes (`admin_actions` B6)

### PHASE 22 — Customer Retention Features
1. Customer first-time tour (WF48 + `user_milestones`)
2. Auto-rebook nudge 24h after 5-star (WF24)
3. Quick rebook flow (WF69)
4. Customer dashboard enhancements (WF11 — carousel, recurring nudge)
5. Favorites tab UI (WF25 — All/Regulars/Saved)

### PHASE 23 — Art Assets + Polish
1. Deploy 3D icon set throughout the app (navigation, tiles, empty states)
2. Background assets on legal, support, coverage pages
3. Dash mascot on onboarding, success states, loading screens
4. Skeleton loading states (WF40a/b/c)
5. Standardized empty states (WF38) with brand art
6. Standardized error states (WF39)
7. Cleaner platform tour (WF50) and score/tier explainer pages

### PHASE 24 — SEO + Growth
1. Coverage page with map (WF46)
2. Help Center index (WF44)
3. City × Service SEO landing pages (WF41)
4. Waitlist enhancements (WF70)

---

## SUMMARY TABLE

| Category | Files Reviewed | Key Findings |
|---|---|---|
| Art assets | 24 images | 10 branded 3D icons unused; 7 page backgrounds unused; Dash mascot + logo ready |
| SQL schema | 8 files, 5,600+ lines | 54 tables; 12+ features with schema ready but no app UI |
| Wireframes | 70 screens, 11 HTML files | ~35 screens either not built or significantly incomplete |
| Batch deep-dives | 20 markdown files | Detailed specs for every screen including cross-phase dependencies |
| Phase 8b/8c specs | 4 files | Full admin mediation + escalation specs with DB additions |
| Style guide (V2.1) | Previously analyzed | Brand tokens ✓ implemented; Inter font + type scale pending |
| Sound system guide | Previously analyzed | 120 sounds, Howler.js architecture fully specified, not started |

**Everything is documented. Nothing is blocking. The schema is ready. The wireframes are ready. The art assets are ready. The build order above is the path forward.**
