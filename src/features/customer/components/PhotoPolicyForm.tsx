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
      <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-xl flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Photo policy</legend>

          <label className="rounded border p-3 text-sm">
            <input type="radio" value="default" {...register('photo_policy')} className="mr-2" />
            Default (allow standard completion photos)
          </label>

          <label className="rounded border p-3 text-sm">
            <input
              type="radio"
              value="skip_named_rooms"
              {...register('photo_policy')}
              className="mr-2"
            />
            Skip named rooms
          </label>

          <label className="rounded border p-3 text-sm">
            <input
              type="radio"
              value="skip_all_with_waiver"
              {...register('photo_policy')}
              className="mr-2"
            />
            Skip all photos (requires waiver)
          </label>
        </fieldset>

        {selectedPolicy === 'skip_named_rooms' ? (
          <>
            <RoomMultiSelect
              selectedRooms={selectedRooms}
              register={register}
              otherRoom={otherRoom}
              onOtherRoomChange={setOtherRoom}
            />
            {errors.skip_photo_rooms ? (
              <p className="text-sm text-red-600">{errors.skip_photo_rooms.message}</p>
            ) : null}
          </>
        ) : null}

        {selectedPolicy === 'skip_all_with_waiver' ? (
          <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            You must explicitly accept the waiver before saving this option.
          </p>
        ) : null}

        {errors.root ? (
          <p className="rounded bg-red-50 p-3 text-sm text-red-700">{errors.root.message}</p>
        ) : null}
        {state.ok && state.message ? (
          <p className="rounded bg-green-50 p-3 text-sm text-green-700">{state.message}</p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="self-start rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {isPending ? 'Saving...' : 'Save policy'}
        </button>
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
