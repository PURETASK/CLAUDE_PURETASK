import Link from 'next/link';

import { getIntegrationStatuses, isV1E2EReady } from '@/lib/integrations';

export default function IntegrationsStatusPage() {
  const statuses = getIntegrationStatuses();
  const v1Ready = isV1E2EReady();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/app/settings"
        className="mb-4 block text-xs text-neutral-400 hover:text-neutral-600"
      >
        ← Back to settings
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900">Integrations</h1>
      <p className="mt-1 text-sm text-neutral-500">
        What is configured on this server (no secret values shown). Add keys in{' '}
        <code className="rounded bg-neutral-100 px-1">.env.local</code> when ready.
      </p>

      <p
        className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
          v1Ready
            ? 'border-success/30 bg-success/5 text-success'
            : 'border-amber-200 bg-amber-50 text-amber-950'
        }`}
      >
        {v1Ready
          ? 'All integrations required for the V1 staging E2E checklist appear configured.'
          : 'Some V1 E2E integrations are still missing — you can use the app for non-payment flows.'}
      </p>

      <ul className="mt-6 space-y-3">
        {statuses.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-tier1"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-neutral-900">{item.label}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{item.enables}</p>
                {item.requiredToBoot && (
                  <p className="mt-1 text-xs text-neutral-400">Required to start the app</p>
                )}
                {item.requiredForV1E2E && !item.requiredToBoot && (
                  <p className="mt-1 text-xs text-neutral-400">Required for full V1 E2E test</p>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  item.configured ? 'bg-success/15 text-success' : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {item.configured ? 'On' : 'Off'}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-xs text-neutral-400">
        Run <code className="rounded bg-neutral-100 px-1">pnpm integrations:check</code> in the
        terminal. See{' '}
        <code className="rounded bg-neutral-100 px-1">docs/secrets-when-ready.md</code>.
      </p>
    </div>
  );
}
