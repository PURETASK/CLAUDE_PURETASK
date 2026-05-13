'use client';

import { useState, useTransition } from 'react';

import { saveTaxInfo } from '@/features/cleaner/tax/actions';
import { Button } from '@/components/ui';

const TAX_CLASSIFICATIONS = [
  { value: 'individual', label: 'Individual / Sole Proprietor' },
  { value: 'single_member_llc', label: 'Single-member LLC' },
  { value: 's_corp', label: 'S Corporation' },
  { value: 'c_corp', label: 'C Corporation' },
];

interface Props {
  hasTaxIdOnFile: boolean;
  taxIdType: string | null;
  earningsYtdCents: number;
}

export const TaxInfoForm = ({ hasTaxIdOnFile, taxIdType, earningsYtdCents }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ssn, setSsn] = useState('');
  const [classification, setClassification] = useState(taxIdType ?? '');

  const earningsFormatted = (earningsYtdCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const formatSsn = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('ssn', ssn.replace(/-/g, ''));
    setError('');
    setSuccess(false);
    startTransition(async () => {
      const result = await saveTaxInfo(formData);
      if (result.error) setError(result.error);
      else setSuccess(true);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
        <p className="mb-3 text-sm font-medium text-neutral-900">Tax classification</p>
        <div className="space-y-2">
          {TAX_CLASSIFICATIONS.map(({ value, label }) => (
            <label key={value} className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="tax_id_type"
                value={value}
                checked={classification === value}
                onChange={() => setClassification(value)}
                className="h-4 w-4 border-neutral-300 text-brand-600 focus:ring-brand-600"
              />
              <span className="text-sm text-neutral-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1 space-y-1">
        <label className="block text-sm font-medium text-neutral-900">Social Security Number</label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={ssn}
            onChange={(e) => setSsn(formatSsn(e.target.value))}
            placeholder="___-__-____"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 pr-8 text-sm font-mono focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
            autoComplete="off"
          />
          <span className="absolute right-3 top-2.5 text-neutral-400">🔒</span>
        </div>
        <p className="text-xs text-neutral-400">Encrypted and stored securely. Never shared.</p>
        {hasTaxIdOnFile && !ssn && <p className="text-xs text-success">SSN on file: ···-··-····</p>}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900">2026 Earnings to Date</p>
            <p className="mt-0.5 text-2xl font-bold text-neutral-900">{earningsFormatted}</p>
          </div>
          <div className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs text-neutral-600">
            1099 issued if &gt; $600
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}
      {success && <p className="text-sm text-success">Tax information saved securely.</p>}

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || !classification || (!ssn && !hasTaxIdOnFile)}
      >
        {isPending ? 'Saving…' : 'Save Tax Information'}
      </Button>
    </form>
  );
};
