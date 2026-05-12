'use client';

import { useTransition, useState } from 'react';

import {
  saveAvailabilityAction,
  type AvailabilityActionState,
  type DayRule,
} from '@/features/cleaner/availability-actions';
import type { AvailabilityRule } from '@/features/cleaner/availability-queries';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_OPTIONS: { label: string; value: number }[] = [];
for (let m = 360; m <= 1320; m += 30) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  TIME_OPTIONS.push({ label: `${h12}:${min === 0 ? '00' : min} ${ampm}`, value: m });
}

const DEFAULT_START = 480; // 8:00 AM
const DEFAULT_END = 1020; // 5:00 PM

function buildInitialState(existingRules: AvailabilityRule[]): DayRule[] {
  return Array.from({ length: 7 }, (_, i) => {
    const rule = existingRules.find((r) => r.day_of_week === i);
    return {
      day_of_week: i,
      is_active: rule?.is_active ?? false,
      start_minutes: rule?.start_minutes ?? DEFAULT_START,
      end_minutes: rule?.end_minutes ?? DEFAULT_END,
    };
  });
}

export function AvailabilityScheduleForm({ initialRules }: { initialRules: AvailabilityRule[] }) {
  const [rules, setRules] = useState<DayRule[]>(() => buildInitialState(initialRules));
  const [status, setStatus] = useState<AvailabilityActionState | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateRule = (day: number, patch: Partial<DayRule>) => {
    setRules((prev) => prev.map((r) => (r.day_of_week === day ? { ...r, ...patch } : r)));
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveAvailabilityAction(rules);
      setStatus(result);
    });
  };

  return (
    <div>
      <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
        {rules.map((rule) => (
          <div key={rule.day_of_week} className="flex items-center gap-4 px-4 py-3">
            <div className="w-24">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rule.is_active}
                  onChange={(e) => updateRule(rule.day_of_week, { is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                <span
                  className={`text-sm font-medium ${rule.is_active ? 'text-neutral-900' : 'text-neutral-400'}`}
                >
                  {DAYS[rule.day_of_week]}
                </span>
              </label>
            </div>

            {rule.is_active ? (
              <div className="flex items-center gap-2">
                <select
                  value={rule.start_minutes}
                  onChange={(e) =>
                    updateRule(rule.day_of_week, { start_minutes: parseInt(e.target.value) })
                  }
                  className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-800"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-neutral-400">to</span>
                <select
                  value={rule.end_minutes}
                  onChange={(e) =>
                    updateRule(rule.day_of_week, { end_minutes: parseInt(e.target.value) })
                  }
                  className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-800"
                >
                  {TIME_OPTIONS.filter((t) => t.value > rule.start_minutes).map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-xs text-neutral-400">Unavailable</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save schedule'}
        </button>
        {status?.ok && <p className="text-sm text-green-700">Schedule saved.</p>}
        {status?.error && <p className="text-sm text-red-600">{status.error}</p>}
      </div>
    </div>
  );
}
