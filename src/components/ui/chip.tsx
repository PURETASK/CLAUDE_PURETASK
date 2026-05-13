import { type ButtonHTMLAttributes } from 'react';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export const Chip = ({
  selected = false,
  disabled,
  children,
  className = '',
  ...props
}: ChipProps) => {
  const base =
    'inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 active:scale-[0.97]';

  const state = disabled
    ? 'border-neutral-100 bg-neutral-50 text-neutral-400 cursor-not-allowed'
    : selected
      ? 'border-brand-600 bg-brand-600/10 text-brand-600'
      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400';

  return (
    <button
      type="button"
      disabled={disabled}
      className={`${base} ${state} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
