'use client';

interface DayData {
  date: string;
  gmvCents: number;
}

interface Props {
  data: DayData[];
}

export const GmvSparkline = ({ data }: Props) => {
  const max = Math.max(...data.map((d) => d.gmvCents), 1);
  const totalGmv = data.reduce((sum, d) => sum + d.gmvCents, 0);

  const totalFormatted = (totalGmv / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.gmvCents / max) * 90;
    return `${x},${y}`;
  });

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-neutral-900">GMV — Last 14 Days</h2>
        <span className="font-bold text-neutral-900">{totalFormatted}</span>
      </div>
      <div className="relative h-24">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            points={points.join(' ')}
            fill="none"
            stroke="#7c3aed"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points={`0,100 ${points.join(' ')} 100,100`}
            fill="rgba(124,58,237,0.08)"
            stroke="none"
          />
        </svg>
      </div>
      <div className="mt-1 flex justify-between text-xs text-neutral-400">
        <span>{data[0]?.date ?? ''}</span>
        <span>{data[data.length - 1]?.date ?? ''}</span>
      </div>
    </div>
  );
};
