import { type ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const BASE =
  'inline-flex items-center justify-center font-semibold transition-all duration-control rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

const VARIANTS = {
  primary:
    'bg-gradient-brand text-white shadow-tier1 hover:shadow-tier2 hover:brightness-110',
  secondary:
    'bg-white text-brand-600 border border-brand-600 shadow-tier1 hover:bg-neutral-50 hover:shadow-tier2',
  ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
};

const SIZES = {
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
);

Button.displayName = 'Button';
