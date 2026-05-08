import Link from 'next/link';

const ConnectOnboardingPage = () => {
  return (
    <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Stripe Connect Onboarding</h1>
      <p className="mt-2 text-sm text-slate-700">
        WF 63 hosted onboarding launcher is represented in application step 7 during the scaffold
        phase. Live Stripe Connect integration lands in Phase 4e.
      </p>
      <Link
        href="/cleaner/apply/step-7"
        className="mt-4 inline-block rounded-md border px-3 py-1.5 text-sm"
      >
        Go to step 7
      </Link>
    </div>
  );
};

export default ConnectOnboardingPage;
