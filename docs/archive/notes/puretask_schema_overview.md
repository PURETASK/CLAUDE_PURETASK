# PureTask Database Schema — Overview & Planning Document

**Purpose:** Comprehensive map of every table, column theme, relationship, and infrastructure piece needed to support all 70 wireframes. This is the planning document. The actual SQL gets built in groups B1–B6 after this is reviewed.

**Database:** PostgreSQL (Supabase)
**Identity model:** Shared `users` table + separate profile tables
**Scope:** Full schema, no MVP/Phase 2 distinction in the schema itself (everything designed to support the full vision)

---

## Quick numbers

- **6 logical groups** (B1–B6)
- **35–40 tables** total
- **~250–300 columns** across all tables
- **~80 foreign-key relationships**
- **~60 indexes** for query performance
- **~12 enum types** for constrained values
- **~8 background jobs / cron tasks** the schema must support
- **~6 audit/event tables** for immutable history

---

## Group B1 — Core Identity + Accounts (6 tables)

The foundation. Everything else hangs off these.

### Tables

| #   | Table               | Purpose                                | Wireframes driving it     |
| --- | ------------------- | -------------------------------------- | ------------------------- |
| 1   | `users`             | Central identity row, one per person   | All authenticated screens |
| 2   | `customer_profiles` | Customer-specific data joined to user  | 1, 11, 28, 29             |
| 3   | `cleaner_profiles`  | Cleaner-specific data joined to user   | 2 (a-d), 7, 26, 31        |
| 4   | `admin_profiles`    | Admin tooling data joined to user      | Admin screens 54-60       |
| 5   | `addresses`         | Service addresses + cleaner home bases | 11, 26, 27                |
| 6   | `auth_sessions`     | Active device sessions for security    | 28 (active sessions)      |

### Key design decisions to make in B1

- **Email uniqueness.** Enforced at users table.
- **Phone format.** E.164 standardized (+1XXXXXXXXXX) for SMS reliability.
- **Soft delete vs hard delete.** Probably soft delete with `deleted_at` because of the locked decision that "cleaners you've reviewed retain their reviews" even after account deletion (wireframe 29).
- **Auth provider linkage.** Clerk-managed. `users` stores `clerk_user_id` as foreign reference. Don't store passwords ourselves.
- **Address ownership.** Customers can have multiple addresses (work, home, parents). Cleaners have one home base + a service area defined by a polygon or radius.

### Open question

Customer favorites: stored as a join table (`customer_favorites`) or as a JSON array on the customer_profile? Recommend join table for query flexibility and audit history. Will lock in B1.

---

## Group B2 — Booking Lifecycle (8 tables)

The core transactional engine. This is the biggest group.

### Tables

| #   | Table                   | Purpose                                            | Wireframes driving it |
| --- | ----------------------- | -------------------------------------------------- | --------------------- |
| 7   | `services`              | Service catalog (Standard, Deep, Move-out, Airbnb) | 1, 11, 21, 26         |
| 8   | `bookings`              | One row per booking instance                       | 8, 9, 10, 11, 14, 15  |
| 9   | `booking_state_events`  | Immutable log of every state change                | 9, 10 (timelines)     |
| 10  | `booking_photos`        | Photos uploaded for a specific booking             | 9, 10, 16, 17         |
| 11  | `recurring_schedules`   | Customer's active recurring agreements             | 21, 22                |
| 12  | `recurring_occurrences` | Spawned bookings from a recurring schedule         | 22 (upcoming list)    |
| 13  | `availability_rules`    | Cleaner's weekly schedule                          | 27                    |
| 14  | `time_off_blocks`       | Cleaner's date-specific overrides                  | 27 (time off tab)     |

### Booking state machine (critical to model)

A booking moves through these states (locked from wireframes 9, 10):

```
DRAFT → CONFIRMED → IMMINENT (24hr) → IN_TRANSIT → ARRIVED →
  IN_PROGRESS → COMPLETED → AWAITING_APPROVAL → APPROVED → PAID
                                              ↓
                                          DISPUTED → RESOLVED
                                              ↓
                                          AUTO_APPROVED (24hr passed)

Plus terminal alternatives:
  CONFIRMED → CANCELLED_BY_CUSTOMER (with penalty %)
  CONFIRMED → CANCELLED_BY_CLEANER (counts against score)
  CONFIRMED → RESCHEDULE_PENDING → CONFIRMED (new time)
                                  → RESCHEDULE_DECLINED → original CONFIRMED stays
```

Every state transition writes a row to `booking_state_events` with: timestamp, previous_state, new_state, triggered_by (user_id or 'system'), reason, metadata. **This is the audit trail for everything.**

### Key design decisions

- **Bookings are immutable once confirmed.** Changes (reschedule, cancel) create new state events, not column updates. The original timestamp/cleaner/etc. preserved.
- **Recurring vs one-off.** Bookings have an optional `recurring_schedule_id` foreign key. NULL = one-off, populated = part of a series.
- **Photos linked to bookings, not to messages or disputes directly.** Photos belong to a booking; disputes reference photos via the booking. Cleaner's clock-out photos and customer's dispute photos differentiate by `uploaded_by_role` and `category` columns.
- **Cancellation penalty calculation.** Schema stores cancellation timestamp + booking_start_time; the penalty % is calculated on read (or stored as a computed column) using the locked schedule (48h+ free / 24-48h 50% / <24h 100%).
- **Hour minimums by tier.** Service+tier combinations have `min_hours` constraint. Schema needs a lookup table or constraint for this.

### Open questions

- Buffer time between bookings (locked at 60 min default per wireframe 27): enforced in application logic or as a database constraint? Probably application logic since it's per-cleaner configurable.
- Recurring occurrence "skip" mechanism: separate `skipped_at` field on the occurrence, or a status enum? Recommend status enum (SCHEDULED / SKIPPED / EXECUTED / CANCELLED).

---

## Group B3 — Trust + Evidence (7 tables)

The differentiator features that make PureTask trustworthy.

### Tables

| #   | Table               | Purpose                                                 | Wireframes driving it     |
| --- | ------------------- | ------------------------------------------------------- | ------------------------- |
| 15  | `messages`          | In-app messaging thread                                 | 18                        |
| 16  | `reviews`           | Customer reviews of cleaners                            | 7, 11, 20                 |
| 17  | `review_traits`     | Trait chips selected on reviews                         | 20                        |
| 18  | `tips`              | Customer tips to cleaners                               | 20, 23                    |
| 19  | `disputes`          | Customer-filed quality/damage issues                    | 16, 17                    |
| 20  | `dispute_responses` | Cleaner response actions (re-clean / refund / stand by) | 17                        |
| 21  | `dispute_messages`  | Threaded conversation within a dispute                  | 17 (messaging in dispute) |

### Key design decisions

- **Messages auto-purge.** Locked rule: messages retained until 4 hours after booking ends. Schema needs `expires_at` column + nightly cleanup job.
- **Reviews are immutable post-submission.** Customer can edit within a window (TBD), but once locked, no edits. Reviews drive cleaner score, so changing them retroactively breaks the audit trail.
- **Trait chips as separate table.** Locked traits (Thorough, On time, Friendly, Communicative, Pet-friendly, Detail-oriented, Professional, Eco-friendly) need normalization. `review_traits` is a join table: review_id + trait_id (where trait_id references a small `traits` lookup).
- **Tips separate from booking total.** Tip is its own charge, paid out 100% to cleaner (locked: "no platform cut on tips"). Schema records tip charge separately from booking charge.
- **Disputes have their own state machine.** OPEN → CLEANER_RESPONDED → CUSTOMER_ACCEPTED / CUSTOMER_REJECTED / ESCALATED → MEDIATION → RESOLVED. Need a `dispute_state_events` table for this audit trail.
- **Dispute responses are typed.** Three locked options (REFUND / RECLEAN / STAND_BY). Each has different downstream consequences.

### Open questions

- Should `traits` be hardcoded as an enum or a lookup table? Lookup table = easier to add traits later. Enum = type-safe at query time. Recommend lookup table with a versioning column for badge/specialty mapping later.
- Photos in disputes: stored in `booking_photos` with a `dispute_evidence` flag, or in a separate `dispute_photos` table? Recommend single `booking_photos` table with `purpose` enum (CLOCK_IN / CLOCK_OUT / DISPUTE_EVIDENCE).

---

## Group B4 — Cleaner Operations (8 tables)

Score, tier, badges, specialties, score events. The system that powers cleaner reliability.

### Tables

| #   | Table                         | Purpose                                 | Wireframes driving it |
| --- | ----------------------------- | --------------------------------------- | --------------------- |
| 22  | `reliability_events`          | Every event affecting score (immutable) | 2c, 53                |
| 23  | `reliability_score_snapshots` | Daily score by cleaner (point-in-time)  | 2 (score widget)      |
| 24  | `tier_assignments`            | Historical record of tier changes       | 2, 6                  |
| 25  | `tier_change_appeals`         | Cleaner-submitted appeals on tier drops | 2d, 52                |
| 26  | `badges`                      | Catalog of all available badges         | 65, 66                |
| 27  | `cleaner_badges`              | Earned badge assignments                | 7, 65                 |
| 28  | `specialties`                 | Specialty endorsement catalog           | 26, 31, 66            |
| 29  | `cleaner_specialties`         | Earned specialty endorsements           | 7, 26, 31             |

### Key design decisions

- **Reliability events are immutable.** Once written, never updated. Includes: ON_TIME_ARRIVAL, COMPLETION, PHOTO_QUALITY, RATING_5_STAR, RATING_LOW, COMM_RESPONSE_FAST, RESCHEDULE_REQUESTED, NO_SHOW, etc. Each event has a metric_category (matches the locked 6-metric system: on-time 25% / completion 25% / photo 15% / ratings 15% / comm 10% / reschedule 10%) and a calculated point delta.
- **Score is computed, not stored long-term.** Daily nightly batch reads reliability_events from the past 90 days, calculates current score, writes to `reliability_score_snapshots`. The dashboard shows the latest snapshot. The score breakdown wireframe (2c) reads from snapshots.
- **Tier transitions take 14 days.** Locked rule. Schema needs to track: when did score cross threshold? has it stayed crossed for 14 days? This logic might live in application code reading from snapshots.
- **Veteran cushion.** Locked: 6+ months at 75+ → 30-day window + manual review on first drop. Need a flag on cleaner_profile for "veteran_status" computed nightly.
- **Badges are zip-locked.** Locked: "Top-Rated in [ZIP]" badge requires 25+ jobs in that ZIP at 4.7+ rating. Schema needs zip-scoped queries — `cleaner_badges` row stores `zip_scope` column when applicable.
- **Specialties are earned, not self-declared.** Locked. Trigger: repeat positive ratings in a category. Schema needs a calculation view or daily job that promotes cleaner_specialties based on review_traits patterns.

### Open questions

- Should `reliability_events` include score deltas (e.g., "+1 point") or just the raw event with point calculation done in code? Recommend storing point_delta as a column for auditability — what was the actual impact?
- Score snapshot frequency: daily for everyone, or only when something changes? Daily is simpler, doesn't create staleness concerns. ~50KB/day per 1000 cleaners = manageable.

---

## Group B5 — Money (6 tables)

Payments, payouts, Stripe Connect mirroring, insurance.

### Tables

| #   | Table                | Purpose                                         | Wireframes driving it    |
| --- | -------------------- | ----------------------------------------------- | ------------------------ |
| 30  | `payment_methods`    | Customer cards on file (mirrors Stripe)         | 28                       |
| 31  | `charges`            | Every charge attempted/succeeded                | 10, 28                   |
| 32  | `payouts`            | Cleaner payout records (mirrors Stripe Connect) | 6, 30, 63                |
| 33  | `payout_line_items`  | What jobs/tips comprise a payout                | 6 (earnings detail)      |
| 34  | `insurance_policies` | Cleaner-uploaded COIs and verification state    | 32 (a, b, c)             |
| 35  | `commission_records` | Per-booking commission calculation history      | 6, 26 (earnings preview) |

### Key design decisions

- **Stripe is source of truth for actual money.** PostgreSQL stores reference IDs (charge_id, payout_id, payment_method_id, stripe_account_id) and a denormalized snapshot of state. We never trust our database for "did the customer get charged?" — we trust Stripe and update our mirror via webhooks.
- **Charges have an idempotency_key** to prevent double-charging on retry.
- **Tier-scaled commission stored per-booking.** When a booking is created, the cleaner's current tier is captured + their commission rate (10/11/13/15/12% per locked schedule). Even if the cleaner's tier changes later, the booking's commission stays as captured. `commission_records` provides this audit trail.
- **Payouts are batched weekly.** Friday at noon PT per locked decision. A payout row aggregates payout_line_items (each line is one approved booking + tip). Stripe Connect handles the actual transfer.
- **Instant payouts.** Locked: 5% fee, opt-in. Schema flag on payout: `instant=true`, fee_amount populated.
- **Insurance policies have a state machine.** UPLOADED → UNDER_REVIEW → VERIFIED → EXPIRED → REPLACED. Same pattern as bookings.
- **Insurance requires expiration tracking.** Locked: 30-day renewal reminder. Schema needs `expires_at` and a daily job that flags upcoming expirations.

### Open questions

- Tax info storage. Locked: encrypted SSN/EIN. Where does the encryption happen — database-level (pgcrypto) or application-level (encrypt before insert)? Recommend application-level using a key from environment, store encrypted bytes in database. Database backups don't expose plaintext.
- Refunds. Implied by dispute resolution but not explicitly modeled. Need a `refunds` table linked to charges? Or a refund event in charges? Recommend separate `refunds` table for clarity.

---

## Group B6 — Platform Operations (5 tables)

Admin, notifications, the plumbing.

### Tables

| #   | Table                      | Purpose                                | Wireframes driving it    |
| --- | -------------------------- | -------------------------------------- | ------------------------ |
| 36  | `notifications`            | Notifications generated for users      | 19                       |
| 37  | `notification_preferences` | User preferences for delivery channels | 28, 30                   |
| 38  | `admin_actions`            | Audit log of admin operations          | 54-60                    |
| 39  | `feature_flags`            | Toggle features without code deploys   | (operational)            |
| 40  | `support_tickets`          | Customer-initiated support issues      | 16 (safety category), 33 |

### Key design decisions

- **Notifications stored, not just delivered.** The notification center wireframe (19) needs a query interface. Notifications have: type, recipient_user_id, related_booking_id (optional), title, body, deep_link, read_at, created_at, expires_at.
- **Notification preferences cascade.** User-level preference (Push on/off) overrides per-event preferences. If push is off, all push events are off regardless of per-event toggle.
- **Admin actions are immutable.** Anything an admin does (approve a cleaner, suspend an account, refund a charge, modify a booking) writes a row. Includes: actor_admin_id, action_type, target_id, before_state (JSON), after_state (JSON), reason, timestamp. Critical for legal/dispute defense.
- **Feature flags simple key/value.** Per-user, per-cleaner, or global. Drives MVP rollout (e.g., "show recurring booking flow = false" until ready).
- **Support tickets separate from disputes.** Disputes are between customer and cleaner about a specific job. Support tickets are about the platform, account, payment issues. Different routing, different SLA, different resolution path.

### Open questions

- Should `notifications` include the rendered text or just a type + parameters? Recommend rendered text for performance (no template lookup on read) but with a `template_version` column so retroactive template changes don't break old notifications.
- Email/SMS delivery logs: do we need `notification_deliveries` tracking which channel succeeded/failed? Yes, especially for compliance (proof of attempted delivery for legal docs). Adding to B6.

---

## Other Things We Need (Not Tables)

These are infrastructure decisions that the schema design must support but aren't tables themselves.

### 1. Background jobs / scheduled tasks

The schema must support queries that these jobs run efficiently:

| Job                     | Frequency          | Purpose                                               | Tables touched                                                    |
| ----------------------- | ------------------ | ----------------------------------------------------- | ----------------------------------------------------------------- |
| Score calculation       | Nightly 2 AM       | Compute reliability scores                            | reliability_events, reliability_score_snapshots, cleaner_profiles |
| Tier reassignment       | Nightly            | Apply 14-day rule on score crossings                  | reliability_score_snapshots, tier_assignments                     |
| Auto-approval           | Hourly             | Mark bookings APPROVED if 24h passed without action   | bookings, booking_state_events                                    |
| Recurring spawn         | Daily              | Create next occurrence for active recurring schedules | recurring_schedules, recurring_occurrences, bookings              |
| Message expiry          | Hourly             | Delete messages 4h+ past their booking                | messages                                                          |
| Photo deletion          | Daily              | Delete photos 90 days post-booking                    | booking_photos                                                    |
| Insurance expiry alerts | Daily              | Notify cleaners 30 days before expiration             | insurance_policies, notifications                                 |
| Payout batch            | Weekly Friday noon | Aggregate approved bookings into payouts              | payouts, payout_line_items, charges                               |
| Auto-rebook nudge       | Hourly             | Trigger 24h after positive review                     | reviews, notifications                                            |

### 2. Indexes (the ones we MUST have)

A schema without indexes is slow. Critical query patterns:

- `bookings` by `cleaner_id + start_at` (cleaner schedule)
- `bookings` by `customer_id + state` (customer dashboard "next cleaning")
- `bookings` by `state + start_at` (admin "active jobs", auto-approval scanner)
- `bookings` by `zip_code + service_id + start_at` (cleaner search)
- `messages` by `booking_id + created_at` (thread display)
- `reliability_events` by `cleaner_id + created_at` (score calculation window)
- `reliability_score_snapshots` by `cleaner_id + snapshot_date` (latest score lookup)
- `notifications` by `user_id + read_at + created_at` (notification center)
- `users` by `email` (auth)
- `cleaner_profiles` by `home_zip + tier + active` (cleaner list page)
- `recurring_occurrences` by `recurring_schedule_id + scheduled_at + status` (upcoming display)

### 3. Enum types

Postgres enums that constrain values:

- `user_role` — customer, cleaner, admin
- `user_status` — active, suspended, deleted
- `booking_state` — draft, confirmed, imminent, in_transit, arrived, in_progress, completed, awaiting_approval, approved, paid, disputed, resolved, cancelled_by_customer, cancelled_by_cleaner, reschedule_pending
- `tier_name` — rising_pro, proven_specialist, top_performer, all_star_expert
- `service_type` — standard, deep, move_out, airbnb
- `dispute_state` — open, cleaner_responded, customer_accepted, customer_rejected, escalated, mediation, resolved
- `dispute_response_type` — refund, reclean, stand_by
- `notification_channel` — push, email, sms
- `payment_method_type` — card, bank_account
- `charge_state` — pending, succeeded, failed, refunded, partially_refunded
- `payout_state` — pending, processing, paid, failed
- `photo_purpose` — clock_in, clock_out, dispute_evidence_customer, dispute_evidence_cleaner

### 4. Constraints we need

Not just "this column can't be null" — actual business rules enforced in the database:

- A cleaner can't double-book (overlapping bookings on same cleaner_id rejected)
- Cancellation must be more than 0 hours before booking start (no future-dated cancellations)
- A review can only be written for a booking the customer was party to
- A tip can only be added to an approved booking
- A dispute can only be filed within 48 hours of approval (locked window)
- Cleaner_profile.hourly_rate must be within their current tier's range
- A user can have at most one cleaner_profile and at most one customer_profile

### 5. Webhooks we need to handle

Stripe sends events; we mirror them into our database:

- `payment_intent.succeeded` → mark charge succeeded, update booking
- `payment_intent.payment_failed` → mark charge failed, alert customer
- `charge.refunded` → mark refund in our database
- `payout.paid` → mark payout state PAID
- `payout.failed` → mark payout FAILED, alert cleaner
- `account.updated` → mirror cleaner Stripe Connect status (KYC progress)
- `identity.verification_session.verified` → mark cleaner ID verified

Schema needs: `stripe_webhook_events` table for idempotency (each webhook event_id processed exactly once).

### 6. PII / encryption strategy

What gets encrypted at the application layer (not just at-rest):

- Cleaner SSN/EIN (locked: encrypted, never displayed in full)
- Bank account numbers (we don't actually store these — Stripe does)
- Insurance certificate documents (stored in Cloudflare R2, signed URLs only)
- ID verification documents (Stripe Identity holds these, we just store reference)

What's stored as plaintext (with row-level access control):

- Email, phone, name
- Addresses (needed for routing cleaners)
- Photos (encrypted at rest by R2, but accessible via signed URLs)
- Messages (auto-purged after 4h post-booking, encryption optional)

### 7. Audit and immutability strategy

Three categories:

- **Append-only event tables** — `booking_state_events`, `reliability_events`, `dispute_state_events`, `admin_actions`. Never updated, never deleted (except by automated retention policies). Triggers prevent UPDATE/DELETE.
- **Soft delete tables** — `users` (deleted_at), `cleaner_profiles`, `customer_profiles`. Records preserved for legal/dispute reasons but excluded from active queries via `WHERE deleted_at IS NULL`.
- **Hard delete tables** — `messages` (auto-purged), `notifications` (retention policy), `auth_sessions` (expired), `booking_photos` (90-day retention).

### 8. Multi-tenancy / row-level security

Supabase supports row-level security (RLS) policies. We'll need policies like:

- A user can read their own user row but no one else's
- A customer can read their own bookings
- A cleaner can read bookings assigned to them
- An admin can read all rows in all tables (with audit log)
- A cleaner profile is publicly readable for active cleaners only (for the cleaner list page)

This is application-layer security, not just database. The schema design must accommodate it.

### 9. Migrations strategy

We're building this fresh, so version 1.0 can be one big migration. After that:

- Use a migration tool (Prisma, Drizzle, Supabase migrations, or raw SQL)
- Every schema change is a versioned migration file in git
- Migrations are reversible where possible (DOWN migration)
- Production migrations run in a transaction (rollback on failure)

### 10. Search / full-text indexing

Where we'll need search:

- Cleaner list page filters (zip, service, rating, tier, language) — handled by indexes
- Admin booking lookup by ID, customer name, cleaner name — needs partial-match search
- Admin user lookup — needs email/phone/name fuzzy search

PostgreSQL has built-in full-text search (`tsvector` + `tsquery`). We'll add `tsvector` columns to `users`, `cleaner_profiles`, `bookings` for admin search.

---

## What This Looks Like as a Build Plan

Once we lock this overview, here's how the actual schema work goes:

| Sub-batch                  | Tables   | Estimated complexity                  |
| -------------------------- | -------- | ------------------------------------- |
| **B1 — Core identity**     | 6 tables | Medium (foundation, careful joins)    |
| **B2 — Booking lifecycle** | 8 tables | Heavy (state machine, recurring)      |
| **B3 — Trust + evidence**  | 7 tables | Medium                                |
| **B4 — Cleaner ops**       | 8 tables | Heavy (score logic, immutable events) |
| **B5 — Money**             | 6 tables | Medium (Stripe mirroring)             |
| **B6 — Platform ops**      | 5 tables | Light                                 |

Each batch produces:

1. SQL CREATE TABLE statements (PostgreSQL syntax)
2. Index definitions
3. Foreign key constraints
4. Row-level security policies (basic)
5. Comments on every column explaining purpose
6. A relationship diagram (Mermaid syntax)
7. Notes on which wireframes drove which decisions
8. A list of judgment calls I made and why
9. A list of open questions if any

After all six batches, you have a schema you can hand to Claude Code or any developer and say "build this." It'll be production-quality, not toy.

---

## What I Need From You Before Starting B1

Push back on anything in this overview that feels off, surprising, or wrong. Specifically:

1. **Are 35-40 tables too many?** Some founders' instinct is to denormalize aggressively. I'm being normalized because audit/compliance matters for marketplaces. If you'd rather see fewer tables (e.g., merging `tier_assignments` into `cleaner_profiles` as a current_tier column), say so.

2. **Did I miss any wireframe surface?** I went through batches 1-5 v3 and the earlier files. If any specific wireframe doesn't seem to have a home in the table list, flag it.

3. **Any tables you think we don't need?** I included things like `feature_flags` and `support_tickets` because real platforms need them. If you want to skip them and add later, say so.

4. **The 6-batch sequence — does it match how you want to build?** Some founders prefer to build money + auth first because those are the riskiest. Others prefer booking-first because that's the user-visible product.

5. **Anything about the wireframes you'd reconsider now?** Sometimes seeing the data structure makes you realize a wireframe is asking for something you don't actually want. If anything's worth changing now, do it before we lock the schema.

Once you've reacted to this, we start B1.
