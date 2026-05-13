'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { createBookingAction, type BookingActionState } from '@/features/booking/actions';
import type { ServiceRow } from '@/features/booking/queries';
import { Button } from '@/components/ui/button';
import { TrustCallout } from '@/components/ui/trust-callout';

type Address = { id: string; street_1: string; city: string; state: string };
type CleanerInfo = {
  id: string;
  full_name: string;
  current_tier: string;
  hourly_rates_cents: Record<string, number>;
};

type Props = {
  cleaner: CleanerInfo;
  services: ServiceRow[];
  addresses: Address[];
};

const INITIAL: BookingActionState = { ok: false, error: null };
const DURATION_OPTIONS = [2, 3, 4, 5, 6, 8];

const fmtPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const fieldClass = 'pt-field';
const labelClass = 'text-sm font-medium text-neutral-700';

export const BookingForm = ({ cleaner, services, addresses }: Props) => {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createBookingAction, INITIAL);

  const offeredServices = services.filter(
    (s) => (cleaner.hourly_rates_cents[s.service_type] ?? 0) > 0,
  );

  const [serviceType, setServiceType] = useState(offeredServices[0]?.service_type ?? '');
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(4);

  const selectedService = services.find((s) => s.service_type === serviceType);
  const minHours = (selectedService?.min_hours_by_tier[cleaner.current_tier] ?? 2) as number;
  const effectiveDuration = Math.max(duration, minHours);

  const hourlyRate = cleaner.hourly_rates_cents[serviceType] ?? 0;
  const subtotal = hourlyRate * effectiveDuration;
  const platformFee = Math.round(subtotal * 0.2);
  const total = subtotal + platformFee;

  const startAt = date && time ? `${date}T${time}` : '';

  useEffect(() => {
    if (duration < minHours) setDuration(minHours);
  }, [duration, minHours]);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="cleaner_id" value={cleaner.id} />

      <div className="flex flex-col gap-1">
        <label className={labelClass}>Service</label>
        <select
          name="service_type"
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          className={fieldClass}
        >
          {offeredServices.map((s) => (
            <option key={s.service_type} value={s.service_type}>
              {s.display_name} — {fmtPrice(cleaner.hourly_rates_cents[s.service_type] ?? 0)}/hr
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>Address</label>
        {addresses.length === 0 ? (
          <TrustCallout variant="warning">
            No addresses saved.{' '}
            <Link href="/app/settings/addresses" className="font-medium underline">
              Add one first.
            </Link>
          </TrustCallout>
        ) : (
          <select
            name="address_id"
            value={addressId}
            onChange={(e) => setAddressId(e.target.value)}
            className={fieldClass}
          >
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.street_1}, {a.city}, {a.state}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label className={labelClass}>Date</label>
          <input
            type="date"
            name="date"
            value={date}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
            className={fieldClass}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Start time</label>
          <input
            type="time"
            name="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={fieldClass}
            required
          />
        </div>
      </div>

      <input type="hidden" name="start_at" value={startAt} />

      <div className="flex flex-col gap-1">
        <label className={labelClass}>
          Duration{minHours > 2 ? ` (${minHours}hr minimum for this tier)` : ''}
        </label>
        <select
          name="duration_hours"
          value={effectiveDuration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className={`${fieldClass} max-w-xs`}
        >
          {DURATION_OPTIONS.filter((d) => d >= minHours).map((d) => (
            <option key={d} value={d}>
              {d} hours
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>Notes for cleaner (optional)</label>
        <textarea
          name="customer_notes"
          rows={3}
          maxLength={500}
          placeholder="Key under mat, dog is friendly, focus on kitchen…"
          className={fieldClass}
        />
      </div>

      {/* Price summary card */}
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm shadow-tier1">
        <p className="mb-3 font-semibold text-neutral-900">Price summary</p>
        <div className="flex flex-col gap-1.5 text-neutral-600">
          <div className="flex justify-between">
            <span>
              {fmtPrice(hourlyRate)}/hr × {effectiveDuration}hr
            </span>
            <span>{fmtPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>PureTask service fee (20%)</span>
            <span>{fmtPrice(platformFee)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-neutral-200 pt-2 font-semibold text-neutral-900">
            <span>Total</span>
            <span>{fmtPrice(total)}</span>
          </div>
        </div>
      </div>

      {state.error && <TrustCallout variant="caution">{state.error}</TrustCallout>}

      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Back
        </Button>
        <Button type="submit" disabled={isPending || addresses.length === 0 || !date}>
          {isPending ? 'Requesting…' : 'Request booking'}
        </Button>
      </div>
    </form>
  );
};
