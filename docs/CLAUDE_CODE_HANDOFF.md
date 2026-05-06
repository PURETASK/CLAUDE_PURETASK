# PureTask Database Build — Claude Code Handoff Document

**Version:** 1.0
**Audience:** Claude Code agent
**Goal:** Set up the PureTask production-ready PostgreSQL database from scratch using the 8 SQL files provided.
**Time estimate:** 1–2 hours including verification.

---

## What You Are Building

PureTask is a two-sided cleaning marketplace launching in Northern California (Sacramento first). Customers book vetted cleaners; cleaners earn money. The schema you're about to deploy supports the entire product: bookings, recurring schedules, payments, reviews, disputes, reliability scoring, badges, admin tooling — 54 tables across 7 logical groups.

**The schema is already designed and SQL-complete.** Your job is to deploy it cleanly, verify it works, and report back. **Do not redesign the schema.** Do not refactor the tables. The SQL is the spec.

---

## Critical Rules — Read These First

These rules exist because LLM agents (you) tend to drift from instructions over time. Following them keeps the build correct.

### Rule 1 — Run the SQL files in exact order

The files have cross-batch foreign key dependencies. Running B5 before B1 will fail.

**Required order** (under `db/migrations/`):
1. `0001_b1_core_identity.sql`
2. `0002_b2_booking_lifecycle.sql`
3. `0003_b3_trust_evidence.sql`
4. `0004_b4_cleaner_operations.sql`
5. `0005_b5_money.sql`
6. `0006_b6_platform_operations.sql`
7. `0007_b7_onboarding_verification.sql`
8. `0008_b8_audit_fixes.sql` ← **must run last**

Never reorder. Never skip. Never run two in parallel.

### Rule 2 — Do not modify the SQL

If something looks weird in the SQL, it's probably intentional. Examples of things that look weird but are correct:

- `cleaner_appeals` uses a polymorphic FK with a CHECK constraint (decided after considering subtype tables — polymorphic was right for low-volume audit data)
- `commission_records` has a trigger that blocks ALL updates and deletes (audit integrity — must stay this way)
- `bookings.no_cleaner_double_booking` is an EXCLUSION CONSTRAINT using GIST indexes (not a regular UNIQUE constraint)
- `reliability_events` allows updates but only to overturn-related columns (appeal mechanism)
- `notifications.recipient_user_id` uses ON DELETE RESTRICT (compliance — protects audit trail)

If you see something you want to "fix," stop and ask the user first. Do not edit the SQL files unilaterally.

### Rule 3 — Stripe is the source of truth for money

The schema mirrors Stripe data (payment_methods, charges, payouts, refunds). It is not the source of truth. **Do not generate seed data that includes fake Stripe IDs and treat those rows as authoritative.** When seeding, mark the rows clearly as test data and use Stripe test-mode IDs.

### Rule 4 — Encryption is application-layer, not database-layer

`cleaner_profiles.encrypted_tax_id` is `BYTEA`. The encryption happens in application code using AES-256-GCM with a key from environment variable `TAX_ENCRYPTION_KEY`. The database stores the encrypted bytes. **Do not implement encryption with `pgcrypto` functions** — that pattern was rejected during schema design.

### Rule 5 — RLS policies are default-deny

Every table has Row Level Security enabled. If your seed scripts or test queries fail with "permission denied," that's RLS working correctly. Use service-role credentials for backend operations, not user-scoped credentials.

---

## What's In Each File

Brief table-level summary. The SQL files have detailed comments on every column.

### B1 — Core Identity + Accounts (8 tables, 761 lines)
Foundation. Every other table FKs back to these.
- `users` — central identity, Clerk-authenticated
- `customer_profiles` — customer data
- `cleaner_profiles` — cleaner data including denormalized aggregates
- `admin_profiles` — admin tooling data
- `addresses` — multi-purpose with address_type enum
- `auth_sessions` — Clerk session mirror
- `customer_favorites` — saved cleaners
- `user_milestones` — tutorial completion tracking

Enables Postgres extensions: `pgcrypto`, `citext`, `btree_gist`.

### B2 — Booking Lifecycle (10 tables, 908 lines)
The transactional spine.
- `services` — Standard, Deep, Move-out, Airbnb (seeded)
- `bookings` — with immutable pricing snapshot
- `booking_state_events` — append-only state log (22-state machine)
- `booking_photos` — unified photos with purpose enum
- `recurring_schedules` + `recurring_occurrences` — recurring system
- `availability_rules` + `time_off_blocks` — cleaner schedule
- `cleaner_service_zips` + `serviced_areas` — geo coverage

Includes the **EXCLUSION CONSTRAINT preventing cleaner double-booking** (modified by B8 to include 60-min buffer).

### B3 — Trust + Evidence (8 tables, 777 lines)
The differentiator features.
- `messages` — in-app, 4hr post-booking auto-purge
- `traits` (seeded with 8 trait chips)
- `reviews` — immutable post-submission
- `review_traits` — join table
- `tips` — separate from booking, 100% to cleaner
- `disputes` — with state machine
- `dispute_messages` + `dispute_resolutions`

### B4 — Cleaner Operations (10 tables, 879 lines)
The reliability ecosystem.
- `reliability_events` — append-only, drives scoring
- `reliability_score_snapshots` — daily computed scores
- `tier_assignments` — tier change history
- `cleaner_appeals` — polymorphic FK with CHECK
- `badges` (seeded) + `cleaner_badges`
- `specialties` (seeded) + `cleaner_specialties`
- `cleaner_suspensions`
- `customer_reliability_events` — schema day-1, UI Phase 2

### B5 — Money (8 tables, 740 lines)
Stripe Connect mirror.
- `payment_methods` (mirror of Stripe)
- `charges` (with idempotency keys)
- `refunds`
- `commission_records` (fully immutable, denormalized tier/rate)
- `payouts` + `payout_line_items`
- `insurance_policies`
- `stripe_webhook_events` (idempotency table)

Wires up deferred FKs from B1 and B3.

### B6 — Platform Operations (6 tables, 711 lines)
Plumbing.
- `notifications` (90-day retention, 63-value type enum)
- `notification_preferences` (cascade logic, quiet hours columns)
- `notification_deliveries` (per-channel attempt log)
- `admin_actions` (append-only, before/after JSONB)
- `support_tickets` + `support_ticket_messages`

### B7 — Onboarding & Verification (4 tables, 547 lines)
The cleaner application pipeline.
- `cleaner_applications` — distinct from cleaner_profiles
- `background_checks` — Checkr-managed, 2-year renewal
- `identity_verifications` — Stripe Identity sessions
- `waitlist_signups` — pre-launch ZIP signups

### B8 — Audit Fixes (281 lines)
Patches 4 blocking issues found in post-build audit.
1. `charges.total_refunded_cents` INTEGER → BIGINT
2. Adds 60-min buffer to cleaner double-booking exclusion constraint (via generated columns)
3. Trigger cascading recurring_schedule end → unspawned occurrences cancelled
4. `notifications.recipient_user_id` CASCADE → RESTRICT (compliance)
5. Plus: RLS policy enforcing message expiration even if cleanup job is delayed

---

## Step-by-Step Build Instructions

### Phase 1 — Set Up Supabase Project

1. **Create a new Supabase project** at https://supabase.com (if user doesn't already have one for PureTask).
   - Region: `us-west-1` (closest to Sacramento)
   - Plan: Free tier is fine for development; Pro for production
   - Database password: Store securely; user will need this for direct connection

2. **Verify Postgres version is 15+.** All schema features used (GENERATED ALWAYS AS STORED, EXCLUDE constraints, NULLS NOT DISTINCT) require Postgres 15 or higher. Supabase defaults are fine.

3. **Verify required extensions are available.** Run in Supabase SQL Editor:
   ```sql
   SELECT name, default_version, installed_version
   FROM pg_available_extensions
   WHERE name IN ('pgcrypto', 'citext', 'btree_gist');
   ```
   Expected: 3 rows returned. Each should have a `default_version`. If `btree_gist` is missing on free tier, the user may need to upgrade to Pro tier or contact Supabase support.

### Phase 2 — Run the SQL Files

**Use the Supabase SQL Editor (web UI) for the cleanest experience.**

For each file in order (B1 through B8):

1. Open the file in your local environment.
2. Copy its full contents.
3. Paste into a new Supabase SQL Editor query.
4. Click "Run" (or Cmd+Enter).
5. **Wait for completion.** Some files (especially B2 with its many tables and indexes) take 5-15 seconds.
6. **Confirm success.** Supabase shows "Success. No rows returned" or similar.
7. **If any error occurs, STOP.** Do not proceed to the next file. Report the error to the user. Do not attempt to debug or modify the SQL on your own.

Common errors and what they mean:
- `extension "btree_gist" is not available` → Phase 1 wasn't completed properly. Enable the extension first.
- `relation "X" does not exist` → A previous batch was skipped or failed. Check earlier batches.
- `permission denied` → You're using the wrong credentials. Use the project owner's connection string, not the anon key.

### Phase 3 — Verification

After all 8 files run successfully, run these verification queries in the Supabase SQL Editor:

**Verify table count:**
```sql
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';
```
**Expected:** 54

**Verify enum count:**
```sql
SELECT COUNT(*) FROM pg_type WHERE typtype = 'e';
```
**Expected:** 42

**Verify index count is reasonable:**
```sql
SELECT COUNT(*) FROM pg_indexes
WHERE schemaname = 'public';
```
**Expected:** ~190 (some are auto-generated for primary keys and unique constraints; total will be higher than the 188 explicitly created).

**Verify B8 fixes are in place:**

```sql
-- Fix 1: total_refunded_cents is BIGINT
SELECT data_type FROM information_schema.columns
WHERE table_name = 'charges' AND column_name = 'total_refunded_cents';
-- Expected: 'bigint'

-- Fix 2: blocked_*_at columns exist on bookings
SELECT column_name, generation_expression
FROM information_schema.columns
WHERE table_name = 'bookings'
AND column_name IN ('blocked_start_at', 'blocked_end_at');
-- Expected: 2 rows

-- Fix 3: cascade trigger exists
SELECT tgname FROM pg_trigger
WHERE tgname = 'recurring_schedules_cascade_end';
-- Expected: 1 row

-- Fix 4: notifications FK uses RESTRICT
SELECT confdeltype FROM pg_constraint
WHERE conname = 'notifications_recipient_user_id_fkey';
-- Expected: 'r' (RESTRICT)
```

**Verify seeded data:**
```sql
SELECT service_type, display_name FROM services ORDER BY display_order;
-- Expected 4 rows: standard, deep, move_out, airbnb

SELECT key, display_label FROM traits ORDER BY display_order;
-- Expected 8 rows starting with 'thorough'

SELECT key, display_label FROM badges ORDER BY display_order;
-- Expected 5 rows

SELECT key, display_label FROM specialties ORDER BY display_order;
-- Expected 5 rows
```

If ALL verification queries return expected results, the schema is deployed correctly.

### Phase 4 — Report Back

Tell the user:
- Which Supabase project the schema was deployed to (project name + URL)
- That all 8 batches ran successfully
- That all verification queries returned expected results
- The connection string format they'll need for application code (without the password)

If anything failed or returned unexpected results, report the specific error and which step it happened at. **Do not attempt fixes without user approval.**

---

## What NOT to Do

These are common LLM agent mistakes I want you to avoid.

### ❌ Do not generate seed data unprompted

This document is for SCHEMA SETUP. After running B1-B8, you'll have a working empty database. Do NOT proceed to seed users, cleaners, bookings, or any other data unless the user explicitly asks. Schema verification queries are fine; data inserts are not.

### ❌ Do not modify the SQL to "improve" it

Examples of "improvements" you might be tempted to make that are wrong:
- "I'll add an index on X" — every necessary index has been considered. Don't add more.
- "I'll combine these two tables" — separation is intentional.
- "I'll change CASCADE to RESTRICT here" — the cascade behavior was carefully chosen per table.
- "I'll add a trigger to do Y" — triggers are sparse on purpose. Most logic is application-layer.

If you genuinely think there's a bug, ask the user before changing anything.

### ❌ Do not write application code

This is a database setup task. Do not write Next.js API routes, Stripe integration, auth middleware, or anything else unless explicitly asked. Your scope is: get the SQL deployed and verified.

### ❌ Do not invent verification queries beyond what's listed

Stick to the verification queries above. Don't write your own queries that "test the schema" — you'll likely write something that fails on RLS or that misinterprets a constraint.

### ❌ Do not install ORMs or migration tools

Drizzle, Prisma, Supabase CLI migrations — none of these are needed for this task. The user can adopt them later. Right now, raw SQL via the Supabase SQL Editor is the path.

---

## Locked Design Decisions Reference

If the user asks "why is X done this way" while you're working, here are the locked decisions you can reference:

**Identity model:** Shared `users` table + separate profile tables (customer/cleaner/admin). Same person can be both customer and cleaner if needed.

**Money:** All stored as INTEGER cents. Currency column on every money table (default 'USD'). Aggregating columns use BIGINT to prevent overflow.

**Booking lifecycle:** 22-state machine. Every state transition writes to `booking_state_events` (append-only). State changes never UPDATE the bookings table itself directly.

**Pricing immutability:** Bookings capture rate, tier, commission rate at booking creation. Even if the cleaner is later promoted to a different tier, the booking's commission stays as captured.

**Cleaner scoring:** 6-metric system, weighted (on-time 25%, completion 25%, photo 15%, ratings 15%, comm 10%, reschedule 10%), 90-day rolling window, computed nightly.

**Tier transitions:** 14-day sustained rule. Cleaner must be in a new score band for 14 days before tier changes. Veterans (6+ months at 75+) get a 30-day cushion on first drop.

**Cancellation policy:** 48h+ free, 24-48h = 50%, <24h = 100%.

**Reschedule policy:** 1 free reschedule up to 12h before. 4-hour cleaner-confirmation SLA on all reschedule requests.

**Dispute window:** 48 hours after booking approval. Cleaner has 48 hours to respond. Three response options: free re-clean / partial refund / stand by work.

**Auto-approval:** 24 hours after job completion if customer doesn't act.

**Photo retention:** 90 days, then auto-deleted by daily cleanup job.

**Message retention:** 4 hours after booking ends (auto-purged).

**Notification retention:** 90 days, then hard-deleted.

**Background check renewal:** Every 2 years (Checkr-managed).

**Insurance:** Optional, $100k minimum coverage for "Insurance Verified" badge.

**Commission tiers:** 12% Rising Pro (first 6 jobs) / 15% Proven Specialist / 13% Top Performer / 11% / 10% All-Star Expert.

**Customer fee:** $9.99 per booking (separate from commission).

**Hour minimums:** 4hr Rising/Proven; 2hr Top/All-Star.

**Tips:** 100% to cleaner, no platform commission.

**Payouts:** Weekly Friday batch (free) or instant (5% fee).

---

## Files Included

These 8 migrations live in `db/migrations/` (numeric prefix is apply order):

1. `0001_b1_core_identity.sql` (32 KB)
2. `0002_b2_booking_lifecycle.sql` (39 KB)
3. `0003_b3_trust_evidence.sql` (32 KB)
4. `0004_b4_cleaner_operations.sql` (38 KB)
5. `0005_b5_money.sql` (31 KB)
6. `0006_b6_platform_operations.sql` (29 KB)
7. `0007_b7_onboarding_verification.sql` (25 KB)
8. `0008_b8_audit_fixes.sql` (12 KB)

Total: ~5,600 lines of SQL.

---

## After Build is Complete

Once the schema is deployed and verified, the next reasonable steps (NOT for you to do automatically — for the user to decide):

1. Generate ER diagrams via dbdiagram.io or Supabase's built-in schema viewer
2. Set up Supabase environment variables in the Next.js application (.env.local)
3. Generate seed data scripts for development
4. Begin building application code against the schema

If the user asks you to do any of these AFTER the schema is verified, that's a new scope and you can proceed. Until then, your job ends at "schema deployed and verified."

---

## Summary of Your Task

1. Set up Supabase project (or use existing PureTask one)
2. Verify required extensions are available
3. Run B1 through B8 in exact order via the Supabase SQL Editor
4. Stop immediately if any file errors
5. Run the verification queries from Phase 3
6. Report back to the user with results

**Estimated time:** 1–2 hours including verification.

**Success looks like:** All 8 files ran without error. All verification queries return expected results. Empty database with 54 tables, ready for application code.

**Failure looks like:** Any error message during file execution, or any verification query returning unexpected results. In either case, stop and report.

Good luck. Don't drift from the spec.
