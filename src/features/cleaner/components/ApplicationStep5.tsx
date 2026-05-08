'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { saveStepAction, type CleanerActionState } from '@/features/cleaner/actions';
import { type Step5Values, step5Schema } from '@/features/cleaner/validation';

type Props = { defaultValues?: Partial<Step5Values> };

const INITIAL: CleanerActionState = { ok: false, error: null };

export const ApplicationStep5 = ({ defaultValues }: Props) => {
  const router = useRouter();
  const saveStep = saveStepAction.bind(null, '5');
  const [state, formAction] = useActionState(saveStep, INITIAL);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Step5Values>({
    resolver: zodResolver(step5Schema),
    defaultValues: { identity_status: 'pending', ...defaultValues },
  });

  useEffect(() => {
    if (state.ok) router.push('/app/apply/step/6');
  }, [router, state.ok]);

  useEffect(() => {
    if (state.error) setError('root', { message: state.error });
  }, [setError, state.error]);

  const onSubmit = (values: Step5Values) => {
    const fd = new FormData();
    fd.set('identity_status', values.identity_status);
    startTransition(() => formAction(fd));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Identity verification</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Phase 4c will launch Stripe Identity from this step. For now, track status manually while
          integrating.
        </p>
      </div>

      <label className="flex max-w-sm flex-col gap-1">
        <span className="text-sm font-medium">Identity status</span>
        <select className="rounded border px-3 py-2" {...register('identity_status')}>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="requires_input">Requires input</option>
        </select>
      </label>

      {errors.root ? (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">{errors.root.message}</p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push('/app/apply/step/4')}
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
