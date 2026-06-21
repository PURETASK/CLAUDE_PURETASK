import { ArrowLeft } from 'lucide-react';
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

  const [booking, messages] = await Promise.all([getBookingForMessaging(id), getMessages(id)]);

  if (!booking) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/app/bookings/${booking.id}`}
          className="flex-shrink-0 text-neutral-500 transition-colors hover:text-neutral-900"
          aria-label="Back to booking"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </Link>
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-400">
          {booking.otherPartyName.charAt(0)}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-neutral-900">
            {booking.otherPartyName}
          </h1>
          <p className="truncate text-xs text-neutral-500">Booking #{booking.bookingNumber}</p>
        </div>
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
