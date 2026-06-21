import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { TierExplainer } from '@/features/cleaner/components/TierExplainer';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const TiersPage = async () => {
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
          href="/cleaner/score/explainer"
          className="flex-shrink-0 text-neutral-500 transition-colors hover:text-neutral-900"
          aria-label="Back to score"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </Link>
        <h1 className="text-lg font-semibold text-neutral-900">How tiers work</h1>
      </div>
      <TierExplainer currentTier={profile.current_tier} currentScore={profile.current_score} />
    </div>
  );
};

export default TiersPage;
