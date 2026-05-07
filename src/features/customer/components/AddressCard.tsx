'use client';

import Link from 'next/link';
import { useTransition } from 'react';

import { deleteAddressAction, setDefaultAddressAction } from '@/features/customer/actions';

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
    <div className="flex items-start justify-between rounded border p-4">
      <div className="flex flex-col gap-0.5 text-sm">
        <div className="flex items-center gap-2">
          <p className="font-medium">{address.label || 'Untitled'}</p>
          {isDefault ? (
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">Default</span>
          ) : null}
        </div>
        <p>
          {address.street_1}
          {address.street_2 ? `, ${address.street_2}` : ''}
        </p>
        <p className="text-zinc-500">
          {address.city}, {address.state} {address.zip_code}
        </p>
        {address.access_instructions ? (
          <p className="mt-1 text-xs text-zinc-400">{address.access_instructions}</p>
        ) : null}
      </div>

      <div className="ml-4 flex shrink-0 gap-2">
        <Link
          href={`/settings/addresses/${address.id}`}
          className="rounded border px-3 py-1 text-sm"
        >
          Edit
        </Link>
        {!isDefault ? (
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                await setDefaultAddressAction(address.id);
                onChanged();
              })
            }
            className="rounded border px-3 py-1 text-sm"
            disabled={isPending}
          >
            Set default
          </button>
        ) : null}
        <button
          type="button"
          onClick={() =>
            startTransition(async () => {
              await deleteAddressAction(address.id);
              onChanged();
            })
          }
          disabled={isPending}
          className="rounded border border-red-200 px-3 py-1 text-sm text-red-600 disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </div>
  );
};
