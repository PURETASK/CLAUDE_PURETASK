'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { saveStepAction, type CleanerActionState } from '@/features/cleaner/actions';
import { type Step10Values, step10Schema } from '@/features/cleaner/validation';
import { Button } from '@/components/ui/button';
import { TrustCallout } from '@/components/ui/trust-callout';

type Props = { defaultValues?: Partial<Step10Values> };

const INITIAL: CleanerActionState = { ok: false, error: null };

export const ApplicationStep10 = ({ defaultValues }: Props) => {
  const router = useRouter();
  const saveStep = saveStepAction.bind(null, '10');
  const [state, formAction] = useActionState(saveStep, INITIAL);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Step10Values>({
    resolver: zodResolver(step10Schema),
    defaultValues: { ready_to_submit: false, ...defaultValues },
  });

  useEffect(() => {
    if (state.ok) router.push('/app/apply/step/11');
  }, [router, state.ok]);

  useEffect(() => {
    if (state.error) setError('root', { message: state.error });
  }, [setError, state.error]);

  const onSubmit = (values: Step10Values) => {
    const fd = new FormData();
    fd.set('ready_to_submit', String(values.ready_to_submit));
    startTransition(() => formAction(fd));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Pre-submit checklist</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Confirm your identity/background/payout/tax/training data is complete before final review.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" className="accent-brand-600" {...register('ready_to_submit')} />I
        reviewed all onboarding steps and I am ready to submit.
      </label>
      {errors.ready_to_submit ? (
        <span className="text-sm text-error">{errors.ready_to_submit.message}</span>
      ) : null}

      {errors.root ? <TrustCallout variant="caution">{errors.root.message}</TrustCallout> : null}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => router.push('/app/apply/step/9')}
        >
          Back
        </Button>
        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? 'Saving…' : 'Continue to final submit'}
        </Button>
      </div>
    </form>
  );
};
