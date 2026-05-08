'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { saveStepAction, type CleanerActionState } from '@/features/cleaner/actions';
import { type Step6Values, step6Schema } from '@/features/cleaner/validation';

type Props = { defaultValues?: Partial<Step6Values> };

const INITIAL: CleanerActionState = { ok: false, error: null };

export const ApplicationStep6 = ({ defaultValues }: Props) => {
  const router = useRouter();
  const saveStep = saveStepAction.bind(null, '6');
  const [state, formAction] = useActionState(saveStep, INITIAL);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Step6Values>({
    resolver: zodResolver(step6Schema),
    defaultValues: { background_check_status: 'requested', ...defaultValues },
  });

  useEffect(() => {
    if (state.ok) router.push('/app/apply/step/7');
  }, [router, state.ok]);

  useEffect(() => {
    if (state.error) setError('root', { message: state.error });
  }, [setError, state.error]);

  const onSubmit = (values: Step6Values) => {
    const fd = new FormData();
    fd.set('background_check_status', values.background_check_status);
    startTransition(() => formAction(fd));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Background check</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Phase 4d will connect this step to Checkr with consent and webhook-driven states.
        </p>
      </div>

      <label className="flex max-w-sm flex-col gap-1">
        <span className="text-sm font-medium">Current status</span>
        <select className="rounded border px-3 py-2" {...register('background_check_status')}>
          <option value="requested">Requested</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="clear">Clear</option>
          <option value="consider">Consider (admin review)</option>
        </select>
      </label>

      {errors.root ? (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">{errors.root.message}</p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push('/app/apply/step/5')}
          className="rounded border px-5 py-2 text-sm"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-black px-5 py-2 text-sm text-white disabled:opacity-60"
        >
          {isPending ? 'Saving...' : 'Save & continue'}
        </button>
      </div>
    </form>
  );
};
