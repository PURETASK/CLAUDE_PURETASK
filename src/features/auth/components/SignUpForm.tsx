'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { signUpAction, type AuthActionState } from '@/features/auth/actions';
import { type SignUpValues, signUpSchema } from '@/features/auth/validation';

const INITIAL_STATE: AuthActionState = { ok: false, error: null };

export const SignUpForm = ({ role = 'customer' }: { role?: 'customer' | 'cleaner' }) => {
  const [state, formAction] = useActionState(signUpAction, INITIAL_STATE);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      role,
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

  const onSubmit = (values: SignUpValues) => {
    const formData = new FormData();
    formData.set('email', values.email);
    formData.set('password', values.password);
    formData.set('confirmPassword', values.confirmPassword);
    formData.set('role', values.role ?? role);

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full max-w-md flex-col gap-4 rounded border p-6"
    >
      <h1 className="text-2xl font-semibold">
        {role === 'cleaner' ? 'Create cleaner account' : 'Create account'}
      </h1>
      <input type="hidden" {...register('role')} value={role} />

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
          autoComplete="new-password"
          className="rounded border px-3 py-2"
          {...register('password')}
        />
        {errors.password ? (
          <span className="text-sm text-red-600">{errors.password.message}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1">
        <span>Confirm password</span>
        <input
          type="password"
          autoComplete="new-password"
          className="rounded border px-3 py-2"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword ? (
          <span className="text-sm text-red-600">{errors.confirmPassword.message}</span>
        ) : null}
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
        {isPending ? 'Creating account...' : 'Create account'}
      </button>

      <p className="text-sm text-zinc-600">
        Already have an account?{' '}
        <Link className="underline" href="/auth/sign-in">
          Sign in
        </Link>
      </p>
    </form>
  );
};
