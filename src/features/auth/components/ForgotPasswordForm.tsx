'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { forgotPasswordAction, type AuthActionState } from '@/features/auth/actions';
import { type ForgotPasswordValues, forgotPasswordSchema } from '@/features/auth/validation';

const INITIAL_STATE: AuthActionState = { ok: false, error: null };

export const ForgotPasswordForm = () => {
  const [state, formAction] = useActionState(forgotPasswordAction, INITIAL_STATE);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  useEffect(() => {
    if (state.error) {
      setError('root', { message: state.error });
      return;
    }

    if (state.ok) {
      reset();
    }
  }, [reset, setError, state.error, state.ok]);

  const onSubmit = (values: ForgotPasswordValues) => {
    const formData = new FormData();
    formData.set('email', values.email);

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full max-w-md flex-col gap-4 rounded border p-6"
    >
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <p className="text-sm text-zinc-600">Enter your email and we will send a reset link.</p>

      <label className="flex flex-col gap-1">
        <span>Email</span>
        <input
          type="email"
          autoComplete="email"
          className="rounded border px-3 py-2"
          {...register('email')}
        />
        {errors.email ? <span className="text-sm text-red-600">{errors.email.message}</span> : null}
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
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {isPending ? 'Sending...' : 'Send reset link'}
      </button>

      <Link className="text-sm underline" href="/auth/sign-in">
        Back to sign in
      </Link>
    </form>
  );
};
