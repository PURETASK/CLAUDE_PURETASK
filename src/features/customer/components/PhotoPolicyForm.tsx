'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { type CustomerActionState, updatePhotoPolicyAction } from '@/features/customer/actions';
import {
  type PhotoPolicyInput,
  type PhotoPolicyValues,
  photoPolicySchema,
} from '@/features/customer/validation';
import { Button } from '@/components/ui/button';
import { TrustCallout } from '@/components/ui/trust-callout';

import { RoomMultiSelect } from './RoomMultiSelect';
import { WaiverModal } from './WaiverModal';

type Props = {
  defaultValues: {
    photo_policy: 'default' | 'skip_named_rooms' | 'skip_all_with_waiver';
    skip_photo_rooms: string[];
  };
};

const INITIAL_STATE: CustomerActionState = { ok: false, error: null };

export const PhotoPolicyForm = ({ defaultValues }: Props) => {
  const [state, formAction] = useActionState(updatePhotoPolicyAction, INITIAL_STATE);
  const [isPending, startTransition] = useTransition();
  const [isWaiverOpen, setIsWaiverOpen] = useState(false);
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<PhotoPolicyValues | null>(null);
  const [otherRoom, setOtherRoom] = useState('');

  const {
    register,
    watch,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm<PhotoPolicyInput>({
    resolver: zodResolver(photoPolicySchema),
    defaultValues: {
      ...defaultValues,
      waiver_accepted: defaultValues.photo_policy === 'skip_all_with_waiver',
    },
  });

  const selectedPolicy = watch('photo_policy');
  const selectedRooms = watch('skip_photo_rooms') ?? [];

  useEffect(() => {
    if (state.error) setError('root', { message: state.error });
  }, [setError, state.error]);

  const onSubmit = (values: PhotoPolicyInput) => {
    const normalizedValues: PhotoPolicyValues = {
      photo_policy: values.photo_policy,
      skip_photo_rooms: values.skip_photo_rooms ?? [],
      waiver_accepted: values.waiver_accepted ?? false,
    };

    if (normalizedValues.photo_policy === 'skip_all_with_waiver' && !waiverAccepted) {
      setPendingSubmit(normalizedValues);
      setIsWaiverOpen(true);
      return;
    }

    const formData = new FormData();
    formData.set('photo_policy', normalizedValues.photo_policy);
    formData.set('skip_photo_rooms', normalizedValues.skip_photo_rooms.join(','));
    formData.set('other_room', otherRoom);
    formData.set(
      'waiver_accepted',
      String(normalizedValues.photo_policy !== 'skip_all_with_waiver' || waiverAccepted),
    );

    startTransition(() => formAction(formData));
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-xl flex-col gap-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold text-neutral-700">Photo policy</legend>

          {[
            { value: 'default', label: 'Default (allow standard completion photos)' },
            { value: 'skip_named_rooms', label: 'Skip named rooms' },
            { value: 'skip_all_with_waiver', label: 'Skip all photos (requires waiver)' },
          ].map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 p-3 text-sm text-neutral-700 transition-colors duration-control has-[:checked]:border-brand-600 has-[:checked]:bg-brand-600/5"
            >
              <input
                type="radio"
                value={opt.value}
                {...register('photo_policy')}
                className="h-4 w-4 accent-brand-600"
              />
              {opt.label}
            </label>
          ))}
        </fieldset>

        {selectedPolicy === 'skip_named_rooms' && (
          <>
            <RoomMultiSelect
              selectedRooms={selectedRooms}
              register={register}
              otherRoom={otherRoom}
              onOtherRoomChange={setOtherRoom}
            />
            {errors.skip_photo_rooms && (
              <p className="text-xs text-error">{errors.skip_photo_rooms.message}</p>
            )}
          </>
        )}

        {selectedPolicy === 'skip_all_with_waiver' && (
          <TrustCallout variant="warning">
            You must explicitly accept the waiver before saving this option.
          </TrustCallout>
        )}

        {errors.root && <TrustCallout variant="caution">{errors.root.message}</TrustCallout>}
        {state.ok && state.message && (
          <TrustCallout variant="success">{state.message}</TrustCallout>
        )}

        <Button type="submit" disabled={isPending} className="self-start">
          {isPending ? 'Saving…' : 'Save policy'}
        </Button>
      </form>

      <WaiverModal
        isOpen={isWaiverOpen}
        isAccepted={waiverAccepted}
        onAcceptedChange={setWaiverAccepted}
        onCancel={() => {
          setIsWaiverOpen(false);
          setWaiverAccepted(false);
          setPendingSubmit(null);
        }}
        onConfirm={() => {
          setIsWaiverOpen(false);
          if (!pendingSubmit) return;
          const formData = new FormData();
          formData.set('photo_policy', pendingSubmit.photo_policy);
          formData.set('skip_photo_rooms', pendingSubmit.skip_photo_rooms.join(','));
          formData.set('other_room', otherRoom);
          formData.set('waiver_accepted', 'true');
          startTransition(() => formAction(formData));
          setPendingSubmit(null);
        }}
      />
    </>
  );
};
