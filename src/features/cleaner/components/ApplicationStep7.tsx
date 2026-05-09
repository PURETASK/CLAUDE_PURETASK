'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { saveStepAction, type CleanerActionState } from '@/features/cleaner/actions';
import { type Step7Values, step7Schema } from '@/features/cleaner/validation';
import { Button } from '@/components/ui/button';
import { TrustCallout } from '@/components/ui/trust-callout';

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
        <h2 className="text-lg font-semibold text-neutral-900">Stripe Connect onboarding</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Phase 4e will launch hosted Express onboarding and webhook tracking.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          className="accent-brand-600"
          {...register('stripe_connect_completed')}
        />
        Stripe Connect onboarding completed
      </label>

      <label className="flex max-w-sm flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">
          Stripe account id (optional while pending)
        </span>
        <input
          type="text"
          placeholder="acct_..."
          className="pt-field"
          {...register('pending_stripe_account_id')}
        />
      </label>

      {!isConnectDone ? (
        <TrustCallout variant="warning">
          Keep this unchecked until onboarding is complete.
        </TrustCallout>
      ) : null}

      {errors.root ? <TrustCallout variant="caution">{errors.root.message}</TrustCallout> : null}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => router.push('/app/apply/step/6')}
        >
          Back
        </Button>
        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? 'Saving…' : 'Save & continue'}
        </Button>
      </div>
    </form>
  );
};
