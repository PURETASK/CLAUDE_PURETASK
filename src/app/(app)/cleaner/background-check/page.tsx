import Link from 'next/link';

const BackgroundCheckPage = () => {
  return (
    <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Background Check Status</h1>
      <p className="mt-2 text-sm text-slate-700">
        WF 33 status detail is being wired to Checkr in Phase 4d. Use application step 6 to set and
        track current status during scaffold build.
      </p>
      <Link
        href="/cleaner/apply/step-6"
        className="mt-4 inline-block rounded-md border px-3 py-1.5 text-sm"
      >
        Go to step 6
      </Link>
    </div>
  );
};

export default BackgroundCheckPage;
