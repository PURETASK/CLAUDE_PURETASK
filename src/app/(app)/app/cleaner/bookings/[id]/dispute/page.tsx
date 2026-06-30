import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card } from '@/components/ui/card';
import { getBookingById, getMyCleanerProfileId } from '@/features/booking/queries';
import { CleanerResponseForm } from '@/features/disputes/components/CleanerResponseForm';
import { DisputeEvidenceUpload } from '@/features/disputes/components/DisputeEvidenceUpload';
import { DisputePhotos } from '@/features/disputes/components/DisputePhotos';
import { DisputeStateBadge } from '@/features/disputes/components/DisputeStateBadge';
import { DisputeThread } from '@/features/disputes/components/DisputeThread';
import {
  getBookingPhotosForDispute,
  getDisputeForBooking,
  getDisputeMessages,
} from '@/features/disputes/queries';
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
  const photos = await getBookingPhotosForDispute(id);

  const resolvedLike = [
    'cleaner_responded',
    'awaiting_customer',
    'mutually_resolved',
    'admin_resolved',
    'escalated',
    'in_mediation',
  ].includes(dispute.state);

  const disputeActive = [
    'open',
    'cleaner_responded',
    'awaiting_customer',
    'escalated',
    'in_mediation',
  ].includes(dispute.state);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href={`/app/cleaner/bookings/${id}`}
          className="flex-shrink-0 text-neutral-500 transition-colors hover:text-neutral-900"
          aria-label="Back to booking"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-neutral-900">Dispute</h1>
          <p className="text-xs text-neutral-500">Booking {booking.booking_number}</p>
        </div>
        <DisputeStateBadge state={dispute.state} />
      </div>

      <Card elevation={1} className="border border-error/30 bg-error-light p-4 text-sm">
        <p className="mb-2 font-semibold text-error-dark">Customer filed a dispute</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-error-dark/90">
          <dt className="text-error-dark/70">Issue</dt>
          <dd>{ISSUE_CATEGORY_LABELS[dispute.issue_category] ?? dispute.issue_category}</dd>
          <dt className="text-error-dark/70">Customer wants</dt>
          <dd>
            {DESIRED_OUTCOME_LABELS[dispute.customer_desired_outcome] ??
              dispute.customer_desired_outcome}
          </dd>
        </dl>
      </Card>

      <DisputePhotos photos={photos} />

      {disputeActive && <DisputeEvidenceUpload bookingId={id} />}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Conversation</h2>
        <DisputeThread messages={messages} viewerRole="cleaner" />
      </div>

      {dispute.state === 'open' && (
        <div>
          <h2 className="mb-1 text-sm font-semibold text-neutral-900">Your response</h2>
          <p className="mb-4 text-sm text-neutral-500">
            You have until {new Date(dispute.cleaner_response_due_at).toLocaleString()} to respond.
          </p>
          <CleanerResponseForm disputeId={dispute.id} />
        </div>
      )}

      {resolvedLike && (
        <Card elevation={1} className="border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm text-neutral-600">
            {dispute.state === 'cleaner_responded' || dispute.state === 'awaiting_customer'
              ? 'Waiting for the customer to review your response.'
              : dispute.state === 'mutually_resolved'
                ? 'This dispute has been mutually resolved.'
                : dispute.state === 'admin_resolved'
                  ? 'An admin has resolved this dispute.'
                  : 'This dispute has been escalated to our team for review.'}
          </p>
        </Card>
      )}
    </div>
  );
}
