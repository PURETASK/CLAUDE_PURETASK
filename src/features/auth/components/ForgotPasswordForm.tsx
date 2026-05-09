'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { forgotPasswordAction, type AuthActionState } from '@/features/auth/actions';
import { type ForgotPasswordValues, forgotPasswordSchema } from '@/features/auth/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrustCallout } from '@/components/ui/trust-callout';

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
      className="flex w-full max-w-md flex-col gap-5 rounded-2xl bg-white p-8 shadow-tier2"
    >
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Reset password</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      {errors.root && (
        <TrustCallout variant="caution">{errors.root.message}</TrustCallout>
      )}
      {state.ok && state.message && (
        <TrustCallout variant="success">{state.message}</TrustCallout>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Sending…' : 'Send reset link'}
      </Button>

      <Link
        className="text-center text-sm font-medium text-brand-600 hover:text-brand-900"
        href="/auth/sign-in"
      >
        ← Back to sign in
      </Link>
    </form>
  );
};
