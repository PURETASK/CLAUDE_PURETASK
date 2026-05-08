import Link from 'next/link';

const TaxInfoPage = () => {
  return (
    <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Tax Info</h1>
      <p className="mt-2 text-sm text-slate-700">
        WF 34 tax flow is tracked in application step 8 in this scaffold. Dedicated W-9 UX will be
        finalized in Phase 4g.
      </p>
      <Link
        href="/cleaner/apply/step-8"
        className="mt-4 inline-block rounded-md border px-3 py-1.5 text-sm"
      >
        Go to step 8
      </Link>
    </div>
  );
};

export default TaxInfoPage;
