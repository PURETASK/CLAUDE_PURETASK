'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { approveWork } from '@/features/booking/actions/job-flow';
import { BOOKING_STATE_LABELS } from '@/features/booking/lib/booking-states';
import { Button } from '@/components/ui';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

const STATUS_STEPS = [
  'confirmed',
  'in_transit',
  'arrived',
  'in_progress',
  'awaiting_approval',
  'approved',
] as const;

interface Photo {
  id: string;
  room_label: string;
  cdn_url: string;
  uploaded_at: string;
}

interface Booking {
  id: string;
  state: string;
  start_at: string;
  clock_in_at: string | null;
  clock_out_at: string | null;
  auto_approval_due_at: string | null;
  cleaner_name: string;
}

interface Props {
  booking: Booking;
  photos: Photo[];
  userId: string;
}

export const JobTrackerClient = ({ booking: initial, photos: initialPhotos, userId }: Props) => {
  const router = useRouter();
  const [booking, setBooking] = useState(initial);
  const [photos, setPhotos] = useState(initialPhotos);
  const [isPending, startTransition] = useTransition();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const channel = supabase
      .channel(`tracker:${booking.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `id=eq.${booking.id}` },
        () => router.refresh(),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'booking_photos', filter: `booking_id=eq.${booking.id}` },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [booking.id, supabase, router]);

  const currentStepIndex = STATUS_STEPS.indexOf(booking.state as (typeof STATUS_STEPS)[number]);
  const isAwaitingApproval = booking.state === 'awaiting_approval';
  const isDone = ['approved', 'auto_approved', 'paid'].includes(booking.state);

  const autoApproveAt = booking.auto_approval_due_at ? new Date(booking.auto_approval_due_at) : null;
  const hoursUntilAutoApprove = autoApproveAt
    ? Math.max(0, Math.ceil((autoApproveAt.getTime() - Date.now()) / (1000 * 60 * 60)))
    : null;

  const handleApprove = () => {
    startTransition(async () => {
      await approveWork(booking.id);
      router.refresh();
    });
  };

  const photosByRoom = photos.reduce<Record<string, Photo[]>>((acc, p) => {
    if (!acc[p.room_label]) acc[p.room_label] = [];
    acc[p.room_label]!.push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link href="/app/bookings" className="text-neutral-500 hover:text-neutral-700">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="font-semibold text-neutral-900">Job tracker</h1>
            <p className="text-xs text-neutral-500">{booking.cleaner_name}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
          <h2 className="mb-4 font-semibold text-neutral-900">Job status</h2>
          <div className="space-y-3">
            {STATUS_STEPS.map((step, i) => {
              const done = currentStepIndex > i;
              const active = currentStepIndex === i;
              return (
                <div key={step} className="flex items-center gap-3">
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      done
                        ? 'border-success bg-success'
                        : active
                          ? 'border-brand-600 bg-brand-600'
                          : 'border-neutral-200 bg-white'
                    }`}
                  >
                    {done ? (
                      <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : active ? (
                      <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                    ) : null}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      done ? 'text-neutral-400 line-through' : active ? 'text-neutral-900' : 'text-neutral-400'
                    }`}
                  >
                    {BOOKING_STATE_LABELS[step] ?? step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {isAwaitingApproval && (
          <div className="rounded-2xl border border-brand-600/30 bg-brand-600/5 p-5">
            <h2 className="font-semibold text-neutral-900">Your cleaning is done!</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Review the photos and approve your cleaner&apos;s work to release payment.
            </p>
            {hoursUntilAutoApprove !== null && (
              <p className="mt-2 text-xs text-neutral-400">
                Auto-approves in ~{hoursUntilAutoApprove}h if no action taken.
              </p>
            )}
            <div className="mt-4 flex gap-3">
              <Link
                href={`/app/bookings/${booking.id}/dispute`}
                className="flex items-center justify-center rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
              >
                Report issue
              </Link>
              <Button size="sm" onClick={handleApprove} disabled={isPending} className="flex-1">
                {isPending ? 'Approving…' : 'Approve & release payment'}
              </Button>
            </div>
          </div>
        )}

        {isDone && (
          <div className="rounded-2xl border border-success/30 bg-success-light p-5 text-center">
            <p className="font-semibold text-success-dark">Payment released — job complete!</p>
            <Link href={`/app/bookings/${booking.id}/review`}>
              <Button size="sm" className="mt-3">Leave a review</Button>
            </Link>
          </div>
        )}

        {Object.keys(photosByRoom).length > 0 && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
            <h2 className="mb-4 font-semibold text-neutral-900">Room photos</h2>
            <div className="space-y-4">
              {Object.entries(photosByRoom).map(([room, roomPhotos]) => (
                <div key={room}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    {room}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {roomPhotos.map((photo) => (
                      <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
                        <Image
                          src={photo.cdn_url}
                          alt={`${room} photo`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
