-- =============================================================================
-- PureTask Database Schema — Batch B5: Money
-- =============================================================================
-- Stripe Connect mirror. Charges, refunds, payouts, commissions, insurance.
--
-- Design principles applied:
--   1. STRIPE IS SOURCE OF TRUTH for actual money. PostgreSQL stores Stripe
--      reference IDs (charge_id, payout_id, etc.) and a denormalized snapshot
--      of state. We never trust our database alone for "did the customer get
--      charged?" — we trust Stripe and update our mirror via webhooks.
--   2. CHARGES use idempotency keys to prevent double-charging on retry.
--   3. COMMISSION_RECORDS denormalize tier and rate at booking time so
--      historical accuracy is preserved even if cleaner's tier changes
--      (audit Issue 1.3).
--   4. PAYOUT_LINE_ITEMS.payout_id is nullable until the Friday batch
--      assigns them to a payout (audit Issue 3.2).
--   5. ALL MONEY stored as INTEGER cents. Currency column for future-proofing.
--   6. SSN/EIN stored encrypted at application layer; column type is BYTEA.
--      Encryption key managed via environment variable; rotation supported
--      via key version column.
--   7. STRIPE WEBHOOK EVENTS table provides idempotency for webhook handlers.
--
-- Wireframes covered by B5:
--   6, 10, 15, 26, 28, 30, 32 a/b/c, 33, 62, 63
--
-- Dependencies: B1 (users, profiles), B2 (bookings), B3 (tips, disputes).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Enums for B5
-- -----------------------------------------------------------------------------

-- Payment method types we accept.
CREATE TYPE payment_method_type AS ENUM (
    'card',           -- Credit / debit / prepaid
    'bank_account'    -- ACH (Phase 2; not in MVP UI but schema-ready)
);

-- Charge state mirrors Stripe's payment_intent / charge state.
CREATE TYPE charge_state AS ENUM (
    'pending',                  -- Created, not yet attempted
    'requires_action',          -- 3D Secure / SCA challenge needed
    'authorized',               -- Auth succeeded, not yet captured
    'captured',                 -- Money committed
    'failed',                   -- Auth failed (declined, etc.)
    'cancelled',                -- Cancelled before capture
    'refunded',                 -- Fully refunded
    'partially_refunded',       -- Partial refund applied
    'disputed_by_card_holder',  -- Stripe dispute (chargeback) - distinct from our app disputes
    'disputed_won',             -- Card-network dispute won
    'disputed_lost'             -- Card-network dispute lost
);

-- Refund reason — categorizes WHY a refund was issued.
CREATE TYPE refund_reason_type AS ENUM (
    'dispute_resolution',       -- From a B3 dispute resolution
    'cancellation_penalty',     -- Customer cancelled within penalty window (partial)
    'cancellation_full',        -- Free cancellation (48hr+ out)
    'goodwill',                 -- Admin discretion, customer satisfaction
    'duplicate_charge',         -- Duplicate captured by mistake
    'fraud',                    -- Fraudulent charge
    'service_unavailable',      -- Cleaner couldn't fulfill
    'other'
);

-- Payout state mirrors Stripe Connect payout state.
CREATE TYPE payout_state AS ENUM (
    'pending',          -- Created, awaiting batch send
    'in_transit',       -- Sent to bank, in flight
    'paid',             -- Confirmed by bank
    'failed',           -- Bank rejected
    'cancelled'         -- Admin cancelled before send
);

-- Insurance policy lifecycle.
CREATE TYPE insurance_state AS ENUM (
    'uploaded',         -- COI uploaded, not yet reviewed
    'under_review',     -- Admin reviewing
    'verified',         -- Approved; badge active
    'rejected',         -- Verification failed
    'expired',          -- Past expiration date
    'replaced'          -- Superseded by newer upload
);

-- Stripe Connect onboarding state for cleaners.
CREATE TYPE stripe_connect_state AS ENUM (
    'not_started',
    'in_progress',
    'pending_verification',
    'active',
    'restricted',           -- Stripe restricted account (compliance issue)
    'disabled'              -- Account disabled
);


-- =============================================================================
-- Table 37: payment_methods
-- =============================================================================
-- Customer payment methods. Mirrors Stripe; we never store actual card data.
-- =============================================================================

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,

    -- Stripe references — these are the source of truth.
    stripe_payment_method_id TEXT NOT NULL UNIQUE,
    stripe_customer_id TEXT NOT NULL,

    -- Type and display details.
    method_type payment_method_type NOT NULL DEFAULT 'card',

    -- Card details (denormalized from Stripe for display).
    -- Full PAN never stored — only last 4 + brand for the user-facing UI.
    card_brand TEXT,                  -- e.g., 'visa', 'mastercard', 'amex'
    card_last_four CHAR(4),
    card_exp_month INTEGER CHECK (card_exp_month BETWEEN 1 AND 12),
    card_exp_year INTEGER,
    card_funding TEXT CHECK (card_funding IN ('credit', 'debit', 'prepaid', 'unknown')),

    -- Bank details (Phase 2 ACH support).
    bank_name TEXT,
    bank_account_last_four CHAR(4),

    -- Default for customer? Only one row per customer should be is_default = true.
    is_default BOOLEAN NOT NULL DEFAULT FALSE,

    -- Soft delete: customer removes a card but charges referencing it still exist.
    deleted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE payment_methods IS 'Customer payment methods. Stripe is source of truth; we mirror display details.';
COMMENT ON COLUMN payment_methods.card_last_four IS 'Display only. Full card data is in Stripe, never our database.';

CREATE TRIGGER payment_methods_set_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- Only one default payment method per customer.
CREATE UNIQUE INDEX idx_payment_methods_one_default ON payment_methods(customer_id)
    WHERE is_default = TRUE AND deleted_at IS NULL;

CREATE INDEX idx_payment_methods_customer ON payment_methods(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payment_methods_stripe ON payment_methods(stripe_payment_method_id);

-- Now add the deferred FK on customer_profiles for default payment method
ALTER TABLE customer_profiles
    ADD CONSTRAINT fk_customer_default_payment_method
    FOREIGN KEY (default_payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL;


-- =============================================================================
-- Table 38: charges
-- =============================================================================
-- Every charge attempt. Auth and capture tracked together.
-- A booking creates an auth at booking time; capture happens at approval.
-- =============================================================================

CREATE TABLE charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What this charge is for.
    -- A charge is for either a booking or a tip.
    booking_id UUID REFERENCES bookings(id) ON DELETE RESTRICT,
    tip_id UUID REFERENCES tips(id) ON DELETE RESTRICT,

    -- Customer paying.
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE RESTRICT,

    -- Payment method used.
    payment_method_id UUID NOT NULL REFERENCES payment_methods(id) ON DELETE RESTRICT,

    -- Idempotency key — application code generates this and passes to Stripe
    -- to prevent double-charging on network retries.
    idempotency_key TEXT NOT NULL UNIQUE,

    -- Stripe references.
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_charge_id TEXT UNIQUE,

    -- Amounts.
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    application_fee_cents INTEGER NOT NULL DEFAULT 0,  -- Platform's take

    -- State.
    state charge_state NOT NULL DEFAULT 'pending',

    -- Lifecycle timestamps.
    authorized_at TIMESTAMPTZ,
    captured_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failed_reason TEXT,

    -- Refund tracking (denormalized for fast lookup).
    total_refunded_cents INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- A charge is for exactly one of: a booking, or a tip.
    CONSTRAINT charge_target_consistency
        CHECK (
            (booking_id IS NOT NULL AND tip_id IS NULL)
            OR (booking_id IS NULL AND tip_id IS NOT NULL)
        ),

    -- Refunded amount cannot exceed charge amount.
    CONSTRAINT refund_within_charge
        CHECK (total_refunded_cents <= amount_cents)
);

COMMENT ON TABLE charges IS 'Customer charges. Stripe-mirrored. Idempotency key prevents double-charging.';
COMMENT ON COLUMN charges.idempotency_key IS 'App-generated, passed to Stripe; prevents duplicate charges on retry.';
COMMENT ON COLUMN charges.application_fee_cents IS 'Platform fee + commission portion taken from booking charges.';

CREATE TRIGGER charges_set_updated_at
    BEFORE UPDATE ON charges
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- Now add the deferred FK on tips
ALTER TABLE tips
    ADD CONSTRAINT fk_tips_charge
    FOREIGN KEY (charge_id) REFERENCES charges(id) ON DELETE SET NULL;

CREATE INDEX idx_charges_booking ON charges(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_charges_tip ON charges(tip_id) WHERE tip_id IS NOT NULL;
CREATE INDEX idx_charges_customer ON charges(customer_id, created_at DESC);
CREATE INDEX idx_charges_state ON charges(state, created_at DESC);
CREATE INDEX idx_charges_stripe_intent ON charges(stripe_payment_intent_id);
CREATE INDEX idx_charges_stripe_charge ON charges(stripe_charge_id);
CREATE INDEX idx_charges_idempotency ON charges(idempotency_key);
CREATE INDEX idx_charges_authorized_uncaptured ON charges(authorized_at)
    WHERE state = 'authorized';


-- =============================================================================
-- Table 39: refunds
-- =============================================================================
-- Refund records. Separate from disputes — refunds can exist without disputes
-- (cancellation penalties, goodwill, duplicate charges).
-- =============================================================================

CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The charge being refunded.
    charge_id UUID NOT NULL REFERENCES charges(id) ON DELETE RESTRICT,

    -- Optional dispute that drove this refund.
    dispute_id UUID REFERENCES disputes(id) ON DELETE SET NULL,

    -- Refund details.
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency CHAR(3) NOT NULL DEFAULT 'USD',

    reason_type refund_reason_type NOT NULL,
    reason_notes TEXT,

    -- Who initiated.
    initiated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    initiated_by_system TEXT,           -- e.g., 'cancellation_job', 'auto_refund'

    -- Stripe reference.
    stripe_refund_id TEXT UNIQUE,

    -- Lifecycle.
    state TEXT NOT NULL DEFAULT 'pending'
        CHECK (state IN ('pending', 'succeeded', 'failed', 'cancelled')),
    succeeded_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failed_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT refund_initiated_by_required
        CHECK (initiated_by_user_id IS NOT NULL OR initiated_by_system IS NOT NULL)
);

COMMENT ON TABLE refunds IS 'Refunds. May or may not be tied to disputes.';
COMMENT ON COLUMN refunds.dispute_id IS 'NULL if refund is unrelated to a dispute (cancellations, goodwill, etc.).';

CREATE TRIGGER refunds_set_updated_at
    BEFORE UPDATE ON refunds
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- Now add the deferred FKs on disputes and dispute_resolutions
ALTER TABLE disputes
    ADD CONSTRAINT fk_disputes_refund
    FOREIGN KEY (refund_id) REFERENCES refunds(id) ON DELETE SET NULL;

ALTER TABLE dispute_resolutions
    ADD CONSTRAINT fk_dispute_resolutions_refund
    FOREIGN KEY (refund_id) REFERENCES refunds(id) ON DELETE SET NULL;

CREATE INDEX idx_refunds_charge ON refunds(charge_id);
CREATE INDEX idx_refunds_dispute ON refunds(dispute_id) WHERE dispute_id IS NOT NULL;
CREATE INDEX idx_refunds_state ON refunds(state, created_at DESC);
CREATE INDEX idx_refunds_stripe ON refunds(stripe_refund_id);


-- =============================================================================
-- Table 40: commission_records
-- =============================================================================
-- Per-booking commission record. Captures tier and rate AT BOOKING TIME so
-- historical reports stay accurate even if cleaner's tier changes later.
-- =============================================================================

CREATE TABLE commission_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,

    cleaner_id UUID NOT NULL REFERENCES cleaner_profiles(id) ON DELETE RESTRICT,

    -- DENORMALIZED at booking creation. These columns are immutable after write.
    tier_at_booking tier_name NOT NULL,
    commission_rate DECIMAL(4,3) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 1),

    -- Calculation snapshot.
    cleaner_subtotal_cents INTEGER NOT NULL CHECK (cleaner_subtotal_cents >= 0),
    commission_cents INTEGER NOT NULL CHECK (commission_cents >= 0),
    cleaner_payout_cents INTEGER NOT NULL CHECK (cleaner_payout_cents >= 0),
    platform_fee_cents INTEGER NOT NULL CHECK (platform_fee_cents >= 0),

    -- Reference to the originating tier_assignment (for audit trail).
    -- This may be null if the cleaner's tier history was reset, but the
    -- denormalized tier_at_booking and commission_rate above are still accurate.
    tier_assignment_id UUID REFERENCES tier_assignments(id) ON DELETE SET NULL,

    -- Currency for future-proofing.
    currency CHAR(3) NOT NULL DEFAULT 'USD',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Math sanity: subtotal = commission + payout
    CONSTRAINT commission_math_consistent
        CHECK (cleaner_subtotal_cents = commission_cents + cleaner_payout_cents)
);

COMMENT ON TABLE commission_records IS 'Per-booking commission. Denormalized for historical immutability.';
COMMENT ON COLUMN commission_records.tier_at_booking IS 'Captured at booking; never updated. Stable record of historical tier.';
COMMENT ON COLUMN commission_records.commission_rate IS 'Captured at booking; e.g., 0.10 for All-Star Expert.';

-- Commission records are immutable post-creation.
CREATE OR REPLACE FUNCTION commission_records_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Cannot delete commission_records (audit integrity)';
    END IF;
    -- All fields immutable.
    RAISE EXCEPTION 'commission_records is immutable post-creation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER commission_records_immutable
    BEFORE UPDATE OR DELETE ON commission_records
    FOR EACH ROW
    EXECUTE FUNCTION commission_records_immutability();

CREATE INDEX idx_commission_records_cleaner ON commission_records(cleaner_id, created_at DESC);
CREATE INDEX idx_commission_records_booking ON commission_records(booking_id);
CREATE INDEX idx_commission_records_tier ON commission_records(tier_at_booking, created_at DESC);


-- =============================================================================
-- Table 41: payouts
-- =============================================================================
-- Cleaner payout records. Mirrors Stripe Connect payouts.
-- Weekly batch on Fridays at noon PT (locked).
-- =============================================================================

CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cleaner_id UUID NOT NULL REFERENCES cleaner_profiles(id) ON DELETE RESTRICT,

    -- Stripe references.
    stripe_payout_id TEXT UNIQUE,
    stripe_account_id TEXT NOT NULL,

    -- Total amount paid out.
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency CHAR(3) NOT NULL DEFAULT 'USD',

    -- Is this an instant payout (5% fee) or weekly batch (free)?
    is_instant BOOLEAN NOT NULL DEFAULT FALSE,
    instant_fee_cents INTEGER NOT NULL DEFAULT 0,

    -- Net to cleaner (after instant fee, if any).
    net_amount_cents INTEGER NOT NULL CHECK (net_amount_cents > 0),

    -- Window of work this payout covers (for weekly batch).
    -- Null for instant payouts (which cover a single booking).
    period_start_at TIMESTAMPTZ,
    period_end_at TIMESTAMPTZ,

    -- State.
    state payout_state NOT NULL DEFAULT 'pending',
    initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    in_transit_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failed_reason TEXT,

    -- Expected arrival per Stripe.
    estimated_arrival_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Math sanity
    CONSTRAINT payout_math_consistent
        CHECK (net_amount_cents = amount_cents - instant_fee_cents)
);

COMMENT ON TABLE payouts IS 'Cleaner payouts. Weekly batched (free) or instant (5% fee).';
COMMENT ON COLUMN payouts.is_instant IS 'true = instant payout (5% fee); false = weekly Friday batch.';

CREATE TRIGGER payouts_set_updated_at
    BEFORE UPDATE ON payouts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_payouts_cleaner ON payouts(cleaner_id, created_at DESC);
CREATE INDEX idx_payouts_state ON payouts(state, created_at DESC);
CREATE INDEX idx_payouts_stripe ON payouts(stripe_payout_id);
CREATE INDEX idx_payouts_period ON payouts(cleaner_id, period_start_at, period_end_at);


-- =============================================================================
-- Table 42: payout_line_items
-- =============================================================================
-- What's in a payout. Each completed booking + tip becomes a line item.
-- payout_id is NULLABLE — line items are created at booking approval, then
-- assigned to a payout when the Friday batch runs (audit Issue 3.2).
-- =============================================================================

CREATE TABLE payout_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- NULL until Friday batch assigns this line to a payout.
    payout_id UUID REFERENCES payouts(id) ON DELETE SET NULL,

    -- DENORMALIZED for batch grouping (audit Issue 3.2).
    cleaner_id UUID NOT NULL REFERENCES cleaner_profiles(id) ON DELETE RESTRICT,

    -- What this line item is for.
    booking_id UUID REFERENCES bookings(id) ON DELETE RESTRICT,
    tip_id UUID REFERENCES tips(id) ON DELETE RESTRICT,

    -- The amount for this line item.
    -- For booking lines: cleaner_payout_cents from commission_record.
    -- For tip lines: full tip amount (100% to cleaner).
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency CHAR(3) NOT NULL DEFAULT 'USD',

    -- Display description for cleaner's earnings page (WF 6).
    -- e.g., "Standard clean Sat Oct 5", "Tip from Jordan B."
    description TEXT NOT NULL,

    -- When this line was created (booking approval time).
    earned_at TIMESTAMPTZ NOT NULL,

    -- For instant payouts, the line is paid immediately upon approval.
    -- For batch payouts, line waits for Friday.
    is_instant BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Each line item is for exactly one of: a booking, or a tip.
    CONSTRAINT payout_line_target_consistency
        CHECK (
            (booking_id IS NOT NULL AND tip_id IS NULL)
            OR (booking_id IS NULL AND tip_id IS NOT NULL)
        )
);

COMMENT ON TABLE payout_line_items IS 'Earnings entries for cleaners. Aggregated into payouts by Friday batch.';
COMMENT ON COLUMN payout_line_items.payout_id IS 'NULL until assigned to a payout by Friday batch job.';
COMMENT ON COLUMN payout_line_items.cleaner_id IS 'Denormalized for efficient batch grouping.';

CREATE INDEX idx_payout_line_items_unassigned ON payout_line_items(cleaner_id, earned_at)
    WHERE payout_id IS NULL;
CREATE INDEX idx_payout_line_items_payout ON payout_line_items(payout_id) WHERE payout_id IS NOT NULL;
CREATE INDEX idx_payout_line_items_cleaner ON payout_line_items(cleaner_id, earned_at DESC);
CREATE INDEX idx_payout_line_items_booking ON payout_line_items(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_payout_line_items_tip ON payout_line_items(tip_id) WHERE tip_id IS NOT NULL;


-- =============================================================================
-- Table 43: insurance_policies
-- =============================================================================
-- Cleaner-uploaded insurance certificates with verification state.
-- Drives the Insurance Verified badge.
-- =============================================================================

CREATE TABLE insurance_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cleaner_id UUID NOT NULL REFERENCES cleaner_profiles(id) ON DELETE CASCADE,

    -- Policy details (captured during verification).
    insurance_provider TEXT,
    policy_number TEXT,
    coverage_amount_cents BIGINT,        -- E.g., $300,000 = 30000000

    -- Coverage period.
    effective_from DATE,
    expires_at DATE,

    -- Document storage (Cloudflare R2).
    document_storage_key TEXT NOT NULL,
    document_uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Lifecycle state.
    state insurance_state NOT NULL DEFAULT 'uploaded',

    -- Review tracking.
    reviewed_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,

    -- For renewal reminders (30 days before expiration per locked WF 32).
    renewal_reminder_sent_at TIMESTAMPTZ,

    -- When state transitions happened.
    verified_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    replaced_at TIMESTAMPTZ,
    replaced_by_policy_id UUID REFERENCES insurance_policies(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Sanity: $100k minimum coverage for verified policies (locked).
    CONSTRAINT insurance_minimum_coverage
        CHECK (
            state != 'verified'
            OR coverage_amount_cents >= 10000000  -- $100,000 in cents
        )
);

COMMENT ON TABLE insurance_policies IS 'Cleaner-uploaded COIs with verification state. Drives Insurance Verified badge.';
COMMENT ON COLUMN insurance_policies.coverage_amount_cents IS 'In cents. Minimum $100,000 (10,000,000 cents) for verified.';

CREATE TRIGGER insurance_policies_set_updated_at
    BEFORE UPDATE ON insurance_policies
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_insurance_cleaner ON insurance_policies(cleaner_id, state);
CREATE INDEX idx_insurance_state ON insurance_policies(state, created_at DESC);
CREATE INDEX idx_insurance_expiring ON insurance_policies(expires_at)
    WHERE state = 'verified' AND expires_at IS NOT NULL;
CREATE INDEX idx_insurance_pending_review ON insurance_policies(uploaded_at)
    WHERE state IN ('uploaded', 'under_review');


-- =============================================================================
-- Table 44: stripe_webhook_events
-- =============================================================================
-- Idempotency table for Stripe webhook processing.
-- Each Stripe event_id processed exactly once.
-- =============================================================================

CREATE TABLE stripe_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The Stripe event ID (e.g., "evt_1234..."). UNIQUE prevents reprocessing.
    stripe_event_id TEXT NOT NULL UNIQUE,

    -- Event type (e.g., 'payment_intent.succeeded', 'payout.paid').
    event_type TEXT NOT NULL,

    -- Stripe API version this event was received under.
    stripe_api_version TEXT,

    -- Full event payload — useful for debugging and replay.
    payload JSONB NOT NULL,

    -- Processing state.
    -- 'received'  = stored, not yet processed
    -- 'processed' = handler completed successfully
    -- 'failed'    = handler errored; manual review needed
    -- 'ignored'   = recognized but no action needed (e.g., test mode events)
    processing_state TEXT NOT NULL DEFAULT 'received'
        CHECK (processing_state IN ('received', 'processed', 'failed', 'ignored')),

    -- Processing timestamps.
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processing_error TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE stripe_webhook_events IS 'Idempotent record of all Stripe webhook events received.';
COMMENT ON COLUMN stripe_webhook_events.stripe_event_id IS 'UNIQUE — prevents duplicate processing on retry.';

CREATE INDEX idx_stripe_events_pending ON stripe_webhook_events(received_at)
    WHERE processing_state IN ('received', 'failed');
CREATE INDEX idx_stripe_events_type ON stripe_webhook_events(event_type, received_at DESC);


-- =============================================================================
-- Row-Level Security (RLS) Policies for B5
-- =============================================================================

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Payment methods: customer reads/writes own.
CREATE POLICY payment_methods_read_self ON payment_methods
    FOR SELECT USING (
        customer_id = current_customer_id() OR is_admin()
    );

CREATE POLICY payment_methods_write_self ON payment_methods
    FOR ALL USING (
        customer_id = current_customer_id() OR is_admin()
    );

-- Charges: customer reads own; admin reads all.
-- Cleaners do NOT see customer charges (only their own commission/payout data).
CREATE POLICY charges_read_customer ON charges
    FOR SELECT USING (
        customer_id = current_customer_id() OR is_admin()
    );

-- Refunds: customer reads own (via charge); admin reads all.
CREATE POLICY refunds_read_party ON refunds
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM charges c
            WHERE c.id = refunds.charge_id
            AND (c.customer_id = current_customer_id() OR is_admin())
        )
    );

-- Commission records: cleaner reads own; admin reads all.
CREATE POLICY commission_records_read_self ON commission_records
    FOR SELECT USING (
        cleaner_id = current_cleaner_id() OR is_admin()
    );

-- Payouts: cleaner reads own; admin reads all.
CREATE POLICY payouts_read_self ON payouts
    FOR SELECT USING (
        cleaner_id = current_cleaner_id() OR is_admin()
    );

-- Payout line items: cleaner reads own; admin reads all.
CREATE POLICY payout_line_items_read_self ON payout_line_items
    FOR SELECT USING (
        cleaner_id = current_cleaner_id() OR is_admin()
    );

-- Insurance: cleaner reads/writes own; admin reads all.
CREATE POLICY insurance_read_self ON insurance_policies
    FOR SELECT USING (
        cleaner_id = current_cleaner_id() OR is_admin()
    );

CREATE POLICY insurance_insert_self ON insurance_policies
    FOR INSERT WITH CHECK (
        cleaner_id = current_cleaner_id()
    );

CREATE POLICY insurance_update_admin ON insurance_policies
    FOR UPDATE USING (is_admin());

-- Stripe webhook events: admin only.
CREATE POLICY stripe_events_read_admin ON stripe_webhook_events
    FOR SELECT USING (is_admin());


-- =============================================================================
-- Notes for B6 and beyond
-- =============================================================================
-- 1. APPLICATION-LAYER ENCRYPTION FOR TAX INFO:
--    cleaner_profiles.encrypted_tax_id (BYTEA) is encrypted in app code:
--      - Use AES-256-GCM with key from env var TAX_ENCRYPTION_KEY
--      - Store IV/nonce as prefix of the bytea
--      - Database backups never expose plaintext SSN/EIN
--    Consider key versioning column when rotating keys.
--
-- 2. NIGHTLY JOBS DRIVEN BY B5 SCHEMA:
--    - Insurance expiration check: query insurance_policies where
--      expires_at <= NOW() + 30 days and renewal_reminder_sent_at IS NULL
--      → send notification, set renewal_reminder_sent_at
--    - Insurance state transition: query verified policies where
--      expires_at <= NOW() → set state = 'expired', expired_at = NOW()
--      → trigger badge revocation in B4 (cleaner_badges.lost_at)
--
-- 3. WEEKLY PAYOUT BATCH (Friday noon PT):
--    a. SELECT cleaner_id, SUM(amount_cents) FROM payout_line_items
--         WHERE payout_id IS NULL AND is_instant = FALSE
--         GROUP BY cleaner_id;
--    b. For each cleaner: insert payouts row, link line items via UPDATE
--         payout_line_items SET payout_id = X WHERE payout_id IS NULL
--         AND cleaner_id = Y AND is_instant = FALSE.
--    c. Trigger Stripe Connect transfer.
--    d. Update payouts.state via webhook.
--
-- 4. WEBHOOK PROCESSING PATTERN:
--    - Receive event → INSERT INTO stripe_webhook_events (idempotency check
--      via UNIQUE constraint on stripe_event_id)
--    - Process event → UPDATE the affected charge/payout/refund row
--    - Mark event processed → UPDATE stripe_webhook_events SET processing_state.
--
-- 5. CHARGE LIFECYCLE FOR A BOOKING:
--    a. Booking created → INSERT charges row, state='pending'
--    b. Stripe authorize → state='authorized', authorized_at populated
--    c. Customer approves booking → Stripe capture → state='captured'
--    d. Approval triggers commission_records insert + payout_line_items insert
--    e. Friday batch creates payout from accumulated line items
--
-- 6. CHARGE LIFECYCLE FOR A TIP:
--    a. Customer adds tip → INSERT tips row → INSERT charges row (tip_id set)
--    b. Stripe charge → state='captured' immediately (no auth/capture split)
--    c. Insert payout_line_items row for full tip amount (no commission)
-- =============================================================================

-- End of B5
