'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { saveStepAction, type CleanerActionState } from '@/features/cleaner/actions';
import { type Step5Values, step5Schema } from '@/features/cleaner/validation';
import { Button } from '@/components/ui/button';
import { TrustCallout } from '@/components/ui/trust-callout';

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
        <h2 className="text-lg font-semibold text-neutral-900">Identity verification</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Phase 4c will launch Stripe Identity from this step. For now, track status manually while
          integrating.
        </p>
      </div>

      <label className="flex max-w-sm flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Identity status</span>
        <select className="pt-field" {...register('identity_status')}>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="requires_input">Requires input</option>
        </select>
      </label>

      {errors.root ? <TrustCallout variant="caution">{errors.root.message}</TrustCallout> : null}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => router.push('/app/apply/step/4')}
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
