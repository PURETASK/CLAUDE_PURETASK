'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import {
  saveStepAction,
  submitApplicationAction,
  type CleanerActionState,
} from '@/features/cleaner/actions';
import { type Step11Values, step11Schema } from '@/features/cleaner/validation';
import { Button } from '@/components/ui/button';
import { TrustCallout } from '@/components/ui/trust-callout';

const SERVICE_LABELS: Record<string, string> = {
  standard: 'Standard clean',
  deep: 'Deep clean',
  move_out: 'Move-out clean',
  airbnb: 'Airbnb turnover',
};

type AppData = {
  home_zip?: string;
  travel_radius_miles?: number;
  years_experience?: number;
  service_types?: string[];
  why_puretask_text?: string;
  etiquette_acknowledged?: boolean;
  identity_status?: 'pending' | 'verified' | 'requires_input';
  background_check_status?: 'requested' | 'pending' | 'in_progress' | 'clear' | 'consider';
  stripe_connect_completed?: boolean;
  legal_name?: string;
  tax_classification?: string;
  tax_id_last4?: string;
  photo_training_completed?: boolean;
  ready_to_submit?: boolean;
};

type Props = { applicationData: AppData };

export const ApplicationReview = ({ applicationData: d }: Props) => {
  const router = useRouter();
  const saveStep11 = saveStepAction.bind(null, '11');
  const [state, formAction] = useActionState<CleanerActionState, FormData>(saveStep11, {
    ok: false,
    error: null,
  });
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, startSubmitTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Step11Values>({
    resolver: zodResolver(step11Schema),
    defaultValues: { confirm_submission: false },
  });

  useEffect(() => {
    if (state.error) {
      setError('root', { message: state.error });
    }
  }, [setError, state.error]);

  const isComplete =
    d.home_zip &&
    d.travel_radius_miles &&
    d.years_experience !== undefined &&
    d.service_types?.length &&
    d.why_puretask_text &&
    d.etiquette_acknowledged &&
    d.identity_status === 'verified' &&
    d.background_check_status === 'clear' &&
    d.stripe_connect_completed &&
    d.legal_name &&
    d.tax_classification &&
    d.tax_id_last4 &&
    d.photo_training_completed &&
    d.ready_to_submit;

  const handleFinalSubmit = () => {
    startSubmitTransition(async () => {
      await submitApplicationAction();
    });
  };

  const onSaveFinal = (values: Step11Values) => {
    const fd = new FormData();
    fd.set('confirm_submission', String(values.confirm_submission));
    startTransition(() => formAction(fd));
  };

  return (
    <form onSubmit={handleSubmit(onSaveFinal)} className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Final review and submit</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Check your details before submitting. You won&apos;t be able to edit after submission.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-5 shadow-tier1">
        <Row label="Home ZIP" value={d.home_zip ?? '—'} step={1} router={router} />
        <Row
          label="Travel radius"
          value={d.travel_radius_miles ? `${d.travel_radius_miles} miles` : '—'}
          step={1}
          router={router}
        />
        <Row
          label="Years experience"
          value={d.years_experience !== undefined ? String(d.years_experience) : '—'}
          step={2}
          router={router}
        />
        <Row
          label="Services"
          value={
            d.service_types?.length
              ? d.service_types.map((s) => SERVICE_LABELS[s] ?? s).join(', ')
              : '—'
          }
          step={2}
          router={router}
        />
        <Row
          label="About you"
          value={d.why_puretask_text ? `${d.why_puretask_text.slice(0, 120)}…` : '—'}
          step={3}
          router={router}
        />
        <Row
          label="Photo guidelines"
          value={d.etiquette_acknowledged ? 'Acknowledged ✓' : 'Not acknowledged'}
          step={4}
          router={router}
        />
        <Row
          label="Identity verification"
          value={d.identity_status ?? 'pending'}
          step={5}
          router={router}
        />
        <Row
          label="Background check"
          value={d.background_check_status ?? 'requested'}
          step={6}
          router={router}
        />
        <Row
          label="Stripe Connect"
          value={d.stripe_connect_completed ? 'Completed ✓' : 'Incomplete'}
          step={7}
          router={router}
        />
        <Row label="Tax legal name" value={d.legal_name ?? '—'} step={8} router={router} />
        <Row
          label="Photo training"
          value={d.photo_training_completed ? 'Completed ✓' : 'Incomplete'}
          step={9}
          router={router}
        />
      </div>

      {!isComplete ? (
        <TrustCallout variant="warning">
          Some steps are incomplete. Go back and complete all steps before submitting.
        </TrustCallout>
      ) : null}

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" className="accent-brand-600" {...register('confirm_submission')} />I
        confirm this application is accurate and ready for admin review.
      </label>
      {errors.confirm_submission ? (
        <p className="text-sm text-error">{errors.confirm_submission.message}</p>
      ) : null}
      {errors.root ? <TrustCallout variant="caution">{errors.root.message}</TrustCallout> : null}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => router.push('/app/apply/step/10')}
        >
          Back
        </Button>
        <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save final confirmation'}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleFinalSubmit}
          disabled={isSubmitting || !isComplete}
        >
          {isSubmitting ? 'Submitting…' : 'Submit application'}
        </Button>
      </div>
    </form>
  );
};

const Row = ({
  label,
  value,
  step,
  router,
}: {
  label: string;
  value: string;
  step: number;
  router: ReturnType<typeof useRouter>;
}) => (
  <div className="flex items-start justify-between gap-4 border-b border-neutral-100 py-1.5 text-sm last:border-0">
    <span className="w-36 shrink-0 text-neutral-500">{label}</span>
    <span className="flex-1 text-neutral-900">{value}</span>
    <button
      type="button"
      onClick={() => router.push(`/app/apply/step/${step}`)}
      className="shrink-0 text-xs text-neutral-400 transition-colors duration-control hover:text-brand-600"
    >
      Edit
    </button>
  </div>
);
