'use client';

import { useActionState } from 'react';

import { fileDisputeAction, type DisputeActionState } from '@/features/disputes/actions';
import { DESIRED_OUTCOME_LABELS, ISSUE_CATEGORY_LABELS } from '@/features/disputes/validation';

const INITIAL: DisputeActionState = { ok: false, error: null };

type Props = { bookingId: string };

export const FileDisputeForm = ({ bookingId }: Props) => {
  const [state, formAction, isPending] = useActionState(fileDisputeAction, INITIAL);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="booking_id" value={bookingId} />

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">What is the issue?</label>
        <select
          name="issue_category"
          required
          className="w-full rounded border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
        >
          <option value="">Select a category</option>
          {Object.entries(ISSUE_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          What outcome are you looking for?
        </label>
        <select
          name="customer_desired_outcome"
          required
          className="w-full rounded border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
        >
          <option value="">Select an outcome</option>
          {Object.entries(DESIRED_OUTCOME_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Describe the issue</label>
        <textarea
          name="customer_description"
          rows={4}
          required
          minLength={10}
          maxLength={2000}
          className="w-full rounded border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
          placeholder="Please describe what happened in detail. Be as specific as possible."
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
      >
        {isPending ? 'Filing dispute…' : 'File dispute'}
      </button>
    </form>
  );
};
