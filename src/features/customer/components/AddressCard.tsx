'use client';

import Link from 'next/link';
import { useTransition } from 'react';

import { deleteAddressAction, setDefaultAddressAction } from '@/features/customer/actions';
import { Badge } from '@/components/ui/badge';

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
  address: Address;
  isDefault: boolean;
  onChanged: () => void;
};

export const AddressCard = ({ address, isDefault, onChanged }: Props) => {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-start justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-tier1">
      <div className="flex flex-col gap-0.5 text-sm">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-neutral-900">{address.label || 'Untitled'}</p>
          {isDefault && <Badge variant="brand">Default</Badge>}
        </div>
        <p className="text-neutral-700">
          {address.street_1}
          {address.street_2 ? `, ${address.street_2}` : ''}
        </p>
        <p className="text-neutral-500">
          {address.city}, {address.state} {address.zip_code}
        </p>
        {address.access_instructions && (
          <p className="mt-1 text-xs text-neutral-400">{address.access_instructions}</p>
        )}
      </div>

      <div className="ml-4 flex shrink-0 gap-2">
        <Link
          href={`/settings/addresses/${address.id}`}
          className="rounded-lg border border-neutral-200 px-3 py-1 text-sm font-medium text-neutral-700 transition-all duration-control hover:border-brand-600 hover:text-brand-600"
        >
          Edit
        </Link>
        {!isDefault && (
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                await setDefaultAddressAction(address.id);
                onChanged();
              })
            }
            className="rounded-lg border border-neutral-200 px-3 py-1 text-sm font-medium text-neutral-600 transition-all duration-control hover:border-brand-600 hover:text-brand-600 disabled:opacity-50"
            disabled={isPending}
          >
            Set default
          </button>
        )}
        <button
          type="button"
          onClick={() =>
            startTransition(async () => {
              await deleteAddressAction(address.id);
              onChanged();
            })
          }
          disabled={isPending}
          className="rounded-lg border border-error/30 px-3 py-1 text-sm font-medium text-error transition-all duration-control hover:bg-error-light disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
};
