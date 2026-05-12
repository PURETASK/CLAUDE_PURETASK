import { redirect } from 'next/navigation';

import { confirmRoleAction } from '@/features/auth/actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const RoleSelectPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/sign-in');

  if (user.user_metadata?.role_confirmed === true) {
    redirect(user.user_metadata?.role === 'cleaner' ? '/app/cleaner' : '/app');
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-neutral-900">How will you use PureTask?</h1>
        <p className="mt-3 text-neutral-500">Choose your account type to get started.</p>
      </div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        <form action={confirmRoleAction}>
          <input type="hidden" name="role" value="customer" />
          <button
            type="submit"
            className="w-full rounded-2xl border-2 border-neutral-200 bg-white p-8 text-left transition-all duration-200 hover:border-brand-400 hover:shadow-tier2 focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <div className="mb-4 text-4xl">🏠</div>
            <h2 className="text-xl font-bold text-neutral-900">I&apos;m a Client</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Book and manage professional home cleaning services.
            </p>
            <span className="mt-6 inline-block rounded-lg bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
              Continue as Client →
            </span>
          </button>
        </form>

        <form action={confirmRoleAction}>
          <input type="hidden" name="role" value="cleaner" />
          <button
            type="submit"
            className="w-full rounded-2xl border-2 border-neutral-200 bg-white p-8 text-left transition-all duration-200 hover:border-brand-400 hover:shadow-tier2 focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <div className="mb-4 text-4xl">✨</div>
            <h2 className="text-xl font-bold text-neutral-900">I&apos;m a Cleaner</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Apply to join our network and earn providing cleaning services.
            </p>
            <span className="mt-6 inline-block rounded-lg bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
              Continue as Cleaner →
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoleSelectPage;
