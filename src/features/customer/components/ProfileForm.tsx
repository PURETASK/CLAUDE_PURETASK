'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { updateProfileAction, type CustomerActionState } from '@/features/customer/actions';
import { type UpdateProfileValues, updateProfileSchema } from '@/features/customer/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrustCallout } from '@/components/ui/trust-callout';

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
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-md flex-col gap-5">
      <Input
        label="Full name"
        type="text"
        autoComplete="name"
        error={errors.full_name?.message}
        {...register('full_name')}
      />

      <Input
        label="Phone (optional)"
        type="tel"
        autoComplete="tel"
        placeholder="+19165550100"
        error={errors.phone?.message}
        {...register('phone')}
      />

      {errors.root && <TrustCallout variant="caution">{errors.root.message}</TrustCallout>}
      {state.ok && state.message && <TrustCallout variant="success">{state.message}</TrustCallout>}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
};
