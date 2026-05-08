'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { saveStepAction, type CleanerActionState } from '@/features/cleaner/actions';
import { type Step9Values, step9Schema } from '@/features/cleaner/validation';

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
        <h2 className="text-lg font-semibold">Photo etiquette training</h2>
        <p className="mt-1 text-sm text-zinc-500">
          WF 49 content is being integrated in Phase 4g. This gate enforces completion in the
          application pipeline.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('photo_training_completed')} />I completed the PureTask
        photo etiquette training.
      </label>
      {errors.photo_training_completed ? (
        <span className="text-sm text-red-600">{errors.photo_training_completed.message}</span>
      ) : null}

      {errors.root ? (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">{errors.root.message}</p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push('/app/apply/step/8')}
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
