import Link from 'next/link';

import { BookingStateBadge } from '@/features/booking/components/BookingStateBadge';
import type { BookingListItem } from '@/features/booking/queries';

type Props = { booking: BookingListItem; href: string };

export const BookingCard = ({ booking, href }: Props) => {
  const start = new Date(booking.start_at);
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded border bg-white p-4 transition-shadow hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium">{booking.booking_number}</span>
        <BookingStateBadge state={booking.state} />
      </div>
      <div className="text-sm text-zinc-600">
        {booking.service_display_name} · {booking.other_party_name}
      </div>
      <div className="text-xs text-zinc-400">
        {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
        {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} ·{' '}
        {booking.duration_hours_decimal}hr
      </div>
      <div className="text-xs text-zinc-400">{booking.address_street}</div>
    </Link>
  );
};
