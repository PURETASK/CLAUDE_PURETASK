import Link from 'next/link';

const VerifyIdentityPage = () => {
  return (
    <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Identity Verification</h1>
      <p className="mt-2 text-sm text-slate-700">
        Stripe Identity launcher integration is part of Phase 4c. Use application step 5 while this
        standalone page is being finalized.
      </p>
      <Link
        href="/cleaner/apply/step-5"
        className="mt-4 inline-block rounded-md border px-3 py-1.5 text-sm"
      >
        Go to step 5
      </Link>
    </div>
  );
};

export default VerifyIdentityPage;
