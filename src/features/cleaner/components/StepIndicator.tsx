const STEPS = [
  'Coverage',
  'Experience',
  'About you',
  'Guidelines',
  'Identity',
  'Background',
  'Payouts',
  'Tax info',
  'Training',
  'Checklist',
  'Submit',
];

type Props = { current: number };

export const StepIndicator = ({ current }: Props) => (
  <div className="flex items-center gap-0">
    {STEPS.map((label, i) => {
      const n = i + 1;
      const done = n < current;
      const active = n === current;
      return (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={[
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-control',
                done
                  ? 'bg-gradient-brand text-white shadow-tier1'
                  : active
                    ? 'border-2 border-brand-600 bg-white text-brand-600 shadow-tier1'
                    : 'border border-neutral-300 bg-white text-neutral-400',
              ].join(' ')}
            >
              {done ? '✓' : n}
            </div>
            <span
              className={[
                'hidden text-xs sm:block transition-colors duration-micro',
                active ? 'font-semibold text-brand-900' : 'text-neutral-400',
              ].join(' ')}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 ? (
            <div
              className={[
                'mx-1 h-px w-8 transition-colors duration-control sm:w-12',
                done ? 'bg-brand-600' : 'bg-neutral-200',
              ].join(' ')}
            />
          ) : null}
        </div>
      );
    })}
  </div>
);
