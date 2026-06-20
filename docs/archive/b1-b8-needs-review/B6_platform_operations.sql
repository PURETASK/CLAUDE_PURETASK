-- =============================================================================
-- PureTask Database Schema — Batch B6: Platform Operations
-- =============================================================================
-- Notifications, admin actions, support. The plumbing.
--
-- Design principles applied:
--   1. Notifications are STORED, not just delivered. The notification center
--      (WF 19) needs queryable history. Each notification has type, body,
--      deep link, expires_at.
--   2. NOTIFICATION RETENTION: 90 days hard-delete via daily cleanup job
--      (audit Issue 4.1). Underlying event tables (booking_state_events,
--      reliability_events) keep the history.
--   3. NOTIFICATION_PREFERENCES has CASCADE LOGIC: user-level toggle
--      overrides per-event toggles. Quiet hours columns added day-1 even
--      though MVP UI doesn't expose them.
--   4. NOTIFICATION_DELIVERIES log each channel attempt for compliance and
--      retry logic.
--   5. ADMIN_ACTIONS is APPEND-ONLY for legal defense. Every admin operation
--      writes a row with full before/after state.
--   6. SUPPORT_TICKETS are SEPARATE from disputes. Disputes are about
--      specific bookings between customer and cleaner. Support tickets are
--      about the platform (account access, billing, etc.).
--
-- Wireframes covered by B6:
--   19, 28, 30, 37, 47, 53, 54, 55, 56, 57, 58, 59, 60, 62
--
-- Dependencies: B1 (users, profiles), B2 (bookings), B3 (disputes),
--               B4 (reliability events), B5 (charges, payouts, refunds).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Enums for B6
-- -----------------------------------------------------------------------------

-- Notification type categorizes what the notification is about.
-- Drives icon, deep-link routing, and per-type preferences.
CREATE TYPE notification_type AS ENUM (
    -- Booking lifecycle
    'booking_confirmed',
    'booking_request_sent',           -- To cleaner: "new booking awaiting your response"
    'booking_request_declined',       -- To customer: cleaner declined
    'booking_request_accepted',       -- To customer: cleaner accepted
    'booking_imminent_reminder',      -- T-24hr reminder
    'cleaner_on_the_way',
    'cleaner_eta_update',
    'cleaner_arrived',
    'cleaner_running_late',           -- WF 68
    'cleaning_started',
    'cleaning_complete',              -- Triggers customer review prompt
    'job_approved',
    'job_auto_approved',              -- 24hr timer expired
    'payment_captured',
    'reschedule_request_received',    -- To cleaner
    'reschedule_accepted',            -- To customer
    'reschedule_declined',            -- To customer
    'booking_cancelled_by_customer',  -- To cleaner
    'booking_cancelled_by_cleaner',   -- To customer

    -- Recurring
    'recurring_setup_confirmed',
    'recurring_next_in_24hr',
    'recurring_paused',
    'recurring_ending_in_14_days',    -- Cleaner-side notice (locked)

    -- Reviews + tips
    'review_received',                -- To cleaner
    'review_prompt',                  -- To customer (24hr post-job)
    'rebook_nudge',                   -- 24h after positive review (WF 24)
    'tip_received',                   -- To cleaner
    'tip_thank_you_prompt',           -- To customer

    -- Disputes
    'dispute_filed',                  -- To cleaner
    'dispute_response_received',      -- To customer
    'dispute_response_due_soon',      -- Cleaner reminder (T-12hr of 48hr window)
    'dispute_escalated',              -- To both parties
    'dispute_resolved',               -- To both parties
    'dispute_in_mediation',           -- Admin took over

    -- Score / tier / badges (WF 53)
    'score_increased',
    'score_decreased',
    'tier_promoted',
    'tier_demoted',
    'tier_drop_appeal_window',        -- Veteran cushion alert
    'badge_earned',
    'specialty_earned',
    'probation_entered',
    'probation_lifted',
    'suspension_imposed',
    'suspension_lifted',
    'appeal_decision',

    -- Money
    'charge_failed',
    'payout_initiated',
    'payout_paid',
    'payout_failed',
    'refund_issued',

    -- Insurance / verification
    'insurance_verified',
    'insurance_rejected',
    'insurance_expiring_soon',        -- 30-day reminder
    'insurance_expired',
    'background_check_complete',
    'background_check_renewal_due',

    -- Account
    'account_verified',
    'new_login_detected',
    'password_changed',

    -- Platform
    'announcement',                   -- General platform announcement
    'support_ticket_response',        -- Reply on support ticket
    'maintenance_notice'
);

-- Channels we send notifications through.
CREATE TYPE notification_channel AS ENUM (
    'push',           -- Web push / mobile push
    'email',
    'sms',
    'in_app'          -- Just in the notification center, no external delivery
);

-- Delivery state per channel attempt.
CREATE TYPE delivery_state AS ENUM (
    'pending',
    'sent',
    'delivered',
    'opened',
    'failed',
    'bounced',           -- Email-specific
    'unsubscribed'       -- Recipient opted out
);

-- Admin action types — categorizes what an admin did.
CREATE TYPE admin_action_type AS ENUM (
    -- Cleaner application lifecycle
    'cleaner_application_approved',
    'cleaner_application_rejected',
    'cleaner_application_requested_info',

    -- Cleaner moderation
    'cleaner_suspended',
    'cleaner_suspension_lifted',
    'cleaner_deactivated',
    'cleaner_reactivated',
    'tier_manually_adjusted',
    'reliability_event_overturned',
    'appeal_decision_recorded',

    -- Customer moderation
    'customer_suspended',
    'customer_suspension_lifted',
    'customer_deleted',

    -- Booking interventions
    'booking_admin_cancelled',
    'booking_state_corrected',
    'booking_rescheduled_by_admin',

    -- Money
    'refund_issued',
    'manual_payout_adjustment',
    'commission_corrected',

    -- Disputes
    'dispute_mediation_started',
    'dispute_admin_resolved',
    'dispute_escalated_to_legal',

    -- Insurance / verification
    'insurance_verified',
    'insurance_rejected',
    'identity_manual_review',

    -- Reviews
    'review_hidden',
    'review_unhidden',

    -- Other
    'feature_flag_changed',
    'support_ticket_resolved',
    'data_export_fulfilled',
    'data_deletion_fulfilled'
);

-- Support ticket lifecycle.
CREATE TYPE support_ticket_status AS ENUM (
    'open',
    'awaiting_customer',
    'awaiting_admin',
    'in_progress',
    'resolved',
    'closed',
    'reopened'
);

-- Support ticket category.
CREATE TYPE support_ticket_category AS ENUM (
    'account_access',         -- Can't log in, password reset
    'billing_question',       -- Charge questions (not disputes)
    'app_bug',                -- Bug report
    'feature_request',
    'safety_concern',         -- Routes here from WF 16 safety category
    'data_request',           -- CCPA / GDPR / data export / deletion
    'partnership',            -- Press, partnerships, B2B
    'other'
);

-- Support ticket priority.
CREATE TYPE support_ticket_priority AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'              -- Safety concerns, payment failures during active job
);


-- =============================================================================
-- Table 45: notifications
-- =============================================================================
-- User-facing notifications. Stored for the notification center (WF 19) and
-- delivered via channels (push/email/SMS) tracked in notification_deliveries.
-- =============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who receives this notification.
    recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- What kind of notification.
    notification_type notification_type NOT NULL,

    -- Display content (rendered at write time per audit pattern).
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    deep_link TEXT,                    -- e.g., '/bookings/{id}', '/disputes/{id}'

    -- Optional related entity references.
    -- Each notification typically relates to one entity. Multiple FKs make
    -- the row queryable from any direction.
    related_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    related_dispute_id UUID REFERENCES disputes(id) ON DELETE SET NULL,
    related_payout_id UUID REFERENCES payouts(id) ON DELETE SET NULL,
    related_charge_id UUID REFERENCES charges(id) ON DELETE SET NULL,
    related_review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
    related_appeal_id UUID REFERENCES cleaner_appeals(id) ON DELETE SET NULL,

    -- Optional metadata (e.g., score delta, tier change context).
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

    -- Read tracking.
    read_at TIMESTAMPTZ,

    -- Auto-expiration. Default 90 days; cleanup job hard-deletes.
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '90 days',

    -- Template versioning.
    -- Allows future template changes without invalidating historical
    -- notification text.
    template_version INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'User-facing notifications. 90-day retention via cleanup job.';
COMMENT ON COLUMN notifications.expires_at IS 'Default 90 days; daily cleanup job hard-deletes past records.';
COMMENT ON COLUMN notifications.template_version IS 'Pinned at write time; immune to future template changes.';

CREATE INDEX idx_notifications_recipient_unread ON notifications(recipient_user_id, created_at DESC)
    WHERE read_at IS NULL;
CREATE INDEX idx_notifications_recipient ON notifications(recipient_user_id, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(notification_type, created_at DESC);
CREATE INDEX idx_notifications_expires ON notifications(expires_at);
CREATE INDEX idx_notifications_booking ON notifications(related_booking_id) WHERE related_booking_id IS NOT NULL;
CREATE INDEX idx_notifications_dispute ON notifications(related_dispute_id) WHERE related_dispute_id IS NOT NULL;


-- =============================================================================
-- Table 46: notification_preferences
-- =============================================================================
-- Per-user notification channel preferences. One row per user.
-- =============================================================================

CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- TOP-LEVEL CHANNEL TOGGLES.
    -- When these are off, NO notifications go out via that channel.
    -- These override per-type toggles in the JSONB below.
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    -- For cleaners: 4hr response SLA awareness.
    -- When this is true, push notifications for active bookings cannot be
    -- disabled (WF 30 locked rule). The flag is informational; enforcement
    -- happens in app code.
    sla_critical_push_required BOOLEAN NOT NULL DEFAULT FALSE,

    -- PER-TYPE TOGGLES stored as JSONB for flexibility.
    -- Each notification_type has push/email/sms boolean.
    -- Example:
    --   {
    --     "booking_confirmed": {"push": true, "email": true, "sms": false},
    --     "review_received": {"push": true, "email": false, "sms": false},
    --     ...
    --   }
    -- Missing types fall back to the per-channel default (true if channel enabled).
    per_type_preferences JSONB NOT NULL DEFAULT '{}'::JSONB,

    -- QUIET HOURS (schema-ready, MVP UI deferred).
    -- When enabled, push notifications between start and end times are
    -- buffered (delivered at start of day) instead of waking the user.
    -- Times stored as INTEGER minutes since midnight in user's timezone.
    quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    quiet_hours_start_minutes INTEGER CHECK (quiet_hours_start_minutes BETWEEN 0 AND 1439),
    quiet_hours_end_minutes INTEGER CHECK (quiet_hours_end_minutes BETWEEN 0 AND 1439),

    -- Email and SMS delivery details.
    email_address CITEXT,                    -- Override on user.email if needed
    sms_phone TEXT,                          -- Override on user.phone if needed

    -- Web push subscription endpoints. JSONB array of push subscription
    -- objects (one per device).
    -- Each entry: { "endpoint": "...", "keys": { "p256dh": "...", "auth": "..." }, "user_agent": "...", "subscribed_at": "..." }
    push_subscriptions JSONB NOT NULL DEFAULT '[]'::JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notification_preferences IS 'User notification channel + per-type preferences with quiet hours.';
COMMENT ON COLUMN notification_preferences.sla_critical_push_required IS 'Set TRUE for cleaners; enforces push during active bookings.';
COMMENT ON COLUMN notification_preferences.per_type_preferences IS 'JSONB per-type toggles. Missing types use channel defaults.';

CREATE TRIGGER notification_preferences_set_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);


-- =============================================================================
-- Table 47: notification_deliveries
-- =============================================================================
-- Log of each delivery attempt per channel. Used for retry logic and
-- compliance (proof of attempted delivery).
-- =============================================================================

CREATE TABLE notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,

    -- Which channel was attempted.
    channel notification_channel NOT NULL,

    -- Where the notification went (denormalized at send time).
    -- For push: subscription endpoint
    -- For email: address
    -- For SMS: phone number
    delivery_target TEXT NOT NULL,

    -- State of this delivery attempt.
    state delivery_state NOT NULL DEFAULT 'pending',

    -- Provider-specific message ID for tracking (e.g., Resend message_id).
    provider_message_id TEXT,
    provider_name TEXT,        -- e.g., 'resend', 'twilio', 'web-push'

    -- Lifecycle.
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failed_reason TEXT,

    -- Retry tracking.
    attempt_number INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notification_deliveries IS 'Per-channel delivery attempts. Provides retry logic and compliance audit.';

CREATE INDEX idx_notification_deliveries_notification ON notification_deliveries(notification_id);
CREATE INDEX idx_notification_deliveries_pending ON notification_deliveries(state, created_at)
    WHERE state IN ('pending', 'failed');
CREATE INDEX idx_notification_deliveries_provider ON notification_deliveries(provider_message_id) WHERE provider_message_id IS NOT NULL;


-- =============================================================================
-- Table 48: admin_actions
-- =============================================================================
-- APPEND-ONLY audit log of admin operations.
-- Critical for legal defense, dispute resolution, regulatory compliance.
-- =============================================================================

CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who took the action.
    admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- What kind of action.
    action_type admin_action_type NOT NULL,

    -- Target of the action — flexible references.
    -- Multiple FKs allow filtering by target type, but only one is typically
    -- non-null per row.
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    target_dispute_id UUID REFERENCES disputes(id) ON DELETE SET NULL,
    target_charge_id UUID REFERENCES charges(id) ON DELETE SET NULL,
    target_payout_id UUID REFERENCES payouts(id) ON DELETE SET NULL,
    target_refund_id UUID REFERENCES refunds(id) ON DELETE SET NULL,
    target_review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
    target_appeal_id UUID REFERENCES cleaner_appeals(id) ON DELETE SET NULL,
    target_application_id UUID,             -- FK declared in B7 (cleaner_applications)
    target_insurance_id UUID REFERENCES insurance_policies(id) ON DELETE SET NULL,
    target_suspension_id UUID REFERENCES cleaner_suspensions(id) ON DELETE SET NULL,

    -- Free-form description of the action.
    description TEXT NOT NULL,

    -- Reason / justification (visible to other admins reviewing later).
    reason TEXT,

    -- Before / after state for full auditability.
    -- Captures the relevant fields before and after the change.
    -- Example:
    --   before: {"tier": "top_performer", "score": 76}
    --   after:  {"tier": "proven_specialist", "score": 76}
    before_state JSONB,
    after_state JSONB,

    -- Optional metadata (IP address, admin client info, related ticket).
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

    -- IP address for compliance.
    admin_ip_address INET,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE admin_actions IS 'Append-only audit log of admin operations. Legal/compliance critical.';
COMMENT ON COLUMN admin_actions.before_state IS 'Snapshot of relevant fields BEFORE the action.';
COMMENT ON COLUMN admin_actions.after_state IS 'Snapshot of relevant fields AFTER the action.';

-- Append-only: no UPDATE or DELETE on admin_actions.
CREATE TRIGGER admin_actions_no_modify
    BEFORE UPDATE OR DELETE ON admin_actions
    FOR EACH ROW
    EXECUTE FUNCTION reject_modifications();

CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_user_id, created_at DESC);
CREATE INDEX idx_admin_actions_type ON admin_actions(action_type, created_at DESC);
CREATE INDEX idx_admin_actions_target_user ON admin_actions(target_user_id, created_at DESC) WHERE target_user_id IS NOT NULL;
CREATE INDEX idx_admin_actions_target_booking ON admin_actions(target_booking_id) WHERE target_booking_id IS NOT NULL;
CREATE INDEX idx_admin_actions_target_dispute ON admin_actions(target_dispute_id) WHERE target_dispute_id IS NOT NULL;
CREATE INDEX idx_admin_actions_created ON admin_actions(created_at DESC);


-- =============================================================================
-- Table 49: support_tickets
-- =============================================================================
-- Customer-initiated support issues. Distinct from disputes.
-- =============================================================================

CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Human-readable ticket number for support reference.
    ticket_number TEXT NOT NULL UNIQUE,

    -- Who filed it.
    submitter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- Categorization.
    category support_ticket_category NOT NULL,
    priority support_ticket_priority NOT NULL DEFAULT 'normal',

    -- Content.
    subject TEXT NOT NULL,
    initial_message TEXT NOT NULL,

    -- Optional related entity. Most tickets reference one of these.
    related_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    related_charge_id UUID REFERENCES charges(id) ON DELETE SET NULL,

    -- Lifecycle state.
    status support_ticket_status NOT NULL DEFAULT 'open',

    -- Assignment.
    assigned_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,

    -- Resolution.
    resolved_at TIMESTAMPTZ,
    resolved_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    closed_at TIMESTAMPTZ,
    reopened_at TIMESTAMPTZ,

    -- Customer satisfaction (optional follow-up).
    csat_rating INTEGER CHECK (csat_rating IS NULL OR (csat_rating >= 1 AND csat_rating <= 5)),
    csat_submitted_at TIMESTAMPTZ,
    csat_feedback TEXT,

    -- Time tracking.
    first_response_at TIMESTAMPTZ,       -- For SLA monitoring
    last_admin_response_at TIMESTAMPTZ,
    last_customer_response_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE support_tickets IS 'Customer-initiated support issues. Separate from disputes.';
COMMENT ON COLUMN support_tickets.category IS 'Account access, billing question, app bug, etc.';
COMMENT ON COLUMN support_tickets.priority IS 'Urgent for safety concerns and active-booking payment issues.';

CREATE TRIGGER support_tickets_set_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_support_tickets_status ON support_tickets(status, priority, created_at);
CREATE INDEX idx_support_tickets_submitter ON support_tickets(submitter_user_id, created_at DESC);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_admin_id, status) WHERE assigned_admin_id IS NOT NULL;
CREATE INDEX idx_support_tickets_unresolved ON support_tickets(priority, created_at)
    WHERE status IN ('open', 'awaiting_admin', 'in_progress');
CREATE INDEX idx_support_tickets_ticket_number ON support_tickets(ticket_number);


-- =============================================================================
-- Bonus table: support_ticket_messages
-- =============================================================================
-- Threaded conversation on a support ticket. (Equivalent to dispute_messages
-- but for support context.)
-- =============================================================================

CREATE TABLE support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,

    -- Sender. customer / admin.
    sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'cleaner', 'admin', 'system')),

    body TEXT NOT NULL,

    -- Optional attachments (images, documents).
    attachment_urls TEXT[],

    -- Internal admin notes (not visible to customer).
    is_internal_note BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE support_ticket_messages IS 'Threaded support ticket conversation; supports internal admin notes.';

-- Append-only.
CREATE TRIGGER support_ticket_messages_no_update
    BEFORE UPDATE OR DELETE ON support_ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION reject_modifications();

CREATE INDEX idx_support_ticket_messages_ticket ON support_ticket_messages(ticket_id, created_at);
CREATE INDEX idx_support_ticket_messages_sender ON support_ticket_messages(sender_user_id, created_at DESC);
CREATE INDEX idx_support_ticket_messages_visible ON support_ticket_messages(ticket_id, created_at)
    WHERE is_internal_note = FALSE;


-- =============================================================================
-- Row-Level Security (RLS) Policies for B6
-- =============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Notifications: recipient reads/marks-read own; admin reads all.
CREATE POLICY notifications_read_self ON notifications
    FOR SELECT USING (recipient_user_id = auth.uid() OR is_admin());

CREATE POLICY notifications_update_self ON notifications
    FOR UPDATE USING (recipient_user_id = auth.uid() OR is_admin());

-- Notification preferences: user reads/writes own.
CREATE POLICY notification_preferences_read_self ON notification_preferences
    FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY notification_preferences_write_self ON notification_preferences
    FOR ALL USING (user_id = auth.uid() OR is_admin());

-- Notification deliveries: admin only (operational data).
CREATE POLICY notification_deliveries_read_admin ON notification_deliveries
    FOR SELECT USING (is_admin());

-- Admin actions: admin only.
CREATE POLICY admin_actions_read_admin ON admin_actions
    FOR SELECT USING (is_admin());

CREATE POLICY admin_actions_insert_admin ON admin_actions
    FOR INSERT WITH CHECK (
        is_admin()
        AND admin_user_id = auth.uid()
    );

-- Support tickets: submitter reads/writes own; assigned/admin reads all.
CREATE POLICY support_tickets_read_self ON support_tickets
    FOR SELECT USING (
        submitter_user_id = auth.uid()
        OR assigned_admin_id = auth.uid()
        OR is_admin()
    );

CREATE POLICY support_tickets_insert_self ON support_tickets
    FOR INSERT WITH CHECK (submitter_user_id = auth.uid());

CREATE POLICY support_tickets_update_party ON support_tickets
    FOR UPDATE USING (
        submitter_user_id = auth.uid()
        OR assigned_admin_id = auth.uid()
        OR is_admin()
    );

-- Support ticket messages: ticket parties + admin.
-- Internal notes are admin-only.
CREATE POLICY support_ticket_messages_read_party ON support_ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets t
            WHERE t.id = support_ticket_messages.ticket_id
            AND (t.submitter_user_id = auth.uid()
                 OR t.assigned_admin_id = auth.uid()
                 OR is_admin())
        )
        AND (is_internal_note = FALSE OR is_admin())
    );

CREATE POLICY support_ticket_messages_insert_party ON support_ticket_messages
    FOR INSERT WITH CHECK (
        sender_user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM support_tickets t
            WHERE t.id = support_ticket_messages.ticket_id
            AND (t.submitter_user_id = auth.uid()
                 OR t.assigned_admin_id = auth.uid()
                 OR is_admin())
        )
    );


-- =============================================================================
-- Notes for B7 and beyond
-- =============================================================================
-- 1. NOTIFICATION CLEANUP JOB (daily):
--    DELETE FROM notifications WHERE expires_at < NOW();
--    Default 90-day retention. Critical events stay in their respective
--    event tables (booking_state_events, reliability_events) — only the
--    notification record is purged, not the underlying history.
--
-- 2. NOTIFICATION DELIVERY PIPELINE:
--    a. Application code creates a notifications row.
--    b. Worker reads the user's notification_preferences.
--    c. For each enabled channel matching the notification_type:
--       - INSERT notification_deliveries row (state='pending')
--       - Send via provider (Resend / Twilio / web-push)
--       - Update notification_deliveries with provider_message_id
--    d. Provider webhooks update delivery state to delivered/opened/bounced.
--
-- 3. ADMIN ACTION WRITE PATTERN:
--    Every admin operation in the app should write an admin_actions row in
--    the same transaction as the modification. Pattern:
--      BEGIN;
--        UPDATE cleaner_profiles SET ... WHERE id = X;
--        INSERT INTO admin_actions (...) VALUES (...);
--      COMMIT;
--    If the UPDATE fails or the INSERT fails, both roll back. Audit and
--    state stay in sync.
--
-- 4. SUPPORT TICKET → DISPUTE ESCALATION:
--    If a support_ticket is determined to actually be a dispute, admin can
--    create a disputes row and link via metadata. The two systems are
--    intentionally separate (different SLA, different access patterns) but
--    can reference each other.
--
-- 5. WF 47 (CONTACT SUPPORT) DRIVES support_tickets INSERT:
--    Subject + body + category + optional related_booking_id.
--    Initial state = 'open', priority defaults to 'normal'.
--    Safety category auto-escalates priority to 'urgent'.
-- =============================================================================

-- End of B6
