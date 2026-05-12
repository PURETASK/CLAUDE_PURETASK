import { redirect } from 'next/navigation';

import { createDraftAction } from '@/features/cleaner/actions';
import { getMyApplication } from '@/features/cleaner/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ApplyEntryPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const application = await getMyApplication();

  if (application) {
    if (application.state === 'draft') redirect('/app/apply/step/1');
    redirect('/app/apply/status');
  }

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Apply to be a PureTask cleaner</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Join our vetted network of professional cleaners in Northern California. The application
          takes about 5 minutes and your answers are saved as you go.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1 text-sm">
        <p className="font-semibold text-neutral-900">What to expect</p>
        <ul className="flex flex-col gap-1.5 text-neutral-500">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
            11-step onboarding form with draft save + resume
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
            Identity, background check, tax, payout, and training checkpoints
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
            Application review + submit for admin decision
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
            Admin review within 2–3 business days
          </li>
        </ul>
      </div>

      <form action={createDraftAction}>
        <button
          type="submit"
          className="rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110 active:scale-[0.98]"
        >
          Start application
        </button>
      </form>
    </div>
  );
};

export default ApplyEntryPage;
