import Image from 'next/image';
import Link from 'next/link';

import { BRAND } from '@/lib/assets';

const OnboardingLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white/95 px-4 py-3">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="flex items-center gap-2">
            <Image src={BRAND.logo} alt="PureTask" width={28} height={28} className="h-7 w-auto" />
            <span className="text-lg font-bold tracking-tight text-brand-900">PureTask</span>
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-12">{children}</div>
    </div>
  );
};

export default OnboardingLayout;
