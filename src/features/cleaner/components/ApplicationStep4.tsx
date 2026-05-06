'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { saveStepAction, type CleanerActionState } from '@/features/cleaner/actions';
import { type Step4Values, step4Schema } from '@/features/cleaner/validation';

const INITIAL: CleanerActionState = { ok: false, error: null };

const GUIDELINES = [
  {
    rule: '15-minute first photo rule',
    detail:
      'Take your first photo within 15 minutes of clocking in. This confirms you arrived and started work.',
  },
  {
    rule: 'Room-by-room coverage',
    detail:
      'Photograph every required room for the service type (kitchen, bathrooms, living areas, bedrooms). You cannot clock out until all required photos are uploaded.',
  },
  {
    rule: 'Before & after pairs',
    detail:
      'Take a photo before cleaning each room and after completing it. This is the evidence customers use to approve payment.',
  },
  {
    rule: 'Privacy rules',
    detail:
      "Never photograph people, pets, personal documents, or valuables. Focus only on the surfaces you're cleaning.",
  },
  {
    rule: 'Photo quality',
    detail:
      'Clear, well-lit photos only. Blurry or dark photos may not be accepted as evidence in disputes.',
  },
  {
    rule: 'Encryption & deletion',
    detail:
      'All photos are encrypted at rest and automatically deleted after 90 days (or when an active dispute is resolved).',
  },
];

export const ApplicationStep4 = ({
  defaultValues,
}: {
  defaultValues?: { etiquette_acknowledged?: boolean };
}) => {
  const router = useRouter();
  const saveStep4 = saveStepAction.bind(null, '4');
  const [state, formAction] = useActionState(saveStep4, INITIAL);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Step4Values>({
    resolver: zodResolver(step4Schema),
    defaultValues: { etiquette_acknowledged: defaultValues?.etiquette_acknowledged ?? false },
  });

  useEffect(() => {
    if (state.ok) router.push('/app/apply/step/5');
  }, [router, state.ok]);

  useEffect(() => {
    if (state.error) setError('root', { message: state.error });
  }, [setError, state.error]);

  const onSubmit = (values: Step4Values) => {
    const fd = new FormData();
    fd.set('etiquette_acknowledged', String(values.etiquette_acknowledged));
    startTransition(() => formAction(fd));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Photo guidelines</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Verified photo documentation is the foundation of customer trust at PureTask. Read these
          rules carefully — they govern every job you take.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {GUIDELINES.map((g) => (
          <div key={g.rule} className="rounded border p-4">
            <p className="text-sm font-medium">{g.rule}</p>
            <p className="mt-1 text-sm text-zinc-500">{g.detail}</p>
          </div>
        ))}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded border p-4">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0"
          {...register('etiquette_acknowledged')}
        />
        <span className="text-sm">
          I have read and understood PureTask&apos;s photo guidelines. I agree to follow them on
          every job and understand that failure to comply may affect my reliability score and tier.
        </span>
      </label>
      {errors.etiquette_acknowledged ? (
        <span className="text-sm text-red-600">{errors.etiquette_acknowledged.message}</span>
      ) : null}

      {errors.root ? (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">{errors.root.message}</p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push('/app/apply/step/3')}
          className="rounded border px-5 py-2 text-sm"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-black px-5 py-2 text-sm text-white disabled:opacity-60"
        >
          {isPending ? 'Saving...' : 'Continue to review'}
        </button>
      </div>
    </form>
  );
};
