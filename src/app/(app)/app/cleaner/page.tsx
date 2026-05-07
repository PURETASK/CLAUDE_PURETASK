import { redirect } from 'next/navigation';

import { BookingCard } from '@/features/booking/components/BookingCard';
import { getMyBookingsAsCleaner, getMyCleanerProfileId } from '@/features/booking/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const CleanerDashboardPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const cleanerProfileId = await getMyCleanerProfileId();
  if (!cleanerProfileId) redirect('/app/apply');

  const bookings = await getMyBookingsAsCleaner();

  const incoming = bookings.filter((b) => b.state === 'booking_requested');
  const active = bookings.filter((b) => b.state === 'confirmed');
  const past = bookings.filter((b) =>
    [
      'cleaner_declined',
      'cancelled_by_customer',
      'cancelled_by_cleaner',
      'completed',
      'paid',
    ].includes(b.state),
  );

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">Cleaner Dashboard</h1>

      <section>
        <p className="mb-3 font-medium">
          Incoming requests{incoming.length > 0 ? ` (${incoming.length})` : ''}
        </p>
        {incoming.length === 0 ? (
          <p className="text-sm text-zinc-400">No pending requests.</p>
        ) : (
          <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            {incoming.map((b) => (
              <BookingCard key={b.id} booking={b} href={`/app/cleaner/bookings/${b.id}`} />
            ))}
          </div>
        )}
      </section>

      {active.length > 0 && (
        <section>
          <p className="mb-3 font-medium">Confirmed ({active.length})</p>
          <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            {active.map((b) => (
              <BookingCard key={b.id} booking={b} href={`/app/cleaner/bookings/${b.id}`} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <p className="mb-3 font-medium text-zinc-500">Past bookings</p>
          <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            {past.map((b) => (
              <BookingCard key={b.id} booking={b} href={`/app/cleaner/bookings/${b.id}`} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default CleanerDashboardPage;
