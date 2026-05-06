'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { signInAction, type AuthActionState } from '@/features/auth/actions';
import { type SignInValues, signInSchema } from '@/features/auth/validation';

const INITIAL_STATE: AuthActionState = { ok: false, error: null };

export const SignInForm = () => {
  const [state, formAction] = useActionState(signInAction, INITIAL_STATE);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (state.error) {
      setError('root', { message: state.error });
    }
  }, [setError, state.error]);

  const onSubmit = (values: SignInValues) => {
    const formData = new FormData();
    formData.set('email', values.email);
    formData.set('password', values.password);

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full max-w-md flex-col gap-4 rounded border p-6"
    >
      <h1 className="text-2xl font-semibold">Sign in</h1>

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

      <label className="flex flex-col gap-1">
        <span>Password</span>
        <input
          type="password"
          autoComplete="current-password"
          className="rounded border px-3 py-2"
          {...register('password')}
        />
        {errors.password ? (
          <span className="text-sm text-red-600">{errors.password.message}</span>
        ) : null}
      </label>

      {errors.root ? (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">{errors.root.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {isPending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
};
