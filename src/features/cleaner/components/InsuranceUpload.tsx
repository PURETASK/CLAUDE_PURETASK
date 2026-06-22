'use client';

import { useRef, useState, useTransition } from 'react';

import { uploadInsuranceDocument } from '@/features/cleaner/insurance/actions';
import { Button } from '@/components/ui';

export const InsuranceUpload = () => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError('');
    startTransition(async () => {
      const result = await uploadInsuranceDocument(formData);
      if (result.error) setError(result.error);
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-600/20 bg-brand-600/5 p-6">
        <div className="mb-4 flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-600/10 text-2xl">
            🛡
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900">Earn the Insurance Verified badge</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Customers book insured cleaners{' '}
              <span className="font-medium text-brand-600">40% more often.</span>
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-neutral-700">
          <p className="font-medium text-neutral-900">Requirements:</p>
          <ul className="space-y-1.5 pl-1">
            {[
              'General liability insurance',
              'Minimum $300,000 coverage',
              'Valid Certificate of Insurance (COI)',
            ].map((req) => (
              <li key={req} className="flex items-center gap-2">
                <span className="text-brand-600">✓</span>
                {req}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1 space-y-4"
      >
        <h3 className="font-semibold text-neutral-900">Upload your Certificate of Insurance</h3>
        <p className="text-sm text-neutral-500">PDF format, max 10 MB</p>

        <div
          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 p-8 text-center transition-colors hover:border-brand-600/50 hover:bg-brand-600/5"
          onClick={() => fileRef.current?.click()}
        >
          <span className="text-3xl">📄</span>
          {fileName ? (
            <p className="text-sm font-medium text-brand-600">{fileName}</p>
          ) : (
            <p className="text-sm text-neutral-500">Click to select your COI document</p>
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

        <Button type="submit" className="w-full" disabled={!fileName || isPending}>
          {isPending ? 'Uploading…' : 'Upload Certificate'}
        </Button>
      </form>
    </div>
  );
};
