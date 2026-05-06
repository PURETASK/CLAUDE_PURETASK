import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ProfileForm } from '@/features/customer/components/ProfileForm';
import { getCurrentUser } from '@/features/customer/queries';

const SettingsPage = async () => {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/sign-in');

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-medium">Profile</h2>
        <div className="max-w-md">
          <ProfileForm
            defaultValues={{
              full_name: user.full_name,
              phone: user.phone ?? '',
            }}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-medium">Addresses</h2>
        <p className="text-sm text-zinc-500">Manage your service addresses.</p>
        <Link
          href="/app/settings/addresses"
          className="self-start rounded border px-4 py-2 text-sm hover:bg-zinc-50"
        >
          Manage addresses
        </Link>
      </section>
    </div>
  );
};

export default SettingsPage;
