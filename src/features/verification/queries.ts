import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';

import type { PhotoCounts, PhotoPurpose } from './photo-rules';

export type BookingPhoto = {
  id: string;
  storage_key: string;
  purpose: PhotoPurpose;
  uploaded_at: string;
  cdn_url: string | null;
};

export const getBookingPhotos = async (bookingId: string): Promise<BookingPhoto[]> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('booking_photos')
    .select('id, storage_key, purpose, uploaded_at, cdn_url')
    .eq('booking_id', bookingId)
    .is('deleted_at', null)
    .order('uploaded_at', { ascending: true });
  return (data ?? []) as BookingPhoto[];
};

export const getPhotoCounts = async (bookingId: string): Promise<PhotoCounts> => {
  const photos = await getBookingPhotos(bookingId);
  return {
    before: photos.filter((p) => p.purpose === 'before_clock_in').length,
    after: photos.filter((p) => p.purpose === 'after_clock_out').length,
  };
};

export const signedUrlForPhoto = async (
  storageKey: string,
  ttlSeconds = 60 * 10,
): Promise<string | null> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.storage
    .from('booking-photos')
    .createSignedUrl(storageKey, ttlSeconds);
  return data?.signedUrl ?? null;
};
