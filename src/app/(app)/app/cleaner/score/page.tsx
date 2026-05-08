import Link from 'next/link';

import { getMyScoreHistory } from '@/features/reliability/queries';

const BAND_COLORS: Record<string, string> = {
  trusted: 'bg-emerald-100 text-emerald-700',
  good_standing: 'bg-blue-100 text-blue-700',
  warning: 'bg-amber-100 text-amber-700',
  probation: 'bg-orange-100 text-orange-700',
  suspended: 'bg-red-100 text-red-700',
};

export default async function CleanerScorePage() {
  const history = await getMyScoreHistory(30);

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <Link href="/app/cleaner" className="mb-1 block text-xs text-zinc-400 hover:text-zinc-600">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-semibold">Reliability score history</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your score is computed nightly from on-time arrivals, completions, ratings, and
          cancellations over the last 90 days.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="rounded-xl border border-zinc-100 bg-white px-6 py-12 text-center">
          <p className="text-sm text-zinc-400">
            No score data yet. Check back after your first job.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs text-zinc-400">
                <th className="px-5 py-3 text-left font-medium">Date</th>
                <th className="px-5 py-3 text-right font-medium">Score</th>
                <th className="px-5 py-3 text-right font-medium">Band</th>
              </tr>
            </thead>
            <tbody>
              {history.map((s) => (
                <tr key={s.snapshot_date} className="border-b border-zinc-50 last:border-0">
                  <td className="px-5 py-3 text-zinc-700">
                    {new Date(s.snapshot_date).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-zinc-900">{s.score}</td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${BAND_COLORS[s.band] ?? BAND_COLORS.good_standing}`}
                    >
                      {s.band.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
