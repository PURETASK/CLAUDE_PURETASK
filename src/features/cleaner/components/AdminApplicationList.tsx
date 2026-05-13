import Link from 'next/link';

import { Badge, type BadgeVariant } from '@/components/ui/badge';

const STATE_VARIANTS: Record<string, BadgeVariant> = {
  submitted: 'warning',
  in_review: 'info',
  needs_info: 'warning',
  approved: 'success',
  rejected: 'error',
};

const STATE_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  in_review: 'In Review',
  needs_info: 'Needs Info',
  approved: 'Approved',
  rejected: 'Rejected',
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
    return <p className="text-sm text-neutral-500">No applications to review.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {applications.map((app) => (
        <Link
          key={app.id}
          href={`/admin/applications/${app.id}`}
          className="flex items-center justify-between rounded-xl border border-neutral-200 p-4 shadow-tier1 transition-all duration-control hover:bg-neutral-50 hover:shadow-tier2"
        >
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-neutral-900">
              {app.users?.full_name ?? 'Unknown'}
            </p>
            <p className="text-xs text-neutral-500">
              {app.users?.email} · #{app.application_number}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={STATE_VARIANTS[app.state] ?? 'neutral'}>
              {STATE_LABELS[app.state] ?? app.state.replace('_', ' ')}
            </Badge>
            {app.submitted_at ? (
              <p className="text-xs text-neutral-400">
                {new Date(app.submitted_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
              </p>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
};
