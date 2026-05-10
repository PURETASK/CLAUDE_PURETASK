'use client';

import { useRef, useState, useTransition } from 'react';

import { uploadInsuranceDocument } from '@/features/cleaner/insurance/actions';
import { Button } from '@/components/ui';

interface Props {
  expiresAt: string;
  verifiedAt: string;
}

export const InsuranceVerified = ({ expiresAt, verifiedAt }: Props) => {
  const [showUpload, setShowUpload] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const expiryDate = new Date(expiresAt).toLocaleDateString([], { month: 'long', year: 'numeric' });
  const verifiedDate = new Date(verifiedAt).toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const daysUntilExpiry = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError('');
    startTransition(async () => {
      const result = await uploadInsuranceDocument(formData);
      if (result.error) setError(result.error);
      else setShowUpload(false);
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-success/30 bg-success-light p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-success/10 text-2xl">
            🛡
          </div>
          <div>
            <h2 className="font-semibold text-success-dark">Insurance Verified</h2>
            <p className="mt-0.5 text-sm text-neutral-600">
              Valid through {expiryDate} · Verified {verifiedDate}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1 space-y-3">
        <div className="flex items-center gap-2 text-sm text-neutral-700">
          <span className="text-success">🛡</span>
          Badge is live on your profile
        </div>
        <div className="h-px bg-neutral-100" />
        <div>
          <p className="text-sm font-medium text-neutral-900">Renewal reminder</p>
          <p className="mt-0.5 text-sm text-neutral-600">
            {daysUntilExpiry > 60
              ? `We'll notify you 60 days before expiration.`
              : `Your policy expires in ${daysUntilExpiry} days — renewal reminder sent.`}
          </p>
        </div>
      </div>

      {!showUpload ? (
        <button
          onClick={() => setShowUpload(true)}
          className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
        >
          Upload updated COI
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1 space-y-4">
          <h3 className="font-medium text-neutral-900">Upload updated certificate</h3>
          <div
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 p-6 text-center hover:border-brand-600/50 hover:bg-brand-600/5"
            onClick={() => fileRef.current?.click()}
          >
            {fileName ? (
              <p className="text-sm font-medium text-brand-600">{fileName}</p>
            ) : (
              <p className="text-sm text-neutral-500">Click to select PDF</p>
            )}
            <input
              ref={fileRef}
              type="file"
              name="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
            />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowUpload(false)}
              className="flex-1 rounded-lg border border-neutral-200 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <Button type="submit" className="flex-1" disabled={!fileName || isPending}>
              {isPending ? 'Uploading…' : 'Submit'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
