import { notFound, redirect } from 'next/navigation';

import { BookingForm } from '@/features/booking/components/BookingForm';
import { listServices } from '@/features/booking/queries';
import { getUserAddresses } from '@/features/customer/queries';
import { getCleanerProfile } from '@/features/discovery/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/** Next 14 days, computed server-side so the client wizard hydrates deterministically. */
function buildDateOptions() {
  const today = new Date();
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      dow: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      day: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  });
}

type PageProps = { params: Promise<{ id: string }> };

const BookPage = async ({ params }: PageProps) => {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const [cleaner, services, addresses] = await Promise.all([
    getCleanerProfile(id),
    listServices(),
    getUserAddresses(),
  ]);

  if (!cleaner) notFound();

  const offeredServices = services.filter(
    (s) => (cleaner.hourly_rates_cents[s.service_type] ?? 0) > 0,
  );
  if (offeredServices.length === 0) {
    return (
      <div className="max-w-lg">
        <p className="text-sm text-neutral-500">This cleaner has no active services available.</p>
      </div>
    );
  }

  const dateOptions = buildDateOptions();

  return (
    <div className="mx-auto w-full max-w-lg">
      <BookingForm
        cleaner={{
          id: cleaner.id,
          full_name: cleaner.full_name,
          current_tier: cleaner.current_tier,
          hourly_rates_cents: cleaner.hourly_rates_cents,
        }}
        services={services}
        addresses={addresses.map((a) => ({
          id: a.id,
          street_1: a.street_1,
          city: a.city,
          state: a.state,
        }))}
        dateOptions={dateOptions}
      />
    </div>
  );
};

export default BookPage;
