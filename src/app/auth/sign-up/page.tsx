import Image from 'next/image';

import { SignUpForm } from '@/features/auth/components/SignUpForm';
import { BRAND } from '@/lib/assets';

type PageProps = {
  searchParams: Promise<{ role?: string }>;
};

const SignUpPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const role = params.role === 'cleaner' ? 'cleaner' : 'customer';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-950 to-brand-900 p-6">
      <div className="mb-6 flex flex-col items-center gap-3">
        <Image src={BRAND.logo} alt="PureTask" width={48} height={48} className="drop-shadow-lg" />
        <span className="text-xl font-bold tracking-tight text-white">PureTask</span>
      </div>

      <div className="w-full max-w-md">
        <SignUpForm role={role} />
      </div>
    </main>
  );
};

export default SignUpPage;
