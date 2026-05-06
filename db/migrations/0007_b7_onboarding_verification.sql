-- =============================================================================
-- PureTask Database Schema — Batch B7: Onboarding & Verification
-- =============================================================================
-- The cleaner application pipeline + verification systems.
-- Final batch.
--
-- Design principles applied:
--   1. cleaner_applications is DISTINCT from cleaner_profiles. An applicant
--      has fundamentally different state than an active cleaner. When an
--      application is approved, it triggers cleaner_profile creation.
--   2. background_checks model RECURRING checks — not one-time events. They
--      expire after 2 years (locked) and need renewals. Multiple historical
--      check rows per cleaner over time.
--   3. identity_verifications are SEPARATE from background_checks because
--      they're different services (Stripe Identity vs Checkr) with different
--      cadences.
--   4. waitlist_signups capture customer demand in unserved areas. When a
--      ZIP becomes active (serviced_areas.status changes), application code
--      processes signups for that ZIP and converts them to real customers.
--
-- Wireframes covered by B7:
--   33, 34, 55, 63, 64, 70
--
-- Dependencies: B1 (users, profiles), B5 (insurance_policies for application
--               linkage), B6 (admin_actions for admin review tracking).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Enums for B7
-- -----------------------------------------------------------------------------

-- Application lifecycle.
-- LIFECYCLE:
--   draft (in-progress, can save and continue)
--     ↓ Submit
--   submitted (full submission received)
--     ↓ Admin starts review
--   in_review
--     ↓ Various outcomes
--   approved → triggers cleaner_profile creation (active cleaner)
--   rejected → terminal
--   needs_info → applicant must respond
--     ↓ Applicant updates and resubmits
--     in_review again
CREATE TYPE application_state AS ENUM (
    'draft',                  -- Started, not yet submitted
    'submitted',              -- Full submission, awaiting admin review
    'in_review',              -- Admin actively reviewing
    'needs_info',             -- Admin requested additional information
    'approved',               -- Approved; triggers cleaner_profile creation
    'rejected',               -- Terminal rejection
    'withdrawn',              -- Applicant withdrew
    'expired'                 -- Auto-expired after long inactivity in draft
);

-- Background check state mirrors Checkr.
CREATE TYPE background_check_state AS ENUM (
    'requested',              -- Submitted to Checkr
    'pending',                -- Checkr processing
    'in_progress',            -- Checkr investigating
    'clear',                  -- Passed
    'consider',               -- Needs admin review (record found)
    'failed',                 -- Failed (admin reviewed 'consider' and rejected)
    'cancelled',              -- Check cancelled before completion
    'expired'                 -- Past expiration date (2 years)
);

-- Identity verification state mirrors Stripe Identity.
CREATE TYPE identity_verification_state AS ENUM (
    'created',                -- Session created
    'requires_input',         -- Awaiting applicant action
    'processing',             -- Stripe processing
    'verified',               -- Successfully verified
    'requires_action',        -- Manual review needed
    'failed',                 -- Verification failed
    'cancelled'               -- Cancelled before completion
);

-- Waitlist signup status.
CREATE TYPE waitlist_status AS ENUM (
    'active',                 -- Currently on waitlist
    'notified',               -- We sent the launch email
    'converted',              -- Became an actual customer
    'unsubscribed'            -- Asked to be removed
);


-- =============================================================================
-- Table 51: cleaner_applications
-- =============================================================================
-- Cleaner application records. Distinct from cleaner_profiles — an applicant
-- is not a cleaner until approved.
-- =============================================================================

CREATE TABLE cleaner_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The user record. Created at application start. Note: this user has
    -- primary_role='cleaner' but no cleaner_profile row yet.
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,

    -- Application number for admin reference (e.g., "APP-2025-001234").
    application_number TEXT NOT NULL UNIQUE,

    -- Lifecycle state.
    state application_state NOT NULL DEFAULT 'draft',

    -- ===== APPLICATION DATA (filled in across the 11-step form) =====
    -- Stored as a single JSONB blob during draft state for flexibility.
    -- Application code maintains the schema/validation; database is permissive.
    -- Promoted to dedicated columns once submitted for indexability.
    application_data JSONB NOT NULL DEFAULT '{}'::JSONB,
    -- Example structure:
    --   {
    --     "basic_info": { "languages": ["en", "es"] },
    --     "service_area": { "home_zip": "94110", "travel_radius_miles": 5,
    --                       "service_zips": ["94110", "94114", "94117"] },
    --     "availability": { "weekly_hours": "..." },
    --     "experience": { "years": 8, "services": ["standard", "deep"],
    --                     "specialties": [] },
    --     "why_puretask": "I love cleaning..."
    --   }

    -- ===== KEY FIELDS PROMOTED FROM application_data FOR QUERY =====
    -- These are populated when state transitions from draft → submitted.

    home_zip VARCHAR(10),
    travel_radius_miles INTEGER,
    years_experience INTEGER CHECK (years_experience IS NULL OR years_experience >= 0),
    why_puretask_text TEXT,

    -- ===== VERIFICATION LINKAGE =====
    -- These FKs populated as verifications complete during application flow.
    background_check_id UUID,            -- FK to background_checks (added below)
    identity_verification_id UUID,       -- FK to identity_verifications (added below)
    initial_insurance_policy_id UUID REFERENCES insurance_policies(id) ON DELETE SET NULL,

    -- Stripe Connect onboarding (WF 63).
    -- Tracked separately from cleaner_profiles.stripe_connect_account_id
    -- because that field is only populated on approval.
    pending_stripe_account_id TEXT,
    stripe_onboarding_link TEXT,
    stripe_onboarding_completed_at TIMESTAMPTZ,

    -- ===== SUBMISSION + REVIEW TRACKING =====

    submitted_at TIMESTAMPTZ,

    -- Admin review.
    reviewed_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    review_started_at TIMESTAMPTZ,
    decision_at TIMESTAMPTZ,
    rejection_reason TEXT,
    admin_notes TEXT,

    -- For 'needs_info' state — what does admin need?
    info_request_message TEXT,
    info_requested_at TIMESTAMPTZ,
    info_responded_at TIMESTAMPTZ,

    -- ===== APPROVAL OUTCOME =====
    -- Set when state = approved; the resulting cleaner_profile.
    -- This is a back-reference; cleaner_profile is created from this application.
    cleaner_profile_id UUID REFERENCES cleaner_profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,

    -- Source / referral tracking for analytics.
    referral_source TEXT,                -- e.g., 'google', 'friend_referral', 'craigslist'
    referrer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Sanity: rejection_reason populated only when state = rejected.
    CONSTRAINT rejection_reason_only_when_rejected
        CHECK (
            (state = 'rejected' AND rejection_reason IS NOT NULL)
            OR (state != 'rejected')
        ),

    -- Sanity: cleaner_profile_id populated only when approved.
    CONSTRAINT cleaner_profile_only_when_approved
        CHECK (
            (state = 'approved' AND cleaner_profile_id IS NOT NULL AND approved_at IS NOT NULL)
            OR (state != 'approved' AND cleaner_profile_id IS NULL)
        )
);

COMMENT ON TABLE cleaner_applications IS 'Cleaner application pipeline. Distinct from cleaner_profiles.';
COMMENT ON COLUMN cleaner_applications.application_data IS 'JSONB during draft; promoted to columns on submission.';
COMMENT ON COLUMN cleaner_applications.cleaner_profile_id IS 'Set on approval; back-reference to created cleaner_profile.';

CREATE TRIGGER cleaner_applications_set_updated_at
    BEFORE UPDATE ON cleaner_applications
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_cleaner_applications_user ON cleaner_applications(user_id);
CREATE INDEX idx_cleaner_applications_state ON cleaner_applications(state, submitted_at DESC);
CREATE INDEX idx_cleaner_applications_pending_review ON cleaner_applications(submitted_at)
    WHERE state IN ('submitted', 'in_review', 'needs_info');
CREATE INDEX idx_cleaner_applications_zip ON cleaner_applications(home_zip) WHERE home_zip IS NOT NULL;
CREATE INDEX idx_cleaner_applications_application_number ON cleaner_applications(application_number);
CREATE INDEX idx_cleaner_applications_referral ON cleaner_applications(referral_source) WHERE referral_source IS NOT NULL;

-- Now wire up the deferred FK on admin_actions
ALTER TABLE admin_actions
    ADD CONSTRAINT fk_admin_actions_application
    FOREIGN KEY (target_application_id) REFERENCES cleaner_applications(id) ON DELETE SET NULL;


-- =============================================================================
-- Table 52: background_checks
-- =============================================================================
-- Background checks via Checkr. RECURRING infrastructure — checks expire
-- every 2 years and require renewal.
-- =============================================================================

CREATE TABLE background_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Subject of the check. May be a current cleaner OR an applicant.
    subject_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- Optional linkage to active cleaner profile. NULL during application phase.
    cleaner_id UUID REFERENCES cleaner_profiles(id) ON DELETE SET NULL,

    -- Optional linkage to application. Set during application; remains for
    -- audit even after cleaner approval.
    application_id UUID REFERENCES cleaner_applications(id) ON DELETE SET NULL,

    -- Provider details.
    provider TEXT NOT NULL DEFAULT 'checkr',
    external_check_id TEXT UNIQUE,        -- Checkr's reference ID
    external_candidate_id TEXT,           -- Checkr candidate ID

    -- State.
    state background_check_state NOT NULL DEFAULT 'requested',

    -- Lifecycle dates.
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,               -- Set on completion: started_at + 2 years

    -- Result details.
    -- For 'consider' results, admin reviews and decides.
    result_summary TEXT,                  -- Human-readable summary
    result_details JSONB,                 -- Full Checkr response (structured)

    -- Admin review when state = 'consider'.
    reviewed_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    admin_decision TEXT
        CHECK (admin_decision IS NULL OR admin_decision IN ('cleared', 'rejected', 'pending')),
    admin_notes TEXT,

    -- Renewal tracking.
    -- When this check is replaced by a renewal, replaced_by_check_id is set.
    replaced_at TIMESTAMPTZ,
    replaced_by_check_id UUID REFERENCES background_checks(id) ON DELETE SET NULL,

    -- 60-day pre-expiration reminder.
    renewal_reminder_sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE background_checks IS 'Checkr-managed checks. Recurring with 2-year expiration.';
COMMENT ON COLUMN background_checks.expires_at IS '2 years after completion (locked policy).';
COMMENT ON COLUMN background_checks.replaced_by_check_id IS 'When a renewal supersedes this check.';

CREATE TRIGGER background_checks_set_updated_at
    BEFORE UPDATE ON background_checks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_background_checks_subject ON background_checks(subject_user_id, requested_at DESC);
CREATE INDEX idx_background_checks_cleaner ON background_checks(cleaner_id) WHERE cleaner_id IS NOT NULL;
CREATE INDEX idx_background_checks_application ON background_checks(application_id) WHERE application_id IS NOT NULL;
CREATE INDEX idx_background_checks_state ON background_checks(state, requested_at DESC);
CREATE INDEX idx_background_checks_expiring ON background_checks(expires_at)
    WHERE state = 'clear' AND expires_at IS NOT NULL AND replaced_at IS NULL;
CREATE INDEX idx_background_checks_external ON background_checks(external_check_id);

-- Now wire up the deferred FK on cleaner_applications
ALTER TABLE cleaner_applications
    ADD CONSTRAINT fk_cleaner_applications_background_check
    FOREIGN KEY (background_check_id) REFERENCES background_checks(id) ON DELETE SET NULL;


-- =============================================================================
-- Table 53: identity_verifications
-- =============================================================================
-- Stripe Identity verification sessions. Separate from background checks.
-- =============================================================================

CREATE TABLE identity_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Subject. Same dual linkage pattern as background_checks.
    subject_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    cleaner_id UUID REFERENCES cleaner_profiles(id) ON DELETE SET NULL,
    application_id UUID REFERENCES cleaner_applications(id) ON DELETE SET NULL,

    -- Stripe Identity session reference.
    stripe_session_id TEXT NOT NULL UNIQUE,

    -- State.
    state identity_verification_state NOT NULL DEFAULT 'created',

    -- Verification details (denormalized from Stripe).
    document_type TEXT,                   -- e.g., 'drivers_license', 'passport'
    document_country CHAR(2),

    -- Lifecycle.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,

    -- Retry tracking.
    -- Stripe Identity charges per session; track retries.
    attempt_number INTEGER NOT NULL DEFAULT 1,

    -- Admin manual review (rare; for edge cases Stripe can't auto-verify).
    requires_manual_review BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    admin_notes TEXT,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE identity_verifications IS 'Stripe Identity sessions. One-time per cleaner (no expiration like background checks).';

CREATE TRIGGER identity_verifications_set_updated_at
    BEFORE UPDATE ON identity_verifications
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_identity_verifications_subject ON identity_verifications(subject_user_id, created_at DESC);
CREATE INDEX idx_identity_verifications_cleaner ON identity_verifications(cleaner_id) WHERE cleaner_id IS NOT NULL;
CREATE INDEX idx_identity_verifications_application ON identity_verifications(application_id) WHERE application_id IS NOT NULL;
CREATE INDEX idx_identity_verifications_state ON identity_verifications(state, created_at DESC);
CREATE INDEX idx_identity_verifications_stripe ON identity_verifications(stripe_session_id);
CREATE INDEX idx_identity_verifications_manual ON identity_verifications(created_at)
    WHERE requires_manual_review = TRUE AND reviewed_at IS NULL;

-- Now wire up the deferred FK on cleaner_applications
ALTER TABLE cleaner_applications
    ADD CONSTRAINT fk_cleaner_applications_identity
    FOREIGN KEY (identity_verification_id) REFERENCES identity_verifications(id) ON DELETE SET NULL;


-- =============================================================================
-- Table 54: waitlist_signups
-- =============================================================================
-- Customer signups in unserved ZIPs. When a ZIP becomes active, batch job
-- notifies waitlisted customers.
-- =============================================================================

CREATE TABLE waitlist_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Captured at signup time. May or may not become a real user later.
    email CITEXT NOT NULL,
    phone TEXT,                           -- Optional
    full_name TEXT,                       -- Optional

    -- ZIP they want service in.
    zip_code VARCHAR(10) NOT NULL,

    -- Optional service preferences.
    requested_service service_type,
    notes TEXT,

    -- Status.
    status waitlist_status NOT NULL DEFAULT 'active',

    -- Lifecycle.
    signed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notified_at TIMESTAMPTZ,
    notification_email_id TEXT,           -- Provider message ID for tracking
    converted_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,

    -- If converted, link to the user record they became.
    converted_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Marketing source.
    referral_source TEXT,                 -- e.g., 'google_ads', 'organic_search', 'partner_site'
    utm_campaign TEXT,
    utm_source TEXT,
    utm_medium TEXT,

    -- Privacy.
    -- Not all waitlisters create accounts. We hold their data only to fulfill
    -- the launch notification, then optionally for analytics.
    consent_to_marketing BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- A given email can sign up for the same ZIP only once.
    UNIQUE (email, zip_code)
);

COMMENT ON TABLE waitlist_signups IS 'Customer signups in unserved ZIPs. Notified when ZIP becomes active.';

CREATE TRIGGER waitlist_signups_set_updated_at
    BEFORE UPDATE ON waitlist_signups
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_waitlist_zip_status ON waitlist_signups(zip_code, status);
CREATE INDEX idx_waitlist_email ON waitlist_signups(email);
CREATE INDEX idx_waitlist_active ON waitlist_signups(zip_code) WHERE status = 'active';
CREATE INDEX idx_waitlist_signed_up ON waitlist_signups(signed_up_at DESC);


-- =============================================================================
-- Row-Level Security (RLS) Policies for B7
-- =============================================================================

ALTER TABLE cleaner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Cleaner applications: applicant reads/writes own draft; admin reads all.
CREATE POLICY cleaner_applications_read_self ON cleaner_applications
    FOR SELECT USING (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY cleaner_applications_insert_self ON cleaner_applications
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

-- Applicant can update only when in draft or needs_info state.
-- Admin can update any time.
CREATE POLICY cleaner_applications_update_party ON cleaner_applications
    FOR UPDATE USING (
        (user_id = auth.uid() AND state IN ('draft', 'needs_info'))
        OR is_admin()
    );

-- Background checks: cleaner reads own; admin reads all.
-- The check itself is initiated/managed by admin or system, not the cleaner.
CREATE POLICY background_checks_read_self ON background_checks
    FOR SELECT USING (
        subject_user_id = auth.uid() OR is_admin()
    );

-- Identity verifications: subject reads own; admin reads all.
CREATE POLICY identity_verifications_read_self ON identity_verifications
    FOR SELECT USING (
        subject_user_id = auth.uid() OR is_admin()
    );

-- Waitlist signups: admin only (these are pre-account records, not authenticated users).
-- Public INSERT allowed via service role for the signup form.
CREATE POLICY waitlist_signups_read_admin ON waitlist_signups
    FOR SELECT USING (is_admin());

-- Note: INSERT into waitlist_signups happens via service role (signup form
-- submission from unauthenticated public). RLS on INSERT not enforced for
-- service-role calls.


-- =============================================================================
-- Cross-batch: Final FK reconciliation
-- =============================================================================
-- All deferred FKs should now be wired up. Verifying:
--   ✓ B1 customer_profiles.default_payment_method_id → payment_methods (in B5)
--   ✓ B2 bookings.recurring_schedule_id → recurring_schedules (within B2)
--   ✓ B3 tips.charge_id → charges (in B5)
--   ✓ B3 disputes.refund_id → refunds (in B5)
--   ✓ B3 dispute_resolutions.refund_id → refunds (in B5)
--   ✓ B4 tier_assignments.appealed_via_appeal_id → cleaner_appeals (within B4)
--   ✓ B4 reliability_events.overturned_by_appeal_id → cleaner_appeals (within B4)
--   ✓ B6 admin_actions.target_application_id → cleaner_applications (in B7 above)
--   ✓ B7 cleaner_applications.background_check_id → background_checks (above)
--   ✓ B7 cleaner_applications.identity_verification_id → identity_verifications (above)


-- =============================================================================
-- Notes for production deployment
-- =============================================================================
-- 1. APPLICATION APPROVAL WORKFLOW (admin clicks "Approve" in WF 55):
--    Within a single transaction:
--      a. UPDATE cleaner_applications SET state='approved', approved_at=NOW(),
--         reviewed_by_admin_id=admin_uid;
--      b. INSERT cleaner_profiles using application_data + tier='rising_pro',
--         current_score=90 (locked default);
--      c. UPDATE cleaner_applications SET cleaner_profile_id = (new id);
--      d. INSERT cleaner_service_zips rows from application_data.service_zips;
--      e. INSERT availability_rules rows from application_data.availability;
--      f. INSERT addresses row for cleaner_home (using application_data.home_zip);
--      g. INSERT cleaner_badges for 'background_checked' (system-granted);
--      h. INSERT admin_actions row (action_type='cleaner_application_approved');
--      i. INSERT notifications row to applicant (type='account_verified');
--      j. INSERT user_milestones row ('cleaner_first_login') for tutorial trigger.
--    Commit. If any step fails, all roll back.
--
-- 2. BACKGROUND CHECK RENEWAL JOB (daily):
--    SELECT * FROM background_checks
--      WHERE state = 'clear'
--      AND expires_at <= NOW() + INTERVAL '60 days'
--      AND renewal_reminder_sent_at IS NULL
--      AND replaced_at IS NULL;
--    For each: send notification to cleaner (type='background_check_renewal_due').
--    Set renewal_reminder_sent_at.
--
--    Separate job at expires_at:
--    UPDATE background_checks SET state = 'expired' WHERE expires_at < NOW();
--    Cascade: trigger insurance_policies and cleaner_badges revocation rules.
--
-- 3. WAITLIST CONVERSION JOB (manual or triggered):
--    When admin marks a serviced_areas row as 'active':
--      SELECT * FROM waitlist_signups
--        WHERE zip_code = X AND status = 'active';
--      For each: send launch email, set status='notified', notified_at=NOW().
--      When customer creates account, set converted_to_user_id and status='converted'.
--
-- 4. APPLICATION DRAFT EXPIRATION (weekly):
--    UPDATE cleaner_applications SET state='expired'
--      WHERE state='draft' AND updated_at < NOW() - INTERVAL '90 days';
--
-- 5. APPLICATION INCOMPLETE-DATA HANDLING:
--    During draft state, application_data JSONB can be missing fields.
--    On submission, application code validates completeness, promotes key
--    fields to dedicated columns, and only then transitions to 'submitted'.
-- =============================================================================

-- End of B7
-- =============================================================================
-- SCHEMA COMPLETE
-- 54 tables across 7 batches.
-- All deferred foreign keys wired up.
-- All wireframes covered.
-- =============================================================================
