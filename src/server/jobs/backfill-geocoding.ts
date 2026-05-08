import { geocodeStructuredAddress } from '@/lib/google-maps/geocoding';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const BATCH_SIZE = 50;

const runBackfill = async () => {
  const admin = createSupabaseAdminClient();

  const { data: rows, error } = await admin
    .from('addresses')
    .select('id, street_1, street_2, city, state, zip_code, country')
    .is('deleted_at', null)
    .is('latitude', null)
    .is('longitude', null)
    .limit(BATCH_SIZE);

  if (error) {
    console.error('Geocode backfill query failed:', error.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log('No address rows pending geocode.');
    return;
  }

  let success = 0;
  let failed = 0;

  for (const row of rows) {
    const coords = await geocodeStructuredAddress({
      street1: row.street_1,
      street2: row.street_2,
      city: row.city,
      state: row.state,
      zip: row.zip_code,
      country: row.country ?? 'US',
    });

    if (!coords) {
      failed += 1;
      continue;
    }

    const { error: updateError } = await admin
      .from('addresses')
      .update({
        latitude: Number(coords.lat.toFixed(7)),
        longitude: Number(coords.lng.toFixed(7)),
        geocoded_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    if (updateError) {
      failed += 1;
      continue;
    }

    success += 1;
  }

  console.log(`Backfill complete. success=${success}, failed=${failed}, scanned=${rows.length}`);
};

void runBackfill();
