import Link from 'next/link';

const CleanerApplyLandingPage = () => {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
      <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Cleaner Onboarding
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Apply to clean with PureTask
        </h1>
        <p className="mt-3 text-sm text-neutral-700">
          Start your cleaner application. You can save your progress and continue later.
        </p>

        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-neutral-700">
          <li>11-step onboarding flow with draft persistence</li>
          <li>Identity + background check + Stripe Connect setup</li>
          <li>Admin review before approval</li>
        </ul>

        <div className="mt-6 flex gap-3">
          <Link
            href="/auth/sign-up?role=cleaner"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Create cleaner account
          </Link>
          <Link
            href="/auth/sign-in"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium"
          >
            I already have an account
          </Link>
        </div>
      </div>
    </main>
  );
};

export default CleanerApplyLandingPage;
