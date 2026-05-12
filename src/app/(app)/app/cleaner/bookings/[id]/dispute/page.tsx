import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getBookingById, getMyCleanerProfileId } from '@/features/booking/queries';
import { getDisputeForBooking, getDisputeMessages } from '@/features/disputes/queries';
import { DisputeStateBadge } from '@/features/disputes/components/DisputeStateBadge';
import { DisputeThread } from '@/features/disputes/components/DisputeThread';
import { CleanerResponseForm } from '@/features/disputes/components/CleanerResponseForm';
import { DESIRED_OUTCOME_LABELS, ISSUE_CATEGORY_LABELS } from '@/features/disputes/validation';

type Props = { params: Promise<{ id: string }> };

export default async function CleanerDisputePage({ params }: Props) {
  const { id } = await params;
  const [booking, cleanerProfileId] = await Promise.all([
    getBookingById(id),
    getMyCleanerProfileId(),
  ]);

  if (!booking || !cleanerProfileId) notFound();
  if (booking.cleaner_id !== cleanerProfileId) notFound();

  const dispute = await getDisputeForBooking(id);
  if (!dispute) notFound();

  const messages = await getDisputeMessages(dispute.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href={`/app/cleaner/bookings/${id}`}
            className="mb-1 block text-xs text-neutral-400 hover:text-neutral-600"
          >
            ← Back to booking
          </Link>
          <h1 className="text-xl font-semibold">Dispute</h1>
          <p className="text-sm text-neutral-500">Booking {booking.booking_number}</p>
        </div>
        <DisputeStateBadge state={dispute.state} />
      </div>

      <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-4 text-sm">
        <p className="mb-2 font-medium text-red-800">Customer filed a dispute</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-red-700">
          <dt>Issue</dt>
          <dd>{ISSUE_CATEGORY_LABELS[dispute.issue_category] ?? dispute.issue_category}</dd>
          <dt>Customer wants</dt>
          <dd>
            {DESIRED_OUTCOME_LABELS[dispute.customer_desired_outcome] ??
              dispute.customer_desired_outcome}
          </dd>
        </dl>
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold">Conversation</h2>
        <DisputeThread messages={messages} viewerRole="cleaner" />
      </div>

      {dispute.state === 'open' && (
        <div>
          <h2 className="mb-3 text-sm font-semibold">Your response</h2>
          <p className="mb-4 text-sm text-neutral-500">
            You have until {new Date(dispute.cleaner_response_due_at).toLocaleString()} to respond.
          </p>
          <CleanerResponseForm disputeId={dispute.id} />
        </div>
      )}

      {[
        'cleaner_responded',
        'awaiting_customer',
        'mutually_resolved',
        'admin_resolved',
        'escalated',
        'in_mediation',
      ].includes(dispute.state) && (
        <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
          <p className="text-sm text-neutral-600">
            {dispute.state === 'cleaner_responded' || dispute.state === 'awaiting_customer'
              ? 'Waiting for the customer to review your response.'
              : dispute.state === 'mutually_resolved'
                ? 'This dispute has been mutually resolved.'
                : dispute.state === 'admin_resolved'
                  ? 'An admin has resolved this dispute.'
                  : 'This dispute has been escalated to our team for review.'}
          </p>
        </div>
      )}
    </div>
  );
}
