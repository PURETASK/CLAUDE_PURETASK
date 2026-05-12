import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AddressList } from '@/features/customer/components/AddressList';
import { getAddresses, getCurrentUser, getCustomerProfile } from '@/features/customer/queries';

const SettingsAddressesPage = async () => {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/sign-in');

  const [addresses, profile] = await Promise.all([getAddresses(), getCustomerProfile()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/settings" className="text-sm text-neutral-500 hover:text-neutral-900">
          Settings
        </Link>
        <span className="text-neutral-300">/</span>
        <h1 className="text-xl font-semibold">Addresses</h1>
      </div>

      <Link
        href="/settings/addresses/new"
        className="self-start rounded border bg-white px-4 py-2 text-sm hover:bg-neutral-50"
      >
        + Add address
      </Link>

      <div className="max-w-2xl">
        <AddressList addresses={addresses} defaultAddressId={profile?.default_address_id ?? null} />
      </div>
    </div>
  );
};

export default SettingsAddressesPage;
