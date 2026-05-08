'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { saveStepAction, type CleanerActionState } from '@/features/cleaner/actions';
import { type Step7Values, step7Schema } from '@/features/cleaner/validation';

type Props = { defaultValues?: Partial<Step7Values> };

const INITIAL: CleanerActionState = { ok: false, error: null };

export const ApplicationStep7 = ({ defaultValues }: Props) => {
  const router = useRouter();
  const saveStep = saveStepAction.bind(null, '7');
  const [state, formAction] = useActionState(saveStep, INITIAL);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
    watch,
  } = useForm<Step7Values>({
    resolver: zodResolver(step7Schema),
    defaultValues: {
      stripe_connect_completed: false,
      pending_stripe_account_id: '',
      ...defaultValues,
    },
  });

  const isConnectDone = watch('stripe_connect_completed');

  useEffect(() => {
    if (state.ok) router.push('/app/apply/step/8');
  }, [router, state.ok]);

  useEffect(() => {
    if (state.error) setError('root', { message: state.error });
  }, [setError, state.error]);

  const onSubmit = (values: Step7Values) => {
    const fd = new FormData();
    fd.set('stripe_connect_completed', String(values.stripe_connect_completed));
    if (values.pending_stripe_account_id) {
      fd.set('pending_stripe_account_id', values.pending_stripe_account_id);
    }
    startTransition(() => formAction(fd));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Stripe Connect onboarding</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Phase 4e will launch hosted Express onboarding and webhook tracking.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('stripe_connect_completed')} />
        Stripe Connect onboarding completed
      </label>

      <label className="flex max-w-sm flex-col gap-1">
        <span className="text-sm font-medium">Stripe account id (optional while pending)</span>
        <input
          type="text"
          placeholder="acct_..."
          className="rounded border px-3 py-2"
          {...register('pending_stripe_account_id')}
        />
      </label>

      {!isConnectDone ? (
        <p className="rounded bg-amber-50 p-3 text-sm text-amber-700">
          Keep this unchecked until onboarding is complete.
        </p>
      ) : null}

      {errors.root ? (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">{errors.root.message}</p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push('/app/apply/step/6')}
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
