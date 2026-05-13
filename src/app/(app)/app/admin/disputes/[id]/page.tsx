import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  getDisputeById,
  getDisputeMessages,
  getBookingPhotosForDispute,
  type DisputePhoto,
} from '@/features/disputes/queries';
import { DisputeStateBadge } from '@/features/disputes/components/DisputeStateBadge';
import { DisputeThread } from '@/features/disputes/components/DisputeThread';
import { AdminResolveForm } from '@/features/disputes/components/AdminResolveForm';
import {
  DESIRED_OUTCOME_LABELS,
  ISSUE_CATEGORY_LABELS,
  RESPONSE_TYPE_LABELS,
} from '@/features/disputes/validation';

type Props = { params: Promise<{ id: string }> };

function PhotoGrid({ photos, label }: { photos: DisputePhoto[]; label: string }) {
  if (photos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center">
        <p className="text-xs text-neutral-400">No {label.toLowerCase()} uploaded</p>
      </div>
    );
  }

  const byRoom = photos.reduce<Record<string, DisputePhoto[]>>((acc, p) => {
    const key = p.room_label ?? 'General';
    (acc[key] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.entries(byRoom).map(([room, roomPhotos]) => (
        <div key={room}>
          <p className="mb-1.5 text-xs font-semibold capitalize text-neutral-500">{room}</p>
          <div className="grid grid-cols-3 gap-2">
            {roomPhotos.map((photo) =>
              photo.cdn_url ? (
                <a key={photo.id} href={photo.cdn_url} target="_blank" rel="noopener noreferrer">
                  <div className="relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                    <Image
                      src={photo.thumbnail_url ?? photo.cdn_url}
                      alt={`${room} photo`}
                      fill
                      className="object-cover transition-opacity hover:opacity-90"
                    />
                  </div>
                </a>
              ) : (
                <div
                  key={photo.id}
                  className="flex aspect-square items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100"
                >
                  <p className="text-xs text-neutral-400">No URL</p>
                </div>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function AdminDisputeDetailPage({ params }: Props) {
  const { id } = await params;
  const dispute = await getDisputeById(id);
  if (!dispute) notFound();

  const [messages, allPhotos] = await Promise.all([
    getDisputeMessages(id),
    getBookingPhotosForDispute(dispute.booking_id),
  ]);

  const cleanerJobPhotos = allPhotos.filter((p) => p.purpose === 'after_clock_out');
  const customerEvidencePhotos = allPhotos.filter((p) =>
    ['dispute_evidence_customer', 'dispute_evidence_cleaner'].includes(p.purpose),
  );

  const isOpen = ['open', 'cleaner_responded', 'escalated', 'in_mediation'].includes(dispute.state);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/app/admin/disputes"
            className="mb-1 block text-xs text-neutral-400 hover:text-neutral-600"
          >
            ← All disputes
          </Link>
          <h1 className="text-xl font-semibold">Dispute — {dispute.booking_number}</h1>
        </div>
        <DisputeStateBadge state={dispute.state} />
      </div>

      <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-5 shadow-tier1 text-sm">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          <dt className="text-neutral-400">Customer</dt>
          <dd className="font-medium">{dispute.customer_name}</dd>
          <dt className="text-neutral-400">Cleaner</dt>
          <dd className="font-medium">{dispute.cleaner_name}</dd>
          <dt className="text-neutral-400">Issue</dt>
          <dd>{ISSUE_CATEGORY_LABELS[dispute.issue_category] ?? dispute.issue_category}</dd>
          <dt className="text-neutral-400">Customer wanted</dt>
          <dd>
            {DESIRED_OUTCOME_LABELS[dispute.customer_desired_outcome] ??
              dispute.customer_desired_outcome}
          </dd>
          {dispute.cleaner_response_type && (
            <>
              <dt className="text-neutral-400">Cleaner offered</dt>
              <dd>
                {RESPONSE_TYPE_LABELS[dispute.cleaner_response_type] ??
                  dispute.cleaner_response_type}
              </dd>
            </>
          )}
          <dt className="text-neutral-400">Filed</dt>
          <dd>{new Date(dispute.created_at).toLocaleString()}</dd>
        </dl>
        {dispute.customer_description && (
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <p className="mb-1 text-xs font-semibold text-neutral-400">Customer description</p>
            <p className="text-sm text-neutral-700">{dispute.customer_description}</p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Photo evidence</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-tier1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Cleaner job photos ({cleanerJobPhotos.length})
            </p>
            <PhotoGrid photos={cleanerJobPhotos} label="Cleaner job photos" />
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-tier1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Dispute evidence ({customerEvidencePhotos.length})
            </p>
            <PhotoGrid photos={customerEvidencePhotos} label="Dispute evidence" />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Conversation</h2>
        <DisputeThread messages={messages} viewerRole="admin" />
      </div>

      {isOpen && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-tier1">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">Admin resolution</h2>
          <AdminResolveForm disputeId={id} />
        </div>
      )}

      {['mutually_resolved', 'admin_resolved'].includes(dispute.state) && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="text-sm font-medium text-green-800">Resolved: {dispute.resolution_type}</p>
          {dispute.resolution_notes && (
            <p className="mt-1 text-sm text-green-700">{dispute.resolution_notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
