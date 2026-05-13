import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { BookingCard } from '@/features/booking/components/BookingCard';
import { getMyBookingsAsCustomer } from '@/features/booking/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { ICONS } from '@/lib/assets';

const BookingsPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const bookings = await getMyBookingsAsCustomer();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Image
          src={ICONS.calendar}
          alt=""
          width={52}
          height={52}
          className="rounded-xl drop-shadow-md"
        />
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Bookings</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Your upcoming and past cleanings.</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-tier1">
          <EmptyState
            showDash
            title="No bookings yet"
            description="Ready when you are. Browse background-checked cleaners and book in seconds."
            action={{ label: 'Find a cleaner', href: '/app/cleaners' }}
          />
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
