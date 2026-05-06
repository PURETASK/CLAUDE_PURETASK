-- =============================================================================
-- PureTask Database Schema — Batch B2: Booking Lifecycle
-- =============================================================================
-- The transactional spine. Every booking from request through completion
-- through approval through payment lives here.
--
-- Design principles applied (from audit v3):
--   1. Bookings capture an IMMUTABLE PRICING SNAPSHOT at creation. Even if
--      the cleaner changes their rate later, historical bookings stay accurate
--      (audit Issue 2.2).
--   2. Booking state machine has 22 states. Transitions tracked in
--      booking_state_events as an append-only log (audit Issue 3.1).
--   3. EXCLUSION CONSTRAINT on bookings prevents same-cleaner double-booking
--      at the database level — no race conditions (audit Issue 3.3).
--   4. Photos use a single unified table with a purpose enum, not separate
--      tables per use case.
--   5. Recurring uses a parent (recurring_schedules) and child
--      (recurring_occurrences) pattern with a 1-to-1 link to actual bookings.
--   6. Cleaner availability is set as a weekly schedule (availability_rules)
--      with date-specific overrides (time_off_blocks).
--
-- Wireframes covered by B2:
--   1, 8, 9, 10, 14a, 14b, 15, 21, 22, 24, 27, 41, 46, 58, 61, 68, 69
--
-- Dependencies: B1 (users, profiles, addresses).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Enums for B2
-- -----------------------------------------------------------------------------

-- Service catalog — locked from system design.
CREATE TYPE service_type AS ENUM (
    'standard',
    'deep',
    'move_out',
    'airbnb'
);

-- Booking state machine — full 22-state model.
-- See booking_state_events for transition history.
--
-- LIFECYCLE:
--   pending_payment_authorization
--     ↓ Stripe authorizes successfully
--   booking_requested
--     ↓ Cleaner accepts (within 4hr SLA)
--   confirmed
--     ↓ T-24hr before start
--   imminent
--     ↓ Cleaner taps "On my way"
--   in_transit
--     ↓ Geo-fence triggered
--   arrived
--     ↓ Cleaner clocks in
--   in_progress
--     ↓ Cleaner clocks out (all required photos uploaded)
--   completed
--     ↓ Photos uploaded successfully
--   awaiting_approval
--     ↓ Customer reviews and approves OR 24hr passes
--   approved (customer-confirmed) OR auto_approved (timer expired)
--     ↓ Stripe captures charge
--   paid
--     ↓ Within 48-hour window, customer can dispute
--   disputed → ... → resolved (back to paid)
--
-- TERMINAL ALTERNATIVES:
--   confirmed → cancelled_by_customer (with penalty calculation)
--   confirmed → cancelled_by_cleaner (counts against score)
--   confirmed → reschedule_pending → confirmed (new time) OR
--               reschedule_declined (back to original confirmed)
--   pending_payment_authorization → charge_failed (terminal)
--   booking_requested → cleaner_declined (within 4hr) → terminal OR
--                                          customer rebooks with different cleaner
CREATE TYPE booking_state AS ENUM (
    'pending_payment_authorization',  -- Stripe auth pending
    'charge_failed',                  -- Stripe auth failed; terminal
    'booking_requested',              -- Sent to cleaner; 4hr SLA
    'cleaner_declined',               -- Cleaner declined; terminal (or customer rebooks)
    'confirmed',                      -- Cleaner accepted
    'imminent',                       -- T-24hr or less before start
    'in_transit',                     -- Cleaner tapped "On my way"
    'arrived',                        -- Geo-fence triggered
    'in_progress',                    -- Clock-in successful
    'completed',                      -- Clock-out + photos uploaded
    'awaiting_approval',              -- Waiting for customer to approve
    'approved',                       -- Customer-confirmed approval
    'auto_approved',                  -- 24hr timer expired without action
    'paid',                           -- Stripe captured; cleaner queued for payout
    'disputed',                       -- Within 48hr window, customer flagged
    'dispute_resolved',               -- Resolution reached
    'reschedule_pending',             -- Awaiting cleaner confirmation of new time
    'cancelled_by_customer',          -- Terminal; penalty per schedule
    'cancelled_by_cleaner',           -- Terminal; counts against cleaner score
    'no_show_customer',               -- Terminal; customer not present at arrival
    'no_show_cleaner',                -- Terminal; cleaner didn't show up
    'admin_cancelled'                 -- Terminal; admin intervention
);

-- Recurring cadence — locked smart defaults from WF 21.
CREATE TYPE recurring_cadence AS ENUM (
    'every_week',
    'every_2_weeks',
    'every_4_weeks',
    'every_8_weeks',
    'every_12_weeks',
    'custom'
);

-- Recurring schedule status.
CREATE TYPE recurring_status AS ENUM (
    'active',
    'paused',
    'ended_by_customer',
    'ended_by_cleaner',
    'ended_by_platform'
);

-- Recurring occurrence status.
CREATE TYPE occurrence_status AS ENUM (
    'scheduled',          -- Future occurrence, booking not yet created
    'spawned',            -- Booking created from this occurrence
    'skipped',            -- Customer skipped this one
    'rescheduled',        -- Moved to different time
    'cancelled'           -- This occurrence cancelled
);

-- Photo categories — refined from audit Issue.
CREATE TYPE photo_purpose AS ENUM (
    'before_clock_in',                 -- Wide-angle pre-clean photos
    'after_clock_out',                 -- Wide-angle post-clean photos
    'dispute_evidence_customer',       -- Customer-uploaded in dispute filing
    'dispute_evidence_cleaner',        -- Cleaner-uploaded in dispute response
    'profile_photo_cleaner',           -- Cleaner profile pic (B1, but enum shared)
    'insurance_certificate',           -- Uploaded COI document (B5 references)
    'identity_document'                -- Stripe Identity reference (B7)
);


-- =============================================================================
-- Table 9: services
-- =============================================================================
-- Service catalog. Small lookup table that drives pricing and minimums.
-- =============================================================================

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    service_type service_type NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT NOT NULL,

    -- Hour minimums by tier (locked from system design):
    --   Rising Pro / Proven Specialist: 4hr min
    --   Top Performer / All-Star Expert: 2hr min
    -- Stored as JSONB for flexibility:
    --   {"rising_pro": 4, "proven_specialist": 4, "top_performer": 2, "all_star_expert": 2}
    min_hours_by_tier JSONB NOT NULL,

    -- Smart defaults for recurring cadence (locked from WF 21):
    --   standard: every_2_weeks (most popular)
    --   deep: every_8_weeks
    --   move_out: NULL (one-off only)
    --   airbnb: every_week
    default_recurring_cadence recurring_cadence,

    -- Whether this service supports recurring at all.
    -- Move-out is one-time only (someone moving out doesn't need biweekly).
    supports_recurring BOOLEAN NOT NULL DEFAULT TRUE,

    -- Display order on homepage and booking flow (WF 1).
    display_order INTEGER NOT NULL DEFAULT 0,

    -- For temporarily disabling a service without deleting it.
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE services IS 'Service catalog: Standard, Deep, Move-out, Airbnb.';
COMMENT ON COLUMN services.min_hours_by_tier IS 'Locked rule: Rising/Proven 4hr min, Top/AllStar 2hr min.';
COMMENT ON COLUMN services.default_recurring_cadence IS 'Smart default for recurring booking setup; null for one-off-only services.';

CREATE TRIGGER services_set_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_services_active ON services(is_active, display_order);

-- Seed the four locked services
INSERT INTO services (service_type, display_name, description, min_hours_by_tier, default_recurring_cadence, supports_recurring, display_order)
VALUES
    ('standard', 'Standard Cleaning', 'Regular maintenance cleaning of bathrooms, kitchen, living areas, and bedrooms.',
     '{"rising_pro": 4, "proven_specialist": 4, "top_performer": 2, "all_star_expert": 2}'::jsonb,
     'every_2_weeks', TRUE, 1),
    ('deep', 'Deep Cleaning', 'Thorough cleaning including baseboards, inside appliances, and detailed scrubbing.',
     '{"rising_pro": 4, "proven_specialist": 4, "top_performer": 2, "all_star_expert": 2}'::jsonb,
     'every_8_weeks', TRUE, 2),
    ('move_out', 'Move-Out Cleaning', 'Top-to-bottom cleaning for end of lease or post-move.',
     '{"rising_pro": 4, "proven_specialist": 4, "top_performer": 2, "all_star_expert": 2}'::jsonb,
     NULL, FALSE, 3),
    ('airbnb', 'Airbnb Turnover', 'Fast turnover cleaning between guests for short-term rentals.',
     '{"rising_pro": 4, "proven_specialist": 4, "top_performer": 2, "all_star_expert": 2}'::jsonb,
     'every_week', TRUE, 4);


-- =============================================================================
-- Table 10: bookings
-- =============================================================================
-- One row per booking instance. The most important table in the schema.
-- Captures an IMMUTABLE PRICING SNAPSHOT at creation time so historical
-- records remain accurate even when rates/tiers change later.
-- =============================================================================

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Human-readable booking ID for support/admin lookup (e.g., "PT-2025-001234").
    -- Generated by application code. Indexed for admin search (WF 58).
    booking_number TEXT NOT NULL UNIQUE,

    -- Customer who placed the booking.
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE RESTRICT,

    -- Cleaner assigned to the booking. Nullable only briefly during creation
    -- (e.g., if customer is browsing). For all post-confirmation states, this
    -- is required.
    cleaner_id UUID REFERENCES cleaner_profiles(id) ON DELETE RESTRICT,

    -- Service being booked.
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,

    -- Where the cleaning happens.
    address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,

    -- When the booking is scheduled.
    -- start_at and end_at are TIMESTAMPTZ; the duration_hours_decimal is the
    -- redundant explicit field for queries and display.
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    duration_hours_decimal DECIMAL(4,2) NOT NULL
        CHECK (duration_hours_decimal >= 1.0 AND duration_hours_decimal <= 12.0),

    -- Current state. History in booking_state_events.
    state booking_state NOT NULL DEFAULT 'pending_payment_authorization',

    -- ===== IMMUTABLE PRICING SNAPSHOT (audit Issue 1.3 + 2.2) =====
    -- These columns are populated at booking creation and NEVER updated.
    -- They preserve the historical truth of "what was charged for this booking."

    hourly_rate_cents INTEGER NOT NULL CHECK (hourly_rate_cents >= 0),
    cleaner_subtotal_cents INTEGER NOT NULL CHECK (cleaner_subtotal_cents >= 0),
    platform_fee_cents INTEGER NOT NULL CHECK (platform_fee_cents >= 0),
    total_charge_cents INTEGER NOT NULL CHECK (total_charge_cents >= 0),

    -- Cleaner's tier and commission rate at time of booking.
    -- Even if cleaner gets promoted/demoted later, this booking keeps original.
    tier_at_booking tier_name NOT NULL,
    commission_rate_at_booking DECIMAL(4,3) NOT NULL
        CHECK (commission_rate_at_booking >= 0 AND commission_rate_at_booking <= 1),
    cleaner_payout_cents INTEGER NOT NULL CHECK (cleaner_payout_cents >= 0),

    currency CHAR(3) NOT NULL DEFAULT 'USD',

    -- Math sanity check
    CONSTRAINT booking_pricing_consistent
        CHECK (total_charge_cents = cleaner_subtotal_cents + platform_fee_cents),

    -- ===== END IMMUTABLE PRICING SNAPSHOT =====

    -- Customer notes for the cleaner (e.g., "key under mat", "dog Pumpkin friendly").
    customer_notes TEXT,

    -- Recurring linkage (audit Issue 1.5: only one direction needed).
    -- Set when this booking was created from a recurring schedule.
    -- NULL for one-off bookings.
    recurring_schedule_id UUID,  -- FK added after recurring_schedules table

    -- Running late flag (from WF 68).
    is_running_late BOOLEAN NOT NULL DEFAULT FALSE,
    late_estimate_minutes INTEGER,
    late_flagged_at TIMESTAMPTZ,

    -- Geo-fence and clock data (populated as state advances).
    cleaner_started_transit_at TIMESTAMPTZ,
    cleaner_arrived_at TIMESTAMPTZ,
    clock_in_at TIMESTAMPTZ,
    clock_out_at TIMESTAMPTZ,
    cleaning_completed_at TIMESTAMPTZ,
    customer_approved_at TIMESTAMPTZ,
    auto_approved_at TIMESTAMPTZ,

    -- Cancellation tracking.
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    cancellation_penalty_cents INTEGER,  -- Computed at cancellation time

    -- Auto-approval timer expires 24 hours after awaiting_approval state begins.
    auto_approval_due_at TIMESTAMPTZ,

    -- Dispute window expires 48 hours after approval.
    dispute_window_ends_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- ===== EXCLUSION CONSTRAINT — audit Issue 3.3 =====
    -- Prevents two ACTIVE bookings overlapping in time for same cleaner.
    -- Database-level enforcement — no race conditions possible.
    CONSTRAINT no_cleaner_double_booking
        EXCLUDE USING gist (
            cleaner_id WITH =,
            tstzrange(start_at, end_at, '[)') WITH &&
        )
        WHERE (cleaner_id IS NOT NULL AND state IN (
            'confirmed', 'imminent', 'in_transit', 'arrived',
            'in_progress', 'completed', 'awaiting_approval'
        ))
);

COMMENT ON TABLE bookings IS 'Booking instances with immutable pricing snapshots and full state lifecycle.';
COMMENT ON COLUMN bookings.booking_number IS 'Human-readable ID for support/admin (WF 58).';
COMMENT ON COLUMN bookings.hourly_rate_cents IS 'IMMUTABLE: rate at booking creation. Never updated.';
COMMENT ON COLUMN bookings.tier_at_booking IS 'IMMUTABLE: cleaner tier when booked. Used for audit and historical reports.';
COMMENT ON COLUMN bookings.commission_rate_at_booking IS 'IMMUTABLE: commission % captured at booking. Stable even if tier changes later.';
COMMENT ON COLUMN bookings.is_running_late IS 'Set when cleaner taps "Running late" in WF 68.';
COMMENT ON CONSTRAINT no_cleaner_double_booking ON bookings IS 'Prevents same cleaner having overlapping active bookings; database-level enforcement.';

CREATE TRIGGER bookings_set_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- Indexes — these are heavily-used query patterns.
CREATE INDEX idx_bookings_customer_state ON bookings(customer_id, state, start_at DESC);
CREATE INDEX idx_bookings_cleaner_start ON bookings(cleaner_id, start_at) WHERE cleaner_id IS NOT NULL;
CREATE INDEX idx_bookings_state_start ON bookings(state, start_at);
CREATE INDEX idx_bookings_auto_approval ON bookings(auto_approval_due_at)
    WHERE state = 'awaiting_approval' AND auto_approval_due_at IS NOT NULL;
CREATE INDEX idx_bookings_recurring ON bookings(recurring_schedule_id) WHERE recurring_schedule_id IS NOT NULL;
CREATE INDEX idx_bookings_address ON bookings(address_id);
CREATE INDEX idx_bookings_customer_cleaner ON bookings(customer_id, cleaner_id) WHERE cleaner_id IS NOT NULL;
CREATE INDEX idx_bookings_booking_number ON bookings(booking_number);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX idx_bookings_dispute_window ON bookings(dispute_window_ends_at)
    WHERE state = 'paid' AND dispute_window_ends_at IS NOT NULL;


-- =============================================================================
-- Table 11: booking_state_events
-- =============================================================================
-- APPEND-ONLY log of every state transition. Critical audit trail.
-- =============================================================================

CREATE TABLE booking_state_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

    -- Previous state may be NULL for the first event (initial creation).
    previous_state booking_state,
    new_state booking_state NOT NULL,

    -- Who or what caused the transition.
    -- triggered_by_user_id may be NULL for system-driven transitions
    -- (e.g., auto-approval timer, scheduled job).
    triggered_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    triggered_by_system TEXT,  -- e.g., 'auto_approval_job', 'recurring_spawn_job'

    -- Optional human-readable reason.
    reason TEXT,

    -- Free-form metadata for the transition.
    -- Examples: cancellation penalty cents, geo-fence coordinates, late minutes.
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

    -- Timestamp is immutable; created_at = "when the transition happened".
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Sanity: at least one of triggered_by_user_id or triggered_by_system must
    -- be populated.
    CONSTRAINT triggered_by_required
        CHECK (
            triggered_by_user_id IS NOT NULL
            OR triggered_by_system IS NOT NULL
        )
);

COMMENT ON TABLE booking_state_events IS 'Append-only audit trail of booking state transitions.';

-- This table is append-only. Block UPDATE and DELETE.
CREATE OR REPLACE FUNCTION reject_modifications()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Modifications not allowed on append-only table %', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_state_events_no_update
    BEFORE UPDATE OR DELETE ON booking_state_events
    FOR EACH ROW
    EXECUTE FUNCTION reject_modifications();

CREATE INDEX idx_booking_state_events_booking ON booking_state_events(booking_id, created_at);
CREATE INDEX idx_booking_state_events_new_state ON booking_state_events(new_state, created_at DESC);
CREATE INDEX idx_booking_state_events_triggered_by ON booking_state_events(triggered_by_user_id) WHERE triggered_by_user_id IS NOT NULL;


-- =============================================================================
-- Table 12: booking_photos
-- =============================================================================
-- All photos uploaded for a booking. Categorized by purpose enum.
-- =============================================================================

CREATE TABLE booking_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    uploaded_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- What is this photo for? Drives access rules and retention.
    purpose photo_purpose NOT NULL,

    -- Cloudflare R2 storage. Public URL is signed with short TTL.
    storage_key TEXT NOT NULL,           -- e.g., "bookings/{booking_id}/photos/{uuid}.jpg"
    cdn_url TEXT,                        -- Signed URL, regenerated as needed
    thumbnail_url TEXT,

    -- Photo metadata.
    file_size_bytes INTEGER NOT NULL,
    mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/heic')),
    width_pixels INTEGER,
    height_pixels INTEGER,

    -- Timestamps for trust/audit.
    captured_at TIMESTAMPTZ,             -- From EXIF if available
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- GPS for trust (helps validate "photo really taken at the address").
    -- Not all photos have GPS (privacy mode, indoor reception, etc.).
    capture_latitude DECIMAL(10, 7),
    capture_longitude DECIMAL(10, 7),

    -- Room/category labels for organizing in WF 9, 10.
    -- e.g., 'kitchen', 'bathroom_1', 'living_room', 'master_bedroom'.
    room_label TEXT,

    -- Auto-deletion. Photos are deleted 90 days after booking ends per locked
    -- privacy policy. delete_after_at = booking.end_at + 90 days.
    -- Background job processes records past this date.
    delete_after_at TIMESTAMPTZ,

    -- Soft delete for record-keeping; actual file in R2 deleted by cleanup job.
    deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE booking_photos IS 'All booking-related photos. Categorized by purpose; auto-deleted at 90 days.';
COMMENT ON COLUMN booking_photos.purpose IS 'Drives access policy and retention.';
COMMENT ON COLUMN booking_photos.delete_after_at IS '90-day deletion date; cleanup job purges R2 file and sets deleted_at.';

CREATE INDEX idx_booking_photos_booking ON booking_photos(booking_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_booking_photos_purpose ON booking_photos(booking_id, purpose) WHERE deleted_at IS NULL;
CREATE INDEX idx_booking_photos_uploaded_by ON booking_photos(uploaded_by_user_id, uploaded_at DESC);
CREATE INDEX idx_booking_photos_delete_after ON booking_photos(delete_after_at)
    WHERE deleted_at IS NULL AND delete_after_at IS NOT NULL;


-- =============================================================================
-- Table 13: recurring_schedules
-- =============================================================================
-- A customer's active recurring agreement with a cleaner.
-- Generates occurrences via the recurring_spawn job.
-- =============================================================================

CREATE TABLE recurring_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE RESTRICT,
    cleaner_id UUID NOT NULL REFERENCES cleaner_profiles(id) ON DELETE RESTRICT,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,

    -- Cadence and timing.
    cadence recurring_cadence NOT NULL,
    custom_cadence_days INTEGER,         -- Used when cadence = 'custom'
    duration_hours_decimal DECIMAL(4,2) NOT NULL,

    -- Day of week (0 = Sunday, 6 = Saturday) and local time of day.
    -- Local time stored as INTEGER minutes-since-midnight (e.g., 600 = 10am).
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_minutes INTEGER NOT NULL CHECK (start_minutes >= 0 AND start_minutes < 1440),

    -- Status.
    status recurring_status NOT NULL DEFAULT 'active',

    -- When recurring started, paused, ended.
    started_at TIMESTAMPTZ NOT NULL,
    paused_at TIMESTAMPTZ,
    paused_until TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    ended_reason TEXT,

    -- For cleaner-side cancellation: 14-day notice required (locked).
    cleaner_end_notice_given_at TIMESTAMPTZ,
    cleaner_end_effective_at TIMESTAMPTZ,

    -- Snapshot of pricing at recurring setup (per audit pattern: immutable
    -- pricing per occurrence captured when each booking spawns).
    -- This is just the current configured rate; bookings get their own snapshot.
    hourly_rate_cents INTEGER NOT NULL,

    customer_notes TEXT,

    -- Stats (denormalized for management page WF 22).
    occurrences_completed_count INTEGER NOT NULL DEFAULT 0,
    total_charged_cents BIGINT NOT NULL DEFAULT 0,
    average_rating DECIMAL(3,2),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT custom_cadence_days_required
        CHECK (
            cadence != 'custom'
            OR custom_cadence_days IS NOT NULL
        )
);

COMMENT ON TABLE recurring_schedules IS 'Customer-cleaner recurring agreements. Spawn occurrences via background job.';
COMMENT ON COLUMN recurring_schedules.cleaner_end_notice_given_at IS 'When cleaner notified of intent to end; 14-day SLA per locked rule.';

CREATE TRIGGER recurring_schedules_set_updated_at
    BEFORE UPDATE ON recurring_schedules
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- Now add the deferred FK on bookings
ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_recurring_schedule
    FOREIGN KEY (recurring_schedule_id) REFERENCES recurring_schedules(id) ON DELETE SET NULL;

CREATE INDEX idx_recurring_schedules_customer ON recurring_schedules(customer_id, status);
CREATE INDEX idx_recurring_schedules_cleaner ON recurring_schedules(cleaner_id, status);
CREATE INDEX idx_recurring_schedules_active ON recurring_schedules(status) WHERE status = 'active';


-- =============================================================================
-- Table 14: recurring_occurrences
-- =============================================================================
-- Each scheduled (or executed) occurrence of a recurring schedule.
-- Links 1-to-1 to a booking once spawned.
-- =============================================================================

CREATE TABLE recurring_occurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    recurring_schedule_id UUID NOT NULL REFERENCES recurring_schedules(id) ON DELETE CASCADE,

    -- When this occurrence is scheduled to happen.
    scheduled_start_at TIMESTAMPTZ NOT NULL,
    scheduled_end_at TIMESTAMPTZ NOT NULL,

    status occurrence_status NOT NULL DEFAULT 'scheduled',

    -- Once spawned, this links to the actual booking.
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    spawned_at TIMESTAMPTZ,

    -- Skip/reschedule tracking.
    skipped_at TIMESTAMPTZ,
    skip_reason TEXT,
    rescheduled_to_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- An occurrence can only spawn once.
    UNIQUE (booking_id),

    -- Each schedule has exactly one occurrence per scheduled start time.
    UNIQUE (recurring_schedule_id, scheduled_start_at)
);

COMMENT ON TABLE recurring_occurrences IS 'Each iteration of a recurring schedule. 1-to-1 with bookings once spawned.';

CREATE TRIGGER recurring_occurrences_set_updated_at
    BEFORE UPDATE ON recurring_occurrences
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_recurring_occurrences_schedule ON recurring_occurrences(recurring_schedule_id, scheduled_start_at);
CREATE INDEX idx_recurring_occurrences_status ON recurring_occurrences(status, scheduled_start_at);
CREATE INDEX idx_recurring_occurrences_pending_spawn ON recurring_occurrences(scheduled_start_at)
    WHERE status = 'scheduled';


-- =============================================================================
-- Table 15: availability_rules
-- =============================================================================
-- Cleaner's weekly availability. One row per day-of-week the cleaner works.
-- =============================================================================

CREATE TABLE availability_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cleaner_id UUID NOT NULL REFERENCES cleaner_profiles(id) ON DELETE CASCADE,

    -- 0 = Sunday, 6 = Saturday.
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),

    -- Local time of day. Minutes since midnight.
    -- e.g., start=480 (8:00am), end=1020 (5:00pm).
    start_minutes INTEGER NOT NULL CHECK (start_minutes >= 0 AND start_minutes < 1440),
    end_minutes INTEGER NOT NULL CHECK (end_minutes > 0 AND end_minutes <= 1440),

    -- Whether this slot is bookable. Cleaners might keep records of slots
    -- they've turned off without deleting them.
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT availability_end_after_start CHECK (end_minutes > start_minutes)

    -- Note: NOT making (cleaner_id, day_of_week) unique, because a cleaner
    -- might split a day (e.g., 8am-12pm and 2pm-6pm with a midday break).
);

COMMENT ON TABLE availability_rules IS 'Cleaner weekly schedule. Multiple rows per day allow split shifts.';

CREATE TRIGGER availability_rules_set_updated_at
    BEFORE UPDATE ON availability_rules
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_availability_rules_cleaner ON availability_rules(cleaner_id, day_of_week)
    WHERE is_active = TRUE;


-- =============================================================================
-- Table 16: time_off_blocks
-- =============================================================================
-- Date-specific overrides to availability rules. Cleaner takes a specific day
-- off, or works a special slot.
-- =============================================================================

CREATE TABLE time_off_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cleaner_id UUID NOT NULL REFERENCES cleaner_profiles(id) ON DELETE CASCADE,

    -- Specific date range the block covers.
    -- For a single-day block, start_at and end_at can be on the same day.
    blocked_start_at TIMESTAMPTZ NOT NULL,
    blocked_end_at TIMESTAMPTZ NOT NULL,

    -- Optional reason (vacation, sick, family event).
    reason TEXT,

    -- Whether this is a hard block (not bookable) or soft (special hours).
    -- For now, only hard blocks are used; soft blocks reserved for future.
    block_type TEXT NOT NULL DEFAULT 'unavailable'
        CHECK (block_type IN ('unavailable', 'special_hours')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT time_off_end_after_start CHECK (blocked_end_at > blocked_start_at)
);

COMMENT ON TABLE time_off_blocks IS 'Date-specific availability overrides. Hard or soft blocks.';

CREATE TRIGGER time_off_blocks_set_updated_at
    BEFORE UPDATE ON time_off_blocks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_time_off_blocks_cleaner_range ON time_off_blocks(cleaner_id, blocked_start_at, blocked_end_at);


-- =============================================================================
-- Table 17: cleaner_service_zips
-- =============================================================================
-- Many-to-many: which ZIPs does each cleaner serve?
-- Drives the cleaner list page filter (WF 8).
-- =============================================================================

CREATE TABLE cleaner_service_zips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cleaner_id UUID NOT NULL REFERENCES cleaner_profiles(id) ON DELETE CASCADE,
    zip_code VARCHAR(10) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (cleaner_id, zip_code)
);

COMMENT ON TABLE cleaner_service_zips IS 'Many-to-many: cleaners ↔ ZIPs they serve. Drives WF 8 filtering.';

CREATE INDEX idx_cleaner_service_zips_cleaner ON cleaner_service_zips(cleaner_id);
CREATE INDEX idx_cleaner_service_zips_zip ON cleaner_service_zips(zip_code);


-- =============================================================================
-- Table 18: serviced_areas
-- =============================================================================
-- Platform-level: which ZIPs are open for booking? Which are SEO-only? Which
-- are waitlist-only?
-- Drives coverage page (WF 46), SEO landing pages (WF 41), and waitlist (WF 70).
-- =============================================================================

CREATE TYPE service_area_status AS ENUM (
    'active',           -- Customers can book; SEO live; cleaners onboarded
    'seo_only',         -- SEO landing page exists; not yet open for booking
    'waitlist',         -- Customers can join waitlist; not yet active
    'inactive'          -- No SEO, no waitlist (default for unknown ZIPs)
);

CREATE TABLE serviced_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    zip_code VARCHAR(10) NOT NULL UNIQUE,
    city TEXT NOT NULL,
    state CHAR(2) NOT NULL,

    status service_area_status NOT NULL DEFAULT 'inactive',

    -- For SEO landing page generation (WF 41).
    seo_metro_area TEXT,                 -- e.g., "San Francisco Bay Area"
    seo_neighborhood_name TEXT,          -- e.g., "Mission District"

    -- When did this area become active?
    activated_at TIMESTAMPTZ,
    inactivated_at TIMESTAMPTZ,

    -- Operational metadata.
    notes TEXT,                          -- Admin notes about this area

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE serviced_areas IS 'Platform authoritative list of ZIP coverage status. Drives coverage/SEO/waitlist.';

CREATE TRIGGER serviced_areas_set_updated_at
    BEFORE UPDATE ON serviced_areas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_serviced_areas_status ON serviced_areas(status);
CREATE INDEX idx_serviced_areas_state_city ON serviced_areas(state, city);


-- =============================================================================
-- Row-Level Security (RLS) Policies for B2
-- =============================================================================

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_state_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaner_service_zips ENABLE ROW LEVEL SECURITY;
ALTER TABLE serviced_areas ENABLE ROW LEVEL SECURITY;

-- Services: publicly readable; admin-only writes.
CREATE POLICY services_read_all ON services
    FOR SELECT USING (is_active = TRUE OR is_admin());

-- Bookings: customer reads own; cleaner reads assigned; admin reads all.
CREATE POLICY bookings_read_party ON bookings
    FOR SELECT USING (
        customer_id = current_customer_id()
        OR cleaner_id = current_cleaner_id()
        OR is_admin()
    );

CREATE POLICY bookings_update_party ON bookings
    FOR UPDATE USING (
        customer_id = current_customer_id()
        OR cleaner_id = current_cleaner_id()
        OR is_admin()
    );

-- Booking state events: same access as parent booking.
CREATE POLICY booking_state_events_read_party ON booking_state_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = booking_state_events.booking_id
            AND (b.customer_id = current_customer_id()
                 OR b.cleaner_id = current_cleaner_id()
                 OR is_admin())
        )
    );

-- Booking photos: same access as parent booking.
CREATE POLICY booking_photos_read_party ON booking_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = booking_photos.booking_id
            AND (b.customer_id = current_customer_id()
                 OR b.cleaner_id = current_cleaner_id()
                 OR is_admin())
        )
        AND deleted_at IS NULL
    );

CREATE POLICY booking_photos_insert_party ON booking_photos
    FOR INSERT WITH CHECK (
        uploaded_by_user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = booking_photos.booking_id
            AND (b.customer_id = current_customer_id()
                 OR b.cleaner_id = current_cleaner_id())
        )
    );

-- Recurring schedules: customer/cleaner parties + admin.
CREATE POLICY recurring_schedules_read_party ON recurring_schedules
    FOR SELECT USING (
        customer_id = current_customer_id()
        OR cleaner_id = current_cleaner_id()
        OR is_admin()
    );

CREATE POLICY recurring_schedules_update_party ON recurring_schedules
    FOR UPDATE USING (
        customer_id = current_customer_id()
        OR cleaner_id = current_cleaner_id()
        OR is_admin()
    );

-- Recurring occurrences: read via parent recurring_schedule access.
CREATE POLICY recurring_occurrences_read ON recurring_occurrences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM recurring_schedules rs
            WHERE rs.id = recurring_occurrences.recurring_schedule_id
            AND (rs.customer_id = current_customer_id()
                 OR rs.cleaner_id = current_cleaner_id()
                 OR is_admin())
        )
    );

-- Availability rules: cleaner reads/writes own; public reads (for cleaner list).
CREATE POLICY availability_rules_read_public ON availability_rules
    FOR SELECT USING (is_active = TRUE OR cleaner_id = current_cleaner_id() OR is_admin());

CREATE POLICY availability_rules_write_self ON availability_rules
    FOR ALL USING (cleaner_id = current_cleaner_id() OR is_admin());

-- Time off blocks: cleaner reads/writes own; public reads (filters cleaner availability).
CREATE POLICY time_off_blocks_read_public ON time_off_blocks
    FOR SELECT USING (TRUE);  -- All time-off blocks must be public for booking flow

CREATE POLICY time_off_blocks_write_self ON time_off_blocks
    FOR ALL USING (cleaner_id = current_cleaner_id() OR is_admin());

-- Cleaner service ZIPs: publicly readable (drives cleaner list).
CREATE POLICY cleaner_service_zips_read_public ON cleaner_service_zips
    FOR SELECT USING (TRUE);

CREATE POLICY cleaner_service_zips_write_self ON cleaner_service_zips
    FOR ALL USING (cleaner_id = current_cleaner_id() OR is_admin());

-- Serviced areas: publicly readable; admin writes.
CREATE POLICY serviced_areas_read_public ON serviced_areas
    FOR SELECT USING (TRUE);


-- =============================================================================
-- Notes for B3 and beyond
-- =============================================================================
-- 1. Reviews (B3) will FK to bookings. Constraint: a review can only exist
--    for a booking the reviewing customer was party to.
--
-- 2. Disputes (B3) will FK to bookings. Constraint: dispute filing only
--    allowed when booking.dispute_window_ends_at > NOW().
--
-- 3. Charges (B5) will FK to bookings. Charges capture is gated on
--    booking.state = 'approved' or 'auto_approved'.
--
-- 4. Reliability events (B4) will FK to bookings (optional). On-time arrival,
--    completion, photo quality events all reference the booking that
--    triggered them.
--
-- 5. Notifications (B6) will FK to bookings (optional). Most notifications
--    are about specific bookings.
--
-- 6. The cleaner search query (cleaner list page) joins:
--      cleaner_profiles ⨝ cleaner_service_zips ⨝ availability_rules
--    with subqueries against bookings and time_off_blocks. Production-ready
--    but may want a materialized view at scale (post-MVP).
-- =============================================================================

-- End of B2
