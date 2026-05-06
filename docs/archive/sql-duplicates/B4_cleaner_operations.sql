-- =============================================================================
-- PureTask Database Schema — Batch B4: Cleaner Operations
-- =============================================================================
-- Score, tier, badges, specialties, suspensions. The reliability ecosystem.
--
-- Design principles applied:
--   1. reliability_events is APPEND-ONLY. Every score-affecting event is
--      written once, never modified. Score recomputation always reads
--      current data; never updates historical events.
--   2. Score is computed daily and stored as snapshots. The current_score
--      on cleaner_profiles is the latest snapshot — denormalized for fast
--      reads.
--   3. Tier transitions follow the 14-day sustained rule. The tier_assignments
--      table records every change with the score reading that triggered it.
--   4. Veteran cushion (6+ months at 75+) is a computed flag refreshed
--      nightly, not a stored derivation.
--   5. Suspensions are explicit rows (not booleans) so we have history,
--      reasons, durations, and lift conditions.
--   6. cleaner_appeals uses polymorphic FK with CHECK constraint (decided in
--      part 1 — best for low-volume audit table).
--   7. Customer reliability events captured day-1 even though customer-
--      facing UI is Phase 2 (admin can already see this data per WF 60).
--
-- Wireframes covered by B4:
--   2, 2c, 2d, 7, 26, 31, 51, 52, 53, 59, 60, 65, 66
--
-- Dependencies: B1 (users, profiles), B2 (bookings), B3 (reviews, traits).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Enums for B4
-- -----------------------------------------------------------------------------

-- The 6 metric categories from locked scoring design.
-- Weights (informational, not stored — applied in scoring code):
--   on_time:      25%
--   completion:   25%
--   photo:        15%
--   ratings:      15%
--   communication: 10%
--   reschedule:   10%
CREATE TYPE reliability_metric_category AS ENUM (
    'on_time',
    'completion',
    'photo',
    'ratings',
    'communication',
    'reschedule'
);

-- Specific event types within each metric category.
-- Application code maps each event_type to a category and a point_delta.
-- Examples:
--   on_time_arrival: category=on_time, delta=+1
--   late_arrival_minor (5-15min): category=on_time, delta=-1
--   late_arrival_major (15+min): category=on_time, delta=-3
--   no_show_arrival: category=on_time, delta=-6 (also triggers no-show count)
--   five_star_review: category=ratings, delta=+1
--   one_star_review: category=ratings, delta=-3
--   photo_upload_complete: category=photo, delta=+1
--   photo_upload_incomplete: category=photo, delta=-2
CREATE TYPE reliability_event_type AS ENUM (
    -- on_time category
    'on_time_arrival',
    'late_arrival_minor',
    'late_arrival_major',
    'running_late_flagged',  -- Cleaner flagged in advance — not punishing
    'no_show_arrival',
    -- completion category
    'job_completed',
    'job_completed_with_issues',
    'cleaner_cancelled_late',
    'cleaner_no_show',
    -- photo category
    'photo_upload_complete',
    'photo_upload_partial',
    'photo_upload_missing',
    'photo_quality_flagged',
    -- ratings category
    'five_star_review',
    'four_star_review',
    'three_star_review',
    'two_star_review',
    'one_star_review',
    -- communication category
    'comm_response_fast',     -- Responded within 1hr during active booking
    'comm_response_slow',     -- Responded 1-4hr
    'comm_response_missed',   -- Missed 4hr SLA
    -- reschedule category
    'reschedule_requested_by_cleaner',
    'reschedule_accepted_by_customer',
    'reschedule_no_response',  -- Cleaner ignored customer reschedule request
    -- positive offsetters
    'manual_admin_credit',     -- Admin grants positive points (rare, audit-tracked)
    'manual_admin_debit'       -- Admin removes points (rare, audit-tracked)
);

-- Appeal target type for polymorphic FK.
CREATE TYPE appeal_target_type AS ENUM (
    'tier_drop',           -- Appealing a tier-drop decision
    'reliability_event'    -- Appealing a specific score event
);

-- Appeal lifecycle.
CREATE TYPE appeal_status AS ENUM (
    'pending',
    'under_review',
    'upheld',              -- Admin agrees with cleaner; reverses the event
    'denied',              -- Admin disagrees; original stands
    'partial'              -- Admin compromise (rare)
);

-- Suspension reason types.
CREATE TYPE suspension_reason_type AS ENUM (
    'no_show_rule',          -- 5 no-shows in 60 days (locked auto-rule)
    'manual_admin',          -- Admin imposed
    'fraud_investigation',   -- Under investigation
    'safety_concern',        -- Reported safety issue
    'background_check_fail', -- Failed renewal check
    'insurance_lapsed',      -- Insurance Verified badge lost while required
    'other'
);

-- Badge categories (locked from WF 65, 66).
CREATE TYPE badge_type AS ENUM (
    'trusted_by_neighbors',     -- 10+ jobs, 4.5+ rating per ZIP
    'top_rated_in_zip',         -- 25+ jobs, 4.7+ rating, Top Performer+
    'customer_favorite_in_zip', -- 5+ recurring customers in ZIP, All-Star
    'background_checked',       -- Standard for all approved cleaners
    'insurance_verified',       -- Cleaner uploaded valid COI
    'platform_milestone'        -- e.g., "100 jobs completed"
);

-- Customer reliability event types — mirrors cleaner version but for customers.
CREATE TYPE customer_reliability_event_type AS ENUM (
    'on_time_for_arrival',
    'no_show_for_arrival',
    'cancelled_late',          -- 24-48hr cancellation
    'cancelled_very_late',     -- <24hr cancellation
    'positive_cleaner_review', -- Cleaner rated customer 5★ (Phase 2)
    'negative_cleaner_review', -- Cleaner rated customer ≤2★ (Phase 2)
    'frivolous_dispute_flagged' -- Mediator flagged customer's dispute as bad-faith
);


-- =============================================================================
-- Table 27: reliability_events
-- =============================================================================
-- APPEND-ONLY log of every event affecting cleaner score.
-- Every row immutable. Score is computed from these events.
-- =============================================================================

CREATE TABLE reliability_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cleaner_id UUID NOT NULL REFERENCES cleaner_profiles(id) ON DELETE RESTRICT,

    -- Optional booking that triggered this event.
    -- Most events tie to a booking; admin manual adjustments may not.
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

    -- Categorization.
    metric_category reliability_metric_category NOT NULL,
    event_type reliability_event_type NOT NULL,

    -- Point delta applied to score.
    -- Stored explicitly (audit pattern) so we don't have to re-derive from
    -- event_type. Application code computes delta at write time.
    point_delta INTEGER NOT NULL,

    -- For audit / explanation in WF 2c (score breakdown).
    description TEXT NOT NULL,

    -- Free-form metadata.
    -- Examples:
    --   late_arrival: {"minutes_late": 12}
    --   review event: {"review_id": "...", "stars": 5}
    --   admin adjustment: {"admin_id": "...", "reason": "..."}
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

    -- Was this event later overturned by an appeal?
    -- If true, the score recalculation excludes this event.
    is_overturned BOOLEAN NOT NULL DEFAULT FALSE,
    overturned_at TIMESTAMPTZ,
    overturned_by_appeal_id UUID,  -- FK to cleaner_appeals (added below)

    -- When the event happened (real-world time, not write time).
    -- For booking-related events, this is typically the booking timestamp;
    -- for admin events, the moment the admin took action.
    event_occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE reliability_events IS 'Append-only log of cleaner score events. Drives score calculation.';
COMMENT ON COLUMN reliability_events.point_delta IS 'Captured at write time. Score = sum of point_deltas in 90-day window.';
COMMENT ON COLUMN reliability_events.is_overturned IS 'Set true when appeal is upheld. Excluded from score calculation.';

-- Append-only enforcement: no UPDATE or DELETE allowed except for is_overturned
-- which is set during appeal processing.
CREATE OR REPLACE FUNCTION reliability_events_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Cannot delete from reliability_events (append-only)';
    END IF;
    -- Only is_overturned, overturned_at, overturned_by_appeal_id can change.
    IF NEW.cleaner_id IS DISTINCT FROM OLD.cleaner_id
        OR NEW.booking_id IS DISTINCT FROM OLD.booking_id
        OR NEW.metric_category IS DISTINCT FROM OLD.metric_category
        OR NEW.event_type IS DISTINCT FROM OLD.event_type
        OR NEW.point_delta IS DISTINCT FROM OLD.point_delta
        OR NEW.description IS DISTINCT FROM OLD.description
        OR NEW.event_occurred_at IS DISTINCT FROM OLD.event_occurred_at
        OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
        RAISE EXCEPTION 'reliability_events is append-only; only overturn fields are mutable';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reliability_events_immutable
    BEFORE UPDATE OR DELETE ON reliability_events
    FOR EACH ROW
    EXECUTE FUNCTION reliability_events_immutability();

CREATE INDEX idx_reliability_events_cleaner ON reliability_events(cleaner_id, event_occurred_at DESC);
CREATE INDEX idx_reliability_events_active_window ON reliability_events(cleaner_id, event_occurred_at DESC)
    WHERE is_overturned = FALSE;
CREATE INDEX idx_reliability_events_category ON reliability_events(cleaner_id, metric_category, event_occurred_at DESC)
    WHERE is_overturned = FALSE;
CREATE INDEX idx_reliability_events_booking ON reliability_events(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_reliability_events_event_type ON reliability_events(event_type, event_occurred_at DESC);


-- =============================================================================
-- Table 28: reliability_score_snapshots
-- =============================================================================
-- Daily computed score per cleaner. Written by nightly batch job.
-- Keeps history for trend display and audit.
-- =============================================================================

CREATE TABLE reliability_score_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cleaner_id UUID NOT NULL REFERENCES cleaner_profiles(id) ON DELETE CASCADE,

    -- The day this snapshot is for.
    snapshot_date DATE NOT NULL,

    -- The 0-100 score on this date.
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),

    -- Score band (matches locked bands):
    --   90-100: trusted
    --   75-89:  good_standing
    --   60-74:  warning
    --   40-59:  probation (cannot accept new bookings)
    --   <40:    suspended (cannot work at all)
    band TEXT NOT NULL CHECK (band IN ('trusted', 'good_standing', 'warning', 'probation', 'suspended')),

    -- Per-metric breakdown for WF 2c (score breakdown screen).
    -- Each metric stored as: { points: integer, max_possible: integer, percentage: decimal }
    -- Example:
    --   { "on_time":      { "points": 24, "max_possible": 25, "percentage": 96 },
    --     "completion":   { "points": 25, "max_possible": 25, "percentage": 100 },
    --     "photo":        { "points": 13, "max_possible": 15, "percentage": 87 },
    --     "ratings":      { "points": 14, "max_possible": 15, "percentage": 93 },
    --     "communication": { "points": 9, "max_possible": 10, "percentage": 90 },
    --     "reschedule":   { "points": 10, "max_possible": 10, "percentage": 100 } }
    metric_breakdown JSONB NOT NULL,

    -- Window of events used for this calculation.
    window_start_date DATE NOT NULL,
    window_end_date DATE NOT NULL,

    -- Did this snapshot trigger any side effects (tier drop, suspension)?
    triggered_tier_change BOOLEAN NOT NULL DEFAULT FALSE,
    triggered_suspension BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One snapshot per cleaner per day.
    UNIQUE (cleaner_id, snapshot_date)
);

COMMENT ON TABLE reliability_score_snapshots IS 'Daily computed scores. UPSERT on (cleaner_id, snapshot_date).';
COMMENT ON COLUMN reliability_score_snapshots.metric_breakdown IS 'Per-category points + max + percentage; drives WF 2c.';

CREATE INDEX idx_score_snapshots_cleaner_date ON reliability_score_snapshots(cleaner_id, snapshot_date DESC);
CREATE INDEX idx_score_snapshots_band ON reliability_score_snapshots(band, snapshot_date DESC);
CREATE INDEX idx_score_snapshots_date ON reliability_score_snapshots(snapshot_date DESC);


-- =============================================================================
-- Table 29: tier_assignments
-- =============================================================================
-- Historical record of tier changes. Each tier transition writes a row.
-- Current tier is denormalized on cleaner_profiles for fast reads.
-- =============================================================================

CREATE TABLE tier_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cleaner_id UUID NOT NULL REFERENCES cleaner_profiles(id) ON DELETE CASCADE,

    -- The tier on this assignment.
    tier tier_name NOT NULL,

    -- The tier that came before (NULL for first assignment).
    previous_tier tier_name,

    -- Score that triggered the assignment.
    score_at_assignment INTEGER NOT NULL CHECK (score_at_assignment >= 0 AND score_at_assignment <= 100),

    -- When this tier started.
    effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- When this tier ended (NULL = current).
    -- A tier_assignment becomes "ended" when a new one is added for the same cleaner.
    ended_at TIMESTAMPTZ,

    -- Reason for assignment.
    reason TEXT NOT NULL,
    -- Examples:
    --   'initial_assignment_first_6_jobs_complete'
    --   'promoted_from_proven_specialist_score_92'
    --   'demoted_from_top_performer_score_dropped_to_72'
    --   'admin_manual_adjustment'

    -- Who/what triggered the change.
    triggered_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    triggered_by_system TEXT,  -- e.g., 'tier_assignment_job', '14_day_sustained_threshold'

    -- Veteran cushion application flag.
    -- Set true if this would have been a tier drop but was deferred per
    -- the 30-day window for veterans.
    veteran_cushion_applied BOOLEAN NOT NULL DEFAULT FALSE,

    -- Was this tier change appealed?
    -- FK declared after cleaner_appeals table exists.
    appealed_via_appeal_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT triggered_by_required_tier
        CHECK (triggered_by_user_id IS NOT NULL OR triggered_by_system IS NOT NULL)
);

COMMENT ON TABLE tier_assignments IS 'History of tier changes. Active tier denormalized to cleaner_profiles.';

CREATE INDEX idx_tier_assignments_cleaner ON tier_assignments(cleaner_id, effective_at DESC);
CREATE INDEX idx_tier_assignments_active ON tier_assignments(cleaner_id) WHERE ended_at IS NULL;
CREATE INDEX idx_tier_assignments_tier ON tier_assignments(tier, effective_at DESC);


-- =============================================================================
-- Table 30: cleaner_appeals
-- =============================================================================
-- Cleaner appeals on tier drops or specific reliability events.
-- Polymorphic FK pattern with CHECK constraint.
-- =============================================================================

CREATE TABLE cleaner_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cleaner_id UUID NOT NULL REFERENCES cleaner_profiles(id) ON DELETE CASCADE,

    -- Polymorphic target.
    target_type appeal_target_type NOT NULL,
    target_tier_assignment_id UUID REFERENCES tier_assignments(id) ON DELETE RESTRICT,
    target_reliability_event_id UUID REFERENCES reliability_events(id) ON DELETE RESTRICT,

    -- Cleaner's appeal text (one paragraph per locked design).
    appeal_text TEXT NOT NULL,

    -- Status lifecycle.
    status appeal_status NOT NULL DEFAULT 'pending',

    -- Submission and SLA.
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- 48-hour review SLA per locked design.
    review_due_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '48 hours',

    -- Admin review.
    reviewed_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    admin_decision_notes TEXT,

    -- Cleaner notification.
    cleaner_notified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Polymorphic FK enforcement: exactly one of the two target FKs is set,
    -- matching the target_type.
    CONSTRAINT appeal_target_consistency
        CHECK (
            (target_type = 'tier_drop'
             AND target_tier_assignment_id IS NOT NULL
             AND target_reliability_event_id IS NULL)
            OR
            (target_type = 'reliability_event'
             AND target_reliability_event_id IS NOT NULL
             AND target_tier_assignment_id IS NULL)
        )
);

COMMENT ON TABLE cleaner_appeals IS 'Cleaner appeals on tier drops or reliability events. Polymorphic FK with CHECK.';
COMMENT ON COLUMN cleaner_appeals.review_due_at IS '48 hours from submission per locked SLA.';
COMMENT ON CONSTRAINT appeal_target_consistency ON cleaner_appeals IS
    'Polymorphic FK: exactly one target FK is set, matching target_type.';

CREATE TRIGGER cleaner_appeals_set_updated_at
    BEFORE UPDATE ON cleaner_appeals
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- Now add the back-references on tier_assignments and reliability_events
ALTER TABLE tier_assignments
    ADD CONSTRAINT fk_tier_appeal
    FOREIGN KEY (appealed_via_appeal_id) REFERENCES cleaner_appeals(id) ON DELETE SET NULL;

ALTER TABLE reliability_events
    ADD CONSTRAINT fk_reliability_event_appeal
    FOREIGN KEY (overturned_by_appeal_id) REFERENCES cleaner_appeals(id) ON DELETE SET NULL;

CREATE INDEX idx_cleaner_appeals_cleaner ON cleaner_appeals(cleaner_id, submitted_at DESC);
CREATE INDEX idx_cleaner_appeals_status ON cleaner_appeals(status, review_due_at);
CREATE INDEX idx_cleaner_appeals_pending ON cleaner_appeals(review_due_at)
    WHERE status IN ('pending', 'under_review');


-- =============================================================================
-- Table 31: badges
-- =============================================================================
-- Catalog of all available badges. Lookup table.
-- =============================================================================

CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Stable key for application code references.
    key TEXT NOT NULL UNIQUE,

    -- Customer-facing label.
    display_label TEXT NOT NULL,

    -- Category enum.
    badge_type badge_type NOT NULL,

    -- Description shown on hover/tap (WF 65, 66 detail screens).
    description TEXT NOT NULL,

    -- Icon name for UI rendering.
    icon_name TEXT NOT NULL,

    -- Earning criteria, stored as JSONB for flexibility.
    -- Examples:
    --   { "min_jobs": 10, "min_rating": 4.5, "scope": "per_zip" }
    --   { "min_jobs": 25, "min_rating": 4.7, "min_tier": "top_performer", "scope": "per_zip" }
    --   { "min_recurring_customers": 5, "min_tier": "all_star_expert", "scope": "per_zip" }
    earning_criteria JSONB NOT NULL,

    -- Whether badge is ZIP-locked (earned per ZIP) or global.
    is_zip_locked BOOLEAN NOT NULL DEFAULT FALSE,

    -- Whether badge can be earned automatically (calculated by job) or
    -- requires manual verification (e.g., insurance_verified is admin-verified).
    is_auto_earned BOOLEAN NOT NULL DEFAULT TRUE,

    -- Display order on profile (WF 7).
    display_order INTEGER NOT NULL DEFAULT 0,

    -- Active badges show on profiles; inactive ones don't but existing
    -- cleaner_badges rows still reference them.
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE badges IS 'Badge catalog. earning_criteria drives auto-calculation jobs.';

CREATE TRIGGER badges_set_updated_at
    BEFORE UPDATE ON badges
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_badges_active ON badges(is_active, display_order);
CREATE INDEX idx_badges_type ON badges(badge_type);

-- Seed the locked badge catalog
INSERT INTO badges (key, display_label, badge_type, description, icon_name, earning_criteria, is_zip_locked, is_auto_earned, display_order) VALUES
    ('trusted_by_neighbors_zip', 'Trusted by Neighbors',
     'trusted_by_neighbors',
     'Earned by completing 10+ jobs at 4.5+ rating in a specific ZIP code.',
     'shield_check',
     '{"min_jobs": 10, "min_rating": 4.5, "scope": "per_zip"}'::jsonb,
     TRUE, TRUE, 1),
    ('top_rated_in_zip', 'Top-Rated in [ZIP]',
     'top_rated_in_zip',
     'Earned by completing 25+ jobs at 4.7+ rating with Top Performer tier or higher.',
     'star_filled',
     '{"min_jobs": 25, "min_rating": 4.7, "min_tier": "top_performer", "scope": "per_zip"}'::jsonb,
     TRUE, TRUE, 2),
    ('customer_favorite_in_zip', 'Customer Favorite in [ZIP]',
     'customer_favorite_in_zip',
     'Earned by having 5+ recurring customers in a ZIP at All-Star Expert tier.',
     'heart_filled',
     '{"min_recurring_customers": 5, "min_tier": "all_star_expert", "scope": "per_zip"}'::jsonb,
     TRUE, TRUE, 3),
    ('background_checked', 'Background Checked',
     'background_checked',
     'All approved cleaners pass a background check via Checkr. Renewed every 2 years.',
     'check_seal',
     '{"manual": true}'::jsonb,
     FALSE, FALSE, 4),
    ('insurance_verified', 'Insurance Verified',
     'insurance_verified',
     'Cleaner has provided proof of $100k+ liability insurance, verified by PureTask.',
     'umbrella',
     '{"manual": true}'::jsonb,
     FALSE, FALSE, 5);


-- =============================================================================
-- Table 32: cleaner_badges
-- =============================================================================
-- Earned badge assignments. Many-to-many between cleaners and badges.
-- ZIP-locked badges have zip_code populated; global badges have NULL.
-- =============================================================================

CREATE TABLE cleaner_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cleaner_id UUID NOT NULL REFERENCES cleaner_profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE RESTRICT,

    -- For ZIP-locked badges. NULL for global badges.
    zip_code VARCHAR(10),

    -- When earned.
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- For audit / display.
    -- Snapshot of stats that earned the badge (e.g., 28 jobs, 4.81 avg).
    earning_snapshot JSONB,

    -- For badges that can lapse (e.g., insurance expires).
    expires_at TIMESTAMPTZ,
    lost_at TIMESTAMPTZ,
    lost_reason TEXT,

    -- A cleaner can have a given badge once per scope (or once globally).
    UNIQUE NULLS NOT DISTINCT (cleaner_id, badge_id, zip_code)
);

COMMENT ON TABLE cleaner_badges IS 'Earned badges. ZIP-locked badges have zip_code; global have NULL.';
COMMENT ON CONSTRAINT cleaner_badges_cleaner_id_badge_id_zip_code_key ON cleaner_badges IS
    'NULLS NOT DISTINCT means NULL zip values are treated as equal — prevents duplicate global badges.';

CREATE INDEX idx_cleaner_badges_cleaner ON cleaner_badges(cleaner_id) WHERE lost_at IS NULL;
CREATE INDEX idx_cleaner_badges_zip ON cleaner_badges(zip_code, badge_id) WHERE lost_at IS NULL;
CREATE INDEX idx_cleaner_badges_expiring ON cleaner_badges(expires_at)
    WHERE expires_at IS NOT NULL AND lost_at IS NULL;


-- =============================================================================
-- Table 33: specialties
-- =============================================================================
-- Specialty endorsement catalog.
-- =============================================================================

CREATE TABLE specialties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    key TEXT NOT NULL UNIQUE,
    display_label TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT,

    -- Earning criteria. Drives the calculation that promotes traits to specialties.
    -- Example:
    --   { "trait_key": "pet_friendly", "min_count": 5, "min_rating": 4.5,
    --     "window_days": 90 }
    earning_criteria JSONB NOT NULL,

    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE specialties IS 'Specialty endorsement catalog. Earned via review_traits patterns.';

CREATE TRIGGER specialties_set_updated_at
    BEFORE UPDATE ON specialties
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_specialties_active ON specialties(is_active, display_order);

-- Seed the locked specialty catalog
INSERT INTO specialties (key, display_label, description, icon_name, earning_criteria, display_order) VALUES
    ('eco_friendly_specialist', 'Eco-friendly',
     'Cleaner has been recognized for using eco-friendly products and methods. Earned through repeated 5-star ratings with the Eco-friendly trait.',
     'leaf',
     '{"trait_key": "eco_friendly", "min_count": 5, "min_rating": 4.5, "window_days": 90}'::jsonb,
     1),
    ('pet_friendly_specialist', 'Pet-friendly',
     'Cleaner is comfortable working in homes with pets. Earned through repeated 5-star ratings with the Pet-friendly trait.',
     'paw',
     '{"trait_key": "pet_friendly", "min_count": 5, "min_rating": 4.5, "window_days": 90}'::jsonb,
     2),
    ('deep_clean_specialist', 'Deep Clean Specialist',
     'Recognized for thorough deep-cleaning work. Earned through repeat detail-oriented ratings on deep cleans.',
     'sparkle',
     '{"trait_key": "detail_oriented", "min_count": 5, "min_rating": 4.7, "service_type": "deep", "window_days": 90}'::jsonb,
     3),
    ('move_out_specialist', 'Move-out Specialist',
     'Recognized for excellent move-out cleanings. Earned through repeated 5-star ratings on move-out service bookings.',
     'box',
     '{"min_count": 5, "min_rating": 4.7, "service_type": "move_out", "window_days": 180}'::jsonb,
     4),
    ('airbnb_specialist', 'Airbnb Specialist',
     'Trusted for fast, reliable Airbnb turnovers. Earned through 10+ on-time turnovers at 4.7+ rating.',
     'key',
     '{"min_count": 10, "min_rating": 4.7, "service_type": "airbnb", "window_days": 90}'::jsonb,
     5);


-- =============================================================================
-- Table 34: cleaner_specialties
-- =============================================================================
-- Earned specialty endorsements. Updated by nightly batch reading review_traits.
-- =============================================================================

CREATE TABLE cleaner_specialties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cleaner_id UUID NOT NULL REFERENCES cleaner_profiles(id) ON DELETE CASCADE,
    specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE RESTRICT,

    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Snapshot of stats when earned.
    earning_snapshot JSONB,

    -- For specialties that can be lost (rare; e.g., recent ratings drop the
    -- 90-day average).
    lost_at TIMESTAMPTZ,
    lost_reason TEXT,

    UNIQUE (cleaner_id, specialty_id)
);

COMMENT ON TABLE cleaner_specialties IS 'Earned specialty endorsements. Computed nightly from review_traits.';

CREATE INDEX idx_cleaner_specialties_cleaner ON cleaner_specialties(cleaner_id) WHERE lost_at IS NULL;
CREATE INDEX idx_cleaner_specialties_specialty ON cleaner_specialties(specialty_id) WHERE lost_at IS NULL;


-- =============================================================================
-- Table 35: cleaner_suspensions
-- =============================================================================
-- Active and historical suspensions. Distinct from cleaner_profiles.is_active
-- (cleaner-controlled) and from probation (calculated from score band).
-- =============================================================================

CREATE TABLE cleaner_suspensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cleaner_id UUID NOT NULL REFERENCES cleaner_profiles(id) ON DELETE CASCADE,

    -- When suspension begins.
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- When suspension ends. NULL = indefinite (manual lift required).
    ends_at TIMESTAMPTZ,

    -- Reason for suspension.
    reason_type suspension_reason_type NOT NULL,
    reason_notes TEXT,

    -- Who imposed it (NULL = automatic system-imposed).
    imposed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    imposed_by_system TEXT,  -- e.g., 'no_show_rule_5_in_60_days'

    -- Lift tracking.
    lifted_at TIMESTAMPTZ,
    lifted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    lifted_reason TEXT,

    -- Cleaner notification.
    cleaner_notified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT suspension_imposed_by_required
        CHECK (imposed_by_user_id IS NOT NULL OR imposed_by_system IS NOT NULL)
);

COMMENT ON TABLE cleaner_suspensions IS 'Explicit suspensions. Active row exists when suspension is active.';
COMMENT ON COLUMN cleaner_suspensions.ends_at IS 'NULL = indefinite, requires manual lift via lifted_at.';

CREATE TRIGGER cleaner_suspensions_set_updated_at
    BEFORE UPDATE ON cleaner_suspensions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- Index for "is this cleaner currently suspended?" check.
CREATE INDEX idx_cleaner_suspensions_active ON cleaner_suspensions(cleaner_id)
    WHERE lifted_at IS NULL AND (ends_at IS NULL OR ends_at > NOW());
CREATE INDEX idx_cleaner_suspensions_cleaner ON cleaner_suspensions(cleaner_id, started_at DESC);
CREATE INDEX idx_cleaner_suspensions_ending ON cleaner_suspensions(ends_at)
    WHERE lifted_at IS NULL AND ends_at IS NOT NULL;


-- =============================================================================
-- Table 36: customer_reliability_events
-- =============================================================================
-- Customer-side scoring events. Schema captured day-1; UI exposed in Phase 2.
-- Admin can view this data via WF 60.
-- =============================================================================

CREATE TABLE customer_reliability_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE RESTRICT,

    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

    event_type customer_reliability_event_type NOT NULL,

    -- Point delta — same pattern as cleaner reliability events.
    point_delta INTEGER NOT NULL,

    description TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

    event_occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE customer_reliability_events IS 'Customer-side reliability events. Schema day-1; UI Phase 2.';

-- Append-only.
CREATE TRIGGER customer_reliability_events_no_update
    BEFORE UPDATE OR DELETE ON customer_reliability_events
    FOR EACH ROW
    EXECUTE FUNCTION reject_modifications();

CREATE INDEX idx_customer_reliability_events_customer ON customer_reliability_events(customer_id, event_occurred_at DESC);
CREATE INDEX idx_customer_reliability_events_booking ON customer_reliability_events(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_customer_reliability_events_type ON customer_reliability_events(event_type, event_occurred_at DESC);


-- =============================================================================
-- Row-Level Security (RLS) Policies for B4
-- =============================================================================

ALTER TABLE reliability_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reliability_score_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaner_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaner_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaner_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaner_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_reliability_events ENABLE ROW LEVEL SECURITY;

-- Reliability events: cleaner reads own; admin reads all.
-- Customers do NOT read these (private to cleaner + platform).
CREATE POLICY reliability_events_read_self ON reliability_events
    FOR SELECT USING (cleaner_id = current_cleaner_id() OR is_admin());

-- Score snapshots: cleaner reads own.
CREATE POLICY score_snapshots_read_self ON reliability_score_snapshots
    FOR SELECT USING (cleaner_id = current_cleaner_id() OR is_admin());

-- Tier assignments: cleaner reads own; public can read just current tier
-- (which lives on cleaner_profiles, so public access is via that table).
CREATE POLICY tier_assignments_read_self ON tier_assignments
    FOR SELECT USING (cleaner_id = current_cleaner_id() OR is_admin());

-- Cleaner appeals: cleaner reads/writes own.
CREATE POLICY cleaner_appeals_read_self ON cleaner_appeals
    FOR SELECT USING (cleaner_id = current_cleaner_id() OR is_admin());

CREATE POLICY cleaner_appeals_insert_self ON cleaner_appeals
    FOR INSERT WITH CHECK (cleaner_id = current_cleaner_id());

CREATE POLICY cleaner_appeals_update_admin ON cleaner_appeals
    FOR UPDATE USING (is_admin());

-- Badges catalog: publicly readable.
CREATE POLICY badges_read_all ON badges
    FOR SELECT USING (TRUE);

-- Cleaner badges: publicly readable (drives WF 7 cleaner profile).
CREATE POLICY cleaner_badges_read_public ON cleaner_badges
    FOR SELECT USING (TRUE);

-- Specialties catalog: publicly readable.
CREATE POLICY specialties_read_all ON specialties
    FOR SELECT USING (TRUE);

-- Cleaner specialties: publicly readable.
CREATE POLICY cleaner_specialties_read_public ON cleaner_specialties
    FOR SELECT USING (TRUE);

-- Suspensions: cleaner reads own; admin reads all.
-- NOTE: customers should not see suspended cleaners — they get filtered out
-- of the cleaner list at application level via cleaner_profiles.is_active
-- combined with the active suspension check.
CREATE POLICY suspensions_read_self ON cleaner_suspensions
    FOR SELECT USING (cleaner_id = current_cleaner_id() OR is_admin());

-- Customer reliability events: admin only (Phase 2 will add customer self-read).
CREATE POLICY customer_reliability_events_read_admin ON customer_reliability_events
    FOR SELECT USING (is_admin());


-- =============================================================================
-- Notes for B5 and beyond
-- =============================================================================
-- 1. Cleaner_profiles fields populated/updated by B4-driven jobs:
--    - current_score   ← latest reliability_score_snapshots.score
--    - current_tier    ← latest tier_assignments.tier (where ended_at IS NULL)
--    - is_veteran      ← computed from 6+ months at 75+ score history
--    - average_rating  ← from B3 reviews aggregation (nightly)
--    - review_count    ← from B3 reviews aggregation (nightly)
--
-- 2. Score calculation algorithm (run nightly per cleaner):
--    a. Find all reliability_events for cleaner where event_occurred_at is
--       within last 90 days AND is_overturned = FALSE.
--    b. Group by metric_category. For each category:
--       - Sum the point_deltas
--       - Apply the locked weight (on_time 25%, completion 25%, photo 15%,
--         ratings 15%, communication 10%, reschedule 10%)
--    c. Combined weighted score, capped at 0-100.
--    d. Determine band: trusted/good_standing/warning/probation/suspended.
--    e. Insert reliability_score_snapshots row.
--    f. Update cleaner_profiles.current_score and score_updated_at.
--
-- 3. Tier transition algorithm (run nightly):
--    a. For each cleaner, look at the score history of past 14 days.
--    b. If sustained in a different tier band for 14 days, transition.
--    c. Apply veteran cushion: if cleaner has 6+ months at 75+ AND this is
--       their first drop, defer to a 30-day window.
--    d. Insert tier_assignments row, mark previous as ended.
--    e. Update cleaner_profiles.current_tier and tier_set_at.
--
-- 4. Suspension auto-application:
--    - 5 no_show_arrival events in 60 days → insert cleaner_suspensions row
--      with reason_type='no_show_rule', ends_at = NOW() + 7 days.
--    - Score band 'suspended' (<40) → insert with reason_type='manual_admin'
--      until score recovers.
--
-- 5. Specialty endorsement calculation (run nightly):
--    - For each (cleaner, specialty) pair:
--      - Read earning_criteria from specialties table
--      - Query review_traits joined to reviews matching criteria
--      - If threshold met AND no current cleaner_specialties row → insert
--      - If threshold no longer met AND current row exists → set lost_at
--
-- 6. Badge calculation (run nightly):
--    - Same pattern as specialties, but with badge-specific criteria.
--    - ZIP-locked badges check per (cleaner, zip) combination.
-- =============================================================================

-- End of B4
