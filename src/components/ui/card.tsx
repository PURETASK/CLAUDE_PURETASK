import { type HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: 1 | 2 | 3;
}

const SHADOWS = {
  1: 'shadow-tier1',
  2: 'shadow-tier2',
  3: 'shadow-tier3',
} as const;

export const Card = ({ elevation = 1, className = '', children, ...props }: CardProps) => (
  <div className={`rounded-2xl bg-white ${SHADOWS[elevation]} ${className}`} {...props}>
    {children}
  </div>
);
