import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Card } from '@/components/ui/card';
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
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div>
        <div className="flex items-center gap-3">
          <Link
            href="/cleaner/score/explainer"
            className="flex-shrink-0 text-neutral-500 transition-colors hover:text-neutral-900"
            aria-label="Back to score"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <h1 className="text-lg font-semibold text-neutral-900">Submit an appeal</h1>
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          Dispute a tier change or a reliability event you believe was recorded incorrectly.
        </p>
      </div>

      {pendingAppeal ? (
        <Card elevation={1} className="border border-warning/30 bg-warning-light p-5">
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
            Our team will respond within 14 days. You can&apos;t submit a new appeal while one is
            pending.
          </p>
        </Card>
      ) : (
        <AppealForm />
      )}
    </div>
  );
};

export default AppealPage;
