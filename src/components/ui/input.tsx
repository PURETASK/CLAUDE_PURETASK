'use client';

import { useId, type InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className = '', ...props }, ref) => {
    const id = useId();
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium text-neutral-700">
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={[
            'rounded-xl border bg-white px-3.5 py-2.5 text-sm text-neutral-900',
            'placeholder:text-neutral-400 transition-colors duration-control',
            'focus:outline-none focus:ring-2',
            error
              ? 'border-error focus:border-error focus:ring-error/20'
              : 'border-neutral-200 focus:border-brand-600 focus:ring-brand-600/20',
            'disabled:bg-neutral-50 disabled:text-neutral-400',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {error && <span className="text-xs text-error">{error}</span>}
        {helper && !error && <span className="text-xs text-neutral-500">{helper}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
