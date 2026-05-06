import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { AdminDecisionForm } from '@/features/cleaner/components/AdminDecisionForm';
import { getApplicationById } from '@/features/cleaner/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type PageProps = { params: Promise<{ id: string }> };

const SERVICE_LABELS: Record<string, string> = {
  standard: 'Standard clean',
  deep: 'Deep clean',
  move_out: 'Move-out clean',
  airbnb: 'Airbnb turnover',
};

const AdminApplicationDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: me } = await supabase
    .from('users')
    .select('primary_role')
    .eq('id', user.id)
    .single();
  if (me?.primary_role !== 'admin') redirect('/app');

  const application = await getApplicationById(id);
  if (!application) notFound();

  const d = (application.application_data ?? {}) as Record<string, unknown>;
  const applicant = Array.isArray(application.users)
    ? application.users[0]
    : (application.users as { full_name: string; email: string } | null);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/app/admin/applications" className="text-sm text-zinc-500 hover:text-zinc-900">
          Applications
        </Link>
        <span className="text-zinc-300">/</span>
        <h1 className="text-xl font-semibold">#{application.application_number}</h1>
      </div>

      <section className="rounded border p-5 text-sm">
        <p className="mb-3 font-medium">Applicant</p>
        <Row label="Name" value={applicant?.full_name ?? '—'} />
        <Row label="Email" value={applicant?.email ?? '—'} />
        <Row
          label="Submitted"
          value={
            application.submitted_at
              ? new Date(application.submitted_at).toLocaleString('en-US')
              : '—'
          }
        />
        <Row label="State" value={application.state} />
      </section>

      <section className="rounded border p-5 text-sm">
        <p className="mb-3 font-medium">Application details</p>
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
        <Row
          label="Services"
          value={
            Array.isArray(d.service_types) && (d.service_types as string[]).length
              ? (d.service_types as string[]).map((s) => SERVICE_LABELS[s] ?? s).join(', ')
              : '—'
          }
        />
        <Row label="Guidelines ack" value={d.etiquette_acknowledged ? 'Yes' : 'No'} />
      </section>

      {(application.why_puretask_text ?? (d.why_puretask_text as string)) ? (
        <section className="rounded border p-5 text-sm">
          <p className="mb-2 font-medium">About the applicant</p>
          <p className="whitespace-pre-wrap text-zinc-700">
            {(d.why_puretask_text as string) ?? application.why_puretask_text}
          </p>
        </section>
      ) : null}

      {application.admin_notes ? (
        <section className="rounded border p-5 text-sm">
          <p className="mb-1 font-medium">Previous admin notes</p>
          <p className="text-zinc-600">{application.admin_notes}</p>
        </section>
      ) : null}

      <section className="rounded border p-5">
        <AdminDecisionForm applicationId={application.id} currentState={application.state} />
      </section>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-4 py-1.5">
    <span className="w-32 shrink-0 text-zinc-500">{label}</span>
    <span>{value}</span>
  </div>
);

export default AdminApplicationDetailPage;
