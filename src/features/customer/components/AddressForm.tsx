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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrustCallout } from '@/components/ui/trust-callout';

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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-tier1"
    >
      <h3 className="font-semibold text-neutral-900">
        {existing ? 'Edit address' : 'Add address'}
      </h3>

      <Input
        label='Label (optional, e.g. "My Home")'
        type="text"
        error={errors.label?.message}
        {...register('label')}
      />

      <Input
        label="Street address"
        type="text"
        autoComplete="address-line1"
        error={errors.street_1?.message}
        {...register('street_1')}
      />

      <Input
        label="Apt / Suite (optional)"
        type="text"
        autoComplete="address-line2"
        {...register('street_2')}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Input
          label="City"
          type="text"
          autoComplete="address-level2"
          error={errors.city?.message}
          className="col-span-1"
          {...register('city')}
        />
        <Input
          label="State"
          type="text"
          autoComplete="address-level1"
          maxLength={2}
          placeholder="CA"
          error={errors.state?.message}
          className="uppercase"
          {...register('state')}
        />
        <Input
          label="ZIP"
          type="text"
          autoComplete="postal-code"
          maxLength={5}
          placeholder="95814"
          error={errors.zip_code?.message}
          {...register('zip_code')}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-neutral-700">
          Access instructions (optional)
        </label>
        <textarea
          rows={2}
          placeholder="Gate code, key location, etc."
          className="pt-field"
          {...register('access_instructions')}
        />
        {errors.access_instructions && (
          <span className="text-xs text-error">{errors.access_instructions.message}</span>
        )}
      </div>

      {errors.root && <TrustCallout variant="caution">{errors.root.message}</TrustCallout>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : existing ? 'Save changes' : 'Add address'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push(onCancelPath)}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
