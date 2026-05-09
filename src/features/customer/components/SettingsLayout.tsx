import { type ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export const SettingsLayout = ({ title, subtitle, children }: Props) => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-3xl text-base text-neutral-600">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
};
