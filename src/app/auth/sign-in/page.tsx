import Image from 'next/image';
import Link from 'next/link';

import { SignInForm } from '@/features/auth/components/SignInForm';
import { BRAND } from '@/lib/assets';

const SignInPage = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-950 to-brand-900 p-6">
      <div className="mb-6 flex flex-col items-center gap-3">
        <Image src={BRAND.logo} alt="PureTask" width={48} height={48} className="drop-shadow-lg" />
        <span className="text-xl font-bold tracking-tight text-white">PureTask</span>
      </div>

      <div className="flex w-full max-w-md flex-col gap-4">
        <SignInForm />
        <p className="text-center text-sm text-white/70">
          Need an account?{' '}
          <Link className="font-medium text-accent-300 underline underline-offset-2 transition-colors hover:text-accent-200" href="/auth/sign-up">
            Create one free
          </Link>
        </p>
        <p className="text-center text-sm">
          <Link className="text-white/50 underline underline-offset-2 transition-colors hover:text-white/80" href="/auth/forgot-password">
            Forgot password?
          </Link>
        </p>
      </div>
    </main>
  );
};

export default SignInPage;
