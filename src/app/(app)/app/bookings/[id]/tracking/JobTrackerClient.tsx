'use client';

import { ArrowLeft, Check, MapPin, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { approveWork } from '@/features/booking/actions/job-flow';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils/cn';

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

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const fmtDuration = (ms: number) => {
  const mins = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
};

const statusOf = (state: string): { label: string; live: boolean } => {
  if (['in_progress', 'arrived', 'active'].includes(state))
    return { label: 'Cleaning in progress', live: true };
  if (state === 'in_transit') return { label: 'Cleaner on the way', live: true };
  if (['confirmed', 'imminent'].includes(state)) return { label: 'Scheduled', live: false };
  if (state === 'awaiting_approval') return { label: 'Cleaning complete', live: false };
  if (['approved', 'auto_approved', 'paid'].includes(state))
    return { label: 'Completed', live: false };
  return { label: state.replace(/_/g, ' '), live: false };
};

type TimelineEvent = {
  key: string;
  time: Date;
  title: string;
  sub: string;
  icon?: 'gps';
  photos?: Photo[];
};

export const JobTrackerClient = ({ booking: initial, photos: initialPhotos }: Props) => {
  const router = useRouter();
  const [booking] = useState(initial);
  const [photos] = useState(initialPhotos);
  const [isPending, startTransition] = useTransition();
  const supabase = createSupabaseBrowserClient();

  // Live elapsed time on site — computed after mount to keep hydration deterministic.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

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
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_photos',
          filter: `booking_id=eq.${booking.id}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [booking.id, supabase, router]);

  const status = statusOf(booking.state);
  const isAwaitingApproval = booking.state === 'awaiting_approval';
  const isDone = ['approved', 'auto_approved', 'paid'].includes(booking.state);
  const onSite = Boolean(booking.clock_in_at) && !booking.clock_out_at && status.live;

  const autoApproveAt = booking.auto_approval_due_at
    ? new Date(booking.auto_approval_due_at)
    : null;
  const hoursUntilAutoApprove =
    autoApproveAt && now
      ? Math.max(0, Math.ceil((autoApproveAt.getTime() - now) / 3_600_000))
      : null;

  const elapsedLabel =
    onSite && booking.clock_in_at && now
      ? fmtDuration(now - new Date(booking.clock_in_at).getTime())
      : null;

  const handleApprove = () => {
    startTransition(async () => {
      await approveWork(booking.id);
      router.refresh();
    });
  };

  // Build the live-updates timeline from photos (grouped per room) + clock events.
  const photosByRoom = photos.reduce<Record<string, Photo[]>>((acc, p) => {
    (acc[p.room_label] ??= []).push(p);
    return acc;
  }, {});

  const events: TimelineEvent[] = [];
  for (const [room, roomPhotos] of Object.entries(photosByRoom)) {
    const latest = roomPhotos.reduce((a, b) =>
      new Date(a.uploaded_at) > new Date(b.uploaded_at) ? a : b,
    );
    events.push({
      key: `room-${room}`,
      time: new Date(latest.uploaded_at),
      title: `${room} done`,
      sub: `${roomPhotos.length} photo${roomPhotos.length > 1 ? 's' : ''} uploaded`,
      photos: roomPhotos,
    });
  }
  if (booking.clock_out_at)
    events.push({
      key: 'out',
      time: new Date(booking.clock_out_at),
      title: 'Clocked out',
      sub: `Cleaning complete · ${fmtTime(booking.clock_out_at)}`,
    });
  if (booking.clock_in_at)
    events.push({
      key: 'in',
      time: new Date(booking.clock_in_at),
      title: 'Clocked in',
      sub: 'GPS verified at your address',
      icon: 'gps',
    });
  events.sort((a, b) => b.time.getTime() - a.time.getTime());

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/bookings"
          className="flex-shrink-0 text-neutral-500 transition-colors hover:text-neutral-900"
          aria-label="Back to bookings"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </Link>
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'h-2.5 w-2.5 rounded-full',
              status.live ? 'animate-pulse bg-success' : 'bg-neutral-300',
            )}
          />
          <div>
            <p className="text-sm font-semibold text-neutral-900">{status.label}</p>
            <p className="text-xs text-neutral-500">{booking.cleaner_name}</p>
          </div>
        </div>
      </div>

      {/* Cleaner card */}
      <Card elevation={1} className="border border-neutral-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-neutral-100 bg-neutral-50 text-sm font-semibold text-neutral-400">
            {booking.cleaner_name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-900">
              {booking.cleaner_name}
              {booking.clock_in_at ? ` · clocked in ${fmtTime(booking.clock_in_at)}` : ''}
            </p>
            <p className="text-xs text-neutral-500">
              {onSite ? 'Working in your home now' : status.label}
            </p>
          </div>
          <Link
            href={`/app/bookings/${booking.id}/messages`}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.8} />
            Message
          </Link>
        </div>

        {elapsedLabel && (
          <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
            <span className="text-xs text-neutral-500">Time on site</span>
            <span className="text-sm font-semibold tabular-nums text-neutral-900">
              {elapsedLabel}
            </span>
          </div>
        )}
      </Card>

      {/* Awaiting approval — the money action */}
      {isAwaitingApproval && (
        <Card elevation={1} className="border border-brand-200 bg-brand-50/50 p-5">
          <p className="font-semibold text-neutral-900">Your cleaning is done!</p>
          <p className="mt-1 text-sm text-neutral-600">
            Review the photos below and approve to release payment.
          </p>
          {hoursUntilAutoApprove !== null && (
            <p className="mt-2 text-xs text-neutral-400">
              Auto-approves in ~{hoursUntilAutoApprove}h if no action taken.
            </p>
          )}
          <div className="mt-4 flex gap-3">
            <Link
              href={`/app/bookings/${booking.id}/dispute`}
              className="flex items-center justify-center rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
            >
              Report issue
            </Link>
            <Button size="sm" onClick={handleApprove} disabled={isPending} className="flex-1">
              {isPending ? 'Approving…' : 'Approve & release payment'}
            </Button>
          </div>
        </Card>
      )}

      {/* Done */}
      {isDone && (
        <Card elevation={1} className="border border-success/30 bg-success-light p-5 text-center">
          <p className="font-semibold text-success-dark">Payment released — job complete!</p>
          <Link href={`/app/bookings/${booking.id}/review`} className="mt-3 inline-block">
            <Button size="sm">Leave a review</Button>
          </Link>
        </Card>
      )}

      {/* Live updates timeline */}
      {events.length > 0 && (
        <Card elevation={1} className="border border-neutral-200 p-5">
          <p className="mb-3 text-base font-semibold text-neutral-900">Live updates</p>
          <div className="flex flex-col">
            {events.map((e, i) => {
              const last = i === events.length - 1;
              return (
                <div key={e.key} className="flex gap-3">
                  <div className="flex flex-shrink-0 flex-col items-center">
                    <span
                      className={cn(
                        'mt-1 flex h-3 w-3 items-center justify-center rounded-full',
                        e.photos ? 'bg-brand-600' : 'border-2 border-neutral-300 bg-white',
                      )}
                    >
                      {e.photos && <Check className="h-2 w-2 text-white" strokeWidth={4} />}
                    </span>
                    {!last && <span className="w-px flex-1 bg-neutral-200" />}
                  </div>
                  <div className={cn('min-w-0 flex-1', last ? 'pb-0' : 'pb-4')}>
                    <p className="text-sm font-medium text-neutral-900">{e.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
                      {e.icon === 'gps' && <MapPin className="h-3 w-3" strokeWidth={1.8} />}
                      {e.time.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}{' '}
                      · {e.sub}
                    </p>
                    {e.photos && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {e.photos.slice(0, 4).map((photo) => (
                          <a
                            key={photo.id}
                            href={photo.cdn_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative h-12 w-12 overflow-hidden rounded-md bg-neutral-100"
                          >
                            <Image
                              src={photo.cdn_url}
                              alt={`${e.title} photo`}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* What's next */}
      {status.live && !isAwaitingApproval && (
        <Card elevation={1} className="border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm font-medium text-neutral-900">What you&apos;ll see next</p>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">
            Room photos will appear here as {booking.cleaner_name} works. You&apos;ll get a
            notification when the booking moves to approval.
          </p>
        </Card>
      )}

      <p className="text-center text-xs text-neutral-400">
        Issue with the cleaning?{' '}
        <Link href={`/app/bookings/${booking.id}/dispute`} className="text-neutral-600 underline">
          Contact support
        </Link>
      </p>
    </div>
  );
};
