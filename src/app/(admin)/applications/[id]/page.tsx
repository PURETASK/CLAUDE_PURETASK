import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AdminDecisionForm } from '@/features/cleaner/components/AdminDecisionForm';
import { getApplicationById } from '@/features/cleaner/queries';

type PageProps = { params: Promise<{ id: string }> };

const AdminApplicationDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;
  const application = await getApplicationById(id);
  if (!application) notFound();

  const d = (application.application_data ?? {}) as Record<string, unknown>;
  const applicant = Array.isArray(application.users)
    ? application.users[0]
    : (application.users as { full_name: string; email: string } | null);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/applications" className="text-sm text-neutral-500 hover:text-neutral-900">
          Applications
        </Link>
        <span className="text-neutral-300">/</span>
        <h1 className="text-xl font-semibold">#{application.application_number}</h1>
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 text-sm shadow-sm">
        <p className="mb-3 font-medium">Applicant</p>
        <Row label="Name" value={applicant?.full_name ?? '—'} />
        <Row label="Email" value={applicant?.email ?? '—'} />
        <Row label="State" value={application.state} />
        <Row label="Submitted" value={application.submitted_at ?? '—'} />
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 text-sm shadow-sm">
        <p className="mb-3 font-medium">Application snapshot</p>
        <Row label="Home ZIP" value={(d.home_zip as string) ?? application.home_zip ?? '—'} />
        <Row
          label="Travel radius"
          value={
            d.travel_radius_miles || application.travel_radius_miles
              ? `${d.travel_radius_miles ?? application.travel_radius_miles} miles`
              : '—'
          }
        />
        <Row
          label="Experience"
          value={
            d.years_experience !== undefined || application.years_experience !== undefined
              ? `${d.years_experience ?? application.years_experience} years`
              : '—'
          }
        />
        <Row label="Identity" value={(d.identity_status as string) ?? 'pending'} />
        <Row label="Background" value={(d.background_check_status as string) ?? 'requested'} />
        <Row label="Connect" value={d.stripe_connect_completed ? 'complete' : 'incomplete'} />
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <AdminDecisionForm applicationId={application.id} currentState={application.state} />
      </section>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-4 py-1.5">
    <span className="w-36 shrink-0 text-neutral-500">{label}</span>
    <span>{value}</span>
  </div>
);

export default AdminApplicationDetailPage;
