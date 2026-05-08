import Link from 'next/link';

const PhotoTrainingPage = () => {
  return (
    <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Photo Etiquette Training</h1>
      <p className="mt-2 text-sm text-slate-700">
        WF 49 multi-section training content is represented by step 9 completion in this scaffold.
        Full content module is scheduled for Phase 4g.
      </p>
      <Link
        href="/cleaner/apply/step-9"
        className="mt-4 inline-block rounded-md border px-3 py-1.5 text-sm"
      >
        Go to step 9
      </Link>
    </div>
  );
};

export default PhotoTrainingPage;
