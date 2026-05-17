type Props = {
  title: string;
  children: React.ReactNode;
};

/** Non-blocking notice when an optional integration is not configured yet. */
export const IntegrationNotice = ({ title, children }: Props) => (
  <div
    role="status"
    className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
  >
    <p className="font-semibold">{title}</p>
    <p className="mt-1 text-amber-900/90">{children}</p>
    <p className="mt-2 text-xs text-amber-800/80">
      See <code className="rounded bg-amber-100 px-1">docs/secrets-when-ready.md</code> — add keys
      to <code className="rounded bg-amber-100 px-1">.env.local</code> when ready.
    </p>
  </div>
);
