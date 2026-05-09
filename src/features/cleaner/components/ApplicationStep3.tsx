'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { saveStepAction, type CleanerActionState } from '@/features/cleaner/actions';
import { type Step3Values, step3Schema } from '@/features/cleaner/validation';
import { Button } from '@/components/ui/button';
import { TrustCallout } from '@/components/ui/trust-callout';

type Props = { defaultValues?: Partial<Step3Values> };

const INITIAL: CleanerActionState = { ok: false, error: null };

export const ApplicationStep3 = ({ defaultValues }: Props) => {
  const router = useRouter();
  const saveStep3 = saveStepAction.bind(null, '3');
  const [state, formAction] = useActionState(saveStep3, INITIAL);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<Step3Values>({
    resolver: zodResolver(step3Schema),
    defaultValues: { why_puretask_text: '', ...defaultValues },
  });

  const text = watch('why_puretask_text') ?? '';

  useEffect(() => {
    if (state.ok) router.push('/app/apply/step/4');
  }, [router, state.ok]);

  useEffect(() => {
    if (state.error) setError('root', { message: state.error });
  }, [setError, state.error]);

  const onSubmit = (values: Step3Values) => {
    const fd = new FormData();
    fd.set('why_puretask_text', values.why_puretask_text);
    startTransition(() => formAction(fd));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">About you</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Tell customers and the PureTask team why you&apos;re a great fit.
        </p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">
          Why do you want to join PureTask? What sets you apart?
        </span>
        <textarea
          rows={6}
          placeholder="Share your approach to cleaning, what you take pride in, and why customers should trust you with their home..."
          className="pt-field text-sm"
          {...register('why_puretask_text')}
        />
        <div className="flex justify-between text-xs text-neutral-400">
          <span>{errors.why_puretask_text?.message ?? ''}</span>
          <span className={text.length < 50 ? 'text-error' : ''}>{text.length} / 1000</span>
        </div>
      </label>

      {errors.root ? <TrustCallout variant="caution">{errors.root.message}</TrustCallout> : null}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => router.push('/app/apply/step/2')}
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
