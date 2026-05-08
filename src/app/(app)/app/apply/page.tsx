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
        <h1 className="text-xl font-semibold">Apply to be a PureTask cleaner</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Join our vetted network of professional cleaners in Northern California. The application
          takes about 5 minutes and your answers are saved as you go.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded border p-5 text-sm">
        <p className="font-medium">What to expect</p>
        <ul className="flex flex-col gap-1.5 text-zinc-500">
          <li>→ 11-step onboarding form with draft save + resume</li>
          <li>→ Identity, background check, tax, payout, and training checkpoints</li>
          <li>→ Application review + submit for admin decision</li>
          <li>→ Admin review within 2–3 business days</li>
        </ul>
      </div>

      <form action={createDraftAction}>
        <button
          type="submit"
          className="rounded bg-black px-6 py-2.5 text-sm text-white hover:bg-zinc-800"
        >
          Start application
        </button>
      </form>
    </div>
  );
};

export default ApplyEntryPage;
