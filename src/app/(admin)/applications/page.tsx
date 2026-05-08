import { AdminApplicationList } from '@/features/cleaner/components/AdminApplicationList';
import { listApplications } from '@/features/cleaner/queries';

const AdminApplicationsQueuePage = async () => {
  const applications = await listApplications(['submitted', 'in_review', 'needs_info']);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Cleaner Applications</h1>
      <div className="max-w-3xl">
        <AdminApplicationList
          applications={applications.map((a) => ({
            ...a,
            users: Array.isArray(a.users)
              ? (a.users[0] ?? null)
              : (a.users as { full_name: string; email: string } | null),
          }))}
        />
      </div>
    </div>
  );
};

export default AdminApplicationsQueuePage;
