export interface ProgressProps {
  value: number; // 0–100
  label?: string;
  showPercent?: boolean;
  className?: string;
}

export const Progress = ({ value, label, showPercent = false, className = '' }: ProgressProps) => {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs font-medium text-neutral-600">{label}</span>}
          {showPercent && <span className="text-xs text-neutral-500">{clamped}%</span>}
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-gradient-brand transition-all duration-card"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
