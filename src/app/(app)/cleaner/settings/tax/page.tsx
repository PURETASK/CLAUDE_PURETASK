import Link from 'next/link';
import { redirect } from 'next/navigation';

import { TaxInfoForm } from '@/features/cleaner/components/TaxInfoForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const TaxPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: profile } = await supabase
    .from('cleaner_profiles')
    .select('encrypted_tax_id, tax_id_type')
    .eq('user_id', user.id)
    .single();

  if (!profile) redirect('/cleaner/apply');

  const { data: earningsRow } = await supabase
    .from('bookings')
    .select('cleaner_payout_cents')
    .eq('state', 'paid')
    .gte('start_at', `${new Date().getFullYear()}-01-01`)
    .then(({ data }) => ({
      data: {
        total: (data ?? []).reduce((sum, b) => sum + (b.cleaner_payout_cents ?? 0), 0),
      },
    }));

  const earningsYtdCents = earningsRow?.total ?? 0;

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <Link href="/cleaner/settings" className="text-sm text-brand-600 hover:underline">
            ← Settings
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-neutral-900">Tax Information</h1>
          <p className="mt-1 text-neutral-600">Required for year-end 1099 reporting.</p>
        </div>

        <TaxInfoForm
          hasTaxIdOnFile={!!profile.encrypted_tax_id}
          taxIdType={profile.tax_id_type}
          earningsYtdCents={earningsYtdCents}
        />
      </div>
    </div>
  );
};

export default TaxPage;
