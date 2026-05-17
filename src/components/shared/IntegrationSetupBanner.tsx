import Link from 'next/link';

import { getOptionalIntegrationsMissing } from '@/lib/integrations';

/** Dev-only hint for integrations that can be added later via .env.local */
export const IntegrationSetupBanner = () => {
  if (process.env.NODE_ENV !== 'development') return null;

  const missing = getOptionalIntegrationsMissing();
  if (missing.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-dashed border-brand-200 bg-brand-50/80 px-4 py-3 text-sm text-brand-950">
      <p className="font-semibold">Development: optional integrations not configured</p>
      <p className="mt-1 text-brand-900/90">
        The app runs without these. Add secrets when you are ready:
      </p>
      <ul className="mt-2 list-inside list-disc text-brand-900/85">
        {missing.map((item) => (
          <li key={item.id}>
            <span className="font-medium">{item.label}</span>
            <span className="text-brand-800/80"> — {item.enables}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs">
        <Link href="/app/settings/integrations" className="underline hover:no-underline">
          Integration status
        </Link>
        {' · '}
        <span className="font-mono">pnpm integrations:check</span>
        {' · '}
        <span className="font-mono">docs/secrets-when-ready.md</span>
      </p>
    </div>
  );
};
