import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ScoreExplainer } from '@/features/cleaner/components/ScoreExplainer';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ScoreExplainerPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: profile } = await supabase
    .from('cleaner_profiles')
    .select('current_tier, current_score')
    .eq('user_id', user.id)
    .single();

  if (!profile) redirect('/cleaner/apply');

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href="/app/cleaner"
          className="flex-shrink-0 text-neutral-500 transition-colors hover:text-neutral-900"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </Link>
        <h1 className="text-lg font-semibold text-neutral-900">Your reliability score</h1>
      </div>
      <ScoreExplainer currentScore={profile.current_score} currentTier={profile.current_tier} />
    </div>
  );
};

export default ScoreExplainerPage;
