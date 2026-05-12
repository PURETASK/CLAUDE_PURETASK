import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ProfileForm } from '@/features/customer/components/ProfileForm';
import { getCurrentUser } from '@/features/customer/queries';

const SettingsProfilePage = async () => {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/sign-in');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/settings" className="text-sm text-neutral-500 hover:text-neutral-900">
          Settings
        </Link>
        <span className="text-neutral-300">/</span>
        <h1 className="text-xl font-semibold">Profile</h1>
      </div>

      <div className="max-w-md rounded border bg-white p-4">
        <ProfileForm
          defaultValues={{
            full_name: user.full_name,
            phone: user.phone ?? '',
          }}
        />
      </div>
    </div>
  );
};

export default SettingsProfilePage;
