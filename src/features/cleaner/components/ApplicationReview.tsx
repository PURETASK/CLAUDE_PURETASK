'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { submitApplicationAction } from '@/features/cleaner/actions';

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
};

type Props = { applicationData: AppData };

export const ApplicationReview = ({ applicationData: d }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isComplete =
    d.home_zip &&
    d.travel_radius_miles &&
    d.years_experience !== undefined &&
    d.service_types?.length &&
    d.why_puretask_text &&
    d.etiquette_acknowledged;

  const handleSubmit = () => {
    startTransition(async () => {
      await submitApplicationAction();
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Review your application</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Check your details before submitting. You won&apos;t be able to edit after submission.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded border p-5">
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
      </div>

      {!isComplete ? (
        <p className="rounded bg-amber-50 p-3 text-sm text-amber-700">
          Some steps are incomplete. Go back and complete all steps before submitting.
        </p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push('/app/apply/step/4')}
          className="rounded border px-5 py-2 text-sm"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !isComplete}
          className="rounded bg-black px-5 py-2 text-sm text-white disabled:opacity-60"
        >
          {isPending ? 'Submitting...' : 'Submit application'}
        </button>
      </div>
    </div>
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
  <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
    <span className="w-36 shrink-0 text-zinc-500">{label}</span>
    <span className="flex-1">{value}</span>
    <button
      type="button"
      onClick={() => router.push(`/app/apply/step/${step}`)}
      className="shrink-0 text-xs text-zinc-400 hover:text-zinc-700"
    >
      Edit
    </button>
  </div>
);
