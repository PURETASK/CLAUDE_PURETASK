import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AddressForm } from '@/features/customer/components/AddressForm';
import { getCurrentUser } from '@/features/customer/queries';

const NewAddressPage = async () => {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/sign-in');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link
          href="/settings/addresses"
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          Addresses
        </Link>
        <span className="text-neutral-300">/</span>
        <h1 className="text-xl font-semibold">Add Address</h1>
      </div>

      <div className="max-w-xl bg-white">
        <AddressForm onSuccessPath="/settings/addresses" onCancelPath="/settings/addresses" />
      </div>
    </div>
  );
};

export default NewAddressPage;
