'use client';

import { useActionState } from 'react';

import { createTicketAction } from '@/features/support/actions';

const CATEGORIES = [
  { value: 'account_access', label: 'Account access' },
  { value: 'billing_question', label: 'Billing question' },
  { value: 'app_bug', label: 'App bug' },
  { value: 'feature_request', label: 'Feature request' },
  { value: 'safety_concern', label: 'Safety concern' },
  { value: 'data_request', label: 'Data request' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'other', label: 'Other' },
];

export function NewTicketForm() {
  const [state, action, pending] = useActionState(createTicketAction, { ok: false, error: null });

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Category
        </label>
        <select
          id="category"
          name="category"
          required
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="">Select a category…</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          maxLength={200}
          placeholder="Brief description of your issue"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <div>
        <label htmlFor="body" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Message
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={6}
          maxLength={5000}
          placeholder="Describe your issue in detail…"
          className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <div>
        <label
          htmlFor="related_booking_id"
          className="mb-1.5 block text-sm font-medium text-zinc-700"
        >
          Related booking ID <span className="font-normal text-zinc-400">(optional)</span>
        </label>
        <input
          id="related_booking_id"
          name="related_booking_id"
          type="text"
          placeholder="Paste booking ID if applicable"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {pending ? 'Submitting…' : 'Submit ticket'}
      </button>
    </form>
  );
}
