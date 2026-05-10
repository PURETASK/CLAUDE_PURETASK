'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { clockIn, clockOut, submitRoomPhotos } from '@/features/booking/actions/job-flow';
import { Button } from '@/components/ui';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

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

export const ActiveJobClient = ({ booking, uploadedRooms: initialUploaded, requiredRooms }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [elapsed, setElapsed] = useState(0);
  const [uploadedRooms, setUploadedRooms] = useState(initialUploaded);
  const [uploadingRoom, setUploadingRoom] = useState<string | null>(null);
  const [showClockOut, setShowClockOut] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeRoomRef = useRef<string>('');
  const supabase = createSupabaseBrowserClient();

  const isInProgress = booking.state === 'in_progress';
  const clockedInAt = booking.clock_in_at ? new Date(booking.clock_in_at) : null;

  useEffect(() => {
    if (!clockedInAt) return;
    const update = () => setElapsed(Math.floor((Date.now() - clockedInAt.getTime()) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [clockedInAt]);

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

  const allRoomsUploaded = requiredRooms.every((r) => uploadedRooms.has(r));

  return (
    <div className="min-h-screen bg-neutral-50 pb-32">
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500">Active job</p>
            <p className="font-semibold text-neutral-900">{booking.customer_name}</p>
            <p className="text-xs text-neutral-400">{booking.address}</p>
          </div>
          {isInProgress && clockedInAt && (
            <div className="text-right">
              <p className="text-xs text-neutral-500">Time elapsed</p>
              <p className="font-mono text-xl font-bold text-brand-600">{formatElapsed(elapsed)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-6 px-4 pt-6">
        {!isInProgress && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-tier1">
            <p className="mb-4 text-neutral-600">Confirm you&apos;ve arrived and are ready to start.</p>
            <Button size="lg" className="w-full" onClick={handleClockIn} disabled={isPending}>
              Clock in — start job
            </Button>
          </div>
        )}

        {isInProgress && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
            <h2 className="mb-1 font-semibold text-neutral-900">Room photos</h2>
            <p className="mb-4 text-sm text-neutral-500">Take before/after photos of each room.</p>
            <div className="space-y-2">
              {requiredRooms.map((room) => {
                const done = uploadedRooms.has(room);
                const uploading = uploadingRoom === room;
                return (
                  <div
                    key={room}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                      done ? 'border-success/30 bg-success-light' : 'border-neutral-200 bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${
                          done ? 'bg-success' : 'border-2 border-neutral-300'
                        }`}
                      >
                        {done && (
                          <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm font-medium ${done ? 'text-success-dark' : 'text-neutral-700'}`}>
                        {room}
                      </span>
                    </div>
                    {!done && (
                      <button
                        type="button"
                        onClick={() => handlePhotoUpload(room)}
                        disabled={!!uploadingRoom}
                        className="text-xs font-semibold text-brand-600 hover:underline disabled:opacity-50"
                      >
                        {uploading ? 'Uploading…' : 'Add photos'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
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

      {isInProgress && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-white p-4">
          <div className="mx-auto max-w-lg">
            {!allRoomsUploaded && (
              <p className="mb-3 text-center text-xs text-neutral-400">
                Upload photos for all rooms to enable clock out.
              </p>
            )}
            <Button
              size="lg"
              className="w-full"
              onClick={() => setShowClockOut(true)}
              disabled={!allRoomsUploaded || isPending}
            >
              Clock out — job complete
            </Button>
          </div>
        </div>
      )}

      {showClockOut && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-2xl">
            <h2 className="text-lg font-bold text-neutral-900">Clock out?</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Time logged: <span className="font-semibold text-neutral-900">{formatElapsed(elapsed)}</span>
              <br />
              The customer will be notified to approve your work.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowClockOut(false)}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleClockOut} disabled={isPending}>
                {isPending ? 'Clocking out…' : 'Confirm clock out'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
