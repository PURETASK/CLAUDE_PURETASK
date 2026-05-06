import Link from 'next/link';

import { SignInForm } from '@/features/auth/components/SignInForm';

const SignInPage = () => {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="flex w-full max-w-md flex-col gap-4">
        <SignInForm />
        <p className="text-center text-sm text-zinc-600">
          Need an account?{' '}
          <Link className="underline" href="/auth/sign-up">
            Create one
          </Link>
        </p>
        <p className="text-center text-sm text-zinc-600">
          <Link className="underline" href="/auth/forgot-password">
            Forgot password?
          </Link>
        </p>
      </div>
    </main>
  );
};

export default SignInPage;
