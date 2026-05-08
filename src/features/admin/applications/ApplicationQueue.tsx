import { AdminApplicationList } from '@/features/cleaner/components/AdminApplicationList';

type Application = {
  id: string;
  application_number: string;
  state: string;
  submitted_at: string | null;
  users: { full_name: string; email: string } | null;
};

export const ApplicationQueue = ({ applications }: { applications: Application[] }) => {
  return <AdminApplicationList applications={applications} />;
};
