import Link from 'next/link';

const STATE_BADGES: Record<string, string> = {
  submitted: 'bg-amber-100 text-amber-800',
  in_review: 'bg-blue-100 text-blue-800',
  needs_info: 'bg-orange-100 text-orange-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

type Application = {
  id: string;
  application_number: string;
  state: string;
  submitted_at: string | null;
  users: { full_name: string; email: string } | null;
};

type Props = { applications: Application[] };

export const AdminApplicationList = ({ applications }: Props) => {
  if (applications.length === 0) {
    return <p className="text-sm text-zinc-500">No applications to review.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {applications.map((app) => (
        <Link
          key={app.id}
          href={`/applications/${app.id}`}
          className="flex items-center justify-between rounded border p-4 hover:bg-zinc-50"
        >
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium">{app.users?.full_name ?? 'Unknown'}</p>
            <p className="text-xs text-zinc-500">
              {app.users?.email} · #{app.application_number}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATE_BADGES[app.state] ?? 'bg-zinc-100 text-zinc-600'}`}
            >
              {app.state.replace('_', ' ')}
            </span>
            {app.submitted_at ? (
              <p className="text-xs text-zinc-400">
                {new Date(app.submitted_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
              </p>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
};
