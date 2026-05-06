'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useState } from 'react';

import { deleteAddressAction } from '@/features/customer/actions';
import { AddressForm } from '@/features/customer/components/AddressForm';

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
};

export const AddressList = ({ addresses }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteAddressAction(id);
      router.refresh();
    });
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingId(null);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      {addresses.length === 0 && !showAddForm ? (
        <p className="text-sm text-zinc-500">No addresses yet.</p>
      ) : null}

      {addresses.map((address) =>
        editingId === address.id ? (
          <AddressForm
            key={address.id}
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
            onSuccess={handleFormSuccess}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div key={address.id} className="flex items-start justify-between rounded border p-4">
            <div className="flex flex-col gap-0.5 text-sm">
              {address.label ? <p className="font-medium">{address.label}</p> : null}
              <p>
                {address.street_1}
                {address.street_2 ? `, ${address.street_2}` : ''}
              </p>
              <p className="text-zinc-500">
                {address.city}, {address.state} {address.zip_code}
              </p>
              {address.access_instructions ? (
                <p className="mt-1 text-zinc-400 text-xs">{address.access_instructions}</p>
              ) : null}
            </div>
            <div className="flex gap-2 shrink-0 ml-4">
              <button
                onClick={() => setEditingId(address.id)}
                className="rounded border px-3 py-1 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(address.id)}
                disabled={isPending}
                className="rounded border border-red-200 px-3 py-1 text-sm text-red-600 disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>
        ),
      )}

      {showAddForm ? (
        <AddressForm onSuccess={handleFormSuccess} onCancel={() => setShowAddForm(false)} />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="self-start rounded border px-4 py-2 text-sm"
        >
          + Add address
        </button>
      )}
    </div>
  );
};
