import Link from 'next/link';

const VerifyEmailPage = () => {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <section className="w-full max-w-lg rounded border p-6">
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="mt-3 text-sm text-zinc-600">
          We sent a verification email. Open the link in that email to activate your account.
        </p>
        <p className="mt-2 text-sm text-zinc-600">After verification, return to sign in.</p>
        <Link className="mt-4 inline-block underline" href="/auth/sign-in">
          Go to sign in
        </Link>
      </section>
    </main>
  );
};

export default VerifyEmailPage;
