'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { signInAction, type AuthActionState } from '@/features/auth/actions';
import { type SignInValues, signInSchema } from '@/features/auth/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrustCallout } from '@/components/ui/trust-callout';

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
      className="flex w-full max-w-md flex-col gap-5 rounded-2xl bg-white p-8 shadow-tier2"
    >
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Welcome back</h1>
        <p className="mt-1 text-sm text-neutral-500">Sign in to your PureTask account</p>
      </div>

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />

      {errors.root && (
        <TrustCallout variant="caution">{errors.root.message}</TrustCallout>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
};
