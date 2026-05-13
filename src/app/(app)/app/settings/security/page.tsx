import { redirect } from 'next/navigation';

import { SettingsLayout } from '@/features/customer/components/SettingsLayout';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { MFASetup } from './MFASetup';

export default async function SecuritySettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: mfaData } = await supabase.auth.mfa.listFactors();
  const factors = (mfaData?.all ?? []).map((f) => ({
    id: f.id,
    factor_type: f.factor_type,
    friendly_name: f.friendly_name,
    status: f.status as 'verified' | 'unverified',
  }));

  return (
    <SettingsLayout title="Security" subtitle="Manage two-factor authentication for your account.">
      <MFASetup initialFactors={factors} />
    </SettingsLayout>
  );
}
