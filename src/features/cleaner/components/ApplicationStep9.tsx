'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { saveStepAction, type CleanerActionState } from '@/features/cleaner/actions';
import { type Step9Values, step9Schema } from '@/features/cleaner/validation';
import { Button } from '@/components/ui/button';
import { TrustCallout } from '@/components/ui/trust-callout';

type Props = { defaultValues?: Partial<Step9Values> };

const INITIAL: CleanerActionState = { ok: false, error: null };

export const ApplicationStep9 = ({ defaultValues }: Props) => {
  const router = useRouter();
  const saveStep = saveStepAction.bind(null, '9');
  const [state, formAction] = useActionState(saveStep, INITIAL);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Step9Values>({
    resolver: zodResolver(step9Schema),
    defaultValues: { photo_training_completed: false, ...defaultValues },
  });

  useEffect(() => {
    if (state.ok) router.push('/app/apply/step/10');
  }, [router, state.ok]);

  useEffect(() => {
    if (state.error) setError('root', { message: state.error });
  }, [setError, state.error]);

  const onSubmit = (values: Step9Values) => {
    const fd = new FormData();
    fd.set('photo_training_completed', String(values.photo_training_completed));
    startTransition(() => formAction(fd));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Photo etiquette training</h2>
        <p className="mt-1 text-sm text-neutral-500">
          WF 49 content is being integrated in Phase 4g. This gate enforces completion in the
          application pipeline.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          className="accent-brand-600"
          {...register('photo_training_completed')}
        />
        I completed the PureTask photo etiquette training.
      </label>
      {errors.photo_training_completed ? (
        <span className="text-sm text-error">{errors.photo_training_completed.message}</span>
      ) : null}

      {errors.root ? <TrustCallout variant="caution">{errors.root.message}</TrustCallout> : null}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => router.push('/app/apply/step/8')}
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
