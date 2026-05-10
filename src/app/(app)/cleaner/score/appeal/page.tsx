import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AppealForm } from '@/features/cleaner/components/AppealForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const AppealPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: profile } = await supabase
    .from('cleaner_profiles')
    .select('id, current_score, current_tier')
    .eq('user_id', user.id)
    .single();
  if (!profile) redirect('/cleaner/apply');

  const { data: pendingAppeal } = await supabase
    .from('cleaner_appeals')
    .select('id, status, submitted_at')
    .eq('cleaner_id', profile.id)
    .in('status', ['pending', 'under_review'])
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <Link href="/cleaner/score/explainer" className="text-sm text-brand-600 hover:underline">
            ← Score
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-neutral-900">Submit an Appeal</h1>
          <p className="mt-1 text-neutral-600">
            Dispute a tier change or a reliability event you believe was recorded incorrectly.
          </p>
        </div>

        {pendingAppeal ? (
          <div className="rounded-2xl border border-warning/30 bg-warning/5 p-6">
            <p className="font-semibold text-warning-dark">Appeal already pending</p>
            <p className="mt-1 text-sm text-neutral-600">
              You submitted an appeal on{' '}
              {new Date(pendingAppeal.submitted_at).toLocaleDateString([], {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              . Status: <span className="font-medium">{pendingAppeal.status}</span>
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              Our team will respond within 14 days. You cannot submit a new appeal while one is
              pending.
            </p>
          </div>
        ) : (
          <AppealForm />
        )}
      </div>
    </div>
  );
};

export default AppealPage;
