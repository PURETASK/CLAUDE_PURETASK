'use client';

import { useActionState } from 'react';

import {
  updateBioAction,
  type CleanerProfileActionState,
} from '@/features/cleaner/profile-actions';

const initial: CleanerProfileActionState = { ok: false, error: null };

export function BioEditForm({ currentBio }: { currentBio: string | null }) {
  const [state, action, pending] = useActionState(updateBioAction, initial);

  return (
    <form action={action} className="mt-3">
      <textarea
        name="bio"
        defaultValue={currentBio ?? ''}
        rows={5}
        maxLength={1000}
        placeholder="Tell customers about your experience, specialties, and what makes your cleaning service stand out…"
        className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:border-neutral-400 focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-neutral-400">Max 1000 characters</p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-neutral-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save bio'}
        </button>
      </div>
      {state.error && <p className="mt-2 text-xs text-red-600">{state.error}</p>}
      {state.ok && <p className="mt-2 text-xs text-green-700">Bio saved.</p>}
    </form>
  );
}
