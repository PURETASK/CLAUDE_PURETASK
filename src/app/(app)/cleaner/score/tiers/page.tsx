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
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <Link href="/cleaner/score/explainer" className="text-sm text-brand-600 hover:underline">
            ← Score
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-neutral-900">How Tiers Work</h1>
        </div>
        <TierExplainer
          currentTier={profile.current_tier}
          currentScore={profile.current_score}
        />
      </div>
    </div>
  );
};

export default TiersPage;
