# PureTask Schema — 4-Check Audit Pass

**Purpose:** Final structural review of the v2 schema before SQL gets written. Four focused checks: cross-table integrity, query walkthrough for hot paths, write-path atomicity, and Day-1 vs Day-365 scaling. Either we find issues that need fixing or we confirm v2 is solid and start B1.

**Result:** **9 issues found. 6 require schema changes before B1. 3 are operational notes that don't block.**

---

## Check 1 — Cross-Table Integrity

For every planned foreign-key relationship, does the target table have what's needed? Are relationships consistent and composable?

### Issue 1.1 (BLOCKING) — `cleaner_appeals` polymorphic FK is fragile

**The problem:** v2 said `cleaner_appeals` references either a `tier_assignments` row OR a `reliability_events` row, with one of two FK columns populated and the other null. This is a polymorphic foreign key pattern. PostgreSQL doesn't enforce it natively — you'd need a CHECK constraint that says "exactly one of tier_assignment_id or reliability_event_id must be non-null." Maintainable but error-prone, and the query patterns are awkward ("which kind of appeal is this?" requires checking which column is set).

**The fix:** Replace the polymorphic FK with explicit subtype tables.

- `cleaner_appeals` (base table): id, cleaner_user_id, appeal_type enum (TIER_DROP / SCORE_EVENT), appeal_text, status, submitted_at, reviewed_by_admin_id, reviewed_at, decision
- `cleaner_appeal_tier_drops`: appeal_id (FK + unique), tier_assignment_id (FK)
- `cleaner_appeal_score_events`: appeal_id (FK + unique), reliability_event_id (FK)

Or simpler if the data is small: drop the join and just store `target_type` and `target_id` as separate columns on `cleaner_appeals` with no FK at all (relying on application code for integrity). This is less safe but acceptable when the table is low-volume.

**Recommendation:** Subtype tables. They're clean and queries don't need conditional logic. Applies to B4.

### Issue 1.2 (BLOCKING) — `customer_favorites` lacks role enforcement

**The problem:** `customer_favorites` has `customer_user_id` and `cleaner_user_id`, both pointing to `users.id`. But there's no constraint that the customer_user_id actually has a `customer_profile` row, or that cleaner_user_id has a `cleaner_profile`. Someone could insert a row pointing to two admin users.

**The fix:** Two options:

- **Option A:** Application-level enforcement only (check before insert). Acceptable for low-criticality data.
- **Option B:** Database-level via FK to the profile tables instead of the users table. So `customer_favorites.customer_id` references `customer_profiles.id` (not users.id), and `customer_favorites.cleaner_id` references `cleaner_profiles.id`.

**Recommendation:** Option B. It's stricter and customer_favorites is already going to do joins for display purposes anyway. Same fix applies to several other join tables. Applies to B1, B3, B4.

### Issue 1.3 (BLOCKING) — `commission_records` denormalization missing

**The problem:** `commission_records` references `tier_assignments` to capture which tier the cleaner was at when the booking was made. But tier_assignments is a historical record — which row? The active one at the booking time. And what if tier_assignments gets corrected later (admin manually adjusts a tier change)? The booking's commission should not change.

**The fix:** `commission_records` must denormalize the relevant data, not just FK to tier_assignments:

- `commission_records.tier_name` (denormalized)
- `commission_records.commission_rate` (denormalized — captured percentage)
- `commission_records.tier_assignment_id` (FK for traceability, but data is independent)

This way, even if tier_assignments is later corrected, the historical commission record stands.

**Same pattern applies to:** `bookings.hourly_rate_at_booking_cents`, `bookings.tier_at_booking`, `bookings.commission_rate_at_booking`. These are immutable snapshots captured at booking creation. Without this, you can't reproduce historical pricing for support tickets or disputes.

**Recommendation:** Lock denormalization patterns now. Applies to B2 and B5.

### Issue 1.4 (NON-BLOCKING) — `dispute_resolutions` ↔ `refunds` linkage

**The problem:** When a dispute resolves with a refund, where does the refund record live? Is it a row in `refunds` that references the dispute? Or is the refund an attribute of the dispute_resolution? Both can work, the question is which is canonical.

**The fix:** Refund is its own record (already in v2). Resolution links to it via FK: `dispute_resolutions.refund_id` (nullable — only populated if resolution_type = REFUND). The refund row records the actual money movement; the resolution row records the agreement.

**Recommendation:** Lock this in B5. Not a blocker because the structure works either way.

### Issue 1.5 (NON-BLOCKING) — `recurring_occurrences` ↔ `bookings` is two-way

**The problem:** A recurring_occurrence spawns a booking. So:

- `recurring_occurrences.booking_id` (FK to the spawned booking, nullable until spawn happens)
- `bookings.recurring_schedule_id` (FK to the schedule, nullable for one-offs)
- `bookings.recurring_occurrence_id` (also FK?)

Three FKs on what's basically one relationship is messy.

**The fix:** Drop `bookings.recurring_occurrence_id`. Keep `bookings.recurring_schedule_id` (so a query can ask "is this a recurring booking?" without joining). Keep `recurring_occurrences.booking_id` (so a query can ask "what booking did this occurrence spawn?"). Two FKs, not three. Different question, different direction.

**Recommendation:** Lock in B2.

---

## Check 2 — Query Walkthrough for the 10 Hottest Paths

I traced the exact tables, joins, and indexes needed for the 10 most-frequent queries. Found 2 schema gaps.

### Walked through

1. **Customer homepage / dashboard load** — clean
2. **Cleaner dashboard load** — clean
3. **Cleaner list filtered by ZIP + service + time** — issue (see 2.1)
4. **Active job tracker load** — clean
5. **Approve & pay screen** — issue (see 2.2)
6. **Filing a dispute** — clean (write path handled in Check 3)
7. **Score calculation nightly job** — clean
8. **Recurring spawn job** — clean
9. **Notification center load** — clean
10. **Admin booking lookup with partial name search** — needs tsvector indexes (already noted in v2)

### Issue 2.1 (BLOCKING) — Cleaner search needs denormalized rating + booking count

**The problem:** Wireframe 8 (cleaner list) shows for each cleaner: 4.9★, 247 reviews, distance, tier, badges. To compute the rating average and count from `reviews` for every cleaner on every list query is expensive.

```sql
SELECT cleaner_id, AVG(stars), COUNT(*) FROM reviews WHERE cleaner_id IN (...) GROUP BY cleaner_id;
```

This works at 100 reviews. At 50,000 reviews it gets slow. By 500,000 it's too slow for an interactive page.

**The fix:** Denormalize on `cleaner_profiles`:

- `cleaner_profiles.average_rating DECIMAL(3,2)` (e.g., 4.92)
- `cleaner_profiles.review_count INTEGER`
- `cleaner_profiles.completed_booking_count INTEGER`

Updated by trigger when reviews are inserted/updated, or by nightly batch (simpler, eventually consistent which is fine for ratings).

This is a standard denormalization pattern. Same applies to the cleaner list page's "8 cleanings together" displays — that's a count of completed bookings between specific customer-cleaner pairs and gets pre-computed.

**Recommendation:** Lock these denormalized columns into B1's `cleaner_profiles`. Add nightly job to recalculate. Applies to B1, B4.

### Issue 2.2 (BLOCKING) — `bookings` doesn't capture immutable pricing snapshot

**The problem:** When a customer books at $65/hr × 2 hours = $130 + $9.99 fee = $139.99 total, those numbers need to be on the booking row immutably. v2 didn't make this explicit. If the cleaner changes their rate later, the existing booking's price shouldn't change.

**The fix:** Add immutable pricing columns to `bookings`:

- `hourly_rate_cents` (rate at booking time)
- `duration_hours_decimal` (booked duration, e.g., 2.5)
- `cleaner_subtotal_cents` (rate × hours)
- `platform_fee_cents` ($9.99 = 999)
- `total_charge_cents` (subtotal + fee)
- `commission_rate_at_booking` (e.g., 0.10 for All-Star)
- `tier_at_booking` (e.g., 'all_star_expert')
- `cleaner_payout_cents` (subtotal × (1 - commission_rate))

These are all calculable from each other but storing them all means historical reports never need to recompute.

**Recommendation:** Lock in B2.

### Walkthrough also surfaced: cleaner search by ZIP needs a careful index strategy

The cleaner search query (#3) joins: `cleaner_profiles`, `cleaner_service_zips`, `availability_rules`, `time_off_blocks`, `bookings` (to subtract conflicts). 5-6 tables.

This works fine at MVP scale (100 cleaners). At 1000 cleaners it gets slow. Long-term solution is a materialized view `cleaner_search_index` refreshed every few minutes that pre-joins these. Not needed for MVP, but the schema design should permit it. v2 design is compatible with this; adding the materialized view later is non-breaking.

**Recommendation:** Note this as a Phase 2 optimization. No schema change needed now.

---

## Check 3 — Write-Path Atomicity for 6 Multi-Table Writes

Walked 6 critical multi-table writes. Found 3 issues.

### Walked through

1. **Book a cleaning** — issue (see 3.1)
2. **Approve & pay** — issue (see 3.2)
3. **File a dispute** — clean
4. **Cleaner accepts booking** — issue (see 3.3)
5. **Process recurring spawn** — clean (same pattern as #1)
6. **Score calculation nightly** — clean (idempotent UPSERT)

### Issue 3.1 (BLOCKING) — Booking creation needs a CHARGE_FAILED state

**The problem:** When a customer books, the flow is:

1. Insert booking row (state: CONFIRMED?)
2. Insert booking_state_event
3. Call Stripe to authorize the card
4. If success, insert charges row with stripe_charge_id

But if step 3 fails, we have a CONFIRMED booking with no charge. The cleaner gets notified of a job that's not actually paid for.

**The fix:** Two changes:

- Add booking state `PENDING_PAYMENT_AUTHORIZATION` — initial state
- After successful Stripe authorization, transition to `CONFIRMED`
- On Stripe failure, transition to `CHARGE_FAILED` (no notification to cleaner)

This means the `booking_state` enum grows by 2 values (PENDING_PAYMENT_AUTHORIZATION and CHARGE_FAILED).

**Recommendation:** Lock the expanded state machine in B2.

### Issue 3.2 (BLOCKING) — `payout_line_items.payout_id` must be nullable

**The problem:** When a booking is approved, we want to schedule the cleaner to be paid for it. But payouts are batched weekly on Fridays. So at approval time, we have a payout_line_item that doesn't yet belong to a payout.

**The fix:** `payout_line_items.payout_id` is nullable. On Friday, the batch job groups all payout_line_items where payout_id IS NULL by cleaner, creates payouts, and updates payout_id. v2 implied this but didn't make it explicit.

**Recommendation:** Lock in B5. Also add `payout_line_items.cleaner_user_id` as a denormalized column so the Friday batch can group efficiently without joining through bookings.

### Issue 3.3 (BLOCKING) — Cleaner double-booking prevention

**The problem:** The schema allows two bookings to be created for the same cleaner at overlapping times. Application code is supposed to prevent it, but at scale (concurrent requests), application-level locking has race conditions.

**The fix:** PostgreSQL EXCLUSION CONSTRAINT on bookings:

```sql
ALTER TABLE bookings ADD CONSTRAINT no_cleaner_overlap
  EXCLUDE USING gist (cleaner_user_id WITH =, tstzrange(start_at, end_at, '[)') WITH &&)
  WHERE (state IN ('confirmed', 'imminent', 'in_transit', 'arrived', 'in_progress'));
```

This is database-level enforcement. Two bookings for the same cleaner that overlap in time can't both exist in active states. Insertions that would violate this fail. The application catches the error and returns "this cleaner is no longer available at this time."

**Note:** Requires the `btree_gist` Postgres extension. Standard, available on Supabase.

**Recommendation:** Lock in B2. Also add an analogous constraint with the buffer time included (the locked 60-min default).

---

## Check 4 — Day-1 vs Day-365 Scale Check

Walked the schema mentally through realistic scaling. Found 1 schema concern.

### What I checked

- **Day 1 (10 cleaners, 50 customers, 100 bookings):** Everything trivially fast.
- **Day 365 conservative (200 cleaners, 5k customers, 50k bookings):** Comfortable on Postgres with proper indexes. Storage costs negligible.
- **Day 365 aggressive (1000 cleaners, 30k customers, 300k bookings):** Most queries still fine. Photo storage ~1.5TB on R2 = ~$20/month. Manageable.

### Issue 4.1 (BLOCKING) — Notification retention not specified

**The problem:** `notifications` grows unboundedly. 5-10 notifications per booking × 300k bookings/year = 1.5M-3M notifications. The notification center page (wireframe 19) only shows recent ones, but the schema retains everything forever.

**The fix:** Add retention policy:

- `notifications` records older than 90 days are hard-deleted by daily job
- Critical event records (which the notification was about) live in their respective event tables, not in notifications

90 days is enough for the user experience (notification center scrollback is rarely longer) and keeps the table manageable.

**Recommendation:** Lock 90-day retention in B6. Add `notification_cleanup_job` to the cron list.

### Issue 4.2 (NON-BLOCKING) — `booking_state_events` will grow large but is fine

**Calculation:** 10 events per booking × 300k bookings = 3M rows. Indexed properly = fine for Postgres. No partitioning needed until ~50M rows. Defer.

### Issue 4.3 (NON-BLOCKING) — `reliability_events` archival

**Calculation:** 30 events per cleaner × 1000 cleaners × 4 quarters = 120k rows per year. Score calculation only reads the last 90 days. Older events stay for audit trail but don't affect query performance if indexed.

**Future optimization:** Move records older than 1 year to `reliability_events_archive` table. Not needed for MVP. Defer.

---

## Summary of Required Changes Before B1

**6 BLOCKING issues** that change the schema design before SQL gets written:

1. **Issue 1.1** — Replace polymorphic FK on `cleaner_appeals` with subtype tables (B4)
2. **Issue 1.2** — Customer_favorites + similar join tables FK to profile tables, not users (B1, B3, B4)
3. **Issue 1.3** — Denormalize tier/commission data into `bookings` and `commission_records` for immutability (B2, B5)
4. **Issue 2.1** — Add denormalized `average_rating`, `review_count`, `completed_booking_count` to `cleaner_profiles` (B1, B4)
5. **Issue 2.2** — Add immutable pricing snapshot columns to `bookings` (B2)
6. **Issue 3.1** — Add `PENDING_PAYMENT_AUTHORIZATION` and `CHARGE_FAILED` states to booking state machine (B2)
7. **Issue 3.2** — Make `payout_line_items.payout_id` nullable + add denormalized `cleaner_user_id` (B5)
8. **Issue 3.3** — Add EXCLUSION CONSTRAINT preventing cleaner double-booking (B2)
9. **Issue 4.1** — Lock 90-day retention policy on `notifications` + add cleanup job (B6)

Wait — that's 9 changes, not 6. Let me recount: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 4.1 = 9 changes total. **All are blocking.** I miscounted in the summary at the top of this document.

**Corrected total: 9 schema changes required before B1.**

**3 NON-BLOCKING notes** that don't change the schema but are operational reminders:

- Issue 1.4 — `dispute_resolutions.refund_id` linkage pattern (B5 detail)
- Issue 1.5 — Two FKs not three between recurring_occurrences and bookings (B2 detail)
- Issues 4.2, 4.3 — Future archival strategies (post-MVP)

---

## What changed in numbers

- **53 tables** → still 53 (no new tables found)
- **~340 columns** → ~365 columns (added denormalized columns + state machine values)
- **~95 FKs** → ~95 FKs (refactored cleaner_appeals from polymorphic to subtype, but same count)
- **15 enums** → 15 enums (booking_state grew by 2 values)
- **Indexes** → ~80 (was ~75; added denormalization-supporting indexes)
- **Constraints** → +1 EXCLUSION CONSTRAINT (cleaner non-overlap)
- **Background jobs** → +1 (notification cleanup) = 10 total

---

## Honest assessment

The audit found 9 issues. None are catastrophic — the v2 structure is fundamentally sound. The issues are the kind of thing that _would_ have been caught during B1-B6 anyway, but catching them now means we don't have to refactor.

**The biggest single insight:** Issue 1.3 + 2.2 are the same pattern — historical immutability through denormalization. Bookings, commission records, and probably tip records all need to capture their relevant context at write time so that subsequent changes don't corrupt historical records. This is a cross-cutting concern. I'll apply it consistently in B1-B6.

**The hardest issue to address:** 3.3 (EXCLUSION CONSTRAINT). Postgres-specific feature, requires extension, error messages are unfriendly. Worth doing for correctness but B2 will need extra care to ensure good error handling.

**Lowest-confidence issue:** 1.1 (polymorphic FK on cleaner_appeals). The subtype-table approach is cleaner but heavier. If you'd rather accept the polymorphic FK pattern with a CHECK constraint, that's a defensible tradeoff. Tell me your preference.

---

## What I want from you before B1

1. **Confirm: apply all 9 fixes in B1-B6?** (Recommended.)
2. **Issue 1.1 — subtype tables (3 tables) or polymorphic FK (1 table with CHECK)?** Smaller team usually prefers polymorphic; cleaner architecture prefers subtype.
3. **Anything in this audit feel wrong or over-engineered?** The denormalization patterns especially — some teams hate them. They're necessary here for query performance and historical immutability, but worth confirming you're OK with the tradeoff (slight write complexity for major read benefits).

Once locked, B1 starts. **Estimated SQL output for B1:** ~250-300 lines covering 8 tables, indexes, FKs, RLS policies, and column comments.
