import { geocodeStructuredAddress } from '@/lib/google-maps/geocoding';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Fire-and-forget geocode for a row the user just created/updated. Uses the service role so
 * coordinate writes are not blocked when the request context has already ended.
 */
export const queueAddressGeocodeFromServerAction = (addressId: string): void => {
  void (async () => {
    try {
      const admin = createSupabaseAdminClient();
      const { data: row } = await admin
        .from('addresses')
        .select('id, street_1, street_2, city, state, zip_code, country')
        .eq('id', addressId)
        .maybeSingle();

      if (!row) return;

      const coords = await geocodeStructuredAddress({
        street1: row.street_1,
        street2: row.street_2,
        city: row.city,
        state: row.state,
        zip: row.zip_code,
        country: row.country ?? 'US',
      });

      if (!coords) return;

      await admin
        .from('addresses')
        .update({
          latitude: Number(coords.lat.toFixed(7)),
          longitude: Number(coords.lng.toFixed(7)),
          geocoded_at: new Date().toISOString(),
        })
        .eq('id', addressId);
    } catch {
      // Silent; operator can rerun backfill job.
    }
  })();
};
