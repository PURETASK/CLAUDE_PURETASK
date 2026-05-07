import Link from 'next/link';
import { redirect } from 'next/navigation';

import { BookingCard } from '@/features/booking/components/BookingCard';
import { getMyBookingsAsCustomer } from '@/features/booking/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const BookingsPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const bookings = await getMyBookingsAsCustomer();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="flex flex-col gap-3 text-sm text-zinc-500">
          <p>No bookings yet.</p>
          <Link href="/app/cleaners" className="self-start underline">
            Find a cleaner
          </Link>
        </div>
      ) : (
        <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          {bookings.map((b) => (
            <BookingCard key={b.id} booking={b} href={`/app/bookings/${b.id}`} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
