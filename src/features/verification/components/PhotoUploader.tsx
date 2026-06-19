'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';

import { uploadBookingPhotoAction } from '@/features/verification/actions';
import type { PhotoPurpose } from '@/features/verification/photo-rules';

type Props = {
  bookingId: string;
  purpose: Extract<PhotoPurpose, 'before_clock_in' | 'after_clock_out'>;
  remaining: number;
  label: string;
};

export const PhotoUploader = ({ bookingId, purpose, remaining, label }: Props) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const res = await uploadBookingPhotoAction(bookingId, purpose, file);
      if (!res.ok) setError(res.error);
      else router.refresh();
      if (inputRef.current) inputRef.current.value = '';
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-700">{label}</span>
        <span className={remaining > 0 ? 'text-amber-600' : 'text-emerald-600'}>
          {remaining > 0 ? `${remaining} more required` : 'Complete'}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={onFile}
        disabled={pending}
        className="text-sm file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm hover:file:bg-zinc-200"
      />
      {pending && <p className="text-xs text-zinc-500">Uploading…</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};
