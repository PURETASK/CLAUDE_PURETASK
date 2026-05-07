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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Profile</h3>
          <p className="mt-2 text-base font-medium text-slate-900">{fullName}</p>
          <p className="text-sm text-slate-700">{email}</p>
          <p className="mt-1 text-xs text-slate-600">Joined {joinedDate}</p>
        </div>
        <Link
          href="/settings/profile"
          className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Edit
        </Link>
      </div>
    </div>
  );
};
