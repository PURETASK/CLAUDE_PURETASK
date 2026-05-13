'use client';

import { useState, useTransition } from 'react';

import { submitAppeal } from '@/features/cleaner/appeals/actions';
import { Button } from '@/components/ui';

type AppealTargetType = 'tier_drop' | 'reliability_event';

export const AppealForm = () => {
  const [isPending, startTransition] = useTransition();
  const [targetType, setTargetType] = useState<AppealTargetType>('tier_drop');
  const [appealText, setAppealText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (success) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success-light p-6 text-center">
        <p className="text-2xl">✓</p>
        <p className="mt-2 font-semibold text-success-dark">Appeal submitted</p>
        <p className="mt-1 text-sm text-neutral-600">
          Our team will review your appeal within 14 days and notify you of the outcome.
        </p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const result = await submitAppeal(targetType, appealText);
      if (result.error) setError(result.error);
      else setSuccess(true);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1 space-y-3">
        <p className="text-sm font-medium text-neutral-900">What are you appealing?</p>
        {(
          [
            {
              value: 'tier_drop',
              label: 'Tier change',
              detail: 'My tier was reduced and I believe it was unfair.',
            },
            {
              value: 'reliability_event',
              label: 'Reliability event',
              detail:
                'A specific reliability event (late arrival, cancellation, etc.) was recorded incorrectly.',
            },
          ] as { value: AppealTargetType; label: string; detail: string }[]
        ).map(({ value, label, detail }) => (
          <label
            key={value}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
              targetType === value
                ? 'border-brand-600/30 bg-brand-600/5'
                : 'border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <input
              type="radio"
              name="target_type"
              value={value}
              checked={targetType === value}
              onChange={() => setTargetType(value)}
              className="mt-0.5 h-4 w-4 border-neutral-300 text-brand-600 focus:ring-brand-600"
            />
            <div>
              <p className="text-sm font-medium text-neutral-900">{label}</p>
              <p className="text-xs text-neutral-500">{detail}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
        <label className="mb-2 block text-sm font-medium text-neutral-900">Your explanation</label>
        <textarea
          value={appealText}
          onChange={(e) => setAppealText(e.target.value)}
          placeholder="Describe what happened and why you believe the decision was incorrect…"
          rows={5}
          className="w-full resize-none rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
        />
        <p className="mt-1 text-xs text-neutral-400">{appealText.length} chars · Minimum 20</p>
      </div>

      <div className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600">
        <p className="font-medium text-neutral-900">Appeal window</p>
        <p className="mt-0.5">
          Appeals must be submitted within 14 days of the tier change or reliability event. Our team
          responds within 14 days.
        </p>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || appealText.trim().length < 20}
      >
        {isPending ? 'Submitting…' : 'Submit Appeal'}
      </Button>
    </form>
  );
};
