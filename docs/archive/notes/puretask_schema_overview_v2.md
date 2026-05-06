# PureTask Schema Overview — Audit & Revised v2

**Purpose of this document:** A real audit of the v1 schema overview against every wireframe (1–70). I went through each wireframe systematically and asked "what data does this screen read or write?" and compared that to the table list in v1. This document captures gaps found, tables added, and tables refined.

---

## Audit summary

**v1 schema:** 39 tables across 6 groups
**v2 schema:** 47 tables across 7 groups (added group B7 for onboarding/operations gaps)

**Gaps found in v1:**

- 8 missing tables
- 4 tables that needed structural changes
- 3 columns/concepts I was hand-waving about
- 2 wireframe surfaces that had zero schema coverage

**Wireframes verified covered:** All 70

---

## Part 1 — Gaps Found

I went through each of the 70 wireframes and asked: "What does this screen need to read from or write to the database?" Here's what came up missing.

### Gap 1 — Cleaner application is not the same as cleaner_profile

**Wireframes affected:** 33 (background check status), 55 (cleaner application queue), 63 (Stripe Connect onboarding wrapper)

**The problem in v1:** I was treating cleaner_profiles as the only cleaner record. But the application queue (wireframe 55) shows pending applications that haven't been approved yet — these aren't cleaners, they're applicants. Once approved, they become cleaners. Two distinct states with different data.

**The fix:** Add a separate `cleaner_applications` table. An application has its own state machine (DRAFT → SUBMITTED → IN_REVIEW → APPROVED → REJECTED → NEEDS_INFO). When approved, it triggers creation of the `cleaner_profile` row. The application itself is preserved as an audit record of the approval decision.

### Gap 2 — Background checks are their own thing

**Wireframes affected:** 33 (background check status), 55 (admin queue showing check status), 64 (background-checked trust page)

**The problem in v1:** I wasn't modeling background checks. Wireframe 33 shows: provider (Checkr), completion date, expiration (renews every 2 years), pass/fail status, ability to contact provider. This is data we need to store and surface.

**The fix:** Add a `background_checks` table. Per-cleaner records of every check ever run. State machine: PENDING → IN_PROGRESS → CLEAR → CONSIDER → FAILED. Includes provider, external_check_id (Checkr's reference), expires_at, run_at. Multiple rows per cleaner over time as checks renew.

### Gap 3 — Identity verification is separate from background checks

**Wireframes affected:** Cleaner application flow (referenced in 55), trust badges on profile (7)

**The problem in v1:** I lumped "identity verification" and "background check" together. They're different services (Stripe Identity vs Checkr), different cadences (one-time vs renewing), different failure modes.

**The fix:** Add `identity_verifications` table. Tracks Stripe Identity sessions with ID document type, verification result, retry attempts. Separate from background_checks because the systems are independent.

### Gap 4 — Service-area definitions are missing

**Wireframes affected:** 8 (cleaner list filtered by ZIP), 26 (profile editor service area tab), 27 (availability — but service area is also editable per locked design), 41 (city × service SEO landing), 46 (coverage page), 70 (waitlist by ZIP)

**The problem in v1:** I had `addresses` for customer service addresses and cleaner home base, but I never modeled the cleaner's service area — the polygon or list of ZIPs they're willing to travel to. The cleaner list page filters by this. The SEO pages list cleaners in specific ZIP/city combinations. The waitlist captures customers in non-served ZIPs.

**The fix:** Two new tables:

- `cleaner_service_zips` — many-to-many between cleaners and ZIPs they serve
- `serviced_areas` — platform's authoritative list of which ZIPs are open for booking, which are SEO-page-but-not-yet-active, and which are waitlist-only

### Gap 5 — Customer favorites needs a real table

**Wireframes affected:** 11 (customer dashboard favorites), 25 (favorites management page), 24 (auto-rebook nudge prefers favorites), 7 (cleaner profile shows "saved by N customers" implicitly)

**The problem in v1:** I noted this as an open question and recommended a join table. Lock it in: `customer_favorites` join table with customer_user_id, cleaner_user_id, saved_at, is_regular (boolean — set true when customer has active recurring with this cleaner per wireframe 25 tab structure).

### Gap 6 — Tutorial / onboarding completion tracking is missing

**Wireframes affected:** 48 (customer first-time tour), 49 (photo etiquette training), 50 (cleaner platform tour)

**The problem in v1:** These tours have completion states. The platform shouldn't show the cleaner platform tour to a cleaner who already completed it. The customer first-time tour appears once after first booking. We need to know who completed what.

**The fix:** Add `user_milestones` table — flexible key/value: user_id, milestone_key (e.g., "customer_first_tour", "cleaner_photo_training", "cleaner_platform_tour", "first_booking_complete"), completed_at, metadata. Used for triggering and suppressing flows.

### Gap 7 — Waitlist signups have no home

**Wireframes affected:** 70 (waitlist signup page)

**The problem in v1:** Customers in non-served ZIPs sign up to be notified when service launches in their area. Where do those signups go?

**The fix:** Add `waitlist_signups` table — email, zip_code, requested_service, signed_up_at, notified_at (set when launch email sent), converted_to_user_id (set when they become a real customer).

### Gap 8 — Press / launch content has no home

**Wireframes affected:** 67 (press kit / launch announcement)

**The problem in v1:** The press kit page (downloadable assets, press contact, recent coverage) is content that needs to live somewhere. I didn't model it.

**The honest answer:** This doesn't need a database table. It's a static marketing page rendered from a CMS or hardcoded React component. **Removing the assumption that everything needs a table.** The schema doesn't cover this — and that's fine.

---

## Part 2 — Tables That Needed Structural Changes

### Change 1 — `bookings` needed a "running late" flag

**Wireframes affected:** 68 (cleaner running late flag)

**The issue:** I had bookings with state IN_TRANSIT and ARRIVED but no way to mark "the cleaner triggered a running-late notification." This is a separate event the customer sees ("Maria flagged she's running 15 min late").

**The fix:** Add `is_running_late` boolean and `late_estimate_minutes` integer to bookings. Plus a `RUNNING_LATE_FLAGGED` event in `booking_state_events`. Doesn't change state, just marks the side-effect.

### Change 2 — Reviews needed customer-side reliability data

**Wireframes affected:** 17 (cleaner sees customer's "rating" implicitly), 60 (admin customer detail showing customer reliability)

**The issue:** I modeled reviews as customer-rates-cleaner. The locked decision was "customer reliability score is Phase 2" but admin tooling (wireframe 60) shows it. We need the data structure even if MVP doesn't expose it.

**The fix:** Add `customer_reliability_events` table — same pattern as cleaner reliability_events but for customers (no-shows, late-cancels, dispute frivolousness flagged by mediator, etc.). Even if the customer-facing display is deferred, capturing the data from day one means we don't backfill later.

### Change 3 — Disputes need an escalation trail

**Wireframes affected:** 17 (cleaner dispute response), 56 (admin disputes list), 57 (mediation interface)

**The issue:** I had `disputes` and `dispute_messages` but no way to model "this dispute was escalated to mediation," "this was resolved by admin decision vs mutual agreement," or "this dispute resulted in a refund of $X."

**The fix:** Add `dispute_resolutions` table — one row per resolution attempt. Contains resolution_type (MUTUAL_REFUND / MUTUAL_RECLEAN / CUSTOMER_BACKED_DOWN / CLEANER_BACKED_DOWN / ADMIN_DECISION / EXPIRED), resolved_by_user_id (admin if applicable), refund_amount, resolution_notes. Foreign key from disputes.

### Change 4 — `tier_change_appeals` should be merged with general appeals

**Wireframes affected:** 2d (cleaner can submit a one-paragraph response on score events too — not just tier drops)

**The issue:** I had `tier_change_appeals` for tier-drop appeals only. But the locked appeal mechanism is more general — cleaners can submit a one-paragraph response on any score event they think was unfair (per the wireframe 2d correction we made).

**The fix:** Rename and broaden to `cleaner_appeals` — links to either a tier_assignment OR a reliability_event (one of the two FK columns populated, the other null). Same review mechanism, broader scope.

---

## Part 3 — Columns and Concepts Refined

### Refinement 1 — Photo categories are richer than I had

**Issue:** I had photo `purpose` enum with 4 values (clock_in, clock_out, dispute_evidence_customer, dispute_evidence_cleaner). Wireframes show more categories.

**Refined enum:**

- `BEFORE_CLOCK_IN` — wide-angle pre-clean photos (wireframe 9)
- `AFTER_CLOCK_OUT` — wide-angle post-clean photos (wireframe 10)
- `DISPUTE_EVIDENCE_CUSTOMER` — customer-uploaded in dispute (wireframe 16)
- `DISPUTE_EVIDENCE_CLEANER` — cleaner-uploaded in dispute response (wireframe 17)
- `PROFILE_PHOTO_CLEANER` — cleaner profile pic (wireframe 31)
- `INSURANCE_CERTIFICATE` — uploaded COI document (wireframe 32)
- `IDENTITY_DOCUMENT` — Stripe Identity reference (admin-only, wireframe 55)

Each category has different retention, different access control, different storage location.

### Refinement 2 — "Address" is overloaded

**Issue:** v1 had one `addresses` table for everything. Wireframes show different access patterns:

- Customer service addresses (multiple per customer) — wireframes 11, 28
- Cleaner home base (one per cleaner) — wireframe 26
- Cleaner travel preferences (radius from home base, or list of ZIPs) — wireframe 26

**Refined:** Keep `addresses` table but add `address_type` enum (CUSTOMER_SERVICE / CLEANER_HOME / BUSINESS) and `owner_user_id` to scope properly. Add `cleaner_service_zips` join table for ZIP-based travel preferences (a cleaner can have one home address + many service ZIPs).

### Refinement 3 — Booking state machine has more transitions than v1 listed

**Wireframes affected:** All booking-related screens, especially 14 (reschedule waiting), 17 (dispute response paths)

**Issue:** I listed ~15 states. Reality is closer to 20 once you include:

- `BOOKING_REQUESTED` — pre-confirmation, cleaner has 4hr to accept (locked SLA)
- `RESCHEDULE_REQUESTED` — pending cleaner confirmation (4hr SLA)
- `RUNNING_LATE_FLAGGED` — sub-state during IN_TRANSIT
- `AUTO_APPROVED` — distinct from APPROVED so we know it wasn't customer-confirmed
- `DISPUTE_PENDING_CLEANER_RESPONSE` — within DISPUTED state
- `DISPUTE_RESOLVED_VIA_MUTUAL` vs `DISPUTE_RESOLVED_VIA_ADMIN` — for analytics

**Refined:** Full state machine documented in B2 with all 20+ states and valid transitions. Stored in `booking_state` enum.

---

## Part 4 — Wireframes That Got Zero Coverage in v1

Two surfaces had no schema home in v1. I added them in v2.

### Surface 1 — Cleaner suspension / probation enforcement

**Wireframes affected:** 2d (cleaner dashboard probation state), 60 (admin customer/cleaner suspension toggle)

**The issue:** Probation (40-59 score band, can't accept new bookings) and suspension (manual admin action or 5-no-shows-in-60-days rule) need to be queryable: "is this cleaner currently allowed to accept new bookings?" In v1 I treated this as a cleaner_profile boolean, but it has history, reasons, durations, and lift conditions.

**The fix:** Add `cleaner_suspensions` table — start_at, end_at (null if indefinite), reason_type (SCORE_PROBATION / NO_SHOW_RULE / MANUAL_ADMIN / FRAUD_INVESTIGATION), notes, imposed_by_user_id (null if automatic). Queryable: "is there an active suspension row for this cleaner right now?"

Probation is a calculated status (score < 60) that the application reads from current score snapshot. Suspension is an explicit row. Both block new booking acceptance.

### Surface 2 — Refund processing as its own concept

**Wireframes affected:** 62 (admin refund processing)

**The issue:** I noted refunds in B5 as an open question. They are their own thing — admin can issue refunds outside the dispute mechanism (goodwill refunds, tax disputes, payment failures).

**The fix:** Add `refunds` table — charge_id, refund_amount, refund_reason_type (DISPUTE_RESOLUTION / GOODWILL / DUPLICATE_CHARGE / FRAUD / OTHER), initiated_by_user_id, stripe_refund_id, status. Foreign key from charges. Separate from disputes — a refund can exist without a dispute.

---

## Part 5 — The Revised Table List

### Group B1 — Core Identity + Accounts (8 tables, was 6)

| #   | Table                | Purpose                        | Change from v1                            |
| --- | -------------------- | ------------------------------ | ----------------------------------------- |
| 1   | `users`              | Central identity row           | unchanged                                 |
| 2   | `customer_profiles`  | Customer-specific data         | unchanged                                 |
| 3   | `cleaner_profiles`   | Cleaner-specific data          | unchanged                                 |
| 4   | `admin_profiles`     | Admin tooling data             | unchanged                                 |
| 5   | `addresses`          | Multi-purpose addresses        | refined with address_type + owner_user_id |
| 6   | `auth_sessions`      | Active device sessions         | unchanged                                 |
| 7   | `customer_favorites` | Customer's saved cleaners      | NEW (was open question)                   |
| 8   | `user_milestones`    | Tutorial/onboarding completion | NEW (gap 6)                               |

### Group B2 — Booking Lifecycle (10 tables, was 8)

| #   | Table                   | Purpose                        | Change from v1                               |
| --- | ----------------------- | ------------------------------ | -------------------------------------------- |
| 9   | `services`              | Service catalog                | unchanged                                    |
| 10  | `bookings`              | One row per booking            | added is_running_late, late_estimate_minutes |
| 11  | `booking_state_events`  | Immutable state log            | full 20-state machine                        |
| 12  | `booking_photos`        | Photos uploaded for bookings   | refined photo_category enum                  |
| 13  | `recurring_schedules`   | Active recurring agreements    | unchanged                                    |
| 14  | `recurring_occurrences` | Spawned bookings from schedule | unchanged                                    |
| 15  | `availability_rules`    | Cleaner weekly schedule        | unchanged                                    |
| 16  | `time_off_blocks`       | Date-specific overrides        | unchanged                                    |
| 17  | `cleaner_service_zips`  | ZIPs cleaner serves            | NEW (gap 4)                                  |
| 18  | `serviced_areas`        | Platform's open ZIPs           | NEW (gap 4)                                  |

### Group B3 — Trust + Evidence (8 tables, was 7)

| #   | Table                 | Purpose                       | Change from v1                     |
| --- | --------------------- | ----------------------------- | ---------------------------------- |
| 19  | `messages`            | In-app messaging              | unchanged                          |
| 20  | `reviews`             | Customer reviews of cleaners  | unchanged                          |
| 21  | `traits`              | Lookup table for trait chips  | NEW (was inline in v1)             |
| 22  | `review_traits`       | Join: reviews ↔ traits        | unchanged                          |
| 23  | `tips`                | Customer tips to cleaners     | unchanged                          |
| 24  | `disputes`            | Customer-filed issues         | unchanged                          |
| 25  | `dispute_messages`    | Threaded dispute conversation | merged dispute_responses into this |
| 26  | `dispute_resolutions` | Resolution outcomes           | NEW (change 3)                     |

### Group B4 — Cleaner Operations (10 tables, was 8)

| #   | Table                         | Purpose                       | Change from v1                   |
| --- | ----------------------------- | ----------------------------- | -------------------------------- |
| 27  | `reliability_events`          | Score-affecting events        | unchanged                        |
| 28  | `reliability_score_snapshots` | Daily score by cleaner        | unchanged                        |
| 29  | `tier_assignments`            | Historical tier changes       | unchanged                        |
| 30  | `cleaner_appeals`             | Appeals on tier or events     | renamed and broadened (change 4) |
| 31  | `badges`                      | Catalog of all badges         | unchanged                        |
| 32  | `cleaner_badges`              | Earned badge assignments      | unchanged                        |
| 33  | `specialties`                 | Specialty endorsement catalog | unchanged                        |
| 34  | `cleaner_specialties`         | Earned specialties            | unchanged                        |
| 35  | `cleaner_suspensions`         | Active/historical suspensions | NEW (surface 1)                  |
| 36  | `customer_reliability_events` | Customer-side score data      | NEW (change 2)                   |

### Group B5 — Money (8 tables, was 6)

| #   | Table                   | Purpose                | Change from v1                 |
| --- | ----------------------- | ---------------------- | ------------------------------ |
| 37  | `payment_methods`       | Customer cards on file | unchanged                      |
| 38  | `charges`               | Every charge attempted | unchanged                      |
| 39  | `refunds`               | Refund records         | NEW (surface 2)                |
| 40  | `payouts`               | Cleaner payouts        | unchanged                      |
| 41  | `payout_line_items`     | Payout composition     | unchanged                      |
| 42  | `commission_records`    | Per-booking commission | unchanged                      |
| 43  | `insurance_policies`    | Cleaner-uploaded COIs  | unchanged                      |
| 44  | `stripe_webhook_events` | Webhook idempotency    | NEW (was implied in section 5) |

### Group B6 — Platform Operations (5 tables, unchanged count)

| #   | Table                      | Purpose                         | Change from v1 |
| --- | -------------------------- | ------------------------------- | -------------- |
| 45  | `notifications`            | User-facing notifications       | unchanged      |
| 46  | `notification_preferences` | Channel preferences             | unchanged      |
| 47  | `notification_deliveries`  | Delivery success/failure log    | NEW            |
| 48  | `admin_actions`            | Admin operation audit log       | unchanged      |
| 49  | `support_tickets`          | Customer/cleaner support issues | unchanged      |

Removed from v1: `feature_flags` (use environment variables; reconsider if/when needed)

### Group B7 — Onboarding & Verification (4 tables, NEW GROUP)

This group was missing from v1 entirely. The cleaner application + verification pipeline deserves its own group because it's a distinct lifecycle.

| #   | Table                    | Purpose                                      | Driving wireframes |
| --- | ------------------------ | -------------------------------------------- | ------------------ |
| 50  | `cleaner_applications`   | Application records (separate from profiles) | 33, 34, 55, 63     |
| 51  | `background_checks`      | Checkr-managed checks, renewing              | 33, 64             |
| 52  | `identity_verifications` | Stripe Identity sessions                     | 55 (admin queue)   |
| 53  | `waitlist_signups`       | Customers in unserved ZIPs                   | 70                 |

---

## Part 6 — Final Numbers (v2)

- **53 tables** (was 39)
- **~340 columns** estimated (was ~280)
- **~95 foreign-key relationships** (was ~80)
- **~75 indexes** (was ~60)
- **15 enum types** (was 12)
- **9 background jobs / cron tasks** (was 8 — added "process waitlist for newly opened ZIPs")
- **8 audit/event tables** for immutable history (was 6)

---

## Part 7 — Things Still Worth Discussing

These didn't rise to the level of "schema gap" but are worth thinking about before we lock in:

### 1. Multi-photo upload retry / partial state

The active job wireframe (9) shows photos arriving live. Mobile photo upload at scale fails — connection drops, server errors, retries. We need a way to track "photo upload pending, retry queued" without showing the customer a half-uploaded photo. Question: does this need a `photo_upload_jobs` table tracking retry state, or do we handle this entirely client-side with offline queue + final POST when complete?

**Recommendation:** Client-side queue for active uploads. Once a photo POSTs to the server, it's in `booking_photos`. If client-side fails permanently, photo_count won't match expected, which we surface as a soft warning ("only 5 of 12 expected photos arrived"). No additional table.

### 2. Search history / "you searched for" features

Wireframe 8 (cleaner list) has filtering. Should we save searches? Power users might want "show me cleaners I've looked at before." Customer dashboard (11) doesn't show this currently.

**Recommendation:** Skip for MVP. Add `customer_search_history` only if/when we add the feature.

### 3. Notification quiet hours

The cleaner settings (30) shows notification toggles but no quiet hours setting. Cleaners get bookings at all hours but might want "no push notifications between 10pm-7am." Not in current wireframes but obvious feature gap.

**Recommendation:** Add columns to `notification_preferences` (quiet_hours_start, quiet_hours_end, quiet_hours_enabled) but don't expose in MVP UI. Schema-ready for when we add it.

### 4. Currency assumption

Everything is in USD. Schema should still store amounts as `INTEGER cents` (not floats — never store money as floats), and prepare for `currency` column on charges/payouts even if we only ever support USD.

**Recommendation:** Add `currency CHAR(3) NOT NULL DEFAULT 'USD'` to charges, payouts, refunds, tips. Cheap insurance.

### 5. Time zones

Cleaners and customers might be in different time zones (especially as we expand to Reno). Bookings are stored UTC but displayed local. Need to know each user's time zone for proper display.

**Recommendation:** Add `timezone VARCHAR(50)` to `users` (e.g., 'America/Los_Angeles'). All timestamp columns stored as `TIMESTAMP WITH TIME ZONE` (Postgres `timestamptz`).

---

## What I want from you before we start B1

Five questions, prioritized:

1. **Does the v2 table list feel complete?** Anything you can think of that I still missed?

2. **Any tables that feel like overkill?** (`customer_reliability_events`, `notification_deliveries`, `user_milestones` are softer than the rest. We could defer them.)

3. **Group B7 — is breaking out onboarding/verification its own group OK, or would you rather merge it into B1?** I think B7 is right because the lifecycle is distinct, but it's a judgment call.

4. **The `booking_state` enum has 20+ values. That's a lot.** Should we collapse to a smaller set (~10) and use additional flags (is_disputed, is_late, etc.)? Tradeoff: smaller enum = simpler queries but more nullable flags. Larger enum = richer state but more transitions to manage. Recommend keeping it rich because the audit trail benefits from explicit states.

5. **Are there wireframes you want to actively change as a result of this audit?** Sometimes seeing the data structure makes you reconsider a UX choice. Specifically — the customer-side reliability data (gap covered by `customer_reliability_events`) is something the wireframes don't show but the data structure suggests. Want to add a wireframe for "customer's own profile from cleaner's perspective"?

After this is locked, we move to B1.
