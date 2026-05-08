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
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                done
                  ? 'bg-black text-white'
                  : active
                    ? 'border-2 border-black bg-white text-black'
                    : 'border border-zinc-300 bg-white text-zinc-400'
              }`}
            >
              {done ? '✓' : n}
            </div>
            <span className={`hidden text-xs sm:block ${active ? 'font-medium' : 'text-zinc-400'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 ? (
            <div className={`mx-1 h-px w-8 sm:w-12 ${done ? 'bg-black' : 'bg-zinc-200'}`} />
          ) : null}
        </div>
      );
    })}
  </div>
);
