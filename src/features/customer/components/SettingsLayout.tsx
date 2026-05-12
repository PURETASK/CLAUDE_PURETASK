import Image from 'next/image';
import { type ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  icon?: string;
  children: ReactNode;
};

export const SettingsLayout = ({ title, subtitle, icon, children }: Props) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        {icon && (
          <Image src={icon} alt="" width={52} height={52} className="rounded-xl drop-shadow-md" />
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{title}</h1>
          {subtitle ? <p className="mt-1 max-w-3xl text-sm text-neutral-500">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
};
