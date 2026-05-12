'use client';

import { useActionState } from 'react';

import { saveSmsSettingsAction } from '@/features/notifications/settings-actions';

type Props = { currentPhone: string | null; currentEnabled: boolean };

export function SmsSettingsForm({ currentPhone, currentEnabled }: Props) {
  const [state, action, pending] = useActionState(saveSmsSettingsAction, {
    ok: false,
    error: null,
  });

  return (
    <form action={action} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-800">SMS notifications</p>
          <p className="text-xs text-neutral-400">
            Receive text messages for booking confirmations and urgent updates.
          </p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            name="sms_enabled_checkbox"
            id="sms_toggle"
            defaultChecked={currentEnabled}
            className="peer sr-only"
            onChange={(e) => {
              const hidden = document.getElementById('sms_enabled_hidden') as HTMLInputElement;
              if (hidden) hidden.value = e.target.checked ? 'true' : 'false';
            }}
          />
          <input
            type="hidden"
            name="sms_enabled"
            id="sms_enabled_hidden"
            defaultValue={String(currentEnabled)}
          />
          <div className="peer h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-neutral-900 peer-checked:after:translate-x-full" />
        </label>
      </div>

      <div>
        <label htmlFor="sms_phone" className="mb-1.5 block text-sm font-medium text-neutral-700">
          Phone number
        </label>
        <input
          id="sms_phone"
          name="sms_phone"
          type="tel"
          defaultValue={currentPhone ?? ''}
          placeholder="+12125551234"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
        <p className="mt-1 text-xs text-neutral-400">International format with country code.</p>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-600">SMS settings saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save SMS settings'}
      </button>
    </form>
  );
}
