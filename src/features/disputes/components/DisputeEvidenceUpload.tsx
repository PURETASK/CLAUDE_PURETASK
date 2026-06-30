'use client';

import { Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';

import { Card } from '@/components/ui/card';
import { uploadDisputeEvidenceAction } from '@/features/disputes/actions';

/**
 * Lets the customer or cleaner attach a new evidence photo to an active
 * dispute. The server action infers the uploader's side from the booking, so
 * the uploaded photo shows up in the `DisputePhotos` gallery grouped under the
 * right party. Render only while the dispute is still open.
 */
export function DisputeEvidenceUpload({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const res = await uploadDisputeEvidenceAction(bookingId, file);
      if (!res.ok) setError(res.error);
      else router.refresh();
      if (inputRef.current) inputRef.current.value = '';
    });
  };

  return (
    <Card elevation={1} className="border border-neutral-200 p-4">
      <p className="text-sm font-semibold text-neutral-900">Add evidence</p>
      <p className="mt-1 text-xs text-neutral-500">
        Upload photos that support your side. Both you and the other party can see them.
      </p>
      <label
        aria-disabled={pending}
        className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
      >
        <Upload className="h-4 w-4" strokeWidth={1.8} />
        {pending ? 'Uploading…' : 'Upload photo'}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={onFile}
          disabled={pending}
          className="hidden"
        />
      </label>
      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </Card>
  );
}
