'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useTransition } from 'react';
import { useController, useForm } from 'react-hook-form';

import { saveStepAction, type CleanerActionState } from '@/features/cleaner/actions';
import { type Step2Values, step2Schema } from '@/features/cleaner/validation';
import { Button } from '@/components/ui/button';
import { TrustCallout } from '@/components/ui/trust-callout';

type Props = { defaultValues?: Partial<Step2Values> };

const INITIAL: CleanerActionState = { ok: false, error: null };
const SERVICE_OPTIONS = [
  { value: 'standard', label: 'Standard clean', desc: 'Regular residential cleaning' },
  { value: 'deep', label: 'Deep clean', desc: 'Detailed cleaning of all surfaces' },
  { value: 'move_out', label: 'Move-out clean', desc: 'End-of-tenancy full clean' },
  { value: 'airbnb', label: 'Airbnb turnover', desc: 'Quick turnaround for short-term rentals' },
] as const;

export const ApplicationStep2 = ({ defaultValues }: Props) => {
  const router = useRouter();
  const saveStep2 = saveStepAction.bind(null, '2');
  const [state, formAction] = useActionState(saveStep2, INITIAL);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: { years_experience: 0, service_types: [], ...defaultValues },
  });

  const { field: serviceField } = useController({ name: 'service_types', control });

  useEffect(() => {
    if (state.ok) router.push('/app/apply/step/3');
  }, [router, state.ok]);

  useEffect(() => {
    if (state.error) setError('root', { message: state.error });
  }, [setError, state.error]);

  const toggleService = (value: Step2Values['service_types'][number]) => {
    const current = serviceField.value ?? [];
    serviceField.onChange(
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    );
  };

  const onSubmit = (values: Step2Values) => {
    const fd = new FormData();
    fd.set('years_experience', String(values.years_experience));
    values.service_types.forEach((s) => fd.append('service_types', s));
    startTransition(() => formAction(fd));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Experience</h2>
        <p className="mt-1 text-sm text-neutral-500">Tell us about your cleaning background.</p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">
          Years of professional cleaning experience
        </span>
        <input
          type="number"
          min={0}
          max={50}
          className="pt-field max-w-xs"
          {...register('years_experience', { valueAsNumber: true })}
        />
        {errors.years_experience ? (
          <span className="text-sm text-error">{errors.years_experience.message}</span>
        ) : null}
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-700">
          Services you can provide (select all that apply)
        </span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SERVICE_OPTIONS.map((opt) => {
            const checked = (serviceField.value ?? []).includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleService(opt.value)}
                className={`rounded-xl border p-3 text-left text-sm transition-colors duration-control ${
                  checked
                    ? 'border-brand-600 bg-brand-600/10 text-brand-600'
                    : 'border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <p className="font-medium">{opt.label}</p>
                <p className={`text-xs ${checked ? 'text-brand-600/70' : 'text-neutral-500'}`}>
                  {opt.desc}
                </p>
              </button>
            );
          })}
        </div>
        {errors.service_types ? (
          <span className="text-sm text-error">{errors.service_types.message}</span>
        ) : null}
      </div>

      {errors.root ? <TrustCallout variant="caution">{errors.root.message}</TrustCallout> : null}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => router.push('/app/apply/step/1')}
        >
          Back
        </Button>
        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? 'Saving…' : 'Save & continue'}
        </Button>
      </div>
    </form>
  );
};
