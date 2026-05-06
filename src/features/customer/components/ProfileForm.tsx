'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { updateProfileAction, type CustomerActionState } from '@/features/customer/actions';
import { type UpdateProfileValues, updateProfileSchema } from '@/features/customer/validation';

type Props = {
  defaultValues: UpdateProfileValues;
};

const INITIAL_STATE: CustomerActionState = { ok: false, error: null };

export const ProfileForm = ({ defaultValues }: Props) => {
  const [state, formAction] = useActionState(updateProfileAction, INITIAL_STATE);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues,
  });

  useEffect(() => {
    if (state.error) setError('root', { message: state.error });
  }, [setError, state.error]);

  const onSubmit = (values: UpdateProfileValues) => {
    const formData = new FormData();
    formData.set('full_name', values.full_name);
    formData.set('phone', values.phone ?? '');
    startTransition(() => formAction(formData));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Full name</span>
        <input
          type="text"
          autoComplete="name"
          className="rounded border px-3 py-2"
          {...register('full_name')}
        />
        {errors.full_name ? (
          <span className="text-sm text-red-600">{errors.full_name.message}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Phone (optional)</span>
        <input
          type="tel"
          autoComplete="tel"
          placeholder="+19165550100"
          className="rounded border px-3 py-2"
          {...register('phone')}
        />
        {errors.phone ? <span className="text-sm text-red-600">{errors.phone.message}</span> : null}
      </label>

      {errors.root ? (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">{errors.root.message}</p>
      ) : null}

      {state.ok && state.message ? (
        <p className="rounded bg-green-50 p-3 text-sm text-green-700">{state.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {isPending ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  );
};
