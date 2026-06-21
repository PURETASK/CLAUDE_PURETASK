import { ArrowLeft } from 'lucide-react';
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
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div>
        <div className="flex items-center gap-3">
          <Link
            href="/app/cleaner/settings"
            className="flex-shrink-0 text-neutral-500 transition-colors hover:text-neutral-900"
            aria-label="Back to settings"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <h1 className="text-lg font-semibold text-neutral-900">Tax information</h1>
        </div>
        <p className="mt-2 text-sm text-neutral-500">Required for year-end 1099 reporting.</p>
      </div>

      <TaxInfoForm
        hasTaxIdOnFile={!!profile.encrypted_tax_id}
        taxIdType={profile.tax_id_type}
        earningsYtdCents={earningsYtdCents}
      />
    </div>
  );
};

export default TaxPage;
