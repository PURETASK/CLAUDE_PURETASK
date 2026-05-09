'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { saveStepAction, type CleanerActionState } from '@/features/cleaner/actions';
import { type Step4Values, step4Schema } from '@/features/cleaner/validation';
import { Button } from '@/components/ui/button';
import { TrustCallout } from '@/components/ui/trust-callout';

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
        <h2 className="text-lg font-semibold text-neutral-900">Photo guidelines</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Verified photo documentation is the foundation of customer trust at PureTask. Read these
          rules carefully — they govern every job you take.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {GUIDELINES.map((g) => (
          <div key={g.rule} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-sm font-medium text-neutral-900">{g.rule}</p>
            <p className="mt-1 text-sm text-neutral-500">{g.detail}</p>
          </div>
        ))}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-4 transition-colors hover:bg-neutral-50">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
          {...register('etiquette_acknowledged')}
        />
        <span className="text-sm text-neutral-700">
          I have read and understood PureTask&apos;s photo guidelines. I agree to follow them on
          every job and understand that failure to comply may affect my reliability score and tier.
        </span>
      </label>
      {errors.etiquette_acknowledged ? (
        <span className="text-sm text-error">{errors.etiquette_acknowledged.message}</span>
      ) : null}

      {errors.root ? <TrustCallout variant="caution">{errors.root.message}</TrustCallout> : null}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => router.push('/app/apply/step/3')}
        >
          Back
        </Button>
        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? 'Saving…' : 'Continue to review'}
        </Button>
      </div>
    </form>
  );
};
