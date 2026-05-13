import Link from 'next/link';

type Props = {
  fullName: string;
  email: string;
  createdAt: string;
};

export const ProfileHeader = ({ fullName, email, createdAt }: Props) => {
  const joinedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(createdAt));

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-500">Profile</h3>
          <p className="mt-2 text-base font-semibold text-neutral-900">{fullName}</p>
          <p className="text-sm text-neutral-700">{email}</p>
          <p className="mt-1 text-xs text-neutral-500">Joined {joinedDate}</p>
        </div>
        <Link
          href="/app/settings/profile"
          className="rounded-lg border border-neutral-200 bg-white px-3 py-1 text-sm font-medium text-neutral-700 transition-all duration-control hover:border-brand-600 hover:text-brand-600"
        >
          Edit
        </Link>
      </div>
    </div>
  );
};
