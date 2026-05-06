import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AddressList } from '@/features/customer/components/AddressList';
import { getUserAddresses } from '@/features/customer/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const AddressesPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/sign-in');

  const addresses = await getUserAddresses();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/app/settings" className="text-sm text-zinc-500 hover:text-zinc-900">
          Settings
        </Link>
        <span className="text-zinc-300">/</span>
        <h1 className="text-xl font-semibold">Addresses</h1>
      </div>

      <div className="max-w-xl">
        <AddressList addresses={addresses} />
      </div>
    </div>
  );
};

export default AddressesPage;
