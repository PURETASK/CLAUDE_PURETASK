-- Harden the search_path on the booking-photos RLS helper added in 0017.
--
-- The Supabase database linter flags functions with a role-mutable search_path
-- (lint 0011_function_search_path_mutable). booking_id_from_object_name only
-- uses built-in pg_catalog functions (split_part), so an empty search_path is
-- safe and removes the warning.
ALTER FUNCTION public.booking_id_from_object_name(text) SET search_path = '';
