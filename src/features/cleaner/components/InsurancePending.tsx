interface Props {
  uploadedAt: string;
}

export const InsurancePending = ({ uploadedAt }: Props) => {
  const formattedDate = new Date(uploadedAt).toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-warning/30 bg-warning/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-warning/10 text-2xl">
            ⏳
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900">Under Review</h2>
            <p className="mt-0.5 text-sm text-neutral-500">Uploaded {formattedDate}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
        <h3 className="mb-4 font-semibold text-neutral-900">What happens next</h3>
        <div className="space-y-3">
          {[
            { day: 'Day 1–2', label: 'Our team reviews your certificate' },
            { day: 'Day 2', label: 'Email confirmation sent' },
            { day: 'Day 2', label: 'Badge appears on your profile' },
          ].map(({ day, label }) => (
            <div key={label} className="flex items-start gap-3">
              <span className="mt-0.5 w-14 flex-shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-center text-xs font-medium text-neutral-600">
                {day}
              </span>
              <span className="text-sm text-neutral-700">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-neutral-500">
        Questions?{' '}
        <a href="mailto:support@puretask.com" className="text-brand-600 hover:underline">
          Contact support
        </a>
      </p>
    </div>
  );
};
