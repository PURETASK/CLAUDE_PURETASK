import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card } from '@/components/ui/card';
import { ApproveWorkButton } from '@/features/booking/components/ApproveWorkButton';
import { getBookingById, getMyCustomerProfileId } from '@/features/booking/queries';
import { CustomerResolutionButtons } from '@/features/disputes/components/CustomerResolutionButtons';
import { DisputePhotos } from '@/features/disputes/components/DisputePhotos';
import { DisputeStateBadge } from '@/features/disputes/components/DisputeStateBadge';
import { DisputeThread } from '@/features/disputes/components/DisputeThread';
import { FileDisputeForm } from '@/features/disputes/components/FileDisputeForm';
import {
  getBookingPhotosForDispute,
  getDisputeForBooking,
  getDisputeMessages,
} from '@/features/disputes/queries';
import {
  DESIRED_OUTCOME_LABELS,
  ISSUE_CATEGORY_LABELS,
  RESPONSE_TYPE_LABELS,
} from '@/features/disputes/validation';

type Props = { params: Promise<{ id: string }> };

export default async function CustomerDisputePage({ params }: Props) {
  const { id } = await params;
  const [booking, customerProfileId] = await Promise.all([
    getBookingById(id),
    getMyCustomerProfileId(),
  ]);

  if (!booking || !customerProfileId) notFound();
  if (booking.customer_id !== customerProfileId) notFound();

  const dispute = await getDisputeForBooking(id);
  const messages = dispute ? await getDisputeMessages(dispute.id) : [];
  const photos = await getBookingPhotosForDispute(id);
  const canFileDispute = !dispute && ['approved', 'auto_approved', 'paid'].includes(booking.state);
  const awaitingApproval = booking.state === 'awaiting_approval';

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href={`/app/bookings/${id}`}
          className="flex-shrink-0 text-neutral-500 transition-colors hover:text-neutral-900"
          aria-label="Back to booking"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-neutral-900">
            {dispute ? 'Dispute' : 'File a dispute'}
          </h1>
          <p className="text-xs text-neutral-500">Booking {booking.booking_number}</p>
        </div>
        {dispute && <DisputeStateBadge state={dispute.state} />}
      </div>

      {awaitingApproval && !dispute && (
        <Card elevation={1} className="border border-warning/30 bg-warning-light p-4">
          <p className="mb-3 text-sm font-medium text-warning-dark">
            Your cleaner has marked this job complete. Review and approve, or file a dispute below.
          </p>
          <ApproveWorkButton bookingId={id} />
        </Card>
      )}

      <DisputePhotos photos={photos} />

      {dispute ? (
        <>
          <Card elevation={1} className="border border-neutral-200 p-4 text-sm">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <dt className="text-neutral-400">Issue</dt>
              <dd className="font-medium text-neutral-900">
                {ISSUE_CATEGORY_LABELS[dispute.issue_category] ?? dispute.issue_category}
              </dd>
              <dt className="text-neutral-400">You asked for</dt>
              <dd className="font-medium text-neutral-900">
                {DESIRED_OUTCOME_LABELS[dispute.customer_desired_outcome] ??
                  dispute.customer_desired_outcome}
              </dd>
              {dispute.cleaner_response_type && (
                <>
                  <dt className="text-neutral-400">Cleaner offered</dt>
                  <dd className="font-medium text-neutral-900">
                    {RESPONSE_TYPE_LABELS[dispute.cleaner_response_type] ??
                      dispute.cleaner_response_type}
                  </dd>
                </>
              )}
            </dl>
          </Card>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-neutral-900">Conversation</h2>
            <DisputeThread messages={messages} viewerRole="customer" />
          </div>

          {dispute.state === 'cleaner_responded' && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-neutral-900">
                Do you accept the cleaner&apos;s response?
              </h2>
              <CustomerResolutionButtons disputeId={dispute.id} />
            </div>
          )}

          {['mutually_resolved', 'admin_resolved'].includes(dispute.state) && (
            <Card elevation={1} className="border border-success/30 bg-success-light p-4">
              <p className="text-sm font-medium text-success-dark">
                This dispute has been resolved.
              </p>
              {dispute.resolution_notes && (
                <p className="mt-1 text-sm text-success-dark/80">{dispute.resolution_notes}</p>
              )}
            </Card>
          )}
        </>
      ) : canFileDispute ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-neutral-500">
            You have until{' '}
            {booking.dispute_window_ends_at
              ? new Date(booking.dispute_window_ends_at as unknown as string).toLocaleString()
              : '48 hours after approval'}{' '}
            to file a dispute.
          </p>
          <FileDisputeForm bookingId={id} />
        </div>
      ) : (
        <Card elevation={1} className="border border-neutral-200 p-5">
          <p className="text-sm text-neutral-500">
            Disputes cannot be filed for this booking in its current state.
          </p>
        </Card>
      )}
    </div>
  );
}
