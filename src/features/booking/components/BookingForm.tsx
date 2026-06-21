'use client';

import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MoneyRow } from '@/components/ui/money-row';
import { Stepper } from '@/components/ui/stepper';
import { TrustCallout } from '@/components/ui/trust-callout';
import { createBookingAction, type BookingActionState } from '@/features/booking/actions';
import type { ServiceRow } from '@/features/booking/queries';
import { cn } from '@/lib/utils/cn';

type Address = { id: string; street_1: string; city: string; state: string };
type CleanerInfo = {
  id: string;
  full_name: string;
  current_tier: string;
  hourly_rates_cents: Record<string, number>;
};
type DateOption = { value: string; dow: string; day: number; month: string };

type Props = {
  cleaner: CleanerInfo;
  services: ServiceRow[];
  addresses: Address[];
  dateOptions: DateOption[];
};

const INITIAL: BookingActionState = { ok: false, error: null };
const DURATION_OPTIONS = [2, 3, 4, 5, 6, 8];
const TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];
const STEPS = ['When', 'Details', 'Review'];

const fmtPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const fmtTime = (hhmm: string) => {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr ?? 0);
  const m = Number(mStr ?? 0);
  const am = h < 12;
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, '0')} ${am ? 'AM' : 'PM'}`;
};

const pill = (active: boolean) =>
  cn(
    'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
    active
      ? 'bg-brand-600 text-white'
      : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50',
  );

const slot = (active: boolean) =>
  cn(
    'rounded-lg border py-2 text-xs font-medium transition-colors',
    active
      ? 'border-brand-600 bg-brand-600 text-white'
      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50',
  );

export const BookingForm = ({ cleaner, services, addresses, dateOptions }: Props) => {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createBookingAction, INITIAL);

  const offeredServices = useMemo(
    () => services.filter((s) => (cleaner.hourly_rates_cents[s.service_type] ?? 0) > 0),
    [services, cleaner.hourly_rates_cents],
  );

  const [step, setStep] = useState(0);
  const [serviceType, setServiceType] = useState(offeredServices[0]?.service_type ?? '');
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(2);
  const [notes, setNotes] = useState('');

  const selectedService = services.find((s) => s.service_type === serviceType);
  const minHours = (selectedService?.min_hours_by_tier[cleaner.current_tier] ?? 2) as number;
  const effectiveDuration = Math.max(duration, minHours);

  useEffect(() => {
    if (duration < minHours) setDuration(minHours);
  }, [duration, minHours]);

  // The action redirects on success; this is a defensive fallback if it returns ok instead.
  useEffect(() => {
    if (state.ok) router.push('/app/bookings');
  }, [state.ok, router]);

  const hourlyRate = cleaner.hourly_rates_cents[serviceType] ?? 0;
  const subtotal = hourlyRate * effectiveDuration;
  const platformFee = Math.round(subtotal * 0.2);
  const total = subtotal + platformFee;
  const startAt = date && time ? `${date}T${time}` : '';

  const selectedDate = dateOptions.find((d) => d.value === date);
  const selectedAddress = addresses.find((a) => a.id === addressId);
  const serviceName = selectedService?.display_name ?? serviceType;
  const firstName = cleaner.full_name.split(' ')[0];

  const canContinueWhen = Boolean(serviceType && date && time);
  const canContinueDetails = Boolean(addressId);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* Submit payload — decoupled from which step is visible, so it's always complete. */}
      <input type="hidden" name="cleaner_id" value={cleaner.id} />
      <input type="hidden" name="service_type" value={serviceType} />
      <input type="hidden" name="address_id" value={addressId} />
      <input type="hidden" name="start_at" value={startAt} />
      <input type="hidden" name="duration_hours" value={effectiveDuration} />
      <input type="hidden" name="customer_notes" value={notes} />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => (step === 0 ? router.back() : setStep((s) => s - 1))}
          className="flex-shrink-0 text-neutral-500 transition-colors hover:text-neutral-900"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </button>
        <div className="flex-1">
          <Stepper steps={STEPS} current={step} />
        </div>
      </div>

      {/* STEP 1 — When */}
      {step === 0 && (
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              Cleaning with {firstName}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-neutral-900">When works for you?</h2>
          </div>

          {offeredServices.length > 1 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-neutral-500">Service</p>
              <div className="flex flex-wrap gap-2">
                {offeredServices.map((s) => (
                  <button
                    key={s.service_type}
                    type="button"
                    onClick={() => setServiceType(s.service_type)}
                    className={pill(serviceType === s.service_type)}
                  >
                    {s.display_name} · {fmtPrice(cleaner.hourly_rates_cents[s.service_type] ?? 0)}
                    /hr
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-neutral-500">Date</p>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {dateOptions.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDate(d.value)}
                  className={cn(
                    'flex w-14 flex-shrink-0 flex-col items-center rounded-xl border py-2 transition-colors',
                    date === d.value
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50',
                  )}
                >
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      date === d.value ? 'text-white/80' : 'text-neutral-400',
                    )}
                  >
                    {d.dow}
                  </span>
                  <span className="text-base font-semibold">{d.day}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-neutral-500">Start time</p>
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTime(t)}
                  className={slot(time === t)}
                >
                  {fmtTime(t)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-neutral-500">
              How many hours{minHours > 2 ? ` · ${minHours}hr min for this tier` : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.filter((d) => d >= minHours).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={cn('min-w-[64px]', slot(effectiveDuration === d))}
                >
                  {d} hr
                </button>
              ))}
            </div>
          </div>

          <Button type="button" disabled={!canContinueWhen} onClick={() => setStep(1)}>
            {canContinueWhen ? `Continue · ${fmtPrice(subtotal)} + fee` : 'Select a date & time'}
          </Button>
        </div>
      )}

      {/* STEP 2 — Details */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              Details for {firstName}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-neutral-900">
              Help {firstName} prepare.
            </h2>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-neutral-500">Address</p>
            {addresses.length === 0 ? (
              <TrustCallout variant="warning">
                No addresses saved.{' '}
                <Link href="/app/settings/addresses" className="font-medium underline">
                  Add one first.
                </Link>
              </TrustCallout>
            ) : (
              <div className="flex flex-col gap-2">
                {addresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAddressId(a.id)}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                      addressId === a.id
                        ? 'border-brand-600 bg-brand-50/50'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50',
                    )}
                  >
                    <span className="text-sm text-neutral-800">
                      {a.street_1}, {a.city}, {a.state}
                    </span>
                    {addressId === a.id && (
                      <Check className="h-4 w-4 flex-shrink-0 text-brand-600" strokeWidth={2.5} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-neutral-500">
              Anything else for {firstName}? (optional)
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Entry method, pets, rooms to skip, focus areas, supplies…"
              className="pt-field"
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button
              type="button"
              disabled={!canContinueDetails}
              onClick={() => setStep(2)}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 — Review */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              Review &amp; confirm
            </p>
            <h2 className="mt-1 text-lg font-semibold text-neutral-900">Confirm your booking.</h2>
          </div>

          <Card elevation={1} className="border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-sm font-semibold text-neutral-900">{serviceName}</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              {selectedDate ? `${selectedDate.dow} ${selectedDate.month} ${selectedDate.day}` : ''}{' '}
              · {time ? fmtTime(time) : ''} · {effectiveDuration} hours
              <br />
              {cleaner.full_name}
              {selectedAddress ? ` · ${selectedAddress.street_1}, ${selectedAddress.city}` : ''}
            </p>
          </Card>

          <Card elevation={1} className="border border-neutral-200 px-4 py-3">
            <MoneyRow
              label={`${firstName}'s rate · ${effectiveDuration} hrs`}
              amount={fmtPrice(subtotal)}
            />
            <MoneyRow label="PureTask service fee" amount={fmtPrice(platformFee)} muted />
            <div className="mt-1 border-t border-neutral-100 pt-1">
              <MoneyRow label="Total" amount={fmtPrice(total)} emphasis />
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Authorized today, charged after you approve the cleaning.
            </p>
          </Card>

          <p className="text-xs leading-relaxed text-neutral-400">
            By booking you agree to PureTask Terms. 48-hour dispute window after the cleaning.
          </p>

          {state.error && <TrustCallout variant="caution">{state.error}</TrustCallout>}

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="submit" disabled={isPending || !startAt || !addressId} className="flex-1">
              {isPending ? 'Requesting…' : `Confirm · authorize ${fmtPrice(total)}`}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
};
