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
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <Link href="/app/cleaner" className="text-sm text-brand-600 hover:underline">
            ← Dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-neutral-900">Your Reliability Score</h1>
        </div>
        <ScoreExplainer currentScore={profile.current_score} currentTier={profile.current_tier} />
      </div>
    </div>
  );
};

export default ScoreExplainerPage;
