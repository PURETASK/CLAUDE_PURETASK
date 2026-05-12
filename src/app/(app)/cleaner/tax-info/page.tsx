import Link from 'next/link';
import { redirect } from 'next/navigation';

import { TaxInfoForm } from '@/features/cleaner/components/TaxInfoForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const TaxInfoPage = async () => {
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

  const { data: bookingsData } = await supabase
    .from('bookings')
    .select('cleaner_payout_cents')
    .eq('state', 'paid')
    .gte('start_at', `${new Date().getFullYear()}-01-01`);

  const earningsYtdCents = (bookingsData ?? []).reduce(
    (sum, b) => sum + (b.cleaner_payout_cents ?? 0),
    0,
  );

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-8">
      <div>
        <Link href="/cleaner/apply" className="text-sm text-brand-600 hover:underline">
          ← Back to application
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-neutral-900">Tax Information</h1>
        <p className="mt-1 text-neutral-500">
          Required for year-end 1099-NEC reporting. All cleaners earning over $600 receive a 1099.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-lg">🔒</span>
          <p className="text-sm font-medium text-neutral-900">Your information is protected</p>
        </div>
        <p className="text-xs text-neutral-500">
          Your SSN or EIN is encrypted with AES-256 before storage and is never visible to PureTask
          staff. It is used exclusively for IRS reporting.
        </p>
      </div>

      <TaxInfoForm
        hasTaxIdOnFile={!!profile.encrypted_tax_id}
        taxIdType={profile.tax_id_type}
        earningsYtdCents={earningsYtdCents}
      />
    </div>
  );
};

export default TaxInfoPage;
