import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { MessageThread } from '@/features/messaging/components/MessageThread';
import { getBookingForMessaging, getMessages } from '@/features/messaging/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type PageProps = { params: Promise<{ id: string }> };

const MessagesPage = async ({ params }: PageProps) => {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const [booking, messages] = await Promise.all([
    getBookingForMessaging(id),
    getMessages(id),
  ]);

  if (!booking) notFound();

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link
          href={`/app/bookings/${booking.id}`}
          className="text-sm text-neutral-400 transition-colors hover:text-neutral-700"
        >
          ← Booking #{booking.bookingNumber}
        </Link>
        <span className="text-neutral-200">/</span>
        <h1 className="text-base font-semibold text-neutral-900">
          Chat with {booking.otherPartyName}
        </h1>
      </div>

      <MessageThread
        initialMessages={messages}
        bookingId={booking.id}
        userRole={booking.userRole}
        userId={booking.userId}
        otherPartyName={booking.otherPartyName}
        expiresAt={booking.expiresAt}
        isExpired={booking.isExpired}
      />
    </div>
  );
};

export default MessagesPage;
