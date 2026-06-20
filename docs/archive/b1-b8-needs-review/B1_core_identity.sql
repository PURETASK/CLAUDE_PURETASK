-- =============================================================================
-- PureTask Database Schema — Batch B1: Core Identity + Accounts
-- =============================================================================
-- This is the foundation. Every other table in B2-B7 will foreign-key back
-- to tables defined here.
--
-- Design principles applied:
--   1. Shared `users` table + separate profile tables (customer/cleaner/admin)
--      Same person can be both customer and cleaner if needed (just have both
--      profile rows).
--   2. Email uniqueness enforced at users level.
--   3. Soft delete via deleted_at on users + profiles (cleaner reviews must
--      survive account deletion per locked design wireframe 29).
--   4. All timestamps stored as TIMESTAMP WITH TIME ZONE (timestamptz).
--   5. All money stored as INTEGER cents (never floats).
--   6. Denormalized aggregates on cleaner_profiles for query performance
--      (average_rating, review_count, completed_booking_count) — kept fresh
--      by a nightly batch job (eventually consistent is fine for ratings).
--   7. PII-grade fields (SSN/EIN) handled in B5 via application-level
--      encryption — not stored in B1.
--
-- Wireframes covered by B1:
--   1, 2 (a-d), 7, 11, 26, 28, 29, 30, 31, 60 (admin user lookup)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Required Postgres extensions
-- -----------------------------------------------------------------------------
-- pgcrypto: gen_random_uuid() for primary keys
-- citext:   case-insensitive text for emails (users with mixed-case emails
--           shouldn't create duplicates)
-- btree_gist: needed in B2 for the no-double-booking exclusion constraint;
--             enabled here so it's in place early
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "btree_gist";


-- -----------------------------------------------------------------------------
-- Enums used in B1
-- -----------------------------------------------------------------------------

-- user_role: which kind of profile(s) does this user have?
-- Note: a user can have multiple profile types (customer + cleaner). This enum
-- is used for primary categorization in admin tooling and analytics; the actual
-- "is this user a cleaner?" check is "does cleaner_profiles row exist for this
-- user_id?".
CREATE TYPE user_role AS ENUM (
    'customer',
    'cleaner',
    'admin'
);

-- user_status: account-level lifecycle.
-- 'active': normal usage
-- 'suspended': admin-imposed lockout (separate from cleaner_suspensions which
--              is more granular and applies only to booking acceptance)
-- 'deleted': soft-deleted (deleted_at populated). Excluded from active queries
--            but row preserved for legal/dispute audit.
CREATE TYPE user_status AS ENUM (
    'active',
    'suspended',
    'deleted'
);

-- address_type: what kind of address is this?
-- 'customer_service': a place a customer wants cleaned
-- 'cleaner_home':     cleaner's home base (used for distance calculations)
-- 'business':         platform/admin business address (rarely used)
CREATE TYPE address_type AS ENUM (
    'customer_service',
    'cleaner_home',
    'business'
);

-- tier_name: cleaner tier (locked from system design).
-- Used here as a column type on cleaner_profiles for current tier; full tier
-- assignment history lives in B4 (tier_assignments table).
CREATE TYPE tier_name AS ENUM (
    'rising_pro',
    'proven_specialist',
    'top_performer',
    'all_star_expert'
);


-- =============================================================================
-- Table 1: users
-- =============================================================================
-- The central identity row. One row per person on the platform.
-- Authentication is handled by Clerk (clerk_user_id is the link).
-- =============================================================================

CREATE TABLE users (
    -- Primary key. UUID v4 for portability and to avoid sequential-id
    -- enumeration attacks.
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- External identifier from Clerk. Set when user completes signup. May be
    -- null briefly during account creation flow.
    clerk_user_id TEXT UNIQUE,

    -- Email is the canonical identifier across providers. citext = case-
    -- insensitive comparisons. UNIQUE prevents duplicate-account problems.
    email CITEXT NOT NULL UNIQUE,

    -- E.164 format (e.g., +14155551234). NULL allowed because magic-link
    -- signup may complete before phone is captured.
    phone TEXT UNIQUE,

    -- Display name. Stored as a single field rather than first/last because
    -- name conventions vary and we display it as one string everywhere.
    full_name TEXT NOT NULL,

    -- IANA timezone identifier (e.g., 'America/Los_Angeles'). Used to display
    -- booking times in the user's local time.
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Los_Angeles',

    -- Primary role for analytics/admin tooling. The "real" check for whether
    -- this user is a customer/cleaner/admin is the existence of the
    -- corresponding profile row.
    primary_role user_role NOT NULL,

    -- Account-level lifecycle.
    status user_status NOT NULL DEFAULT 'active',

    -- Audit timestamps. created_at is immutable; updated_at gets bumped by
    -- trigger when any column changes.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Soft-delete timestamp. NULL = active row. NON-NULL = deleted; row
    -- preserved for audit but excluded from queries via WHERE deleted_at IS NULL.
    deleted_at TIMESTAMPTZ,

    -- For admin search by email/name/phone. Populated by trigger.
    search_tsv TSVECTOR
);

COMMENT ON TABLE users IS 'Central identity row. One per person.';
COMMENT ON COLUMN users.clerk_user_id IS 'Set by Clerk after auth; null during signup flow only.';
COMMENT ON COLUMN users.phone IS 'E.164 format only. UNIQUE constraint prevents account collisions on phone.';
COMMENT ON COLUMN users.primary_role IS 'For admin tooling; actual role checks use profile-table existence.';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete. NULL = active; populated = deleted but preserved for audit.';
COMMENT ON COLUMN users.search_tsv IS 'Full-text search vector for admin user lookup. Maintained by trigger.';

-- Trigger to keep updated_at fresh on every column change.
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- Trigger to maintain the search_tsv column for admin full-text search.
CREATE OR REPLACE FUNCTION trigger_users_search_tsv()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_tsv :=
        setweight(to_tsvector('english', COALESCE(NEW.full_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.email::text, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.phone, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_update_search_tsv
    BEFORE INSERT OR UPDATE OF full_name, email, phone ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_users_search_tsv();

-- Indexes
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_primary_role ON users(primary_role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_search_tsv ON users USING gin(search_tsv);
CREATE INDEX idx_users_created_at ON users(created_at DESC);


-- =============================================================================
-- Table 2: customer_profiles
-- =============================================================================
-- Customer-specific data. One row per customer (NULL if user is admin or
-- cleaner only).
-- =============================================================================

CREATE TABLE customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,

    -- The default address used when booking. References addresses.id; nullable
    -- because customer might not have set one yet during signup flow.
    -- ON DELETE SET NULL: deleting an address shouldn't delete the customer.
    default_address_id UUID,

    -- Default payment method. Same nullability/delete rationale as address.
    -- FK declared in B5 (payment_methods table not yet created).
    default_payment_method_id UUID,

    -- Photo policy: how should cleaners handle photos for this customer?
    -- 'default'           = photograph all rooms (locked default per WF 29)
    -- 'skip_named_rooms'  = photograph except rooms in skip_photo_rooms
    -- 'skip_all_with_waiver' = no photos, customer accepts dispute waiver
    photo_policy TEXT NOT NULL DEFAULT 'default'
        CHECK (photo_policy IN ('default', 'skip_named_rooms', 'skip_all_with_waiver')),

    -- Array of room names to skip photographing (e.g., ['bedroom', 'office'])
    -- Only meaningful when photo_policy = 'skip_named_rooms'.
    skip_photo_rooms TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

    -- Timestamp when customer accepted the dispute waiver. Required when
    -- photo_policy = 'skip_all_with_waiver'.
    waiver_accepted_at TIMESTAMPTZ,

    -- Lifetime stats, denormalized for dashboard performance.
    -- Updated by nightly batch job, not by triggers (eventually consistent).
    total_bookings_count INTEGER NOT NULL DEFAULT 0,
    total_spent_cents BIGINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Sanity: if photo_policy is 'skip_all_with_waiver', waiver_accepted_at
    -- must be populated.
    CONSTRAINT photo_waiver_required
        CHECK (
            photo_policy != 'skip_all_with_waiver'
            OR waiver_accepted_at IS NOT NULL
        )
);

COMMENT ON TABLE customer_profiles IS 'Customer-specific data, one per customer.';
COMMENT ON COLUMN customer_profiles.photo_policy IS 'Locked options from WF 29: default / skip named rooms / skip all + waiver.';
COMMENT ON COLUMN customer_profiles.skip_photo_rooms IS 'Array of room names to skip; only meaningful when policy=skip_named_rooms.';
COMMENT ON COLUMN customer_profiles.total_bookings_count IS 'Denormalized; refreshed nightly. Drives WF 11 dashboard stats.';

CREATE TRIGGER customer_profiles_set_updated_at
    BEFORE UPDATE ON customer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_customer_profiles_user ON customer_profiles(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customer_profiles_default_address ON customer_profiles(default_address_id) WHERE default_address_id IS NOT NULL;


-- =============================================================================
-- Table 3: cleaner_profiles
-- =============================================================================
-- Cleaner-specific data. One row per cleaner.
-- This is the densest table in B1 because cleaners have a lot of public-facing
-- and operational data.
-- =============================================================================

CREATE TABLE cleaner_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,

    -- Display fields. Bio is what customers see on the cleaner profile page (WF 7).
    -- profile_photo_url is a Cloudflare R2 signed URL.
    bio TEXT,
    profile_photo_url TEXT,

    -- Languages spoken. Each entry includes proficiency:
    --   [{"code": "en", "proficiency": "native"}, {"code": "es", "proficiency": "fluent"}]
    -- JSONB for flexibility; could be normalized to a join table in the future.
    languages JSONB NOT NULL DEFAULT '[]'::JSONB,

    -- Cleaner's home base address (where they start their day from).
    -- FK declared after addresses table.
    home_address_id UUID,

    -- Per-service hourly rates as JSONB for flexibility:
    --   {"standard": 6500, "deep": 7000, "move_out": 7500, "airbnb": 7000}
    -- Values are integer cents. Validation that rates are within tier range
    -- happens in application code (because tier ranges aren't a database
    -- concept — they're business rules).
    hourly_rates_cents JSONB NOT NULL DEFAULT '{}'::JSONB,

    -- Tier and score (denormalized current values).
    -- Full tier history is in B4 (tier_assignments).
    -- Full score history is in B4 (reliability_score_snapshots).
    -- These columns are the latest values for fast reads.
    current_tier tier_name NOT NULL DEFAULT 'rising_pro',
    current_score INTEGER NOT NULL DEFAULT 90
        CHECK (current_score >= 0 AND current_score <= 100),
    tier_set_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    score_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Veteran cushion eligibility (locked: 6+ months at 75+ score).
    -- Computed nightly by score job.
    is_veteran BOOLEAN NOT NULL DEFAULT FALSE,

    -- Operational settings (from WF 27).
    buffer_minutes INTEGER NOT NULL DEFAULT 60
        CHECK (buffer_minutes >= 0 AND buffer_minutes <= 240),
    booking_lead_time_hours INTEGER NOT NULL DEFAULT 24
        CHECK (booking_lead_time_hours >= 0 AND booking_lead_time_hours <= 168),

    -- Stripe Connect linkage. Set during onboarding (WF 63).
    stripe_connect_account_id TEXT UNIQUE,
    stripe_connect_onboarding_completed_at TIMESTAMPTZ,
    instant_payout_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    -- Tax info (encrypted at application layer in B5).
    -- These are stored bytea for encrypted blobs.
    encrypted_tax_id BYTEA,
    tax_id_type TEXT CHECK (tax_id_type IN ('ssn', 'ein')),

    -- Active flag. Used by cleaner list (WF 8) — only show active cleaners.
    -- Distinct from suspensions (B4): a cleaner can be inactive (paused
    -- themselves) without being suspended.
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deactivated_at TIMESTAMPTZ,
    deactivation_reason TEXT,

    -- Contact preferences (from WF 31).
    allow_phone_calls BOOLEAN NOT NULL DEFAULT TRUE,
    allow_sms BOOLEAN NOT NULL DEFAULT TRUE,

    -- Denormalized aggregates for cleaner search/list page performance (WF 8).
    -- Updated nightly by batch job.
    average_rating DECIMAL(3,2)
        CHECK (average_rating IS NULL OR (average_rating >= 0 AND average_rating <= 5)),
    review_count INTEGER NOT NULL DEFAULT 0,
    completed_booking_count INTEGER NOT NULL DEFAULT 0,
    last_booking_completed_at TIMESTAMPTZ,

    -- Cleaning start date (when they joined as approved cleaner).
    cleaner_since_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Search support (for admin lookup by name/bio).
    search_tsv TSVECTOR,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Sanity: deactivation_reason populated only when is_active = false
    CONSTRAINT deactivation_reason_only_when_inactive
        CHECK (
            (is_active = TRUE AND deactivated_at IS NULL)
            OR (is_active = FALSE AND deactivated_at IS NOT NULL)
        )
);

COMMENT ON TABLE cleaner_profiles IS 'Cleaner-specific data including denormalized aggregates for search performance.';
COMMENT ON COLUMN cleaner_profiles.current_tier IS 'Latest tier; history in B4.tier_assignments. Updated by nightly tier job.';
COMMENT ON COLUMN cleaner_profiles.current_score IS 'Latest score 0-100; history in B4.reliability_score_snapshots.';
COMMENT ON COLUMN cleaner_profiles.is_veteran IS 'Locked rule: 6+ months at score 75+. Computed nightly.';
COMMENT ON COLUMN cleaner_profiles.average_rating IS 'Denormalized; refreshed nightly. NULL for cleaners with no reviews yet.';
COMMENT ON COLUMN cleaner_profiles.review_count IS 'Denormalized; refreshed nightly.';
COMMENT ON COLUMN cleaner_profiles.is_active IS 'Cleaner-controlled active flag. Suspensions in B4.cleaner_suspensions.';

CREATE TRIGGER cleaner_profiles_set_updated_at
    BEFORE UPDATE ON cleaner_profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE FUNCTION trigger_cleaner_profiles_search_tsv()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_tsv :=
        setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleaner_profiles_update_search_tsv
    BEFORE INSERT OR UPDATE OF bio ON cleaner_profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_cleaner_profiles_search_tsv();

-- Indexes for the cleaner list page (WF 8) — these are the heaviest queries.
CREATE INDEX idx_cleaner_profiles_user ON cleaner_profiles(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cleaner_profiles_active ON cleaner_profiles(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_cleaner_profiles_tier ON cleaner_profiles(current_tier) WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_cleaner_profiles_rating ON cleaner_profiles(average_rating DESC NULLS LAST) WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_cleaner_profiles_score ON cleaner_profiles(current_score) WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_cleaner_profiles_search ON cleaner_profiles USING gin(search_tsv);
CREATE INDEX idx_cleaner_profiles_stripe ON cleaner_profiles(stripe_connect_account_id) WHERE stripe_connect_account_id IS NOT NULL;


-- =============================================================================
-- Table 4: admin_profiles
-- =============================================================================
-- Admin-specific data. Small table; one row per admin.
-- =============================================================================

CREATE TABLE admin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,

    -- Permission level. Simple for MVP; can grow into a roles table later.
    permission_level TEXT NOT NULL DEFAULT 'standard'
        CHECK (permission_level IN ('standard', 'super_admin')),

    -- Admin actions are audit-logged in B6.admin_actions. This is just the
    -- admin's profile.
    last_active_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE admin_profiles IS 'Admin-specific data; small table.';
COMMENT ON COLUMN admin_profiles.permission_level IS 'Simple two-level permissions for MVP; expandable later.';

CREATE TRIGGER admin_profiles_set_updated_at
    BEFORE UPDATE ON admin_profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_admin_profiles_user ON admin_profiles(user_id) WHERE deleted_at IS NULL;


-- =============================================================================
-- Table 5: addresses
-- =============================================================================
-- Multi-purpose address table. Used for customer service addresses, cleaner
-- home bases, and platform business addresses.
-- =============================================================================

CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Owner of this address. References users (not profiles) because both
    -- customers and cleaners have addresses, and the simplest FK is to the
    -- shared user.
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- What kind of address is this?
    address_type address_type NOT NULL,

    -- Address fields. street_2 is optional (apartment numbers, suite numbers).
    street_1 TEXT NOT NULL,
    street_2 TEXT,
    city TEXT NOT NULL,
    state CHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    country CHAR(2) NOT NULL DEFAULT 'US',

    -- Lat/lng for distance calculations (cleaner search, ETA computation).
    -- Populated by geocoding service when address is created.
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),

    -- Optional friendly label (e.g., "Home", "Office", "Mom's place").
    label TEXT,

    -- Special instructions (entry codes, parking, pet warnings).
    -- Visible to assigned cleaner only via booking.
    access_instructions TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE addresses IS 'Multi-purpose addresses scoped by owner_user_id and address_type.';
COMMENT ON COLUMN addresses.access_instructions IS 'Entry codes, parking, pet warnings. Shown to cleaner only after booking.';
COMMENT ON COLUMN addresses.latitude IS 'Populated via geocoding service on insert/update.';

CREATE TRIGGER addresses_set_updated_at
    BEFORE UPDATE ON addresses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- FK back-references from profile tables now that addresses exists
ALTER TABLE customer_profiles
    ADD CONSTRAINT fk_customer_default_address
    FOREIGN KEY (default_address_id) REFERENCES addresses(id) ON DELETE SET NULL;

ALTER TABLE cleaner_profiles
    ADD CONSTRAINT fk_cleaner_home_address
    FOREIGN KEY (home_address_id) REFERENCES addresses(id) ON DELETE SET NULL;

CREATE INDEX idx_addresses_owner ON addresses(owner_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_addresses_zip ON addresses(zip_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_addresses_type ON addresses(address_type, owner_user_id) WHERE deleted_at IS NULL;


-- =============================================================================
-- Table 6: auth_sessions
-- =============================================================================
-- Active device sessions for the user-facing "active sessions" view (WF 28).
-- Note: Clerk handles actual session tokens. This table is a denormalized
-- mirror so we can show the user which devices are signed in.
-- =============================================================================

CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Clerk's session reference.
    clerk_session_id TEXT NOT NULL UNIQUE,

    -- Device info for display.
    device_label TEXT NOT NULL,        -- e.g., "iPhone · Safari"
    ip_address INET,
    user_agent TEXT,

    -- Lifecycle.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,

    -- Sessions that haven't been active in 30 days are auto-revoked by a
    -- daily cleanup job. expires_at gives an explicit boundary.
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days'
);

COMMENT ON TABLE auth_sessions IS 'Mirror of Clerk sessions for user-visible active sessions list.';
COMMENT ON COLUMN auth_sessions.expires_at IS 'Daily cleanup job revokes sessions past expiration.';

CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_auth_sessions_clerk ON auth_sessions(clerk_session_id);
CREATE INDEX idx_auth_sessions_expires ON auth_sessions(expires_at) WHERE revoked_at IS NULL;


-- =============================================================================
-- Table 7: customer_favorites
-- =============================================================================
-- Customer's saved/favorited cleaners. FKs reference profile tables (not
-- users) per audit Issue 1.2 — enforces that only customers can favorite and
-- only cleaners can be favorited.
-- =============================================================================

CREATE TABLE customer_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    cleaner_id UUID NOT NULL REFERENCES cleaner_profiles(id) ON DELETE CASCADE,

    -- Tab classification on WF 25. is_regular = true when customer has an
    -- active recurring schedule with this cleaner. Updated by application
    -- code when recurring schedules are created/ended.
    is_regular BOOLEAN NOT NULL DEFAULT FALSE,

    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- A customer can only have a given cleaner as a favorite once.
    UNIQUE (customer_id, cleaner_id)
);

COMMENT ON TABLE customer_favorites IS 'Saved cleaners per customer. Tab classification via is_regular flag.';
COMMENT ON COLUMN customer_favorites.is_regular IS 'True when customer has active recurring with this cleaner; updated by app code.';

CREATE INDEX idx_customer_favorites_customer ON customer_favorites(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customer_favorites_cleaner ON customer_favorites(cleaner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customer_favorites_regular ON customer_favorites(customer_id, is_regular) WHERE deleted_at IS NULL;


-- =============================================================================
-- Table 8: user_milestones
-- =============================================================================
-- Tutorial / onboarding completion tracking. Flexible key/value design so we
-- can add new milestones without schema migrations.
-- =============================================================================

CREATE TABLE user_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Examples:
    --   'customer_first_tour'        (WF 48)
    --   'cleaner_photo_training'     (WF 49)
    --   'cleaner_platform_tour'      (WF 50)
    --   'customer_first_booking'     (analytics milestone)
    --   'cleaner_first_payout'       (analytics milestone)
    milestone_key TEXT NOT NULL,

    -- When the milestone was completed.
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Optional context about completion (e.g., which version of the tutorial
    -- they saw, A/B test arm).
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

    -- A user completes each milestone once.
    UNIQUE (user_id, milestone_key)
);

COMMENT ON TABLE user_milestones IS 'Tutorial/onboarding completion tracking. Used to suppress already-seen flows.';
COMMENT ON COLUMN user_milestones.milestone_key IS 'Free-form key; conventions documented in app code.';

CREATE INDEX idx_user_milestones_user ON user_milestones(user_id);
CREATE INDEX idx_user_milestones_key ON user_milestones(milestone_key);


-- =============================================================================
-- Row-Level Security (RLS) Policies
-- =============================================================================
-- Supabase uses RLS to enforce authorization at the database level.
-- Application code passes the auth.uid() as the requesting user's ID.
-- =============================================================================

-- Enable RLS on every table. Default-deny.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;

-- Helper function: is the requesting user an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_profiles
        WHERE user_id = auth.uid()
        AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: get the calling user's customer_profile id (or null)
CREATE OR REPLACE FUNCTION current_customer_id()
RETURNS UUID AS $$
DECLARE
    cid UUID;
BEGIN
    SELECT id INTO cid FROM customer_profiles
    WHERE user_id = auth.uid() AND deleted_at IS NULL;
    RETURN cid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: get the calling user's cleaner_profile id (or null)
CREATE OR REPLACE FUNCTION current_cleaner_id()
RETURNS UUID AS $$
DECLARE
    cid UUID;
BEGIN
    SELECT id INTO cid FROM cleaner_profiles
    WHERE user_id = auth.uid() AND deleted_at IS NULL;
    RETURN cid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========
-- users policies
-- ==========
-- Users can read their own row.
CREATE POLICY users_read_self ON users
    FOR SELECT USING (id = auth.uid() OR is_admin());

-- Users can update their own row (limited columns enforced at app layer).
CREATE POLICY users_update_self ON users
    FOR UPDATE USING (id = auth.uid() OR is_admin());

-- Inserts allowed via service role only (signup happens in trusted backend).

-- ==========
-- customer_profiles policies
-- ==========
CREATE POLICY customer_profiles_read_self ON customer_profiles
    FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY customer_profiles_update_self ON customer_profiles
    FOR UPDATE USING (user_id = auth.uid() OR is_admin());

-- ==========
-- cleaner_profiles policies
-- ==========
-- Active cleaner profiles are publicly readable (for cleaner list & profile page).
-- Inactive/deleted only readable by self or admin.
CREATE POLICY cleaner_profiles_read_public ON cleaner_profiles
    FOR SELECT USING (
        (is_active = TRUE AND deleted_at IS NULL)
        OR user_id = auth.uid()
        OR is_admin()
    );

CREATE POLICY cleaner_profiles_update_self ON cleaner_profiles
    FOR UPDATE USING (user_id = auth.uid() OR is_admin());

-- ==========
-- admin_profiles policies
-- ==========
-- Only admins can read admin profiles.
CREATE POLICY admin_profiles_read_admin_only ON admin_profiles
    FOR SELECT USING (is_admin());

-- ==========
-- addresses policies
-- ==========
-- Owner can read/write own addresses. Cleaners assigned to an active booking
-- can read the customer's address (handled by booking-level policies in B2).
CREATE POLICY addresses_read_owner ON addresses
    FOR SELECT USING (owner_user_id = auth.uid() OR is_admin());

CREATE POLICY addresses_write_owner ON addresses
    FOR ALL USING (owner_user_id = auth.uid() OR is_admin());

-- ==========
-- auth_sessions policies
-- ==========
CREATE POLICY auth_sessions_read_self ON auth_sessions
    FOR SELECT USING (user_id = auth.uid() OR is_admin());

-- ==========
-- customer_favorites policies
-- ==========
CREATE POLICY customer_favorites_read_self ON customer_favorites
    FOR SELECT USING (
        customer_id = current_customer_id()
        OR is_admin()
    );

CREATE POLICY customer_favorites_write_self ON customer_favorites
    FOR ALL USING (
        customer_id = current_customer_id()
        OR is_admin()
    );

-- ==========
-- user_milestones policies
-- ==========
CREATE POLICY user_milestones_read_self ON user_milestones
    FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY user_milestones_write_self ON user_milestones
    FOR ALL USING (user_id = auth.uid() OR is_admin());


-- =============================================================================
-- Notes for B2 and beyond
-- =============================================================================
-- 1. Many tables in B2-B7 will FK back to users.id, customer_profiles.id, or
--    cleaner_profiles.id. Use ON DELETE RESTRICT for users (block deletion if
--    referenced) or ON DELETE CASCADE depending on whether the data should
--    survive account deletion.
--
-- 2. The cleaner_search query (cleaner list page) will heavily use
--    cleaner_profiles + cleaner_service_zips (B2) + availability_rules (B2)
--    + bookings (B2). The denormalized columns on cleaner_profiles
--    (average_rating, review_count, completed_booking_count) are essential
--    for that query's performance.
--
-- 3. The score and tier are denormalized on cleaner_profiles as
--    current_score and current_tier. The full history goes in B4. Application
--    code should read latest from cleaner_profiles, write new history rows in
--    B4, then update cleaner_profiles to match.
--
-- 4. RLS policies above are baseline. Admin policies allow full access via
--    is_admin() helper. Service-role queries (background jobs) should run
--    with security definer or RLS bypass to avoid policy overhead.
-- =============================================================================

-- End of B1
