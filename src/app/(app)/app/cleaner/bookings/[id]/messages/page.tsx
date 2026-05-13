import { notFound, redirect } from 'next/navigation';

import { MessageThread } from '@/features/messaging/components/MessageThread';
import { getBookingForMessaging, getMessages } from '@/features/messaging/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ id: string }> };

export default async function CleanerBookingMessagesPage({ params }: Props) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { id } = await params;

  const [booking, messages] = await Promise.all([getBookingForMessaging(id), getMessages(id)]);

  if (!booking) notFound();
  if (booking.userRole !== 'cleaner') notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4">
        <a
          href={`/app/cleaner/bookings/${id}`}
          className="text-sm text-neutral-400 hover:text-neutral-700"
        >
          ← Back to booking
        </a>
        <h1 className="mt-2 text-xl font-semibold text-neutral-900">
          Message — {booking.otherPartyName}
        </h1>
        <p className="mt-0.5 text-sm text-neutral-400">Booking #{booking.bookingNumber}</p>
      </div>

      <MessageThread
        initialMessages={messages}
        bookingId={id}
        userRole="cleaner"
        userId={user.id}
        otherPartyName={booking.otherPartyName}
        expiresAt={booking.expiresAt}
        isExpired={booking.isExpired}
      />
    </div>
  );
}
