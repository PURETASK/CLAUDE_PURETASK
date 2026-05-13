import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getMyCleanerProfileId } from '@/features/booking/queries';
import { InsurancePending } from '@/features/cleaner/components/InsurancePending';
import { InsuranceUpload } from '@/features/cleaner/components/InsuranceUpload';
import { InsuranceVerified } from '@/features/cleaner/components/InsuranceVerified';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const InsurancePage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const cleanerProfileId = await getMyCleanerProfileId();
  if (!cleanerProfileId) redirect('/cleaner/apply');

  const { data: policy } = await supabase
    .from('insurance_policies')
    .select('id, state, document_uploaded_at, verified_at, expires_at')
    .eq('cleaner_id', cleanerProfileId)
    .not('state', 'eq', 'replaced')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <Link href="/cleaner/settings" className="text-sm text-brand-600 hover:underline">
            ← Settings
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-neutral-900">Insurance Verification</h1>
        </div>

        {!policy || policy.state === 'rejected' || policy.state === 'expired' ? (
          <InsuranceUpload />
        ) : policy.state === 'uploaded' || policy.state === 'under_review' ? (
          <InsurancePending uploadedAt={policy.document_uploaded_at} />
        ) : policy.state === 'verified' && policy.verified_at && policy.expires_at ? (
          <InsuranceVerified verifiedAt={policy.verified_at} expiresAt={policy.expires_at} />
        ) : (
          <InsuranceUpload />
        )}
      </div>
    </div>
  );
};

export default InsurancePage;
