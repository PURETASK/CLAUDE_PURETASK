'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { saveStepAction, type CleanerActionState } from '@/features/cleaner/actions';
import { type Step1Values, step1Schema } from '@/features/cleaner/validation';

type Props = { defaultValues?: Partial<Step1Values> };

const INITIAL: CleanerActionState = { ok: false, error: null };
const RADII = [5, 10, 15, 20, 30, 40, 50];

export const ApplicationStep1 = ({ defaultValues }: Props) => {
  const router = useRouter();
  const saveStep1 = saveStepAction.bind(null, '1');
  const [state, formAction] = useActionState(saveStep1, INITIAL);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { home_zip: '', travel_radius_miles: 20, ...defaultValues },
  });

  useEffect(() => {
    if (state.ok) router.push('/app/apply/step/2');
  }, [router, state.ok]);

  useEffect(() => {
    if (state.error) setError('root', { message: state.error });
  }, [setError, state.error]);

  const onSubmit = (values: Step1Values) => {
    const fd = new FormData();
    fd.set('home_zip', values.home_zip);
    fd.set('travel_radius_miles', String(values.travel_radius_miles));
    startTransition(() => formAction(fd));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Service coverage</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Tell us where you&apos;re based and how far you&apos;re willing to travel.
        </p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Your home ZIP code</span>
        <input
          type="text"
          maxLength={5}
          placeholder="95814"
          className="max-w-xs rounded border px-3 py-2"
          {...register('home_zip')}
        />
        {errors.home_zip ? (
          <span className="text-sm text-red-600">{errors.home_zip.message}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Maximum travel radius</span>
        <select
          className="max-w-xs rounded border px-3 py-2"
          {...register('travel_radius_miles', { valueAsNumber: true })}
        >
          {RADII.map((r) => (
            <option key={r} value={r}>
              {r} miles
            </option>
          ))}
        </select>
        {errors.travel_radius_miles ? (
          <span className="text-sm text-red-600">{errors.travel_radius_miles.message}</span>
        ) : null}
      </label>

      {errors.root ? (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">{errors.root.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded bg-black px-5 py-2 text-sm text-white disabled:opacity-60"
      >
        {isPending ? 'Saving...' : 'Save & continue'}
      </button>
    </form>
  );
};
