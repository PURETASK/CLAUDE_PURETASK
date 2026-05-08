import { SignUpForm } from '@/features/auth/components/SignUpForm';

type PageProps = {
  searchParams: Promise<{ role?: string }>;
};

const SignUpPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const role = params.role === 'cleaner' ? 'cleaner' : 'customer';

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <SignUpForm role={role} />
    </main>
  );
};

export default SignUpPage;
