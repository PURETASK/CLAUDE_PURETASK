'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { signUpAction, type AuthActionState } from '@/features/auth/actions';
import { type SignUpValues, signUpSchema } from '@/features/auth/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrustCallout } from '@/components/ui/trust-callout';

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
      className="flex w-full max-w-md flex-col gap-5 rounded-2xl bg-white p-8 shadow-tier2"
    >
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          {role === 'cleaner' ? 'Create cleaner account' : 'Create your account'}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Join PureTask — it&apos;s free to get started
        </p>
      </div>

      <input type="hidden" {...register('role')} value={role} />

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

      {errors.root && <TrustCallout variant="caution">{errors.root.message}</TrustCallout>}
      {state.ok && state.message && <TrustCallout variant="success">{state.message}</TrustCallout>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Creating account…' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-neutral-500">
        Already have an account?{' '}
        <Link className="font-medium text-brand-600 hover:text-brand-900" href="/auth/sign-in">
          Sign in
        </Link>
      </p>
    </form>
  );
};
