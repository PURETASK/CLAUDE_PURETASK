import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { AddressForm } from '@/features/customer/components/AddressForm';
import { getAddress, getCurrentUser } from '@/features/customer/queries';

type Props = {
  params: Promise<{ id: string }>;
};

const EditAddressPage = async ({ params }: Props) => {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/sign-in');

  const { id } = await params;
  const address = await getAddress(id);
  if (!address) notFound();

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
        <h1 className="text-xl font-semibold">Edit Address</h1>
      </div>

      <div className="max-w-xl bg-white">
        <AddressForm
          existing={{
            id: address.id,
            label: address.label ?? undefined,
            street_1: address.street_1,
            street_2: address.street_2 ?? undefined,
            city: address.city,
            state: address.state,
            zip_code: address.zip_code,
            access_instructions: address.access_instructions ?? undefined,
          }}
          onSuccessPath="/settings/addresses"
          onCancelPath="/settings/addresses"
        />
      </div>
    </div>
  );
};

export default EditAddressPage;
