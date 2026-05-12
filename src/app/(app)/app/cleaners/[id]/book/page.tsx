import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { BookingForm } from '@/features/booking/components/BookingForm';
import { listServices } from '@/features/booking/queries';
import { getCleanerProfile } from '@/features/discovery/queries';
import { getUserAddresses } from '@/features/customer/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href={`/app/cleaners/${id}`} className="text-sm text-neutral-500 hover:text-neutral-900">
          {cleaner.full_name}
        </Link>
        <span className="text-neutral-300">/</span>
        <h1 className="text-xl font-semibold">Book a cleaning</h1>
      </div>

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
      />
    </div>
  );
};

export default BookPage;
