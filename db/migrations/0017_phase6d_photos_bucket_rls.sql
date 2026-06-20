-- Phase 6d-3 (verification): Supabase Storage bucket for booking photos + RLS.
--
-- Bucket name: 'booking-photos' (private)
-- Object key shape: bookings/{booking_id}/photos/{uuid}.{ext}
--
-- Access policy:
--   - INSERT: cleaner of the booking, when the booking is in_progress
--   - SELECT: customer + cleaner of the booking, and admins (via service role)
--   - UPDATE: never
--   - DELETE: only the 90-day cleanup job (service role)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'booking-photos',
  'booking-photos',
  FALSE,
  10 * 1024 * 1024, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Helper: extract booking_id from object key "bookings/{uuid}/..."
CREATE OR REPLACE FUNCTION public.booking_id_from_object_name(name TEXT)
RETURNS UUID
LANGUAGE sql IMMUTABLE
AS $$
  SELECT NULLIF(split_part(split_part(name, '/', 2), '.', 1), '')::uuid
  WHERE name LIKE 'bookings/%/photos/%';
$$;

-- Cleaner can INSERT photos for an in_progress booking they own.
DROP POLICY IF EXISTS booking_photos_insert_cleaner ON storage.objects;
CREATE POLICY booking_photos_insert_cleaner ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'booking-photos'
    AND EXISTS (
      SELECT 1
      FROM public.bookings b
      JOIN public.cleaner_profiles cp ON cp.id = b.cleaner_id
      WHERE b.id = public.booking_id_from_object_name(name)
        AND cp.user_id = auth.uid()
        AND b.state = 'in_progress'
    )
  );

-- Customer + cleaner of the booking can SELECT (read) photos for their booking.
DROP POLICY IF EXISTS booking_photos_select_party ON storage.objects;
CREATE POLICY booking_photos_select_party ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'booking-photos'
    AND EXISTS (
      SELECT 1
      FROM public.bookings b
      LEFT JOIN public.cleaner_profiles cp ON cp.id = b.cleaner_id
      LEFT JOIN public.customer_profiles cu ON cu.id = b.customer_id
      WHERE b.id = public.booking_id_from_object_name(name)
        AND (cp.user_id = auth.uid() OR cu.user_id = auth.uid())
    )
  );

COMMENT ON FUNCTION public.booking_id_from_object_name(TEXT) IS
  'Phase 8: parses booking_id from a booking-photos object key for RLS.';
