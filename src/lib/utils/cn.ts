/**
 * Tiny dependency-free className joiner. Filters out falsy values and joins
 * the rest with spaces. We deliberately avoid `tailwind-merge`/`clsx` to keep
 * the bundle lean — conflicting Tailwind classes are not de-duplicated, so pass
 * mutually exclusive classes (the common case for conditional styling).
 */
export type ClassValue = string | number | false | null | undefined;

export const cn = (...classes: ClassValue[]): string => classes.filter(Boolean).join(' ');
