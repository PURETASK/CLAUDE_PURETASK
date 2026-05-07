type Props = {
  title: string;
  description: string;
  phaseBadge: string;
};

export const StubCard = ({ title, description, phaseBadge }: Props) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          {phaseBadge}
        </span>
      </div>
      <p className="text-sm text-slate-700">{description}</p>
    </div>
  );
};
