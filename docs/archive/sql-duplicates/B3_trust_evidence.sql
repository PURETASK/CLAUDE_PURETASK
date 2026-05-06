-- =============================================================================
-- PureTask Database Schema — Batch B3: Trust + Evidence
-- =============================================================================
-- The differentiator features. Reviews, tips, messages, disputes — the trust
-- loop that makes PureTask worth using.
--
-- Design principles applied:
--   1. Reviews are immutable post-submission. Customer cannot edit ratings
--      after they're locked. This protects cleaner score integrity.
--   2. Tips are a separate financial transaction from booking total.
--      "100% goes to the cleaner" per locked design — no platform commission
--      on tips. Captured as separate record for tax + payout tracking.
--   3. Messages auto-purge 4 hours after booking ends per locked privacy
--      policy. Application-level cleanup job processes the retention column.
--   4. Disputes have a state machine like bookings. Resolutions create either
--      mutual agreements or admin decisions, with optional refund linkage.
--   5. Trait chips are normalized to a lookup table so we can version the
--      catalog and add specialty endorsement mappings.
--
-- Wireframes covered by B3:
--   7, 11, 16, 17, 18, 20, 23, 56, 57
--
-- Dependencies: B1 (users, profiles), B2 (bookings).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Enums for B3
-- -----------------------------------------------------------------------------

-- Dispute state machine.
-- LIFECYCLE:
--   open
--     ↓ Cleaner responds with offer
--   cleaner_responded
--     ↓ Customer accepts → resolved
--     ↓ Customer rejects → escalated → mediation → resolved
--     ↓ Cleaner stands by work + customer accepts → resolved
--     ↓ 48hr expires without resolution → mediation
CREATE TYPE dispute_state AS ENUM (
    'open',                -- Customer filed; awaiting cleaner response
    'cleaner_responded',   -- Cleaner offered re-clean / refund / standing by
    'awaiting_customer',   -- Customer reviewing cleaner's response
    'mutually_resolved',   -- Both parties agreed; closed
    'escalated',           -- Customer rejected cleaner offer; needs admin
    'in_mediation',        -- Admin actively reviewing
    'admin_resolved',      -- Admin made decision
    'expired'              -- 48hr window passed without action
);

-- Cleaner's three response options when a dispute is filed (locked design).
CREATE TYPE dispute_response_type AS ENUM (
    'offer_reclean',       -- Free re-clean of missed area
    'offer_partial_refund', -- Partial money back
    'stand_by_work'        -- Cleaner believes work was complete; provides evidence
);

-- How was the dispute ultimately resolved?
CREATE TYPE dispute_resolution_type AS ENUM (
    'mutual_refund',           -- Cleaner offered, customer accepted refund
    'mutual_reclean_completed', -- Cleaner re-cleaned and customer accepted
    'mutual_no_action',        -- Customer accepted cleaner's "stand by work"
    'customer_backed_down',    -- Customer withdrew dispute
    'cleaner_backed_down',     -- Cleaner agreed despite originally standing by
    'admin_refund',            -- Admin issued refund after mediation
    'admin_no_refund',         -- Admin sided with cleaner after mediation
    'admin_partial_refund',    -- Admin issued partial after mediation
    'expired_no_resolution'    -- 48hr passed; defaulted (rules per business policy)
);

-- Who sent the message?
-- 'system' is for booking event messages (e.g., "Booking confirmed").
CREATE TYPE message_sender_role AS ENUM (
    'customer',
    'cleaner',
    'system'
);

-- Message status for delivery/read tracking.
CREATE TYPE message_status AS ENUM (
    'sent',
    'delivered',
    'read'
);

-- Issue category for disputes (locked from WF 16).
CREATE TYPE dispute_issue_category AS ENUM (
    'quality_issue',          -- Areas missed, work not as expected
    'damage_to_property',     -- Something broken, scratched, stained
    'missing_item',           -- Item missing after cleaning
    'time_discrepancy',       -- Hours billed don't match work done
    'safety_or_behavior'      -- Routes to platform support directly
);

-- Customer's desired outcome when filing a dispute (from WF 16).
CREATE TYPE customer_desired_outcome AS ENUM (
    'free_reclean',
    'partial_refund',
    'flexible_let_cleaner_propose'
);


-- =============================================================================
-- Table 19: messages
-- =============================================================================
-- In-app messaging between customer and cleaner about a specific booking.
-- Auto-purged 4 hours after booking ends per locked privacy policy.
-- =============================================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

    -- Who sent it. For system messages, sender_user_id is NULL.
    sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_role message_sender_role NOT NULL,

    -- Message content.
    body TEXT NOT NULL,

    -- Optional photo attachment via Cloudflare R2.
    -- For richer attachments later, this could be a join to a separate
    -- message_attachments table.
    attachment_url TEXT,
    attachment_thumbnail_url TEXT,
    attachment_mime_type TEXT,

    -- Delivery tracking.
    status message_status NOT NULL DEFAULT 'sent',
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,

    -- Retention.
    -- Set on insert: booking.end_at + 4 hours. Cleanup job hard-deletes rows
    -- past this date.
    expires_at TIMESTAMPTZ NOT NULL,

    -- For system messages, this categorizes the event.
    -- e.g., 'booking_confirmed', 'cleaner_on_the_way', 'cleaner_arrived',
    -- 'job_completed', 'eta_update'.
    -- NULL for human-sent messages.
    system_event_type TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- A system message has no human sender.
    -- Human messages must have a sender_user_id.
    CONSTRAINT message_sender_consistency
        CHECK (
            (sender_role = 'system' AND sender_user_id IS NULL AND system_event_type IS NOT NULL)
            OR (sender_role IN ('customer', 'cleaner') AND sender_user_id IS NOT NULL AND system_event_type IS NULL)
        )
);

COMMENT ON TABLE messages IS 'In-app messaging for active bookings. Auto-purged 4 hours after booking ends.';
COMMENT ON COLUMN messages.expires_at IS 'Set to booking.end_at + 4 hours. Cleanup job hard-deletes past records.';
COMMENT ON COLUMN messages.system_event_type IS 'Set for system-generated messages (booking confirmed, ETA, etc.).';

CREATE INDEX idx_messages_booking ON messages(booking_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_user_id, created_at DESC) WHERE sender_user_id IS NOT NULL;
CREATE INDEX idx_messages_unread ON messages(booking_id, read_at) WHERE read_at IS NULL AND sender_role != 'system';
CREATE INDEX idx_messages_expires ON messages(expires_at);


-- =============================================================================
-- Table 20: traits
-- =============================================================================
-- Lookup table for trait chips selected on reviews (e.g., "Thorough", "On time").
-- Normalized so the catalog can be versioned and traits can map to specialty
-- endorsements via separate logic in B4.
-- =============================================================================

CREATE TABLE traits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Stable key for application code references.
    key TEXT NOT NULL UNIQUE,

    -- Customer-facing label.
    display_label TEXT NOT NULL,

    -- For traits that signal positive (vs neutral/negative).
    -- Currently all locked traits are positive. Field allows future expansion
    -- (e.g., "Late" as a critical-feedback option).
    sentiment TEXT NOT NULL DEFAULT 'positive'
        CHECK (sentiment IN ('positive', 'neutral', 'negative')),

    -- Display order on review prompt.
    display_order INTEGER NOT NULL DEFAULT 0,

    -- Active traits show on the review prompt; inactive ones don't but
    -- existing review_traits rows still reference them.
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Maps trait selection patterns to specialty endorsements (per locked
    -- design: repeat positive ratings on a category earn specialty).
    -- Set to the specialty.key in B4 if applicable, else NULL.
    -- Examples:
    --   trait 'pet_friendly' → maps to specialty 'pet_friendly_specialist'
    --   trait 'eco_friendly' → maps to specialty 'eco_friendly_specialist'
    maps_to_specialty_key TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE traits IS 'Lookup of review trait chips. Maps to specialty endorsements via maps_to_specialty_key.';

CREATE TRIGGER traits_set_updated_at
    BEFORE UPDATE ON traits
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_traits_active_order ON traits(is_active, display_order);

-- Seed the locked trait catalog from WF 20.
INSERT INTO traits (key, display_label, sentiment, display_order, maps_to_specialty_key) VALUES
    ('thorough',         'Thorough',          'positive', 1, NULL),
    ('on_time',          'On time',           'positive', 2, NULL),
    ('friendly',         'Friendly',          'positive', 3, NULL),
    ('communicative',    'Communicative',     'positive', 4, NULL),
    ('pet_friendly',     'Pet-friendly',      'positive', 5, 'pet_friendly_specialist'),
    ('detail_oriented',  'Detail-oriented',   'positive', 6, 'deep_clean_specialist'),
    ('professional',     'Professional',      'positive', 7, NULL),
    ('eco_friendly',     'Eco-friendly',      'positive', 8, 'eco_friendly_specialist');


-- =============================================================================
-- Table 21: reviews
-- =============================================================================
-- Customer reviews of cleaners. Immutable post-submission.
-- Drives:
--   - Cleaner profile public reviews (WF 7)
--   - Cleaner reliability score (B4 reliability_events)
--   - Cleaner's denormalized average_rating (B1)
-- =============================================================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,

    -- Denormalized FKs for query performance (avoid joins through bookings).
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE RESTRICT,
    cleaner_id UUID NOT NULL REFERENCES cleaner_profiles(id) ON DELETE RESTRICT,

    -- 1-5 stars.
    stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),

    -- Free-text review (optional per WF 20).
    body TEXT,

    -- Whether to display this review publicly on the cleaner's profile.
    -- Default true; admin can hide if review is abusive.
    is_public BOOLEAN NOT NULL DEFAULT TRUE,

    -- Once submitted, review is locked. Edits would compromise score integrity.
    -- This is a database constraint enforced via trigger below.
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Admin can hide a review (abusive, false, etc.).
    hidden_at TIMESTAMPTZ,
    hidden_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    hidden_reason TEXT,

    -- For audit trail of when something changed (status flags only; review
    -- body and stars never change).
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE reviews IS 'Customer reviews. Body/stars immutable; admin can hide via flags.';
COMMENT ON COLUMN reviews.stars IS 'Immutable 1-5 rating. Cannot be updated post-submission.';
COMMENT ON COLUMN reviews.is_public IS 'Default true; admin sets false to hide from cleaner profile.';

-- Trigger preventing edits to body/stars/booking_id/customer_id/cleaner_id
-- Allows updating: hidden_at, hidden_by_admin_id, hidden_reason, is_public, updated_at
CREATE OR REPLACE FUNCTION reject_review_content_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stars IS DISTINCT FROM OLD.stars
        OR NEW.body IS DISTINCT FROM OLD.body
        OR NEW.booking_id IS DISTINCT FROM OLD.booking_id
        OR NEW.customer_id IS DISTINCT FROM OLD.customer_id
        OR NEW.cleaner_id IS DISTINCT FROM OLD.cleaner_id
        OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
    THEN
        RAISE EXCEPTION 'Review content (stars, body, FK fields) is immutable post-submission';
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_immutable_content
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION reject_review_content_changes();

CREATE INDEX idx_reviews_cleaner_public ON reviews(cleaner_id, submitted_at DESC)
    WHERE is_public = TRUE AND hidden_at IS NULL;
CREATE INDEX idx_reviews_customer ON reviews(customer_id, submitted_at DESC);
CREATE INDEX idx_reviews_booking ON reviews(booking_id);
CREATE INDEX idx_reviews_stars ON reviews(cleaner_id, stars) WHERE is_public = TRUE AND hidden_at IS NULL;
CREATE INDEX idx_reviews_hidden ON reviews(hidden_at) WHERE hidden_at IS NOT NULL;


-- =============================================================================
-- Table 22: review_traits
-- =============================================================================
-- Join table: which traits did the customer select on a review?
-- =============================================================================

CREATE TABLE review_traits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    trait_id UUID NOT NULL REFERENCES traits(id) ON DELETE RESTRICT,

    -- Denormalized: which cleaner this trait was given to. Speeds up
    -- specialty endorsement calculation queries.
    cleaner_id UUID NOT NULL REFERENCES cleaner_profiles(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- A review can have a given trait at most once.
    UNIQUE (review_id, trait_id)
);

COMMENT ON TABLE review_traits IS 'Trait chips selected on reviews. Drives specialty endorsement earning.';

CREATE INDEX idx_review_traits_review ON review_traits(review_id);
CREATE INDEX idx_review_traits_cleaner_trait ON review_traits(cleaner_id, trait_id);


-- =============================================================================
-- Table 23: tips
-- =============================================================================
-- Tips from customers to cleaners. SEPARATE from booking total.
-- 100% goes to cleaner — no platform commission on tips (locked).
-- =============================================================================

CREATE TABLE tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,

    -- Denormalized FKs for payout calculation.
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE RESTRICT,
    cleaner_id UUID NOT NULL REFERENCES cleaner_profiles(id) ON DELETE RESTRICT,

    -- Money fields.
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency CHAR(3) NOT NULL DEFAULT 'USD',

    -- Optional message attached to tip (WF 23).
    customer_note TEXT,

    -- Where the tip came from in the UI.
    -- 'review_flow' = added during initial review submission (WF 20)
    -- 'standalone'  = added later via standalone tip prompt (WF 23)
    -- 'admin'       = admin-added (rare, e.g., correction)
    source TEXT NOT NULL CHECK (source IN ('review_flow', 'standalone', 'admin')),

    -- Stripe charge for this tip — separate from booking charge.
    -- FK to charges (B5) added later.
    charge_id UUID,

    -- Lifecycle.
    -- 'pending'   = created but Stripe charge not yet captured
    -- 'paid'      = captured, will be paid out to cleaner
    -- 'refunded'  = customer disputed and tip was refunded
    -- 'failed'    = Stripe charge failed
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'refunded', 'failed')),

    paid_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,

    -- One tip per booking per source. Customer can tip via review flow AND
    -- standalone, but not twice via the same source.
    -- (Not strictly UNIQUE — admin could add a correction tip for same booking.)

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tips IS 'Tips to cleaners. 100% goes to cleaner; no platform cut.';
COMMENT ON COLUMN tips.source IS 'review_flow / standalone / admin — distinguishes tip origin.';
COMMENT ON COLUMN tips.status IS 'pending → paid → optionally refunded.';

CREATE TRIGGER tips_set_updated_at
    BEFORE UPDATE ON tips
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_tips_booking ON tips(booking_id);
CREATE INDEX idx_tips_cleaner_paid ON tips(cleaner_id, paid_at DESC) WHERE status = 'paid';
CREATE INDEX idx_tips_customer ON tips(customer_id, created_at DESC);
CREATE INDEX idx_tips_status ON tips(status, created_at);


-- =============================================================================
-- Table 24: disputes
-- =============================================================================
-- Customer-filed disputes about specific bookings.
-- Has its own state machine and resolution flow.
-- =============================================================================

CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,

    -- Denormalized for query performance.
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE RESTRICT,
    cleaner_id UUID NOT NULL REFERENCES cleaner_profiles(id) ON DELETE RESTRICT,

    -- The category and outcome customer is asking for (from WF 16).
    issue_category dispute_issue_category NOT NULL,
    customer_desired_outcome customer_desired_outcome NOT NULL,

    -- Customer's initial description (WF 16 description field).
    customer_description TEXT NOT NULL,

    -- Current state.
    state dispute_state NOT NULL DEFAULT 'open',

    -- Cleaner's response (when they respond per WF 17).
    cleaner_response_type dispute_response_type,
    cleaner_response_message TEXT,
    cleaner_response_amount_cents INTEGER,  -- Set when offer_partial_refund
    cleaner_responded_at TIMESTAMPTZ,

    -- Window timing.
    -- Cleaner has 48 hours from filing to respond.
    cleaner_response_due_at TIMESTAMPTZ NOT NULL,

    -- Final resolution.
    resolved_at TIMESTAMPTZ,
    resolution_type dispute_resolution_type,
    resolution_amount_cents INTEGER,         -- Refund issued, if any
    resolution_notes TEXT,
    resolved_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Refund linkage (FK to B5.refunds; declared after refunds table exists).
    refund_id UUID,

    -- Did the customer or cleaner escalate? Tracked for analytics on dispute
    -- patterns.
    escalated_at TIMESTAMPTZ,
    escalated_by_role message_sender_role,  -- 'customer' or 'cleaner'

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Sanity: refund amount only set when there's a refund-type resolution.
    CONSTRAINT dispute_refund_amount_consistency
        CHECK (
            resolution_amount_cents IS NULL
            OR resolution_type IN ('mutual_refund', 'admin_refund', 'admin_partial_refund')
        )
);

COMMENT ON TABLE disputes IS 'Customer disputes about specific bookings. State machine with admin escalation path.';
COMMENT ON COLUMN disputes.cleaner_response_due_at IS '48 hours after filing. Past this, dispute auto-escalates.';

CREATE TRIGGER disputes_set_updated_at
    BEFORE UPDATE ON disputes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_disputes_state ON disputes(state, created_at DESC);
CREATE INDEX idx_disputes_customer ON disputes(customer_id, created_at DESC);
CREATE INDEX idx_disputes_cleaner ON disputes(cleaner_id, created_at DESC);
CREATE INDEX idx_disputes_response_due ON disputes(cleaner_response_due_at)
    WHERE state IN ('open', 'cleaner_responded');
CREATE INDEX idx_disputes_resolved ON disputes(resolved_at DESC) WHERE resolved_at IS NOT NULL;
CREATE INDEX idx_disputes_pending_admin ON disputes(state)
    WHERE state IN ('escalated', 'in_mediation');


-- =============================================================================
-- Table 25: dispute_messages
-- =============================================================================
-- Threaded conversation within a dispute.
-- Different from `messages` (B3.19) which is general booking messaging —
-- dispute_messages persists longer (no 4-hour expiry) and includes admin
-- mediation messages.
-- =============================================================================

CREATE TABLE dispute_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,

    -- Sender. For admin messages during mediation, sender_role = 'admin'.
    sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'cleaner', 'admin')),

    body TEXT NOT NULL,

    -- Optional photo attachment, stored separately in booking_photos with
    -- purpose = dispute_evidence_customer or dispute_evidence_cleaner.
    -- This array references those photo IDs.
    photo_ids UUID[],

    -- Did this message change the dispute state?
    -- e.g., cleaner posting their response transitions state from 'open' to
    -- 'cleaner_responded'. Documented for audit but state is on disputes table.
    triggered_state_change BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE dispute_messages IS 'Conversation thread for a dispute, including admin mediation messages.';
COMMENT ON COLUMN dispute_messages.photo_ids IS 'References booking_photos with dispute_evidence_* purpose.';

-- Append-only: dispute messages cannot be edited or deleted (audit integrity).
CREATE TRIGGER dispute_messages_no_update
    BEFORE UPDATE OR DELETE ON dispute_messages
    FOR EACH ROW
    EXECUTE FUNCTION reject_modifications();

CREATE INDEX idx_dispute_messages_dispute ON dispute_messages(dispute_id, created_at);
CREATE INDEX idx_dispute_messages_sender ON dispute_messages(sender_user_id, created_at DESC);


-- =============================================================================
-- Table 26: dispute_resolutions
-- =============================================================================
-- One row per resolution attempt on a dispute. The disputes.state column
-- tracks current state; this table tracks the audit trail of resolution
-- attempts (which is needed because some disputes go through multiple
-- attempts — cleaner offers, customer rejects, cleaner offers again).
-- =============================================================================

CREATE TABLE dispute_resolutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,

    -- The type of resolution attempted.
    resolution_type dispute_resolution_type NOT NULL,

    -- Was this resolution accepted or did it fail and lead to escalation?
    is_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,

    -- Money movement, if any.
    refund_amount_cents INTEGER,
    refund_id UUID,  -- FK to refunds (B5)

    -- Who proposed this resolution?
    proposed_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    proposed_by_role TEXT NOT NULL CHECK (proposed_by_role IN ('customer', 'cleaner', 'admin')),

    -- Detailed notes from the proposer.
    proposal_notes TEXT,

    -- Admin notes if this was an admin resolution.
    admin_notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT resolution_acceptance_dates
        CHECK (
            (is_accepted = TRUE AND accepted_at IS NOT NULL AND rejected_at IS NULL)
            OR (is_accepted = FALSE AND rejected_at IS NOT NULL AND accepted_at IS NULL)
            OR (is_accepted = FALSE AND rejected_at IS NULL AND accepted_at IS NULL)
            -- Last case: pending, neither accepted nor rejected yet
        )
);

COMMENT ON TABLE dispute_resolutions IS 'Resolution attempts within a dispute. Multiple per dispute possible.';
COMMENT ON COLUMN dispute_resolutions.is_accepted IS 'Whether the other party accepted this resolution.';

CREATE INDEX idx_dispute_resolutions_dispute ON dispute_resolutions(dispute_id, created_at);
CREATE INDEX idx_dispute_resolutions_proposed_by ON dispute_resolutions(proposed_by_user_id);
CREATE INDEX idx_dispute_resolutions_pending ON dispute_resolutions(dispute_id)
    WHERE is_accepted = FALSE AND rejected_at IS NULL;


-- =============================================================================
-- Row-Level Security (RLS) Policies for B3
-- =============================================================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_resolutions ENABLE ROW LEVEL SECURITY;

-- Messages: only booking parties.
CREATE POLICY messages_read_party ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = messages.booking_id
            AND (b.customer_id = current_customer_id()
                 OR b.cleaner_id = current_cleaner_id()
                 OR is_admin())
        )
    );

CREATE POLICY messages_insert_party ON messages
    FOR INSERT WITH CHECK (
        sender_user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = messages.booking_id
            AND (b.customer_id = current_customer_id()
                 OR b.cleaner_id = current_cleaner_id())
        )
    );

-- Traits: publicly readable.
CREATE POLICY traits_read_all ON traits
    FOR SELECT USING (TRUE);

-- Reviews: publicly readable when public; party + admin always.
CREATE POLICY reviews_read_public ON reviews
    FOR SELECT USING (
        (is_public = TRUE AND hidden_at IS NULL)
        OR customer_id = current_customer_id()
        OR cleaner_id = current_cleaner_id()
        OR is_admin()
    );

CREATE POLICY reviews_insert_customer ON reviews
    FOR INSERT WITH CHECK (
        customer_id = current_customer_id()
    );

-- Reviews can only be updated to flag/hide — no content changes (enforced by trigger).
CREATE POLICY reviews_update_admin ON reviews
    FOR UPDATE USING (is_admin());

-- Review traits: read with the review.
CREATE POLICY review_traits_read ON review_traits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM reviews r
            WHERE r.id = review_traits.review_id
            AND ((r.is_public = TRUE AND r.hidden_at IS NULL)
                 OR r.customer_id = current_customer_id()
                 OR r.cleaner_id = current_cleaner_id()
                 OR is_admin())
        )
    );

CREATE POLICY review_traits_insert ON review_traits
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM reviews r
            WHERE r.id = review_traits.review_id
            AND r.customer_id = current_customer_id()
        )
    );

-- Tips: customer reads own; cleaner reads own; admin reads all.
CREATE POLICY tips_read_party ON tips
    FOR SELECT USING (
        customer_id = current_customer_id()
        OR cleaner_id = current_cleaner_id()
        OR is_admin()
    );

CREATE POLICY tips_insert_customer ON tips
    FOR INSERT WITH CHECK (
        customer_id = current_customer_id()
    );

-- Disputes: party + admin.
CREATE POLICY disputes_read_party ON disputes
    FOR SELECT USING (
        customer_id = current_customer_id()
        OR cleaner_id = current_cleaner_id()
        OR is_admin()
    );

CREATE POLICY disputes_insert_customer ON disputes
    FOR INSERT WITH CHECK (
        customer_id = current_customer_id()
        AND EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = disputes.booking_id
            AND b.customer_id = current_customer_id()
            AND b.dispute_window_ends_at > NOW()
            AND b.state IN ('approved', 'auto_approved', 'paid')
        )
    );

CREATE POLICY disputes_update_party ON disputes
    FOR UPDATE USING (
        customer_id = current_customer_id()
        OR cleaner_id = current_cleaner_id()
        OR is_admin()
    );

-- Dispute messages: read by parties (including admin during mediation).
CREATE POLICY dispute_messages_read_party ON dispute_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM disputes d
            WHERE d.id = dispute_messages.dispute_id
            AND (d.customer_id = current_customer_id()
                 OR d.cleaner_id = current_cleaner_id()
                 OR is_admin())
        )
    );

CREATE POLICY dispute_messages_insert_party ON dispute_messages
    FOR INSERT WITH CHECK (
        sender_user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM disputes d
            WHERE d.id = dispute_messages.dispute_id
            AND (d.customer_id = current_customer_id()
                 OR d.cleaner_id = current_cleaner_id()
                 OR is_admin())
        )
    );

-- Dispute resolutions: read by parties.
CREATE POLICY dispute_resolutions_read_party ON dispute_resolutions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM disputes d
            WHERE d.id = dispute_resolutions.dispute_id
            AND (d.customer_id = current_customer_id()
                 OR d.cleaner_id = current_cleaner_id()
                 OR is_admin())
        )
    );

CREATE POLICY dispute_resolutions_insert_party ON dispute_resolutions
    FOR INSERT WITH CHECK (
        proposed_by_user_id = auth.uid()
    );


-- =============================================================================
-- Notes for B4 and beyond
-- =============================================================================
-- 1. Reliability events (B4) will be created when reviews are submitted:
--    - 5-star review → +1 reliability_event with category 'ratings'
--    - <3-star review → -2 reliability_event with category 'ratings'
--    - Customer rating threshold of 3.8 average drives suspension logic.
--
-- 2. Specialty endorsements (B4) calculate from review_traits:
--    - 5+ reviews with 'pet_friendly' trait → 'pet_friendly_specialist' badge.
--    - The maps_to_specialty_key column on traits drives this.
--
-- 3. Refunds (B5) will FK to disputes via dispute_resolutions.refund_id and
--    disputes.refund_id. The FK constraints on those columns will be added
--    after refunds table exists in B5.
--
-- 4. Charges (B5) will FK to tips via tips.charge_id. Same FK addition pattern.
--
-- 5. Admin actions (B6) will reference disputes when admin makes mediation
--    decisions. dispute_messages.sender_role = 'admin' will be cross-validated.
--
-- 6. Cleaner_profiles.average_rating and review_count denormalization (B1)
--    is updated by nightly batch from reviews:
--      UPDATE cleaner_profiles SET
--        average_rating = (SELECT AVG(stars) FROM reviews WHERE cleaner_id = X
--                          AND is_public = TRUE AND hidden_at IS NULL),
--        review_count = (SELECT COUNT(*) FROM reviews WHERE cleaner_id = X
--                        AND is_public = TRUE AND hidden_at IS NULL);
-- =============================================================================

-- End of B3
