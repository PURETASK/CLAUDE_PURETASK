import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { getMyScoreHistory } from '@/features/reliability/queries';

const BAND_TONE: Record<string, string> = {
  trusted: 'bg-success-light text-success-dark',
  good_standing: 'bg-brand-50 text-brand-700',
  warning: 'bg-warning-light text-warning-dark',
  probation: 'bg-warning-light text-warning-dark',
  suspended: 'bg-error-light text-error-dark',
};

export default async function CleanerScorePage() {
  const history = await getMyScoreHistory(30);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <div>
        <div className="flex items-center gap-3">
          <Link
            href="/app/cleaner"
            className="flex-shrink-0 text-neutral-500 transition-colors hover:text-neutral-900"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <h1 className="text-lg font-semibold text-neutral-900">Reliability score history</h1>
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          Computed nightly from on-time arrivals, completions, ratings, and cancellations over the
          last 90 days.
        </p>
      </div>

      {history.length === 0 ? (
        <Card elevation={1} className="border border-neutral-200 px-6 py-12 text-center">
          <p className="text-sm text-neutral-400">
            No score data yet. Check back after your first job.
          </p>
        </Card>
      ) : (
        <Card elevation={1} className="overflow-hidden border border-neutral-200 p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-xs text-neutral-400">
                <th className="px-5 py-3 text-left font-medium">Date</th>
                <th className="px-5 py-3 text-right font-medium">Score</th>
                <th className="px-5 py-3 text-right font-medium">Band</th>
              </tr>
            </thead>
            <tbody>
              {history.map((s) => (
                <tr key={s.snapshot_date} className="border-b border-neutral-50 last:border-0">
                  <td className="px-5 py-3 text-neutral-700">
                    {new Date(s.snapshot_date).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-neutral-900">{s.score}</td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${BAND_TONE[s.band] ?? BAND_TONE.good_standing}`}
                    >
                      {s.band.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
