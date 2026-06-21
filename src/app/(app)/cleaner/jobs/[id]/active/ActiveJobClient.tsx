'use client';

import { Check, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { clockIn, clockOut, submitRoomPhotos } from '@/features/booking/actions/job-flow';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils/cn';

interface Booking {
  id: string;
  state: string;
  start_at: string;
  clock_in_at: string | null;
  customer_name: string;
  address: string;
}

interface Props {
  booking: Booking;
  uploadedRooms: Set<string>;
  requiredRooms: string[];
}

export const ActiveJobClient = ({
  booking,
  uploadedRooms: initialUploaded,
  requiredRooms,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [elapsed, setElapsed] = useState(0);
  const [uploadedRooms, setUploadedRooms] = useState(initialUploaded);
  const [uploadingRoom, setUploadingRoom] = useState<string | null>(null);
  const [confirmingClockOut, setConfirmingClockOut] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeRoomRef = useRef<string>('');
  const supabase = createSupabaseBrowserClient();

  const isInProgress = booking.state === 'in_progress';
  const clockInAtIso = booking.clock_in_at;
  const clockedInAt = clockInAtIso ? new Date(clockInAtIso) : null;

  useEffect(() => {
    if (!clockInAtIso) return;
    const startMs = new Date(clockInAtIso).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - startMs) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [clockInAtIso]);

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleClockIn = () => {
    startTransition(async () => {
      await clockIn(booking.id);
      router.refresh();
    });
  };

  const handlePhotoUpload = (roomLabel: string) => {
    activeRoomRef.current = roomLabel;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const room = activeRoomRef.current;
    setUploadingRoom(room);

    try {
      let lat: number | undefined;
      let lng: number | undefined;
      if ('geolocation' in navigator) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { timeout: 3000 },
          );
        });
      }

      const uploadedUrls: string[] = [];
      for (const file of files) {
        const path = `booking-photos/${booking.id}/${room.replace(/\s+/g, '-')}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from('booking-photos').upload(path, file);
        if (!error) uploadedUrls.push(path);
      }

      if (uploadedUrls.length > 0) {
        await submitRoomPhotos(booking.id, room, uploadedUrls, lat, lng);
        setUploadedRooms((prev) => new Set([...prev, room]));
      }
    } finally {
      setUploadingRoom(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClockOut = () => {
    startTransition(async () => {
      await clockOut(booking.id);
    });
  };

  const doneCount = requiredRooms.filter((r) => uploadedRooms.has(r)).length;
  const allRoomsUploaded = doneCount === requiredRooms.length;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'h-2.5 w-2.5 rounded-full',
              isInProgress ? 'animate-pulse bg-warning' : 'bg-brand-400',
            )}
          />
          <div className="min-w-0">
            <p className="text-xs text-neutral-500">Active job</p>
            <p className="truncate text-sm font-semibold text-neutral-900">
              {booking.customer_name}
            </p>
          </div>
        </div>
        {isInProgress && clockedInAt && (
          <div className="text-right">
            <p className="text-xs text-neutral-400">Elapsed</p>
            <p className="font-mono text-lg font-bold tabular-nums text-brand-600">
              {formatElapsed(elapsed)}
            </p>
          </div>
        )}
      </div>

      {!isInProgress ? (
        <Card elevation={1} className="border border-neutral-200 p-6 text-center">
          <p className="mb-1 text-sm text-neutral-600">{booking.address}</p>
          <p className="mb-4 text-sm text-neutral-500">
            Confirm you&apos;ve arrived and are ready to start.
          </p>
          <Button size="lg" className="w-full" onClick={handleClockIn} disabled={isPending}>
            {isPending ? 'Starting…' : 'Clock in — start job'}
          </Button>
        </Card>
      ) : (
        <>
          {clockedInAt && (
            <Card elevation={1} className="border border-neutral-200 px-4 py-3">
              <p className="text-xs text-neutral-500">
                Clocked in at{' '}
                {clockedInAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} ·
                Working
              </p>
            </Card>
          )}

          <section className="flex flex-col gap-3">
            <SectionHeader title={`Photo documentation · ${doneCount}/${requiredRooms.length}`} />
            <div className="grid grid-cols-2 gap-2">
              {requiredRooms.map((room) => {
                const done = uploadedRooms.has(room);
                const uploading = uploadingRoom === room;
                return (
                  <div
                    key={room}
                    className={cn(
                      'rounded-xl border p-3',
                      done
                        ? 'border-success/40 bg-success-light'
                        : 'border-dashed border-neutral-300 bg-white',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-neutral-900">{room}</p>
                      {done && (
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-success">
                          <Check className="h-3 w-3 text-white" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-neutral-500">
                      Required · {done ? 'Done' : 'Pending'}
                    </p>
                    {!done && (
                      <button
                        type="button"
                        onClick={() => handlePhotoUpload(room)}
                        disabled={!!uploadingRoom}
                        className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-50"
                      >
                        {uploading ? (
                          'Uploading…'
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                            Add photos
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Clock out */}
          <div className="flex flex-col gap-2">
            {!allRoomsUploaded && (
              <p className="text-center text-xs text-neutral-400">
                Complete all required photos to clock out.
              </p>
            )}
            {!confirmingClockOut ? (
              <Button
                size="lg"
                className="w-full"
                onClick={() => setConfirmingClockOut(true)}
                disabled={!allRoomsUploaded || isPending}
              >
                Clock out — job complete
              </Button>
            ) : (
              <Card elevation={1} className="border border-neutral-200 p-4">
                <p className="text-sm font-medium text-neutral-900">Clock out?</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Time logged{' '}
                  <span className="font-semibold text-neutral-700">{formatElapsed(elapsed)}</span>.
                  The customer will be notified to approve your work.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setConfirmingClockOut(false)}
                    disabled={isPending}
                  >
                    Back
                  </Button>
                  <Button className="flex-1" onClick={handleClockOut} disabled={isPending}>
                    {isPending ? 'Clocking out…' : 'Confirm'}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};
