import { redirect } from 'next/navigation';

import { joinWaitlistAction } from '@/features/discovery/actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const WaitlistPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Join the ZIP waitlist</h1>
      <p className="text-sm text-slate-600">
        If your area is not active yet, we will notify you as soon as we launch there.
      </p>

      <form
        action={joinWaitlistAction}
        className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"
      >
        <div className="space-y-1">
          <label htmlFor="zip_code" className="text-sm font-medium text-slate-900">
            ZIP code
          </label>
          <input
            id="zip_code"
            name="zip_code"
            maxLength={10}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="94110"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="notes" className="text-sm font-medium text-slate-900">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Any service preferences"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Join waitlist
        </button>
      </form>
    </div>
  );
};

export default WaitlistPage;
