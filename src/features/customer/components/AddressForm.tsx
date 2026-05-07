'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import {
  addAddressAction,
  updateAddressAction,
  type CustomerActionState,
} from '@/features/customer/actions';
import { type AddressValues, addressSchema } from '@/features/customer/validation';

type ExistingAddress = AddressValues & { id: string };

type Props = {
  existing?: ExistingAddress;
  onSuccessPath: string;
  onCancelPath: string;
};

const INITIAL_STATE: CustomerActionState = { ok: false, error: null };

export const AddressForm = ({ existing, onSuccessPath, onCancelPath }: Props) => {
  const router = useRouter();
  const action = existing ? updateAddressAction : addAddressAction;
  const [state, formAction] = useActionState(action, INITIAL_STATE);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: existing ?? { state: 'CA' },
  });

  useEffect(() => {
    if (state.ok) {
      router.push(onSuccessPath);
      router.refresh();
    }
  }, [onSuccessPath, router, state.ok]);

  useEffect(() => {
    if (state.error) setError('root', { message: state.error });
  }, [setError, state.error]);

  const onSubmit = (values: AddressValues) => {
    const formData = new FormData();
    if (existing) formData.set('address_id', existing.id);
    formData.set('label', values.label ?? '');
    formData.set('street_1', values.street_1);
    formData.set('street_2', values.street_2 ?? '');
    formData.set('city', values.city);
    formData.set('state', values.state);
    formData.set('zip_code', values.zip_code);
    formData.set('access_instructions', values.access_instructions ?? '');
    startTransition(() => formAction(formData));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 rounded border p-4">
      <h3 className="font-medium">{existing ? 'Edit address' : 'Add address'}</h3>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Label (optional, e.g. &ldquo;My Home&rdquo;)</span>
        <input type="text" className="rounded border px-3 py-2 text-sm" {...register('label')} />
        {errors.label ? <span className="text-sm text-red-600">{errors.label.message}</span> : null}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Street address</span>
        <input
          type="text"
          autoComplete="address-line1"
          className="rounded border px-3 py-2 text-sm"
          {...register('street_1')}
        />
        {errors.street_1 ? (
          <span className="text-sm text-red-600">{errors.street_1.message}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Apt / Suite (optional)</span>
        <input
          type="text"
          autoComplete="address-line2"
          className="rounded border px-3 py-2 text-sm"
          {...register('street_2')}
        />
      </label>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="col-span-1 flex flex-col gap-1 sm:col-span-1">
          <span className="text-sm">City</span>
          <input
            type="text"
            autoComplete="address-level2"
            className="rounded border px-3 py-2 text-sm"
            {...register('city')}
          />
          {errors.city ? <span className="text-sm text-red-600">{errors.city.message}</span> : null}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">State</span>
          <input
            type="text"
            autoComplete="address-level1"
            maxLength={2}
            placeholder="CA"
            className="rounded border px-3 py-2 text-sm uppercase"
            {...register('state')}
          />
          {errors.state ? (
            <span className="text-sm text-red-600">{errors.state.message}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">ZIP</span>
          <input
            type="text"
            autoComplete="postal-code"
            maxLength={5}
            placeholder="95814"
            className="rounded border px-3 py-2 text-sm"
            {...register('zip_code')}
          />
          {errors.zip_code ? (
            <span className="text-sm text-red-600">{errors.zip_code.message}</span>
          ) : null}
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Access instructions (optional)</span>
        <textarea
          rows={2}
          placeholder="Gate code, key location, etc."
          className="rounded border px-3 py-2 text-sm"
          {...register('access_instructions')}
        />
        {errors.access_instructions ? (
          <span className="text-sm text-red-600">{errors.access_instructions.message}</span>
        ) : null}
      </label>

      {errors.root ? (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">{errors.root.message}</p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {isPending ? 'Saving...' : existing ? 'Save changes' : 'Add address'}
        </button>
        <button
          type="button"
          onClick={() => router.push(onCancelPath)}
          className="rounded border px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
