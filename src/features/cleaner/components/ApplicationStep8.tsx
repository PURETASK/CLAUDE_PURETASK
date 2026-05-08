'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { saveStepAction, type CleanerActionState } from '@/features/cleaner/actions';
import { type Step8Values, step8Schema } from '@/features/cleaner/validation';

type Props = { defaultValues?: Partial<Step8Values> };

const INITIAL: CleanerActionState = { ok: false, error: null };

export const ApplicationStep8 = ({ defaultValues }: Props) => {
  const router = useRouter();
  const saveStep = saveStepAction.bind(null, '8');
  const [state, formAction] = useActionState(saveStep, INITIAL);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Step8Values>({
    resolver: zodResolver(step8Schema),
    defaultValues: {
      legal_name: '',
      tax_classification: 'sole_proprietor',
      tax_id_last4: '',
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (state.ok) router.push('/app/apply/step/9');
  }, [router, state.ok]);

  useEffect(() => {
    if (state.error) setError('root', { message: state.error });
  }, [setError, state.error]);

  const onSubmit = (values: Step8Values) => {
    const fd = new FormData();
    fd.set('legal_name', values.legal_name);
    fd.set('tax_classification', values.tax_classification);
    fd.set('tax_id_last4', values.tax_id_last4);
    startTransition(() => formAction(fd));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Tax info (W-9 pre-check)</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Stripe Connect will collect full tax details. This step captures minimum profile data for
          review workflow requirements.
        </p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Legal name</span>
        <input className="rounded border px-3 py-2" {...register('legal_name')} />
        {errors.legal_name ? (
          <span className="text-sm text-red-600">{errors.legal_name.message}</span>
        ) : null}
      </label>

      <label className="flex max-w-sm flex-col gap-1">
        <span className="text-sm font-medium">Tax classification</span>
        <select className="rounded border px-3 py-2" {...register('tax_classification')}>
          <option value="sole_proprietor">Sole proprietor</option>
          <option value="llc">LLC</option>
          <option value="corporation">Corporation</option>
          <option value="partnership">Partnership</option>
        </select>
      </label>

      <label className="flex max-w-sm flex-col gap-1">
        <span className="text-sm font-medium">Tax ID last 4 digits</span>
        <input maxLength={4} className="rounded border px-3 py-2" {...register('tax_id_last4')} />
        {errors.tax_id_last4 ? (
          <span className="text-sm text-red-600">{errors.tax_id_last4.message}</span>
        ) : null}
      </label>

      {errors.root ? (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">{errors.root.message}</p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push('/app/apply/step/7')}
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
