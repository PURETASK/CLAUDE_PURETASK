'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { resetPasswordAction, type AuthActionState } from '@/features/auth/actions';
import { type ResetPasswordValues, resetPasswordSchema } from '@/features/auth/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrustCallout } from '@/components/ui/trust-callout';

const INITIAL_STATE: AuthActionState = { ok: false, error: null };

export const ResetPasswordForm = () => {
  const [state, formAction] = useActionState(resetPasswordAction, INITIAL_STATE);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
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

  const onSubmit = (values: ResetPasswordValues) => {
    const formData = new FormData();
    formData.set('password', values.password);
    formData.set('confirmPassword', values.confirmPassword);

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
        <h1 className="text-2xl font-bold text-neutral-900">Set a new password</h1>
        <p className="mt-1 text-sm text-neutral-500">Choose a strong password for your account.</p>
      </div>

      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />

      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      {errors.root && (
        <TrustCallout variant="caution">{errors.root.message}</TrustCallout>
      )}
      {state.ok && state.message && (
        <TrustCallout variant="success">{state.message}</TrustCallout>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Updating…' : 'Update password'}
      </Button>

      <Link
        className="text-center text-sm font-medium text-brand-600 hover:text-brand-900"
        href="/auth/sign-in"
      >
        Go to sign in
      </Link>
    </form>
  );
};
