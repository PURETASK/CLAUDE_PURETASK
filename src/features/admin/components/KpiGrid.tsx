interface KpiCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  highlight?: boolean;
}

const KpiCard = ({ label, value, sublabel, highlight }: KpiCardProps) => (
  <div
    className={`rounded-2xl border p-5 ${
      highlight
        ? 'border-error/30 bg-error/5'
        : 'border-neutral-200 bg-white shadow-tier1'
    }`}
  >
    <p className="text-sm text-neutral-500">{label}</p>
    <p className={`mt-1 text-3xl font-bold ${highlight ? 'text-error' : 'text-neutral-900'}`}>
      {value}
    </p>
    {sublabel && <p className="mt-0.5 text-xs text-neutral-400">{sublabel}</p>}
  </div>
);

interface Props {
  bookingsToday: number;
  gmvTodayCents: number;
  newApplications: number;
  openDisputes: number;
}

export const KpiGrid = ({ bookingsToday, gmvTodayCents, newApplications, openDisputes }: Props) => {
  const gmv = (gmvTodayCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiCard label="Today's Bookings" value={bookingsToday} />
      <KpiCard label="GMV Today" value={gmv} />
      <KpiCard label="New Applications" value={newApplications} sublabel="pending review" />
      <KpiCard label="Open Disputes" value={openDisputes} highlight={openDisputes > 0} />
    </div>
  );
};
