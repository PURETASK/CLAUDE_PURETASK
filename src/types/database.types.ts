export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      addresses: {
        Row: {
          access_instructions: string | null;
          address_type: Database['public']['Enums']['address_type'];
          city: string;
          country: string;
          created_at: string;
          deleted_at: string | null;
          geocoded_at: string | null;
          id: string;
          label: string | null;
          latitude: number | null;
          longitude: number | null;
          owner_user_id: string;
          state: string;
          street_1: string;
          street_2: string | null;
          updated_at: string;
          zip_code: string;
        };
        Insert: {
          access_instructions?: string | null;
          address_type: Database['public']['Enums']['address_type'];
          city: string;
          country?: string;
          created_at?: string;
          deleted_at?: string | null;
          geocoded_at?: string | null;
          id?: string;
          label?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          owner_user_id: string;
          state: string;
          street_1: string;
          street_2?: string | null;
          updated_at?: string;
          zip_code: string;
        };
        Update: {
          access_instructions?: string | null;
          address_type?: Database['public']['Enums']['address_type'];
          city?: string;
          country?: string;
          created_at?: string;
          deleted_at?: string | null;
          geocoded_at?: string | null;
          id?: string;
          label?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          owner_user_id?: string;
          state?: string;
          street_1?: string;
          street_2?: string | null;
          updated_at?: string;
          zip_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'addresses_owner_user_id_fkey';
            columns: ['owner_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      admin_actions: {
        Row: {
          action_type: Database['public']['Enums']['admin_action_type'];
          admin_ip_address: unknown;
          admin_user_id: string;
          after_state: Json | null;
          before_state: Json | null;
          created_at: string;
          description: string;
          id: string;
          metadata: Json;
          reason: string | null;
          target_appeal_id: string | null;
          target_application_id: string | null;
          target_booking_id: string | null;
          target_charge_id: string | null;
          target_dispute_id: string | null;
          target_insurance_id: string | null;
          target_payout_id: string | null;
          target_refund_id: string | null;
          target_review_id: string | null;
          target_suspension_id: string | null;
          target_user_id: string | null;
        };
        Insert: {
          action_type: Database['public']['Enums']['admin_action_type'];
          admin_ip_address?: unknown;
          admin_user_id: string;
          after_state?: Json | null;
          before_state?: Json | null;
          created_at?: string;
          description: string;
          id?: string;
          metadata?: Json;
          reason?: string | null;
          target_appeal_id?: string | null;
          target_application_id?: string | null;
          target_booking_id?: string | null;
          target_charge_id?: string | null;
          target_dispute_id?: string | null;
          target_insurance_id?: string | null;
          target_payout_id?: string | null;
          target_refund_id?: string | null;
          target_review_id?: string | null;
          target_suspension_id?: string | null;
          target_user_id?: string | null;
        };
        Update: {
          action_type?: Database['public']['Enums']['admin_action_type'];
          admin_ip_address?: unknown;
          admin_user_id?: string;
          after_state?: Json | null;
          before_state?: Json | null;
          created_at?: string;
          description?: string;
          id?: string;
          metadata?: Json;
          reason?: string | null;
          target_appeal_id?: string | null;
          target_application_id?: string | null;
          target_booking_id?: string | null;
          target_charge_id?: string | null;
          target_dispute_id?: string | null;
          target_insurance_id?: string | null;
          target_payout_id?: string | null;
          target_refund_id?: string | null;
          target_review_id?: string | null;
          target_suspension_id?: string | null;
          target_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'admin_actions_admin_user_id_fkey';
            columns: ['admin_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'admin_actions_target_appeal_id_fkey';
            columns: ['target_appeal_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_appeals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'admin_actions_target_booking_id_fkey';
            columns: ['target_booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'admin_actions_target_charge_id_fkey';
            columns: ['target_charge_id'];
            isOneToOne: false;
            referencedRelation: 'charges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'admin_actions_target_dispute_id_fkey';
            columns: ['target_dispute_id'];
            isOneToOne: false;
            referencedRelation: 'disputes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'admin_actions_target_insurance_id_fkey';
            columns: ['target_insurance_id'];
            isOneToOne: false;
            referencedRelation: 'insurance_policies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'admin_actions_target_payout_id_fkey';
            columns: ['target_payout_id'];
            isOneToOne: false;
            referencedRelation: 'payouts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'admin_actions_target_refund_id_fkey';
            columns: ['target_refund_id'];
            isOneToOne: false;
            referencedRelation: 'refunds';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'admin_actions_target_review_id_fkey';
            columns: ['target_review_id'];
            isOneToOne: false;
            referencedRelation: 'reviews';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'admin_actions_target_suspension_id_fkey';
            columns: ['target_suspension_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_suspensions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'admin_actions_target_user_id_fkey';
            columns: ['target_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_admin_actions_application';
            columns: ['target_application_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_applications';
            referencedColumns: ['id'];
          },
        ];
      };
      admin_profiles: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          last_active_at: string | null;
          permission_level: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          last_active_at?: string | null;
          permission_level?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          last_active_at?: string | null;
          permission_level?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'admin_profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      auth_sessions: {
        Row: {
          clerk_session_id: string;
          created_at: string;
          device_label: string;
          expires_at: string;
          id: string;
          ip_address: unknown;
          last_active_at: string;
          revoked_at: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          clerk_session_id: string;
          created_at?: string;
          device_label: string;
          expires_at?: string;
          id?: string;
          ip_address?: unknown;
          last_active_at?: string;
          revoked_at?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          clerk_session_id?: string;
          created_at?: string;
          device_label?: string;
          expires_at?: string;
          id?: string;
          ip_address?: unknown;
          last_active_at?: string;
          revoked_at?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'auth_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      availability_rules: {
        Row: {
          cleaner_id: string;
          created_at: string;
          day_of_week: number;
          end_minutes: number;
          id: string;
          is_active: boolean;
          start_minutes: number;
          updated_at: string;
        };
        Insert: {
          cleaner_id: string;
          created_at?: string;
          day_of_week: number;
          end_minutes: number;
          id?: string;
          is_active?: boolean;
          start_minutes: number;
          updated_at?: string;
        };
        Update: {
          cleaner_id?: string;
          created_at?: string;
          day_of_week?: number;
          end_minutes?: number;
          id?: string;
          is_active?: boolean;
          start_minutes?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'availability_rules_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      background_checks: {
        Row: {
          admin_decision: string | null;
          admin_notes: string | null;
          application_id: string | null;
          cleaner_id: string | null;
          completed_at: string | null;
          created_at: string;
          expires_at: string | null;
          external_candidate_id: string | null;
          external_check_id: string | null;
          id: string;
          provider: string;
          renewal_reminder_sent_at: string | null;
          replaced_at: string | null;
          replaced_by_check_id: string | null;
          requested_at: string;
          result_details: Json | null;
          result_summary: string | null;
          reviewed_at: string | null;
          reviewed_by_admin_id: string | null;
          started_at: string | null;
          state: Database['public']['Enums']['background_check_state'];
          subject_user_id: string;
          updated_at: string;
        };
        Insert: {
          admin_decision?: string | null;
          admin_notes?: string | null;
          application_id?: string | null;
          cleaner_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          expires_at?: string | null;
          external_candidate_id?: string | null;
          external_check_id?: string | null;
          id?: string;
          provider?: string;
          renewal_reminder_sent_at?: string | null;
          replaced_at?: string | null;
          replaced_by_check_id?: string | null;
          requested_at?: string;
          result_details?: Json | null;
          result_summary?: string | null;
          reviewed_at?: string | null;
          reviewed_by_admin_id?: string | null;
          started_at?: string | null;
          state?: Database['public']['Enums']['background_check_state'];
          subject_user_id: string;
          updated_at?: string;
        };
        Update: {
          admin_decision?: string | null;
          admin_notes?: string | null;
          application_id?: string | null;
          cleaner_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          expires_at?: string | null;
          external_candidate_id?: string | null;
          external_check_id?: string | null;
          id?: string;
          provider?: string;
          renewal_reminder_sent_at?: string | null;
          replaced_at?: string | null;
          replaced_by_check_id?: string | null;
          requested_at?: string;
          result_details?: Json | null;
          result_summary?: string | null;
          reviewed_at?: string | null;
          reviewed_by_admin_id?: string | null;
          started_at?: string | null;
          state?: Database['public']['Enums']['background_check_state'];
          subject_user_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'background_checks_application_id_fkey';
            columns: ['application_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_applications';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'background_checks_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'background_checks_replaced_by_check_id_fkey';
            columns: ['replaced_by_check_id'];
            isOneToOne: false;
            referencedRelation: 'background_checks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'background_checks_reviewed_by_admin_id_fkey';
            columns: ['reviewed_by_admin_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'background_checks_subject_user_id_fkey';
            columns: ['subject_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      badges: {
        Row: {
          badge_type: Database['public']['Enums']['badge_type'];
          created_at: string;
          description: string;
          display_label: string;
          display_order: number;
          earning_criteria: Json;
          icon_name: string;
          id: string;
          is_active: boolean;
          is_auto_earned: boolean;
          is_zip_locked: boolean;
          key: string;
          updated_at: string;
        };
        Insert: {
          badge_type: Database['public']['Enums']['badge_type'];
          created_at?: string;
          description: string;
          display_label: string;
          display_order?: number;
          earning_criteria: Json;
          icon_name: string;
          id?: string;
          is_active?: boolean;
          is_auto_earned?: boolean;
          is_zip_locked?: boolean;
          key: string;
          updated_at?: string;
        };
        Update: {
          badge_type?: Database['public']['Enums']['badge_type'];
          created_at?: string;
          description?: string;
          display_label?: string;
          display_order?: number;
          earning_criteria?: Json;
          icon_name?: string;
          id?: string;
          is_active?: boolean;
          is_auto_earned?: boolean;
          is_zip_locked?: boolean;
          key?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      booking_photos: {
        Row: {
          booking_id: string;
          capture_latitude: number | null;
          capture_longitude: number | null;
          captured_at: string | null;
          cdn_url: string | null;
          delete_after_at: string | null;
          deleted_at: string | null;
          file_size_bytes: number;
          height_pixels: number | null;
          id: string;
          mime_type: string;
          purpose: Database['public']['Enums']['photo_purpose'];
          room_label: string | null;
          storage_key: string;
          thumbnail_url: string | null;
          uploaded_at: string;
          uploaded_by_user_id: string;
          width_pixels: number | null;
        };
        Insert: {
          booking_id: string;
          capture_latitude?: number | null;
          capture_longitude?: number | null;
          captured_at?: string | null;
          cdn_url?: string | null;
          delete_after_at?: string | null;
          deleted_at?: string | null;
          file_size_bytes: number;
          height_pixels?: number | null;
          id?: string;
          mime_type: string;
          purpose: Database['public']['Enums']['photo_purpose'];
          room_label?: string | null;
          storage_key: string;
          thumbnail_url?: string | null;
          uploaded_at?: string;
          uploaded_by_user_id: string;
          width_pixels?: number | null;
        };
        Update: {
          booking_id?: string;
          capture_latitude?: number | null;
          capture_longitude?: number | null;
          captured_at?: string | null;
          cdn_url?: string | null;
          delete_after_at?: string | null;
          deleted_at?: string | null;
          file_size_bytes?: number;
          height_pixels?: number | null;
          id?: string;
          mime_type?: string;
          purpose?: Database['public']['Enums']['photo_purpose'];
          room_label?: string | null;
          storage_key?: string;
          thumbnail_url?: string | null;
          uploaded_at?: string;
          uploaded_by_user_id?: string;
          width_pixels?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'booking_photos_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'booking_photos_uploaded_by_user_id_fkey';
            columns: ['uploaded_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      booking_state_events: {
        Row: {
          booking_id: string;
          created_at: string;
          id: string;
          metadata: Json;
          new_state: Database['public']['Enums']['booking_state'];
          previous_state: Database['public']['Enums']['booking_state'] | null;
          reason: string | null;
          triggered_by_system: string | null;
          triggered_by_user_id: string | null;
        };
        Insert: {
          booking_id: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          new_state: Database['public']['Enums']['booking_state'];
          previous_state?: Database['public']['Enums']['booking_state'] | null;
          reason?: string | null;
          triggered_by_system?: string | null;
          triggered_by_user_id?: string | null;
        };
        Update: {
          booking_id?: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          new_state?: Database['public']['Enums']['booking_state'];
          previous_state?: Database['public']['Enums']['booking_state'] | null;
          reason?: string | null;
          triggered_by_system?: string | null;
          triggered_by_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'booking_state_events_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'booking_state_events_triggered_by_user_id_fkey';
            columns: ['triggered_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      bookings: {
        Row: {
          address_id: string;
          auto_approval_due_at: string | null;
          auto_approved_at: string | null;
          booking_number: string;
          cancellation_penalty_cents: number | null;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          cleaner_arrived_at: string | null;
          cleaner_id: string | null;
          cleaner_payout_cents: number;
          cleaner_started_transit_at: string | null;
          cleaner_subtotal_cents: number;
          cleaning_completed_at: string | null;
          clock_in_at: string | null;
          clock_out_at: string | null;
          commission_rate_at_booking: number;
          created_at: string;
          currency: string;
          customer_approved_at: string | null;
          customer_id: string;
          customer_notes: string | null;
          dispute_window_ends_at: string | null;
          duration_hours_decimal: number;
          end_at: string;
          hourly_rate_cents: number;
          id: string;
          is_running_late: boolean;
          late_estimate_minutes: number | null;
          late_flagged_at: string | null;
          platform_fee_cents: number;
          recurring_schedule_id: string | null;
          service_id: string;
          start_at: string;
          state: Database['public']['Enums']['booking_state'];
          tier_at_booking: Database['public']['Enums']['tier_name'];
          total_charge_cents: number;
          updated_at: string;
        };
        Insert: {
          address_id: string;
          auto_approval_due_at?: string | null;
          auto_approved_at?: string | null;
          booking_number: string;
          cancellation_penalty_cents?: number | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cleaner_arrived_at?: string | null;
          cleaner_id?: string | null;
          cleaner_payout_cents: number;
          cleaner_started_transit_at?: string | null;
          cleaner_subtotal_cents: number;
          cleaning_completed_at?: string | null;
          clock_in_at?: string | null;
          clock_out_at?: string | null;
          commission_rate_at_booking: number;
          created_at?: string;
          currency?: string;
          customer_approved_at?: string | null;
          customer_id: string;
          customer_notes?: string | null;
          dispute_window_ends_at?: string | null;
          duration_hours_decimal: number;
          end_at: string;
          hourly_rate_cents: number;
          id?: string;
          is_running_late?: boolean;
          late_estimate_minutes?: number | null;
          late_flagged_at?: string | null;
          platform_fee_cents: number;
          recurring_schedule_id?: string | null;
          service_id: string;
          start_at: string;
          state?: Database['public']['Enums']['booking_state'];
          tier_at_booking: Database['public']['Enums']['tier_name'];
          total_charge_cents: number;
          updated_at?: string;
        };
        Update: {
          address_id?: string;
          auto_approval_due_at?: string | null;
          auto_approved_at?: string | null;
          booking_number?: string;
          cancellation_penalty_cents?: number | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cleaner_arrived_at?: string | null;
          cleaner_id?: string | null;
          cleaner_payout_cents?: number;
          cleaner_started_transit_at?: string | null;
          cleaner_subtotal_cents?: number;
          cleaning_completed_at?: string | null;
          clock_in_at?: string | null;
          clock_out_at?: string | null;
          commission_rate_at_booking?: number;
          created_at?: string;
          currency?: string;
          customer_approved_at?: string | null;
          customer_id?: string;
          customer_notes?: string | null;
          dispute_window_ends_at?: string | null;
          duration_hours_decimal?: number;
          end_at?: string;
          hourly_rate_cents?: number;
          id?: string;
          is_running_late?: boolean;
          late_estimate_minutes?: number | null;
          late_flagged_at?: string | null;
          platform_fee_cents?: number;
          recurring_schedule_id?: string | null;
          service_id?: string;
          start_at?: string;
          state?: Database['public']['Enums']['booking_state'];
          tier_at_booking?: Database['public']['Enums']['tier_name'];
          total_charge_cents?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bookings_address_id_fkey';
            columns: ['address_id'];
            isOneToOne: false;
            referencedRelation: 'addresses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customer_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_bookings_recurring_schedule';
            columns: ['recurring_schedule_id'];
            isOneToOne: false;
            referencedRelation: 'recurring_schedules';
            referencedColumns: ['id'];
          },
        ];
      };
      charges: {
        Row: {
          amount_cents: number;
          application_fee_cents: number;
          authorized_at: string | null;
          booking_id: string | null;
          captured_at: string | null;
          created_at: string;
          currency: string;
          customer_id: string;
          failed_at: string | null;
          failed_reason: string | null;
          id: string;
          idempotency_key: string;
          payment_method_id: string;
          state: Database['public']['Enums']['charge_state'];
          stripe_charge_id: string | null;
          stripe_payment_intent_id: string | null;
          tip_id: string | null;
          total_refunded_cents: number;
          updated_at: string;
        };
        Insert: {
          amount_cents: number;
          application_fee_cents?: number;
          authorized_at?: string | null;
          booking_id?: string | null;
          captured_at?: string | null;
          created_at?: string;
          currency?: string;
          customer_id: string;
          failed_at?: string | null;
          failed_reason?: string | null;
          id?: string;
          idempotency_key: string;
          payment_method_id: string;
          state?: Database['public']['Enums']['charge_state'];
          stripe_charge_id?: string | null;
          stripe_payment_intent_id?: string | null;
          tip_id?: string | null;
          total_refunded_cents?: number;
          updated_at?: string;
        };
        Update: {
          amount_cents?: number;
          application_fee_cents?: number;
          authorized_at?: string | null;
          booking_id?: string | null;
          captured_at?: string | null;
          created_at?: string;
          currency?: string;
          customer_id?: string;
          failed_at?: string | null;
          failed_reason?: string | null;
          id?: string;
          idempotency_key?: string;
          payment_method_id?: string;
          state?: Database['public']['Enums']['charge_state'];
          stripe_charge_id?: string | null;
          stripe_payment_intent_id?: string | null;
          tip_id?: string | null;
          total_refunded_cents?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'charges_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'charges_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customer_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'charges_payment_method_id_fkey';
            columns: ['payment_method_id'];
            isOneToOne: false;
            referencedRelation: 'payment_methods';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'charges_tip_id_fkey';
            columns: ['tip_id'];
            isOneToOne: false;
            referencedRelation: 'tips';
            referencedColumns: ['id'];
          },
        ];
      };
      cleaner_appeals: {
        Row: {
          admin_decision_notes: string | null;
          appeal_text: string;
          cleaner_id: string;
          cleaner_notified_at: string | null;
          created_at: string;
          id: string;
          review_due_at: string;
          reviewed_at: string | null;
          reviewed_by_admin_id: string | null;
          status: Database['public']['Enums']['appeal_status'];
          submitted_at: string;
          target_reliability_event_id: string | null;
          target_tier_assignment_id: string | null;
          target_type: Database['public']['Enums']['appeal_target_type'];
          updated_at: string;
        };
        Insert: {
          admin_decision_notes?: string | null;
          appeal_text: string;
          cleaner_id: string;
          cleaner_notified_at?: string | null;
          created_at?: string;
          id?: string;
          review_due_at?: string;
          reviewed_at?: string | null;
          reviewed_by_admin_id?: string | null;
          status?: Database['public']['Enums']['appeal_status'];
          submitted_at?: string;
          target_reliability_event_id?: string | null;
          target_tier_assignment_id?: string | null;
          target_type: Database['public']['Enums']['appeal_target_type'];
          updated_at?: string;
        };
        Update: {
          admin_decision_notes?: string | null;
          appeal_text?: string;
          cleaner_id?: string;
          cleaner_notified_at?: string | null;
          created_at?: string;
          id?: string;
          review_due_at?: string;
          reviewed_at?: string | null;
          reviewed_by_admin_id?: string | null;
          status?: Database['public']['Enums']['appeal_status'];
          submitted_at?: string;
          target_reliability_event_id?: string | null;
          target_tier_assignment_id?: string | null;
          target_type?: Database['public']['Enums']['appeal_target_type'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cleaner_appeals_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cleaner_appeals_reviewed_by_admin_id_fkey';
            columns: ['reviewed_by_admin_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cleaner_appeals_target_reliability_event_id_fkey';
            columns: ['target_reliability_event_id'];
            isOneToOne: false;
            referencedRelation: 'reliability_events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cleaner_appeals_target_tier_assignment_id_fkey';
            columns: ['target_tier_assignment_id'];
            isOneToOne: false;
            referencedRelation: 'tier_assignments';
            referencedColumns: ['id'];
          },
        ];
      };
      cleaner_applications: {
        Row: {
          admin_notes: string | null;
          application_data: Json;
          application_number: string;
          approved_at: string | null;
          background_check_id: string | null;
          cleaner_profile_id: string | null;
          created_at: string;
          decision_at: string | null;
          home_zip: string | null;
          id: string;
          identity_verification_id: string | null;
          info_request_message: string | null;
          info_requested_at: string | null;
          info_responded_at: string | null;
          initial_insurance_policy_id: string | null;
          pending_stripe_account_id: string | null;
          referral_source: string | null;
          referrer_user_id: string | null;
          rejection_reason: string | null;
          review_started_at: string | null;
          reviewed_by_admin_id: string | null;
          state: Database['public']['Enums']['application_state'];
          stripe_onboarding_completed_at: string | null;
          stripe_onboarding_link: string | null;
          submitted_at: string | null;
          travel_radius_miles: number | null;
          updated_at: string;
          user_id: string;
          why_puretask_text: string | null;
          years_experience: number | null;
        };
        Insert: {
          admin_notes?: string | null;
          application_data?: Json;
          application_number: string;
          approved_at?: string | null;
          background_check_id?: string | null;
          cleaner_profile_id?: string | null;
          created_at?: string;
          decision_at?: string | null;
          home_zip?: string | null;
          id?: string;
          identity_verification_id?: string | null;
          info_request_message?: string | null;
          info_requested_at?: string | null;
          info_responded_at?: string | null;
          initial_insurance_policy_id?: string | null;
          pending_stripe_account_id?: string | null;
          referral_source?: string | null;
          referrer_user_id?: string | null;
          rejection_reason?: string | null;
          review_started_at?: string | null;
          reviewed_by_admin_id?: string | null;
          state?: Database['public']['Enums']['application_state'];
          stripe_onboarding_completed_at?: string | null;
          stripe_onboarding_link?: string | null;
          submitted_at?: string | null;
          travel_radius_miles?: number | null;
          updated_at?: string;
          user_id: string;
          why_puretask_text?: string | null;
          years_experience?: number | null;
        };
        Update: {
          admin_notes?: string | null;
          application_data?: Json;
          application_number?: string;
          approved_at?: string | null;
          background_check_id?: string | null;
          cleaner_profile_id?: string | null;
          created_at?: string;
          decision_at?: string | null;
          home_zip?: string | null;
          id?: string;
          identity_verification_id?: string | null;
          info_request_message?: string | null;
          info_requested_at?: string | null;
          info_responded_at?: string | null;
          initial_insurance_policy_id?: string | null;
          pending_stripe_account_id?: string | null;
          referral_source?: string | null;
          referrer_user_id?: string | null;
          rejection_reason?: string | null;
          review_started_at?: string | null;
          reviewed_by_admin_id?: string | null;
          state?: Database['public']['Enums']['application_state'];
          stripe_onboarding_completed_at?: string | null;
          stripe_onboarding_link?: string | null;
          submitted_at?: string | null;
          travel_radius_miles?: number | null;
          updated_at?: string;
          user_id?: string;
          why_puretask_text?: string | null;
          years_experience?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'cleaner_applications_cleaner_profile_id_fkey';
            columns: ['cleaner_profile_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cleaner_applications_initial_insurance_policy_id_fkey';
            columns: ['initial_insurance_policy_id'];
            isOneToOne: false;
            referencedRelation: 'insurance_policies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cleaner_applications_referrer_user_id_fkey';
            columns: ['referrer_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cleaner_applications_reviewed_by_admin_id_fkey';
            columns: ['reviewed_by_admin_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cleaner_applications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_cleaner_applications_background_check';
            columns: ['background_check_id'];
            isOneToOne: false;
            referencedRelation: 'background_checks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_cleaner_applications_identity';
            columns: ['identity_verification_id'];
            isOneToOne: false;
            referencedRelation: 'identity_verifications';
            referencedColumns: ['id'];
          },
        ];
      };
      cleaner_badges: {
        Row: {
          badge_id: string;
          cleaner_id: string;
          earned_at: string;
          earning_snapshot: Json | null;
          expires_at: string | null;
          id: string;
          lost_at: string | null;
          lost_reason: string | null;
          zip_code: string | null;
        };
        Insert: {
          badge_id: string;
          cleaner_id: string;
          earned_at?: string;
          earning_snapshot?: Json | null;
          expires_at?: string | null;
          id?: string;
          lost_at?: string | null;
          lost_reason?: string | null;
          zip_code?: string | null;
        };
        Update: {
          badge_id?: string;
          cleaner_id?: string;
          earned_at?: string;
          earning_snapshot?: Json | null;
          expires_at?: string | null;
          id?: string;
          lost_at?: string | null;
          lost_reason?: string | null;
          zip_code?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'cleaner_badges_badge_id_fkey';
            columns: ['badge_id'];
            isOneToOne: false;
            referencedRelation: 'badges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cleaner_badges_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      cleaner_profiles: {
        Row: {
          allow_phone_calls: boolean;
          allow_sms: boolean;
          average_rating: number | null;
          bio: string | null;
          booking_lead_time_hours: number;
          buffer_minutes: number;
          cleaner_since_at: string;
          completed_booking_count: number;
          created_at: string;
          current_score: number;
          current_tier: Database['public']['Enums']['tier_name'];
          deactivated_at: string | null;
          deactivation_reason: string | null;
          deleted_at: string | null;
          encrypted_tax_id: string | null;
          home_address_id: string | null;
          hourly_rates_cents: Json;
          id: string;
          instant_payout_enabled: boolean;
          is_active: boolean;
          is_veteran: boolean;
          languages: Json;
          last_booking_completed_at: string | null;
          profile_photo_url: string | null;
          review_count: number;
          score_updated_at: string;
          search_tsv: unknown;
          stripe_connect_account_id: string | null;
          stripe_connect_onboarding_completed_at: string | null;
          tax_id_type: string | null;
          tier_set_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          allow_phone_calls?: boolean;
          allow_sms?: boolean;
          average_rating?: number | null;
          bio?: string | null;
          booking_lead_time_hours?: number;
          buffer_minutes?: number;
          cleaner_since_at?: string;
          completed_booking_count?: number;
          created_at?: string;
          current_score?: number;
          current_tier?: Database['public']['Enums']['tier_name'];
          deactivated_at?: string | null;
          deactivation_reason?: string | null;
          deleted_at?: string | null;
          encrypted_tax_id?: string | null;
          home_address_id?: string | null;
          hourly_rates_cents?: Json;
          id?: string;
          instant_payout_enabled?: boolean;
          is_active?: boolean;
          is_veteran?: boolean;
          languages?: Json;
          last_booking_completed_at?: string | null;
          profile_photo_url?: string | null;
          review_count?: number;
          score_updated_at?: string;
          search_tsv?: unknown;
          stripe_connect_account_id?: string | null;
          stripe_connect_onboarding_completed_at?: string | null;
          tax_id_type?: string | null;
          tier_set_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          allow_phone_calls?: boolean;
          allow_sms?: boolean;
          average_rating?: number | null;
          bio?: string | null;
          booking_lead_time_hours?: number;
          buffer_minutes?: number;
          cleaner_since_at?: string;
          completed_booking_count?: number;
          created_at?: string;
          current_score?: number;
          current_tier?: Database['public']['Enums']['tier_name'];
          deactivated_at?: string | null;
          deactivation_reason?: string | null;
          deleted_at?: string | null;
          encrypted_tax_id?: string | null;
          home_address_id?: string | null;
          hourly_rates_cents?: Json;
          id?: string;
          instant_payout_enabled?: boolean;
          is_active?: boolean;
          is_veteran?: boolean;
          languages?: Json;
          last_booking_completed_at?: string | null;
          profile_photo_url?: string | null;
          review_count?: number;
          score_updated_at?: string;
          search_tsv?: unknown;
          stripe_connect_account_id?: string | null;
          stripe_connect_onboarding_completed_at?: string | null;
          tax_id_type?: string | null;
          tier_set_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cleaner_profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_cleaner_home_address';
            columns: ['home_address_id'];
            isOneToOne: false;
            referencedRelation: 'addresses';
            referencedColumns: ['id'];
          },
        ];
      };
      cleaner_service_zips: {
        Row: {
          cleaner_id: string;
          created_at: string;
          id: string;
          zip_code: string;
        };
        Insert: {
          cleaner_id: string;
          created_at?: string;
          id?: string;
          zip_code: string;
        };
        Update: {
          cleaner_id?: string;
          created_at?: string;
          id?: string;
          zip_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cleaner_service_zips_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      cleaner_specialties: {
        Row: {
          cleaner_id: string;
          earned_at: string;
          earning_snapshot: Json | null;
          id: string;
          lost_at: string | null;
          lost_reason: string | null;
          specialty_id: string;
        };
        Insert: {
          cleaner_id: string;
          earned_at?: string;
          earning_snapshot?: Json | null;
          id?: string;
          lost_at?: string | null;
          lost_reason?: string | null;
          specialty_id: string;
        };
        Update: {
          cleaner_id?: string;
          earned_at?: string;
          earning_snapshot?: Json | null;
          id?: string;
          lost_at?: string | null;
          lost_reason?: string | null;
          specialty_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cleaner_specialties_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cleaner_specialties_specialty_id_fkey';
            columns: ['specialty_id'];
            isOneToOne: false;
            referencedRelation: 'specialties';
            referencedColumns: ['id'];
          },
        ];
      };
      cleaner_suspensions: {
        Row: {
          cleaner_id: string;
          cleaner_notified_at: string | null;
          created_at: string;
          ends_at: string | null;
          id: string;
          imposed_by_system: string | null;
          imposed_by_user_id: string | null;
          lifted_at: string | null;
          lifted_by_user_id: string | null;
          lifted_reason: string | null;
          reason_notes: string | null;
          reason_type: Database['public']['Enums']['suspension_reason_type'];
          started_at: string;
          updated_at: string;
        };
        Insert: {
          cleaner_id: string;
          cleaner_notified_at?: string | null;
          created_at?: string;
          ends_at?: string | null;
          id?: string;
          imposed_by_system?: string | null;
          imposed_by_user_id?: string | null;
          lifted_at?: string | null;
          lifted_by_user_id?: string | null;
          lifted_reason?: string | null;
          reason_notes?: string | null;
          reason_type: Database['public']['Enums']['suspension_reason_type'];
          started_at?: string;
          updated_at?: string;
        };
        Update: {
          cleaner_id?: string;
          cleaner_notified_at?: string | null;
          created_at?: string;
          ends_at?: string | null;
          id?: string;
          imposed_by_system?: string | null;
          imposed_by_user_id?: string | null;
          lifted_at?: string | null;
          lifted_by_user_id?: string | null;
          lifted_reason?: string | null;
          reason_notes?: string | null;
          reason_type?: Database['public']['Enums']['suspension_reason_type'];
          started_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cleaner_suspensions_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cleaner_suspensions_imposed_by_user_id_fkey';
            columns: ['imposed_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cleaner_suspensions_lifted_by_user_id_fkey';
            columns: ['lifted_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      commission_records: {
        Row: {
          booking_id: string;
          cleaner_id: string;
          cleaner_payout_cents: number;
          cleaner_subtotal_cents: number;
          commission_cents: number;
          commission_rate: number;
          created_at: string;
          currency: string;
          id: string;
          platform_fee_cents: number;
          tier_assignment_id: string | null;
          tier_at_booking: Database['public']['Enums']['tier_name'];
        };
        Insert: {
          booking_id: string;
          cleaner_id: string;
          cleaner_payout_cents: number;
          cleaner_subtotal_cents: number;
          commission_cents: number;
          commission_rate: number;
          created_at?: string;
          currency?: string;
          id?: string;
          platform_fee_cents: number;
          tier_assignment_id?: string | null;
          tier_at_booking: Database['public']['Enums']['tier_name'];
        };
        Update: {
          booking_id?: string;
          cleaner_id?: string;
          cleaner_payout_cents?: number;
          cleaner_subtotal_cents?: number;
          commission_cents?: number;
          commission_rate?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          platform_fee_cents?: number;
          tier_assignment_id?: string | null;
          tier_at_booking?: Database['public']['Enums']['tier_name'];
        };
        Relationships: [
          {
            foreignKeyName: 'commission_records_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: true;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'commission_records_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'commission_records_tier_assignment_id_fkey';
            columns: ['tier_assignment_id'];
            isOneToOne: false;
            referencedRelation: 'tier_assignments';
            referencedColumns: ['id'];
          },
        ];
      };
      customer_favorites: {
        Row: {
          cleaner_id: string;
          customer_id: string;
          deleted_at: string | null;
          id: string;
          is_regular: boolean;
          saved_at: string;
        };
        Insert: {
          cleaner_id: string;
          customer_id: string;
          deleted_at?: string | null;
          id?: string;
          is_regular?: boolean;
          saved_at?: string;
        };
        Update: {
          cleaner_id?: string;
          customer_id?: string;
          deleted_at?: string | null;
          id?: string;
          is_regular?: boolean;
          saved_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'customer_favorites_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'customer_favorites_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customer_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      customer_profiles: {
        Row: {
          created_at: string;
          default_address_id: string | null;
          default_payment_method_id: string | null;
          deleted_at: string | null;
          id: string;
          photo_policy: string;
          skip_photo_rooms: string[];
          total_bookings_count: number;
          total_spent_cents: number;
          updated_at: string;
          user_id: string;
          waiver_accepted_at: string | null;
        };
        Insert: {
          created_at?: string;
          default_address_id?: string | null;
          default_payment_method_id?: string | null;
          deleted_at?: string | null;
          id?: string;
          photo_policy?: string;
          skip_photo_rooms?: string[];
          total_bookings_count?: number;
          total_spent_cents?: number;
          updated_at?: string;
          user_id: string;
          waiver_accepted_at?: string | null;
        };
        Update: {
          created_at?: string;
          default_address_id?: string | null;
          default_payment_method_id?: string | null;
          deleted_at?: string | null;
          id?: string;
          photo_policy?: string;
          skip_photo_rooms?: string[];
          total_bookings_count?: number;
          total_spent_cents?: number;
          updated_at?: string;
          user_id?: string;
          waiver_accepted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'customer_profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_customer_default_address';
            columns: ['default_address_id'];
            isOneToOne: false;
            referencedRelation: 'addresses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_customer_default_payment_method';
            columns: ['default_payment_method_id'];
            isOneToOne: false;
            referencedRelation: 'payment_methods';
            referencedColumns: ['id'];
          },
        ];
      };
      customer_reliability_events: {
        Row: {
          booking_id: string | null;
          created_at: string;
          customer_id: string;
          description: string;
          event_occurred_at: string;
          event_type: Database['public']['Enums']['customer_reliability_event_type'];
          id: string;
          metadata: Json;
          point_delta: number;
        };
        Insert: {
          booking_id?: string | null;
          created_at?: string;
          customer_id: string;
          description: string;
          event_occurred_at?: string;
          event_type: Database['public']['Enums']['customer_reliability_event_type'];
          id?: string;
          metadata?: Json;
          point_delta: number;
        };
        Update: {
          booking_id?: string | null;
          created_at?: string;
          customer_id?: string;
          description?: string;
          event_occurred_at?: string;
          event_type?: Database['public']['Enums']['customer_reliability_event_type'];
          id?: string;
          metadata?: Json;
          point_delta?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'customer_reliability_events_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'customer_reliability_events_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customer_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      dispute_messages: {
        Row: {
          body: string;
          created_at: string;
          dispute_id: string;
          id: string;
          photo_ids: string[] | null;
          sender_role: string;
          sender_user_id: string;
          triggered_state_change: boolean;
        };
        Insert: {
          body: string;
          created_at?: string;
          dispute_id: string;
          id?: string;
          photo_ids?: string[] | null;
          sender_role: string;
          sender_user_id: string;
          triggered_state_change?: boolean;
        };
        Update: {
          body?: string;
          created_at?: string;
          dispute_id?: string;
          id?: string;
          photo_ids?: string[] | null;
          sender_role?: string;
          sender_user_id?: string;
          triggered_state_change?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'dispute_messages_dispute_id_fkey';
            columns: ['dispute_id'];
            isOneToOne: false;
            referencedRelation: 'disputes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dispute_messages_sender_user_id_fkey';
            columns: ['sender_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      dispute_resolutions: {
        Row: {
          accepted_at: string | null;
          admin_notes: string | null;
          created_at: string;
          dispute_id: string;
          id: string;
          is_accepted: boolean;
          proposal_notes: string | null;
          proposed_by_role: string;
          proposed_by_user_id: string;
          refund_amount_cents: number | null;
          refund_id: string | null;
          rejected_at: string | null;
          resolution_type: Database['public']['Enums']['dispute_resolution_type'];
        };
        Insert: {
          accepted_at?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          dispute_id: string;
          id?: string;
          is_accepted?: boolean;
          proposal_notes?: string | null;
          proposed_by_role: string;
          proposed_by_user_id: string;
          refund_amount_cents?: number | null;
          refund_id?: string | null;
          rejected_at?: string | null;
          resolution_type: Database['public']['Enums']['dispute_resolution_type'];
        };
        Update: {
          accepted_at?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          dispute_id?: string;
          id?: string;
          is_accepted?: boolean;
          proposal_notes?: string | null;
          proposed_by_role?: string;
          proposed_by_user_id?: string;
          refund_amount_cents?: number | null;
          refund_id?: string | null;
          rejected_at?: string | null;
          resolution_type?: Database['public']['Enums']['dispute_resolution_type'];
        };
        Relationships: [
          {
            foreignKeyName: 'dispute_resolutions_dispute_id_fkey';
            columns: ['dispute_id'];
            isOneToOne: false;
            referencedRelation: 'disputes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dispute_resolutions_proposed_by_user_id_fkey';
            columns: ['proposed_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_dispute_resolutions_refund';
            columns: ['refund_id'];
            isOneToOne: false;
            referencedRelation: 'refunds';
            referencedColumns: ['id'];
          },
        ];
      };
      disputes: {
        Row: {
          booking_id: string;
          cleaner_id: string;
          cleaner_responded_at: string | null;
          cleaner_response_amount_cents: number | null;
          cleaner_response_due_at: string;
          cleaner_response_message: string | null;
          cleaner_response_type: Database['public']['Enums']['dispute_response_type'] | null;
          created_at: string;
          customer_description: string;
          customer_desired_outcome: Database['public']['Enums']['customer_desired_outcome'];
          customer_id: string;
          escalated_at: string | null;
          escalated_by_role: Database['public']['Enums']['message_sender_role'] | null;
          id: string;
          issue_category: Database['public']['Enums']['dispute_issue_category'];
          refund_id: string | null;
          resolution_amount_cents: number | null;
          resolution_notes: string | null;
          resolution_type: Database['public']['Enums']['dispute_resolution_type'] | null;
          resolved_at: string | null;
          resolved_by_admin_id: string | null;
          state: Database['public']['Enums']['dispute_state'];
          updated_at: string;
        };
        Insert: {
          booking_id: string;
          cleaner_id: string;
          cleaner_responded_at?: string | null;
          cleaner_response_amount_cents?: number | null;
          cleaner_response_due_at: string;
          cleaner_response_message?: string | null;
          cleaner_response_type?: Database['public']['Enums']['dispute_response_type'] | null;
          created_at?: string;
          customer_description: string;
          customer_desired_outcome: Database['public']['Enums']['customer_desired_outcome'];
          customer_id: string;
          escalated_at?: string | null;
          escalated_by_role?: Database['public']['Enums']['message_sender_role'] | null;
          id?: string;
          issue_category: Database['public']['Enums']['dispute_issue_category'];
          refund_id?: string | null;
          resolution_amount_cents?: number | null;
          resolution_notes?: string | null;
          resolution_type?: Database['public']['Enums']['dispute_resolution_type'] | null;
          resolved_at?: string | null;
          resolved_by_admin_id?: string | null;
          state?: Database['public']['Enums']['dispute_state'];
          updated_at?: string;
        };
        Update: {
          booking_id?: string;
          cleaner_id?: string;
          cleaner_responded_at?: string | null;
          cleaner_response_amount_cents?: number | null;
          cleaner_response_due_at?: string;
          cleaner_response_message?: string | null;
          cleaner_response_type?: Database['public']['Enums']['dispute_response_type'] | null;
          created_at?: string;
          customer_description?: string;
          customer_desired_outcome?: Database['public']['Enums']['customer_desired_outcome'];
          customer_id?: string;
          escalated_at?: string | null;
          escalated_by_role?: Database['public']['Enums']['message_sender_role'] | null;
          id?: string;
          issue_category?: Database['public']['Enums']['dispute_issue_category'];
          refund_id?: string | null;
          resolution_amount_cents?: number | null;
          resolution_notes?: string | null;
          resolution_type?: Database['public']['Enums']['dispute_resolution_type'] | null;
          resolved_at?: string | null;
          resolved_by_admin_id?: string | null;
          state?: Database['public']['Enums']['dispute_state'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'disputes_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: true;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'disputes_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'disputes_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customer_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'disputes_resolved_by_admin_id_fkey';
            columns: ['resolved_by_admin_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_disputes_refund';
            columns: ['refund_id'];
            isOneToOne: false;
            referencedRelation: 'refunds';
            referencedColumns: ['id'];
          },
        ];
      };
      identity_verifications: {
        Row: {
          admin_notes: string | null;
          application_id: string | null;
          attempt_number: number;
          cleaner_id: string | null;
          created_at: string;
          document_country: string | null;
          document_type: string | null;
          failed_at: string | null;
          failure_reason: string | null;
          id: string;
          requires_manual_review: boolean;
          reviewed_at: string | null;
          reviewed_by_admin_id: string | null;
          state: Database['public']['Enums']['identity_verification_state'];
          stripe_session_id: string;
          subject_user_id: string;
          submitted_at: string | null;
          updated_at: string;
          verified_at: string | null;
        };
        Insert: {
          admin_notes?: string | null;
          application_id?: string | null;
          attempt_number?: number;
          cleaner_id?: string | null;
          created_at?: string;
          document_country?: string | null;
          document_type?: string | null;
          failed_at?: string | null;
          failure_reason?: string | null;
          id?: string;
          requires_manual_review?: boolean;
          reviewed_at?: string | null;
          reviewed_by_admin_id?: string | null;
          state?: Database['public']['Enums']['identity_verification_state'];
          stripe_session_id: string;
          subject_user_id: string;
          submitted_at?: string | null;
          updated_at?: string;
          verified_at?: string | null;
        };
        Update: {
          admin_notes?: string | null;
          application_id?: string | null;
          attempt_number?: number;
          cleaner_id?: string | null;
          created_at?: string;
          document_country?: string | null;
          document_type?: string | null;
          failed_at?: string | null;
          failure_reason?: string | null;
          id?: string;
          requires_manual_review?: boolean;
          reviewed_at?: string | null;
          reviewed_by_admin_id?: string | null;
          state?: Database['public']['Enums']['identity_verification_state'];
          stripe_session_id?: string;
          subject_user_id?: string;
          submitted_at?: string | null;
          updated_at?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'identity_verifications_application_id_fkey';
            columns: ['application_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_applications';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'identity_verifications_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'identity_verifications_reviewed_by_admin_id_fkey';
            columns: ['reviewed_by_admin_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'identity_verifications_subject_user_id_fkey';
            columns: ['subject_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      insurance_policies: {
        Row: {
          cleaner_id: string;
          coverage_amount_cents: number | null;
          created_at: string;
          document_storage_key: string;
          document_uploaded_at: string;
          effective_from: string | null;
          expired_at: string | null;
          expires_at: string | null;
          id: string;
          insurance_provider: string | null;
          policy_number: string | null;
          rejection_reason: string | null;
          renewal_reminder_sent_at: string | null;
          replaced_at: string | null;
          replaced_by_policy_id: string | null;
          reviewed_at: string | null;
          reviewed_by_admin_id: string | null;
          state: Database['public']['Enums']['insurance_state'];
          updated_at: string;
          verified_at: string | null;
        };
        Insert: {
          cleaner_id: string;
          coverage_amount_cents?: number | null;
          created_at?: string;
          document_storage_key: string;
          document_uploaded_at?: string;
          effective_from?: string | null;
          expired_at?: string | null;
          expires_at?: string | null;
          id?: string;
          insurance_provider?: string | null;
          policy_number?: string | null;
          rejection_reason?: string | null;
          renewal_reminder_sent_at?: string | null;
          replaced_at?: string | null;
          replaced_by_policy_id?: string | null;
          reviewed_at?: string | null;
          reviewed_by_admin_id?: string | null;
          state?: Database['public']['Enums']['insurance_state'];
          updated_at?: string;
          verified_at?: string | null;
        };
        Update: {
          cleaner_id?: string;
          coverage_amount_cents?: number | null;
          created_at?: string;
          document_storage_key?: string;
          document_uploaded_at?: string;
          effective_from?: string | null;
          expired_at?: string | null;
          expires_at?: string | null;
          id?: string;
          insurance_provider?: string | null;
          policy_number?: string | null;
          rejection_reason?: string | null;
          renewal_reminder_sent_at?: string | null;
          replaced_at?: string | null;
          replaced_by_policy_id?: string | null;
          reviewed_at?: string | null;
          reviewed_by_admin_id?: string | null;
          state?: Database['public']['Enums']['insurance_state'];
          updated_at?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'insurance_policies_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'insurance_policies_replaced_by_policy_id_fkey';
            columns: ['replaced_by_policy_id'];
            isOneToOne: false;
            referencedRelation: 'insurance_policies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'insurance_policies_reviewed_by_admin_id_fkey';
            columns: ['reviewed_by_admin_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          attachment_mime_type: string | null;
          attachment_thumbnail_url: string | null;
          attachment_url: string | null;
          body: string;
          booking_id: string;
          created_at: string;
          delivered_at: string | null;
          expires_at: string;
          id: string;
          read_at: string | null;
          sender_role: Database['public']['Enums']['message_sender_role'];
          sender_user_id: string | null;
          status: Database['public']['Enums']['message_status'];
          system_event_type: string | null;
        };
        Insert: {
          attachment_mime_type?: string | null;
          attachment_thumbnail_url?: string | null;
          attachment_url?: string | null;
          body: string;
          booking_id: string;
          created_at?: string;
          delivered_at?: string | null;
          expires_at: string;
          id?: string;
          read_at?: string | null;
          sender_role: Database['public']['Enums']['message_sender_role'];
          sender_user_id?: string | null;
          status?: Database['public']['Enums']['message_status'];
          system_event_type?: string | null;
        };
        Update: {
          attachment_mime_type?: string | null;
          attachment_thumbnail_url?: string | null;
          attachment_url?: string | null;
          body?: string;
          booking_id?: string;
          created_at?: string;
          delivered_at?: string | null;
          expires_at?: string;
          id?: string;
          read_at?: string | null;
          sender_role?: Database['public']['Enums']['message_sender_role'];
          sender_user_id?: string | null;
          status?: Database['public']['Enums']['message_status'];
          system_event_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_sender_user_id_fkey';
            columns: ['sender_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_deliveries: {
        Row: {
          attempt_number: number;
          channel: Database['public']['Enums']['notification_channel'];
          created_at: string;
          delivered_at: string | null;
          delivery_target: string;
          failed_at: string | null;
          failed_reason: string | null;
          id: string;
          notification_id: string;
          opened_at: string | null;
          provider_message_id: string | null;
          provider_name: string | null;
          sent_at: string | null;
          state: Database['public']['Enums']['delivery_state'];
        };
        Insert: {
          attempt_number?: number;
          channel: Database['public']['Enums']['notification_channel'];
          created_at?: string;
          delivered_at?: string | null;
          delivery_target: string;
          failed_at?: string | null;
          failed_reason?: string | null;
          id?: string;
          notification_id: string;
          opened_at?: string | null;
          provider_message_id?: string | null;
          provider_name?: string | null;
          sent_at?: string | null;
          state?: Database['public']['Enums']['delivery_state'];
        };
        Update: {
          attempt_number?: number;
          channel?: Database['public']['Enums']['notification_channel'];
          created_at?: string;
          delivered_at?: string | null;
          delivery_target?: string;
          failed_at?: string | null;
          failed_reason?: string | null;
          id?: string;
          notification_id?: string;
          opened_at?: string | null;
          provider_message_id?: string | null;
          provider_name?: string | null;
          sent_at?: string | null;
          state?: Database['public']['Enums']['delivery_state'];
        };
        Relationships: [
          {
            foreignKeyName: 'notification_deliveries_notification_id_fkey';
            columns: ['notification_id'];
            isOneToOne: false;
            referencedRelation: 'notifications';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_preferences: {
        Row: {
          created_at: string;
          email_address: string | null;
          email_enabled: boolean;
          id: string;
          per_type_preferences: Json;
          push_enabled: boolean;
          push_subscriptions: Json;
          quiet_hours_enabled: boolean;
          quiet_hours_end_minutes: number | null;
          quiet_hours_start_minutes: number | null;
          sla_critical_push_required: boolean;
          sms_enabled: boolean;
          sms_phone: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email_address?: string | null;
          email_enabled?: boolean;
          id?: string;
          per_type_preferences?: Json;
          push_enabled?: boolean;
          push_subscriptions?: Json;
          quiet_hours_enabled?: boolean;
          quiet_hours_end_minutes?: number | null;
          quiet_hours_start_minutes?: number | null;
          sla_critical_push_required?: boolean;
          sms_enabled?: boolean;
          sms_phone?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          email_address?: string | null;
          email_enabled?: boolean;
          id?: string;
          per_type_preferences?: Json;
          push_enabled?: boolean;
          push_subscriptions?: Json;
          quiet_hours_enabled?: boolean;
          quiet_hours_end_minutes?: number | null;
          quiet_hours_start_minutes?: number | null;
          sla_critical_push_required?: boolean;
          sms_enabled?: boolean;
          sms_phone?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          body: string;
          created_at: string;
          deep_link: string | null;
          expires_at: string;
          id: string;
          metadata: Json;
          notification_type: Database['public']['Enums']['notification_type'];
          read_at: string | null;
          recipient_user_id: string;
          related_appeal_id: string | null;
          related_booking_id: string | null;
          related_charge_id: string | null;
          related_dispute_id: string | null;
          related_payout_id: string | null;
          related_review_id: string | null;
          template_version: number;
          title: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          deep_link?: string | null;
          expires_at?: string;
          id?: string;
          metadata?: Json;
          notification_type: Database['public']['Enums']['notification_type'];
          read_at?: string | null;
          recipient_user_id: string;
          related_appeal_id?: string | null;
          related_booking_id?: string | null;
          related_charge_id?: string | null;
          related_dispute_id?: string | null;
          related_payout_id?: string | null;
          related_review_id?: string | null;
          template_version?: number;
          title: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          deep_link?: string | null;
          expires_at?: string;
          id?: string;
          metadata?: Json;
          notification_type?: Database['public']['Enums']['notification_type'];
          read_at?: string | null;
          recipient_user_id?: string;
          related_appeal_id?: string | null;
          related_booking_id?: string | null;
          related_charge_id?: string | null;
          related_dispute_id?: string | null;
          related_payout_id?: string | null;
          related_review_id?: string | null;
          template_version?: number;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_recipient_user_id_fkey';
            columns: ['recipient_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_related_appeal_id_fkey';
            columns: ['related_appeal_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_appeals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_related_booking_id_fkey';
            columns: ['related_booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_related_charge_id_fkey';
            columns: ['related_charge_id'];
            isOneToOne: false;
            referencedRelation: 'charges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_related_dispute_id_fkey';
            columns: ['related_dispute_id'];
            isOneToOne: false;
            referencedRelation: 'disputes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_related_payout_id_fkey';
            columns: ['related_payout_id'];
            isOneToOne: false;
            referencedRelation: 'payouts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_related_review_id_fkey';
            columns: ['related_review_id'];
            isOneToOne: false;
            referencedRelation: 'reviews';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_methods: {
        Row: {
          bank_account_last_four: string | null;
          bank_name: string | null;
          card_brand: string | null;
          card_exp_month: number | null;
          card_exp_year: number | null;
          card_funding: string | null;
          card_last_four: string | null;
          created_at: string;
          customer_id: string;
          deleted_at: string | null;
          id: string;
          is_default: boolean;
          method_type: Database['public']['Enums']['payment_method_type'];
          stripe_customer_id: string;
          stripe_payment_method_id: string;
          updated_at: string;
        };
        Insert: {
          bank_account_last_four?: string | null;
          bank_name?: string | null;
          card_brand?: string | null;
          card_exp_month?: number | null;
          card_exp_year?: number | null;
          card_funding?: string | null;
          card_last_four?: string | null;
          created_at?: string;
          customer_id: string;
          deleted_at?: string | null;
          id?: string;
          is_default?: boolean;
          method_type?: Database['public']['Enums']['payment_method_type'];
          stripe_customer_id: string;
          stripe_payment_method_id: string;
          updated_at?: string;
        };
        Update: {
          bank_account_last_four?: string | null;
          bank_name?: string | null;
          card_brand?: string | null;
          card_exp_month?: number | null;
          card_exp_year?: number | null;
          card_funding?: string | null;
          card_last_four?: string | null;
          created_at?: string;
          customer_id?: string;
          deleted_at?: string | null;
          id?: string;
          is_default?: boolean;
          method_type?: Database['public']['Enums']['payment_method_type'];
          stripe_customer_id?: string;
          stripe_payment_method_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_methods_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customer_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      payout_line_items: {
        Row: {
          amount_cents: number;
          booking_id: string | null;
          cleaner_id: string;
          created_at: string;
          currency: string;
          description: string;
          earned_at: string;
          id: string;
          is_instant: boolean;
          payout_id: string | null;
          tip_id: string | null;
        };
        Insert: {
          amount_cents: number;
          booking_id?: string | null;
          cleaner_id: string;
          created_at?: string;
          currency?: string;
          description: string;
          earned_at: string;
          id?: string;
          is_instant?: boolean;
          payout_id?: string | null;
          tip_id?: string | null;
        };
        Update: {
          amount_cents?: number;
          booking_id?: string | null;
          cleaner_id?: string;
          created_at?: string;
          currency?: string;
          description?: string;
          earned_at?: string;
          id?: string;
          is_instant?: boolean;
          payout_id?: string | null;
          tip_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payout_line_items_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payout_line_items_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payout_line_items_payout_id_fkey';
            columns: ['payout_id'];
            isOneToOne: false;
            referencedRelation: 'payouts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payout_line_items_tip_id_fkey';
            columns: ['tip_id'];
            isOneToOne: false;
            referencedRelation: 'tips';
            referencedColumns: ['id'];
          },
        ];
      };
      payouts: {
        Row: {
          amount_cents: number;
          cleaner_id: string;
          created_at: string;
          currency: string;
          estimated_arrival_at: string | null;
          failed_at: string | null;
          failed_reason: string | null;
          id: string;
          in_transit_at: string | null;
          initiated_at: string;
          instant_fee_cents: number;
          is_instant: boolean;
          net_amount_cents: number;
          paid_at: string | null;
          period_end_at: string | null;
          period_start_at: string | null;
          state: Database['public']['Enums']['payout_state'];
          stripe_account_id: string;
          stripe_payout_id: string | null;
          updated_at: string;
        };
        Insert: {
          amount_cents: number;
          cleaner_id: string;
          created_at?: string;
          currency?: string;
          estimated_arrival_at?: string | null;
          failed_at?: string | null;
          failed_reason?: string | null;
          id?: string;
          in_transit_at?: string | null;
          initiated_at?: string;
          instant_fee_cents?: number;
          is_instant?: boolean;
          net_amount_cents: number;
          paid_at?: string | null;
          period_end_at?: string | null;
          period_start_at?: string | null;
          state?: Database['public']['Enums']['payout_state'];
          stripe_account_id: string;
          stripe_payout_id?: string | null;
          updated_at?: string;
        };
        Update: {
          amount_cents?: number;
          cleaner_id?: string;
          created_at?: string;
          currency?: string;
          estimated_arrival_at?: string | null;
          failed_at?: string | null;
          failed_reason?: string | null;
          id?: string;
          in_transit_at?: string | null;
          initiated_at?: string;
          instant_fee_cents?: number;
          is_instant?: boolean;
          net_amount_cents?: number;
          paid_at?: string | null;
          period_end_at?: string | null;
          period_start_at?: string | null;
          state?: Database['public']['Enums']['payout_state'];
          stripe_account_id?: string;
          stripe_payout_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payouts_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      recurring_occurrences: {
        Row: {
          booking_id: string | null;
          cancelled_at: string | null;
          created_at: string;
          id: string;
          recurring_schedule_id: string;
          rescheduled_to_at: string | null;
          scheduled_end_at: string;
          scheduled_start_at: string;
          skip_reason: string | null;
          skipped_at: string | null;
          spawned_at: string | null;
          status: Database['public']['Enums']['occurrence_status'];
          updated_at: string;
        };
        Insert: {
          booking_id?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          id?: string;
          recurring_schedule_id: string;
          rescheduled_to_at?: string | null;
          scheduled_end_at: string;
          scheduled_start_at: string;
          skip_reason?: string | null;
          skipped_at?: string | null;
          spawned_at?: string | null;
          status?: Database['public']['Enums']['occurrence_status'];
          updated_at?: string;
        };
        Update: {
          booking_id?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          id?: string;
          recurring_schedule_id?: string;
          rescheduled_to_at?: string | null;
          scheduled_end_at?: string;
          scheduled_start_at?: string;
          skip_reason?: string | null;
          skipped_at?: string | null;
          spawned_at?: string | null;
          status?: Database['public']['Enums']['occurrence_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recurring_occurrences_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: true;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recurring_occurrences_recurring_schedule_id_fkey';
            columns: ['recurring_schedule_id'];
            isOneToOne: false;
            referencedRelation: 'recurring_schedules';
            referencedColumns: ['id'];
          },
        ];
      };
      recurring_schedules: {
        Row: {
          address_id: string;
          average_rating: number | null;
          cadence: Database['public']['Enums']['recurring_cadence'];
          cleaner_end_effective_at: string | null;
          cleaner_end_notice_given_at: string | null;
          cleaner_id: string;
          created_at: string;
          custom_cadence_days: number | null;
          customer_id: string;
          customer_notes: string | null;
          day_of_week: number;
          duration_hours_decimal: number;
          ended_at: string | null;
          ended_reason: string | null;
          hourly_rate_cents: number;
          id: string;
          occurrences_completed_count: number;
          paused_at: string | null;
          paused_until: string | null;
          service_id: string;
          start_minutes: number;
          started_at: string;
          status: Database['public']['Enums']['recurring_status'];
          total_charged_cents: number;
          updated_at: string;
        };
        Insert: {
          address_id: string;
          average_rating?: number | null;
          cadence: Database['public']['Enums']['recurring_cadence'];
          cleaner_end_effective_at?: string | null;
          cleaner_end_notice_given_at?: string | null;
          cleaner_id: string;
          created_at?: string;
          custom_cadence_days?: number | null;
          customer_id: string;
          customer_notes?: string | null;
          day_of_week: number;
          duration_hours_decimal: number;
          ended_at?: string | null;
          ended_reason?: string | null;
          hourly_rate_cents: number;
          id?: string;
          occurrences_completed_count?: number;
          paused_at?: string | null;
          paused_until?: string | null;
          service_id: string;
          start_minutes: number;
          started_at: string;
          status?: Database['public']['Enums']['recurring_status'];
          total_charged_cents?: number;
          updated_at?: string;
        };
        Update: {
          address_id?: string;
          average_rating?: number | null;
          cadence?: Database['public']['Enums']['recurring_cadence'];
          cleaner_end_effective_at?: string | null;
          cleaner_end_notice_given_at?: string | null;
          cleaner_id?: string;
          created_at?: string;
          custom_cadence_days?: number | null;
          customer_id?: string;
          customer_notes?: string | null;
          day_of_week?: number;
          duration_hours_decimal?: number;
          ended_at?: string | null;
          ended_reason?: string | null;
          hourly_rate_cents?: number;
          id?: string;
          occurrences_completed_count?: number;
          paused_at?: string | null;
          paused_until?: string | null;
          service_id?: string;
          start_minutes?: number;
          started_at?: string;
          status?: Database['public']['Enums']['recurring_status'];
          total_charged_cents?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recurring_schedules_address_id_fkey';
            columns: ['address_id'];
            isOneToOne: false;
            referencedRelation: 'addresses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recurring_schedules_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recurring_schedules_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customer_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recurring_schedules_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
        ];
      };
      refunds: {
        Row: {
          amount_cents: number;
          charge_id: string;
          created_at: string;
          currency: string;
          dispute_id: string | null;
          failed_at: string | null;
          failed_reason: string | null;
          id: string;
          initiated_by_system: string | null;
          initiated_by_user_id: string | null;
          reason_notes: string | null;
          reason_type: Database['public']['Enums']['refund_reason_type'];
          state: string;
          stripe_refund_id: string | null;
          succeeded_at: string | null;
          updated_at: string;
        };
        Insert: {
          amount_cents: number;
          charge_id: string;
          created_at?: string;
          currency?: string;
          dispute_id?: string | null;
          failed_at?: string | null;
          failed_reason?: string | null;
          id?: string;
          initiated_by_system?: string | null;
          initiated_by_user_id?: string | null;
          reason_notes?: string | null;
          reason_type: Database['public']['Enums']['refund_reason_type'];
          state?: string;
          stripe_refund_id?: string | null;
          succeeded_at?: string | null;
          updated_at?: string;
        };
        Update: {
          amount_cents?: number;
          charge_id?: string;
          created_at?: string;
          currency?: string;
          dispute_id?: string | null;
          failed_at?: string | null;
          failed_reason?: string | null;
          id?: string;
          initiated_by_system?: string | null;
          initiated_by_user_id?: string | null;
          reason_notes?: string | null;
          reason_type?: Database['public']['Enums']['refund_reason_type'];
          state?: string;
          stripe_refund_id?: string | null;
          succeeded_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'refunds_charge_id_fkey';
            columns: ['charge_id'];
            isOneToOne: false;
            referencedRelation: 'charges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'refunds_dispute_id_fkey';
            columns: ['dispute_id'];
            isOneToOne: false;
            referencedRelation: 'disputes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'refunds_initiated_by_user_id_fkey';
            columns: ['initiated_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      reliability_events: {
        Row: {
          booking_id: string | null;
          cleaner_id: string;
          created_at: string;
          description: string;
          event_occurred_at: string;
          event_type: Database['public']['Enums']['reliability_event_type'];
          id: string;
          is_overturned: boolean;
          metadata: Json;
          metric_category: Database['public']['Enums']['reliability_metric_category'];
          overturned_at: string | null;
          overturned_by_appeal_id: string | null;
          point_delta: number;
        };
        Insert: {
          booking_id?: string | null;
          cleaner_id: string;
          created_at?: string;
          description: string;
          event_occurred_at?: string;
          event_type: Database['public']['Enums']['reliability_event_type'];
          id?: string;
          is_overturned?: boolean;
          metadata?: Json;
          metric_category: Database['public']['Enums']['reliability_metric_category'];
          overturned_at?: string | null;
          overturned_by_appeal_id?: string | null;
          point_delta: number;
        };
        Update: {
          booking_id?: string | null;
          cleaner_id?: string;
          created_at?: string;
          description?: string;
          event_occurred_at?: string;
          event_type?: Database['public']['Enums']['reliability_event_type'];
          id?: string;
          is_overturned?: boolean;
          metadata?: Json;
          metric_category?: Database['public']['Enums']['reliability_metric_category'];
          overturned_at?: string | null;
          overturned_by_appeal_id?: string | null;
          point_delta?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_reliability_event_appeal';
            columns: ['overturned_by_appeal_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_appeals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reliability_events_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reliability_events_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      reliability_score_snapshots: {
        Row: {
          band: string;
          cleaner_id: string;
          created_at: string;
          id: string;
          metric_breakdown: Json;
          score: number;
          snapshot_date: string;
          triggered_suspension: boolean;
          triggered_tier_change: boolean;
          window_end_date: string;
          window_start_date: string;
        };
        Insert: {
          band: string;
          cleaner_id: string;
          created_at?: string;
          id?: string;
          metric_breakdown: Json;
          score: number;
          snapshot_date: string;
          triggered_suspension?: boolean;
          triggered_tier_change?: boolean;
          window_end_date: string;
          window_start_date: string;
        };
        Update: {
          band?: string;
          cleaner_id?: string;
          created_at?: string;
          id?: string;
          metric_breakdown?: Json;
          score?: number;
          snapshot_date?: string;
          triggered_suspension?: boolean;
          triggered_tier_change?: boolean;
          window_end_date?: string;
          window_start_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reliability_score_snapshots_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      review_traits: {
        Row: {
          cleaner_id: string;
          created_at: string;
          id: string;
          review_id: string;
          trait_id: string;
        };
        Insert: {
          cleaner_id: string;
          created_at?: string;
          id?: string;
          review_id: string;
          trait_id: string;
        };
        Update: {
          cleaner_id?: string;
          created_at?: string;
          id?: string;
          review_id?: string;
          trait_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'review_traits_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'review_traits_review_id_fkey';
            columns: ['review_id'];
            isOneToOne: false;
            referencedRelation: 'reviews';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'review_traits_trait_id_fkey';
            columns: ['trait_id'];
            isOneToOne: false;
            referencedRelation: 'traits';
            referencedColumns: ['id'];
          },
        ];
      };
      reviews: {
        Row: {
          body: string | null;
          booking_id: string;
          cleaner_id: string;
          customer_id: string;
          hidden_at: string | null;
          hidden_by_admin_id: string | null;
          hidden_reason: string | null;
          id: string;
          is_public: boolean;
          stars: number;
          submitted_at: string;
          updated_at: string;
        };
        Insert: {
          body?: string | null;
          booking_id: string;
          cleaner_id: string;
          customer_id: string;
          hidden_at?: string | null;
          hidden_by_admin_id?: string | null;
          hidden_reason?: string | null;
          id?: string;
          is_public?: boolean;
          stars: number;
          submitted_at?: string;
          updated_at?: string;
        };
        Update: {
          body?: string | null;
          booking_id?: string;
          cleaner_id?: string;
          customer_id?: string;
          hidden_at?: string | null;
          hidden_by_admin_id?: string | null;
          hidden_reason?: string | null;
          id?: string;
          is_public?: boolean;
          stars?: number;
          submitted_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: true;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customer_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_hidden_by_admin_id_fkey';
            columns: ['hidden_by_admin_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      serviced_areas: {
        Row: {
          activated_at: string | null;
          city: string;
          created_at: string;
          id: string;
          inactivated_at: string | null;
          notes: string | null;
          seo_metro_area: string | null;
          seo_neighborhood_name: string | null;
          state: string;
          status: Database['public']['Enums']['service_area_status'];
          updated_at: string;
          zip_code: string;
        };
        Insert: {
          activated_at?: string | null;
          city: string;
          created_at?: string;
          id?: string;
          inactivated_at?: string | null;
          notes?: string | null;
          seo_metro_area?: string | null;
          seo_neighborhood_name?: string | null;
          state: string;
          status?: Database['public']['Enums']['service_area_status'];
          updated_at?: string;
          zip_code: string;
        };
        Update: {
          activated_at?: string | null;
          city?: string;
          created_at?: string;
          id?: string;
          inactivated_at?: string | null;
          notes?: string | null;
          seo_metro_area?: string | null;
          seo_neighborhood_name?: string | null;
          state?: string;
          status?: Database['public']['Enums']['service_area_status'];
          updated_at?: string;
          zip_code?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          created_at: string;
          default_recurring_cadence: Database['public']['Enums']['recurring_cadence'] | null;
          description: string;
          display_name: string;
          display_order: number;
          id: string;
          is_active: boolean;
          min_hours_by_tier: Json;
          service_type: Database['public']['Enums']['service_type'];
          supports_recurring: boolean;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          default_recurring_cadence?: Database['public']['Enums']['recurring_cadence'] | null;
          description: string;
          display_name: string;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          min_hours_by_tier: Json;
          service_type: Database['public']['Enums']['service_type'];
          supports_recurring?: boolean;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          default_recurring_cadence?: Database['public']['Enums']['recurring_cadence'] | null;
          description?: string;
          display_name?: string;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          min_hours_by_tier?: Json;
          service_type?: Database['public']['Enums']['service_type'];
          supports_recurring?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      smoke_test: {
        Row: {
          created_at: string;
          id: number;
          label: string;
        };
        Insert: {
          created_at?: string;
          id?: never;
          label: string;
        };
        Update: {
          created_at?: string;
          id?: never;
          label?: string;
        };
        Relationships: [];
      };
      specialties: {
        Row: {
          created_at: string;
          description: string;
          display_label: string;
          display_order: number;
          earning_criteria: Json;
          icon_name: string | null;
          id: string;
          is_active: boolean;
          key: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          display_label: string;
          display_order?: number;
          earning_criteria: Json;
          icon_name?: string | null;
          id?: string;
          is_active?: boolean;
          key: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          display_label?: string;
          display_order?: number;
          earning_criteria?: Json;
          icon_name?: string | null;
          id?: string;
          is_active?: boolean;
          key?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stripe_webhook_events: {
        Row: {
          event_type: string;
          id: string;
          payload: Json;
          processed_at: string | null;
          processing_error: string | null;
          processing_state: string;
          received_at: string;
          retry_count: number;
          stripe_api_version: string | null;
          stripe_event_id: string;
        };
        Insert: {
          event_type: string;
          id?: string;
          payload: Json;
          processed_at?: string | null;
          processing_error?: string | null;
          processing_state?: string;
          received_at?: string;
          retry_count?: number;
          stripe_api_version?: string | null;
          stripe_event_id: string;
        };
        Update: {
          event_type?: string;
          id?: string;
          payload?: Json;
          processed_at?: string | null;
          processing_error?: string | null;
          processing_state?: string;
          received_at?: string;
          retry_count?: number;
          stripe_api_version?: string | null;
          stripe_event_id?: string;
        };
        Relationships: [];
      };
      support_ticket_messages: {
        Row: {
          attachment_urls: string[] | null;
          body: string;
          created_at: string;
          id: string;
          is_internal_note: boolean;
          sender_role: string;
          sender_user_id: string;
          ticket_id: string;
        };
        Insert: {
          attachment_urls?: string[] | null;
          body: string;
          created_at?: string;
          id?: string;
          is_internal_note?: boolean;
          sender_role: string;
          sender_user_id: string;
          ticket_id: string;
        };
        Update: {
          attachment_urls?: string[] | null;
          body?: string;
          created_at?: string;
          id?: string;
          is_internal_note?: boolean;
          sender_role?: string;
          sender_user_id?: string;
          ticket_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'support_ticket_messages_sender_user_id_fkey';
            columns: ['sender_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'support_ticket_messages_ticket_id_fkey';
            columns: ['ticket_id'];
            isOneToOne: false;
            referencedRelation: 'support_tickets';
            referencedColumns: ['id'];
          },
        ];
      };
      support_tickets: {
        Row: {
          assigned_admin_id: string | null;
          assigned_at: string | null;
          category: Database['public']['Enums']['support_ticket_category'];
          closed_at: string | null;
          created_at: string;
          csat_feedback: string | null;
          csat_rating: number | null;
          csat_submitted_at: string | null;
          first_response_at: string | null;
          id: string;
          initial_message: string;
          last_admin_response_at: string | null;
          last_customer_response_at: string | null;
          priority: Database['public']['Enums']['support_ticket_priority'];
          related_booking_id: string | null;
          related_charge_id: string | null;
          reopened_at: string | null;
          resolution_notes: string | null;
          resolved_at: string | null;
          resolved_by_admin_id: string | null;
          status: Database['public']['Enums']['support_ticket_status'];
          subject: string;
          submitter_user_id: string;
          ticket_number: string;
          updated_at: string;
        };
        Insert: {
          assigned_admin_id?: string | null;
          assigned_at?: string | null;
          category: Database['public']['Enums']['support_ticket_category'];
          closed_at?: string | null;
          created_at?: string;
          csat_feedback?: string | null;
          csat_rating?: number | null;
          csat_submitted_at?: string | null;
          first_response_at?: string | null;
          id?: string;
          initial_message: string;
          last_admin_response_at?: string | null;
          last_customer_response_at?: string | null;
          priority?: Database['public']['Enums']['support_ticket_priority'];
          related_booking_id?: string | null;
          related_charge_id?: string | null;
          reopened_at?: string | null;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          resolved_by_admin_id?: string | null;
          status?: Database['public']['Enums']['support_ticket_status'];
          subject: string;
          submitter_user_id: string;
          ticket_number: string;
          updated_at?: string;
        };
        Update: {
          assigned_admin_id?: string | null;
          assigned_at?: string | null;
          category?: Database['public']['Enums']['support_ticket_category'];
          closed_at?: string | null;
          created_at?: string;
          csat_feedback?: string | null;
          csat_rating?: number | null;
          csat_submitted_at?: string | null;
          first_response_at?: string | null;
          id?: string;
          initial_message?: string;
          last_admin_response_at?: string | null;
          last_customer_response_at?: string | null;
          priority?: Database['public']['Enums']['support_ticket_priority'];
          related_booking_id?: string | null;
          related_charge_id?: string | null;
          reopened_at?: string | null;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          resolved_by_admin_id?: string | null;
          status?: Database['public']['Enums']['support_ticket_status'];
          subject?: string;
          submitter_user_id?: string;
          ticket_number?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'support_tickets_assigned_admin_id_fkey';
            columns: ['assigned_admin_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'support_tickets_related_booking_id_fkey';
            columns: ['related_booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'support_tickets_related_charge_id_fkey';
            columns: ['related_charge_id'];
            isOneToOne: false;
            referencedRelation: 'charges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'support_tickets_resolved_by_admin_id_fkey';
            columns: ['resolved_by_admin_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'support_tickets_submitter_user_id_fkey';
            columns: ['submitter_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      tier_assignments: {
        Row: {
          appealed_via_appeal_id: string | null;
          cleaner_id: string;
          created_at: string;
          effective_at: string;
          ended_at: string | null;
          id: string;
          previous_tier: Database['public']['Enums']['tier_name'] | null;
          reason: string;
          score_at_assignment: number;
          tier: Database['public']['Enums']['tier_name'];
          triggered_by_system: string | null;
          triggered_by_user_id: string | null;
          veteran_cushion_applied: boolean;
        };
        Insert: {
          appealed_via_appeal_id?: string | null;
          cleaner_id: string;
          created_at?: string;
          effective_at?: string;
          ended_at?: string | null;
          id?: string;
          previous_tier?: Database['public']['Enums']['tier_name'] | null;
          reason: string;
          score_at_assignment: number;
          tier: Database['public']['Enums']['tier_name'];
          triggered_by_system?: string | null;
          triggered_by_user_id?: string | null;
          veteran_cushion_applied?: boolean;
        };
        Update: {
          appealed_via_appeal_id?: string | null;
          cleaner_id?: string;
          created_at?: string;
          effective_at?: string;
          ended_at?: string | null;
          id?: string;
          previous_tier?: Database['public']['Enums']['tier_name'] | null;
          reason?: string;
          score_at_assignment?: number;
          tier?: Database['public']['Enums']['tier_name'];
          triggered_by_system?: string | null;
          triggered_by_user_id?: string | null;
          veteran_cushion_applied?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_tier_appeal';
            columns: ['appealed_via_appeal_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_appeals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tier_assignments_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tier_assignments_triggered_by_user_id_fkey';
            columns: ['triggered_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      time_off_blocks: {
        Row: {
          block_type: string;
          blocked_end_at: string;
          blocked_start_at: string;
          cleaner_id: string;
          created_at: string;
          id: string;
          reason: string | null;
          updated_at: string;
        };
        Insert: {
          block_type?: string;
          blocked_end_at: string;
          blocked_start_at: string;
          cleaner_id: string;
          created_at?: string;
          id?: string;
          reason?: string | null;
          updated_at?: string;
        };
        Update: {
          block_type?: string;
          blocked_end_at?: string;
          blocked_start_at?: string;
          cleaner_id?: string;
          created_at?: string;
          id?: string;
          reason?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'time_off_blocks_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      tips: {
        Row: {
          amount_cents: number;
          booking_id: string;
          charge_id: string | null;
          cleaner_id: string;
          created_at: string;
          currency: string;
          customer_id: string;
          customer_note: string | null;
          id: string;
          paid_at: string | null;
          refunded_at: string | null;
          source: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          amount_cents: number;
          booking_id: string;
          charge_id?: string | null;
          cleaner_id: string;
          created_at?: string;
          currency?: string;
          customer_id: string;
          customer_note?: string | null;
          id?: string;
          paid_at?: string | null;
          refunded_at?: string | null;
          source: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          amount_cents?: number;
          booking_id?: string;
          charge_id?: string | null;
          cleaner_id?: string;
          created_at?: string;
          currency?: string;
          customer_id?: string;
          customer_note?: string | null;
          id?: string;
          paid_at?: string | null;
          refunded_at?: string | null;
          source?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_tips_charge';
            columns: ['charge_id'];
            isOneToOne: false;
            referencedRelation: 'charges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tips_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tips_cleaner_id_fkey';
            columns: ['cleaner_id'];
            isOneToOne: false;
            referencedRelation: 'cleaner_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tips_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customer_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      traits: {
        Row: {
          created_at: string;
          display_label: string;
          display_order: number;
          id: string;
          is_active: boolean;
          key: string;
          maps_to_specialty_key: string | null;
          sentiment: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_label: string;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          key: string;
          maps_to_specialty_key?: string | null;
          sentiment?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_label?: string;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          key?: string;
          maps_to_specialty_key?: string | null;
          sentiment?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_milestones: {
        Row: {
          completed_at: string;
          id: string;
          metadata: Json;
          milestone_key: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string;
          id?: string;
          metadata?: Json;
          milestone_key: string;
          user_id: string;
        };
        Update: {
          completed_at?: string;
          id?: string;
          metadata?: Json;
          milestone_key?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_milestones_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          clerk_user_id: string | null;
          created_at: string;
          deleted_at: string | null;
          email: string;
          full_name: string;
          id: string;
          phone: string | null;
          primary_role: Database['public']['Enums']['user_role'];
          search_tsv: unknown;
          status: Database['public']['Enums']['user_status'];
          timezone: string;
          updated_at: string;
        };
        Insert: {
          clerk_user_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email: string;
          full_name: string;
          id?: string;
          phone?: string | null;
          primary_role: Database['public']['Enums']['user_role'];
          search_tsv?: unknown;
          status?: Database['public']['Enums']['user_status'];
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          clerk_user_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email?: string;
          full_name?: string;
          id?: string;
          phone?: string | null;
          primary_role?: Database['public']['Enums']['user_role'];
          search_tsv?: unknown;
          status?: Database['public']['Enums']['user_status'];
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      waitlist_signups: {
        Row: {
          consent_to_marketing: boolean;
          converted_at: string | null;
          converted_to_user_id: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          notes: string | null;
          notification_email_id: string | null;
          notified_at: string | null;
          phone: string | null;
          referral_source: string | null;
          requested_service: Database['public']['Enums']['service_type'] | null;
          signed_up_at: string;
          status: Database['public']['Enums']['waitlist_status'];
          unsubscribed_at: string | null;
          updated_at: string;
          utm_campaign: string | null;
          utm_medium: string | null;
          utm_source: string | null;
          zip_code: string;
        };
        Insert: {
          consent_to_marketing?: boolean;
          converted_at?: string | null;
          converted_to_user_id?: string | null;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id?: string;
          notes?: string | null;
          notification_email_id?: string | null;
          notified_at?: string | null;
          phone?: string | null;
          referral_source?: string | null;
          requested_service?: Database['public']['Enums']['service_type'] | null;
          signed_up_at?: string;
          status?: Database['public']['Enums']['waitlist_status'];
          unsubscribed_at?: string | null;
          updated_at?: string;
          utm_campaign?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          zip_code: string;
        };
        Update: {
          consent_to_marketing?: boolean;
          converted_at?: string | null;
          converted_to_user_id?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          notes?: string | null;
          notification_email_id?: string | null;
          notified_at?: string | null;
          phone?: string | null;
          referral_source?: string | null;
          requested_service?: Database['public']['Enums']['service_type'] | null;
          signed_up_at?: string;
          status?: Database['public']['Enums']['waitlist_status'];
          unsubscribed_at?: string | null;
          updated_at?: string;
          utm_campaign?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          zip_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'waitlist_signups_converted_to_user_id_fkey';
            columns: ['converted_to_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      booking_buffered_end: { Args: { ts: string }; Returns: string };
      booking_buffered_start: { Args: { ts: string }; Returns: string };
      current_cleaner_id: { Args: never; Returns: string };
      current_customer_id: { Args: never; Returns: string };
      is_admin: { Args: never; Returns: boolean };
    };
    Enums: {
      address_type: 'customer_service' | 'cleaner_home' | 'business';
      admin_action_type:
        | 'cleaner_application_approved'
        | 'cleaner_application_rejected'
        | 'cleaner_application_requested_info'
        | 'cleaner_suspended'
        | 'cleaner_suspension_lifted'
        | 'cleaner_deactivated'
        | 'cleaner_reactivated'
        | 'tier_manually_adjusted'
        | 'reliability_event_overturned'
        | 'appeal_decision_recorded'
        | 'customer_suspended'
        | 'customer_suspension_lifted'
        | 'customer_deleted'
        | 'booking_admin_cancelled'
        | 'booking_state_corrected'
        | 'booking_rescheduled_by_admin'
        | 'refund_issued'
        | 'manual_payout_adjustment'
        | 'commission_corrected'
        | 'dispute_mediation_started'
        | 'dispute_admin_resolved'
        | 'dispute_escalated_to_legal'
        | 'insurance_verified'
        | 'insurance_rejected'
        | 'identity_manual_review'
        | 'review_hidden'
        | 'review_unhidden'
        | 'feature_flag_changed'
        | 'support_ticket_resolved'
        | 'data_export_fulfilled'
        | 'data_deletion_fulfilled';
      appeal_status: 'pending' | 'under_review' | 'upheld' | 'denied' | 'partial';
      appeal_target_type: 'tier_drop' | 'reliability_event';
      application_state:
        | 'draft'
        | 'submitted'
        | 'in_review'
        | 'needs_info'
        | 'approved'
        | 'rejected'
        | 'withdrawn'
        | 'expired';
      background_check_state:
        | 'requested'
        | 'pending'
        | 'in_progress'
        | 'clear'
        | 'consider'
        | 'failed'
        | 'cancelled'
        | 'expired';
      badge_type:
        | 'trusted_by_neighbors'
        | 'top_rated_in_zip'
        | 'customer_favorite_in_zip'
        | 'background_checked'
        | 'insurance_verified'
        | 'platform_milestone';
      booking_state:
        | 'pending_payment_authorization'
        | 'charge_failed'
        | 'booking_requested'
        | 'cleaner_declined'
        | 'confirmed'
        | 'imminent'
        | 'in_transit'
        | 'arrived'
        | 'in_progress'
        | 'completed'
        | 'awaiting_approval'
        | 'approved'
        | 'auto_approved'
        | 'paid'
        | 'disputed'
        | 'dispute_resolved'
        | 'reschedule_pending'
        | 'cancelled_by_customer'
        | 'cancelled_by_cleaner'
        | 'no_show_customer'
        | 'no_show_cleaner'
        | 'admin_cancelled';
      charge_state:
        | 'pending'
        | 'requires_action'
        | 'authorized'
        | 'captured'
        | 'failed'
        | 'cancelled'
        | 'refunded'
        | 'partially_refunded'
        | 'disputed_by_card_holder'
        | 'disputed_won'
        | 'disputed_lost';
      customer_desired_outcome: 'free_reclean' | 'partial_refund' | 'flexible_let_cleaner_propose';
      customer_reliability_event_type:
        | 'on_time_for_arrival'
        | 'no_show_for_arrival'
        | 'cancelled_late'
        | 'cancelled_very_late'
        | 'positive_cleaner_review'
        | 'negative_cleaner_review'
        | 'frivolous_dispute_flagged';
      delivery_state:
        | 'pending'
        | 'sent'
        | 'delivered'
        | 'opened'
        | 'failed'
        | 'bounced'
        | 'unsubscribed';
      dispute_issue_category:
        | 'quality_issue'
        | 'damage_to_property'
        | 'missing_item'
        | 'time_discrepancy'
        | 'safety_or_behavior';
      dispute_resolution_type:
        | 'mutual_refund'
        | 'mutual_reclean_completed'
        | 'mutual_no_action'
        | 'customer_backed_down'
        | 'cleaner_backed_down'
        | 'admin_refund'
        | 'admin_no_refund'
        | 'admin_partial_refund'
        | 'expired_no_resolution';
      dispute_response_type: 'offer_reclean' | 'offer_partial_refund' | 'stand_by_work';
      dispute_state:
        | 'open'
        | 'cleaner_responded'
        | 'awaiting_customer'
        | 'mutually_resolved'
        | 'escalated'
        | 'in_mediation'
        | 'admin_resolved'
        | 'expired';
      identity_verification_state:
        | 'created'
        | 'requires_input'
        | 'processing'
        | 'verified'
        | 'requires_action'
        | 'failed'
        | 'cancelled';
      insurance_state:
        | 'uploaded'
        | 'under_review'
        | 'verified'
        | 'rejected'
        | 'expired'
        | 'replaced';
      message_sender_role: 'customer' | 'cleaner' | 'system';
      message_status: 'sent' | 'delivered' | 'read';
      notification_channel: 'push' | 'email' | 'sms' | 'in_app';
      notification_type:
        | 'booking_confirmed'
        | 'booking_request_sent'
        | 'booking_request_declined'
        | 'booking_request_accepted'
        | 'booking_imminent_reminder'
        | 'cleaner_on_the_way'
        | 'cleaner_eta_update'
        | 'cleaner_arrived'
        | 'cleaner_running_late'
        | 'cleaning_started'
        | 'cleaning_complete'
        | 'job_approved'
        | 'job_auto_approved'
        | 'payment_captured'
        | 'reschedule_request_received'
        | 'reschedule_accepted'
        | 'reschedule_declined'
        | 'booking_cancelled_by_customer'
        | 'booking_cancelled_by_cleaner'
        | 'recurring_setup_confirmed'
        | 'recurring_next_in_24hr'
        | 'recurring_paused'
        | 'recurring_ending_in_14_days'
        | 'review_received'
        | 'review_prompt'
        | 'rebook_nudge'
        | 'tip_received'
        | 'tip_thank_you_prompt'
        | 'dispute_filed'
        | 'dispute_response_received'
        | 'dispute_response_due_soon'
        | 'dispute_escalated'
        | 'dispute_resolved'
        | 'dispute_in_mediation'
        | 'score_increased'
        | 'score_decreased'
        | 'tier_promoted'
        | 'tier_demoted'
        | 'tier_drop_appeal_window'
        | 'badge_earned'
        | 'specialty_earned'
        | 'probation_entered'
        | 'probation_lifted'
        | 'suspension_imposed'
        | 'suspension_lifted'
        | 'appeal_decision'
        | 'charge_failed'
        | 'payout_initiated'
        | 'payout_paid'
        | 'payout_failed'
        | 'refund_issued'
        | 'insurance_verified'
        | 'insurance_rejected'
        | 'insurance_expiring_soon'
        | 'insurance_expired'
        | 'background_check_complete'
        | 'background_check_renewal_due'
        | 'account_verified'
        | 'new_login_detected'
        | 'password_changed'
        | 'announcement'
        | 'support_ticket_response'
        | 'maintenance_notice';
      occurrence_status: 'scheduled' | 'spawned' | 'skipped' | 'rescheduled' | 'cancelled';
      payment_method_type: 'card' | 'bank_account';
      payout_state: 'pending' | 'in_transit' | 'paid' | 'failed' | 'cancelled';
      photo_purpose:
        | 'before_clock_in'
        | 'after_clock_out'
        | 'dispute_evidence_customer'
        | 'dispute_evidence_cleaner'
        | 'profile_photo_cleaner'
        | 'insurance_certificate'
        | 'identity_document';
      recurring_cadence:
        | 'every_week'
        | 'every_2_weeks'
        | 'every_4_weeks'
        | 'every_8_weeks'
        | 'every_12_weeks'
        | 'custom';
      recurring_status:
        | 'active'
        | 'paused'
        | 'ended_by_customer'
        | 'ended_by_cleaner'
        | 'ended_by_platform';
      refund_reason_type:
        | 'dispute_resolution'
        | 'cancellation_penalty'
        | 'cancellation_full'
        | 'goodwill'
        | 'duplicate_charge'
        | 'fraud'
        | 'service_unavailable'
        | 'other';
      reliability_event_type:
        | 'on_time_arrival'
        | 'late_arrival_minor'
        | 'late_arrival_major'
        | 'running_late_flagged'
        | 'no_show_arrival'
        | 'job_completed'
        | 'job_completed_with_issues'
        | 'cleaner_cancelled_late'
        | 'cleaner_no_show'
        | 'photo_upload_complete'
        | 'photo_upload_partial'
        | 'photo_upload_missing'
        | 'photo_quality_flagged'
        | 'five_star_review'
        | 'four_star_review'
        | 'three_star_review'
        | 'two_star_review'
        | 'one_star_review'
        | 'comm_response_fast'
        | 'comm_response_slow'
        | 'comm_response_missed'
        | 'reschedule_requested_by_cleaner'
        | 'reschedule_accepted_by_customer'
        | 'reschedule_no_response'
        | 'manual_admin_credit'
        | 'manual_admin_debit';
      reliability_metric_category:
        | 'on_time'
        | 'completion'
        | 'photo'
        | 'ratings'
        | 'communication'
        | 'reschedule';
      service_area_status: 'active' | 'seo_only' | 'waitlist' | 'inactive';
      service_type: 'standard' | 'deep' | 'move_out' | 'airbnb';
      stripe_connect_state:
        | 'not_started'
        | 'in_progress'
        | 'pending_verification'
        | 'active'
        | 'restricted'
        | 'disabled';
      support_ticket_category:
        | 'account_access'
        | 'billing_question'
        | 'app_bug'
        | 'feature_request'
        | 'safety_concern'
        | 'data_request'
        | 'partnership'
        | 'other';
      support_ticket_priority: 'low' | 'normal' | 'high' | 'urgent';
      support_ticket_status:
        | 'open'
        | 'awaiting_customer'
        | 'awaiting_admin'
        | 'in_progress'
        | 'resolved'
        | 'closed'
        | 'reopened';
      suspension_reason_type:
        | 'no_show_rule'
        | 'manual_admin'
        | 'fraud_investigation'
        | 'safety_concern'
        | 'background_check_fail'
        | 'insurance_lapsed'
        | 'other';
      tier_name: 'rising_pro' | 'proven_specialist' | 'top_performer' | 'all_star_expert';
      user_role: 'customer' | 'cleaner' | 'admin';
      user_status: 'active' | 'suspended' | 'deleted';
      waitlist_status: 'active' | 'notified' | 'converted' | 'unsubscribed';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      address_type: ['customer_service', 'cleaner_home', 'business'],
      admin_action_type: [
        'cleaner_application_approved',
        'cleaner_application_rejected',
        'cleaner_application_requested_info',
        'cleaner_suspended',
        'cleaner_suspension_lifted',
        'cleaner_deactivated',
        'cleaner_reactivated',
        'tier_manually_adjusted',
        'reliability_event_overturned',
        'appeal_decision_recorded',
        'customer_suspended',
        'customer_suspension_lifted',
        'customer_deleted',
        'booking_admin_cancelled',
        'booking_state_corrected',
        'booking_rescheduled_by_admin',
        'refund_issued',
        'manual_payout_adjustment',
        'commission_corrected',
        'dispute_mediation_started',
        'dispute_admin_resolved',
        'dispute_escalated_to_legal',
        'insurance_verified',
        'insurance_rejected',
        'identity_manual_review',
        'review_hidden',
        'review_unhidden',
        'feature_flag_changed',
        'support_ticket_resolved',
        'data_export_fulfilled',
        'data_deletion_fulfilled',
      ],
      appeal_status: ['pending', 'under_review', 'upheld', 'denied', 'partial'],
      appeal_target_type: ['tier_drop', 'reliability_event'],
      application_state: [
        'draft',
        'submitted',
        'in_review',
        'needs_info',
        'approved',
        'rejected',
        'withdrawn',
        'expired',
      ],
      background_check_state: [
        'requested',
        'pending',
        'in_progress',
        'clear',
        'consider',
        'failed',
        'cancelled',
        'expired',
      ],
      badge_type: [
        'trusted_by_neighbors',
        'top_rated_in_zip',
        'customer_favorite_in_zip',
        'background_checked',
        'insurance_verified',
        'platform_milestone',
      ],
      booking_state: [
        'pending_payment_authorization',
        'charge_failed',
        'booking_requested',
        'cleaner_declined',
        'confirmed',
        'imminent',
        'in_transit',
        'arrived',
        'in_progress',
        'completed',
        'awaiting_approval',
        'approved',
        'auto_approved',
        'paid',
        'disputed',
        'dispute_resolved',
        'reschedule_pending',
        'cancelled_by_customer',
        'cancelled_by_cleaner',
        'no_show_customer',
        'no_show_cleaner',
        'admin_cancelled',
      ],
      charge_state: [
        'pending',
        'requires_action',
        'authorized',
        'captured',
        'failed',
        'cancelled',
        'refunded',
        'partially_refunded',
        'disputed_by_card_holder',
        'disputed_won',
        'disputed_lost',
      ],
      customer_desired_outcome: ['free_reclean', 'partial_refund', 'flexible_let_cleaner_propose'],
      customer_reliability_event_type: [
        'on_time_for_arrival',
        'no_show_for_arrival',
        'cancelled_late',
        'cancelled_very_late',
        'positive_cleaner_review',
        'negative_cleaner_review',
        'frivolous_dispute_flagged',
      ],
      delivery_state: [
        'pending',
        'sent',
        'delivered',
        'opened',
        'failed',
        'bounced',
        'unsubscribed',
      ],
      dispute_issue_category: [
        'quality_issue',
        'damage_to_property',
        'missing_item',
        'time_discrepancy',
        'safety_or_behavior',
      ],
      dispute_resolution_type: [
        'mutual_refund',
        'mutual_reclean_completed',
        'mutual_no_action',
        'customer_backed_down',
        'cleaner_backed_down',
        'admin_refund',
        'admin_no_refund',
        'admin_partial_refund',
        'expired_no_resolution',
      ],
      dispute_response_type: ['offer_reclean', 'offer_partial_refund', 'stand_by_work'],
      dispute_state: [
        'open',
        'cleaner_responded',
        'awaiting_customer',
        'mutually_resolved',
        'escalated',
        'in_mediation',
        'admin_resolved',
        'expired',
      ],
      identity_verification_state: [
        'created',
        'requires_input',
        'processing',
        'verified',
        'requires_action',
        'failed',
        'cancelled',
      ],
      insurance_state: ['uploaded', 'under_review', 'verified', 'rejected', 'expired', 'replaced'],
      message_sender_role: ['customer', 'cleaner', 'system'],
      message_status: ['sent', 'delivered', 'read'],
      notification_channel: ['push', 'email', 'sms', 'in_app'],
      notification_type: [
        'booking_confirmed',
        'booking_request_sent',
        'booking_request_declined',
        'booking_request_accepted',
        'booking_imminent_reminder',
        'cleaner_on_the_way',
        'cleaner_eta_update',
        'cleaner_arrived',
        'cleaner_running_late',
        'cleaning_started',
        'cleaning_complete',
        'job_approved',
        'job_auto_approved',
        'payment_captured',
        'reschedule_request_received',
        'reschedule_accepted',
        'reschedule_declined',
        'booking_cancelled_by_customer',
        'booking_cancelled_by_cleaner',
        'recurring_setup_confirmed',
        'recurring_next_in_24hr',
        'recurring_paused',
        'recurring_ending_in_14_days',
        'review_received',
        'review_prompt',
        'rebook_nudge',
        'tip_received',
        'tip_thank_you_prompt',
        'dispute_filed',
        'dispute_response_received',
        'dispute_response_due_soon',
        'dispute_escalated',
        'dispute_resolved',
        'dispute_in_mediation',
        'score_increased',
        'score_decreased',
        'tier_promoted',
        'tier_demoted',
        'tier_drop_appeal_window',
        'badge_earned',
        'specialty_earned',
        'probation_entered',
        'probation_lifted',
        'suspension_imposed',
        'suspension_lifted',
        'appeal_decision',
        'charge_failed',
        'payout_initiated',
        'payout_paid',
        'payout_failed',
        'refund_issued',
        'insurance_verified',
        'insurance_rejected',
        'insurance_expiring_soon',
        'insurance_expired',
        'background_check_complete',
        'background_check_renewal_due',
        'account_verified',
        'new_login_detected',
        'password_changed',
        'announcement',
        'support_ticket_response',
        'maintenance_notice',
      ],
      occurrence_status: ['scheduled', 'spawned', 'skipped', 'rescheduled', 'cancelled'],
      payment_method_type: ['card', 'bank_account'],
      payout_state: ['pending', 'in_transit', 'paid', 'failed', 'cancelled'],
      photo_purpose: [
        'before_clock_in',
        'after_clock_out',
        'dispute_evidence_customer',
        'dispute_evidence_cleaner',
        'profile_photo_cleaner',
        'insurance_certificate',
        'identity_document',
      ],
      recurring_cadence: [
        'every_week',
        'every_2_weeks',
        'every_4_weeks',
        'every_8_weeks',
        'every_12_weeks',
        'custom',
      ],
      recurring_status: [
        'active',
        'paused',
        'ended_by_customer',
        'ended_by_cleaner',
        'ended_by_platform',
      ],
      refund_reason_type: [
        'dispute_resolution',
        'cancellation_penalty',
        'cancellation_full',
        'goodwill',
        'duplicate_charge',
        'fraud',
        'service_unavailable',
        'other',
      ],
      reliability_event_type: [
        'on_time_arrival',
        'late_arrival_minor',
        'late_arrival_major',
        'running_late_flagged',
        'no_show_arrival',
        'job_completed',
        'job_completed_with_issues',
        'cleaner_cancelled_late',
        'cleaner_no_show',
        'photo_upload_complete',
        'photo_upload_partial',
        'photo_upload_missing',
        'photo_quality_flagged',
        'five_star_review',
        'four_star_review',
        'three_star_review',
        'two_star_review',
        'one_star_review',
        'comm_response_fast',
        'comm_response_slow',
        'comm_response_missed',
        'reschedule_requested_by_cleaner',
        'reschedule_accepted_by_customer',
        'reschedule_no_response',
        'manual_admin_credit',
        'manual_admin_debit',
      ],
      reliability_metric_category: [
        'on_time',
        'completion',
        'photo',
        'ratings',
        'communication',
        'reschedule',
      ],
      service_area_status: ['active', 'seo_only', 'waitlist', 'inactive'],
      service_type: ['standard', 'deep', 'move_out', 'airbnb'],
      stripe_connect_state: [
        'not_started',
        'in_progress',
        'pending_verification',
        'active',
        'restricted',
        'disabled',
      ],
      support_ticket_category: [
        'account_access',
        'billing_question',
        'app_bug',
        'feature_request',
        'safety_concern',
        'data_request',
        'partnership',
        'other',
      ],
      support_ticket_priority: ['low', 'normal', 'high', 'urgent'],
      support_ticket_status: [
        'open',
        'awaiting_customer',
        'awaiting_admin',
        'in_progress',
        'resolved',
        'closed',
        'reopened',
      ],
      suspension_reason_type: [
        'no_show_rule',
        'manual_admin',
        'fraud_investigation',
        'safety_concern',
        'background_check_fail',
        'insurance_lapsed',
        'other',
      ],
      tier_name: ['rising_pro', 'proven_specialist', 'top_performer', 'all_star_expert'],
      user_role: ['customer', 'cleaner', 'admin'],
      user_status: ['active', 'suspended', 'deleted'],
      waitlist_status: ['active', 'notified', 'converted', 'unsubscribed'],
    },
  },
} as const;
