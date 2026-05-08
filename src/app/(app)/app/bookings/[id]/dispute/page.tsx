import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getBookingById, getMyCustomerProfileId } from '@/features/booking/queries';
import { ApproveWorkButton } from '@/features/booking/components/ApproveWorkButton';
import { getDisputeForBooking, getDisputeMessages } from '@/features/disputes/queries';
import { DisputeStateBadge } from '@/features/disputes/components/DisputeStateBadge';
import { DisputeThread } from '@/features/disputes/components/DisputeThread';
import { FileDisputeForm } from '@/features/disputes/components/FileDisputeForm';
import { CustomerResolutionButtons } from '@/features/disputes/components/CustomerResolutionButtons';
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

  const canFileDispute = !dispute && ['approved', 'auto_approved', 'paid'].includes(booking.state);

  const awaitingApproval = booking.state === 'awaiting_approval';

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href={`/app/bookings/${id}`}
            className="mb-1 block text-xs text-zinc-400 hover:text-zinc-600"
          >
            ← Back to booking
          </Link>
          <h1 className="text-xl font-semibold">{dispute ? 'Dispute' : 'File a dispute'}</h1>
          <p className="text-sm text-zinc-500">Booking {booking.booking_number}</p>
        </div>
        {dispute && <DisputeStateBadge state={dispute.state} />}
      </div>

      {awaitingApproval && !dispute && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="mb-3 text-sm font-medium text-amber-800">
            Your cleaner has marked this job complete. Review and approve, or file a dispute.
          </p>
          <ApproveWorkButton bookingId={id} />
        </div>
      )}

      {dispute ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-zinc-100 p-4 text-sm">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <dt className="text-zinc-400">Issue</dt>
              <dd className="font-medium">
                {ISSUE_CATEGORY_LABELS[dispute.issue_category] ?? dispute.issue_category}
              </dd>
              <dt className="text-zinc-400">You asked for</dt>
              <dd className="font-medium">
                {DESIRED_OUTCOME_LABELS[dispute.customer_desired_outcome] ??
                  dispute.customer_desired_outcome}
              </dd>
              {dispute.cleaner_response_type && (
                <>
                  <dt className="text-zinc-400">Cleaner offered</dt>
                  <dd className="font-medium">
                    {RESPONSE_TYPE_LABELS[dispute.cleaner_response_type] ??
                      dispute.cleaner_response_type}
                  </dd>
                </>
              )}
            </dl>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold">Conversation</h2>
            <DisputeThread messages={messages} viewerRole="customer" />
          </div>

          {dispute.state === 'cleaner_responded' && (
            <div>
              <h2 className="mb-3 text-sm font-semibold">
                Do you accept the cleaner&apos;s response?
              </h2>
              <CustomerResolutionButtons disputeId={dispute.id} />
            </div>
          )}

          {['mutually_resolved', 'admin_resolved'].includes(dispute.state) && (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-800">
                This dispute has been resolved.
              </p>
              {dispute.resolution_notes && (
                <p className="mt-1 text-sm text-emerald-700">{dispute.resolution_notes}</p>
              )}
            </div>
          )}
        </div>
      ) : canFileDispute ? (
        <div>
          <p className="mb-4 text-sm text-zinc-500">
            You have until{' '}
            {booking.dispute_window_ends_at
              ? new Date(booking.dispute_window_ends_at as unknown as string).toLocaleString()
              : '48 hours after approval'}{' '}
            to file a dispute.
          </p>
          <FileDisputeForm bookingId={id} />
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          Disputes cannot be filed for this booking in its current state.
        </p>
      )}
    </div>
  );
}
