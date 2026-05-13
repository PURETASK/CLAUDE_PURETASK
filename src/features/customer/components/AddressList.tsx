'use client';

import { useRouter } from 'next/navigation';
import { AddressCard } from '@/features/customer/components/AddressCard';

type Address = {
  id: string;
  label: string | null;
  street_1: string;
  street_2: string | null;
  city: string;
  state: string;
  zip_code: string;
  access_instructions: string | null;
};

type Props = {
  addresses: Address[];
  defaultAddressId: string | null;
};

export const AddressList = ({ addresses, defaultAddressId }: Props) => {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      {addresses.length === 0 ? (
        <p className="text-sm text-neutral-500">No addresses yet.</p>
      ) : null}

      {addresses.map((address) => (
        <AddressCard
          key={address.id}
          address={address}
          isDefault={defaultAddressId === address.id}
          onChanged={() => router.refresh()}
        />
      ))}
    </div>
  );
};
