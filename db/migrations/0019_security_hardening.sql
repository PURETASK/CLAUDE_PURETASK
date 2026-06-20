-- V1 pre-launch DB security hardening (Supabase database linter findings).
-- Applied to the live project via MCP; this file keeps repo ↔ DB in sync.
--
-- Addresses two lints:
--   0011_function_search_path_mutable
--   0028/0029_*_security_definer_function_executable (trigger functions only)

-- 1) Pin search_path on functions with a role-mutable search_path. 'public'
--    keeps unqualified references to app tables/operators (e.g. earthdistance
--    used by distance_miles) working; pg_catalog stays implicitly first. This
--    is non-breaking and removes the mutable-search_path attack surface.
ALTER FUNCTION public.distance_miles(double precision, double precision, double precision, double precision) SET search_path = public;
ALTER FUNCTION public.generate_cleaner_application_number() SET search_path = public;
ALTER FUNCTION public.booking_buffered_end(timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.booking_buffered_start(timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.cascade_recurring_schedule_end() SET search_path = public;
ALTER FUNCTION public.commission_records_immutability() SET search_path = public;
ALTER FUNCTION public.reject_modifications() SET search_path = public;
ALTER FUNCTION public.reject_review_content_changes() SET search_path = public;
ALTER FUNCTION public.reliability_events_immutability() SET search_path = public;
ALTER FUNCTION public.trigger_cleaner_profiles_search_tsv() SET search_path = public;
ALTER FUNCTION public.trigger_set_updated_at() SET search_path = public;
ALTER FUNCTION public.trigger_users_search_tsv() SET search_path = public;
ALTER FUNCTION public.current_cleaner_id() SET search_path = public;
ALTER FUNCTION public.current_customer_id() SET search_path = public;
-- (booking_id_from_object_name was hardened separately in 0018.)

-- 2) Remove RPC reachability of the SECURITY DEFINER *trigger* functions.
--    Default EXECUTE is granted to PUBLIC, so it must be revoked FROM PUBLIC
--    (revoking from anon/authenticated alone is a no-op). Triggers still fire —
--    they run as the function owner, independent of EXECUTE grants.
REVOKE EXECUTE ON FUNCTION public.handle_cleaner_application_approved() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_customer_profile_from_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_cleaner_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_customer_user() FROM PUBLIC;

-- INTENTIONALLY NOT CHANGED:
--   is_admin(), current_customer_id(), current_cleaner_id() remain EXECUTE-able
--   by authenticated/anon — they are SECURITY DEFINER helpers invoked inside RLS
--   policies, and revoking would break row-level security. Accepted finding.
--
-- DEFERRED (handled outside migrations):
--   extension_in_public (citext / btree_gist / cube / earthdistance) — moving
--     system extensions out of public is involved; revisit post-launch.
--   auth_leaked_password_protection — enable in Supabase Dashboard
--     (Authentication → Policies), not a SQL change.
