import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getMyCleanerProfileId } from '@/features/booking/queries';
import { Button } from '@/components/ui';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

const JobCompletePage = async ({ params }: Props) => {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const cleanerProfileId = await getMyCleanerProfileId();
  if (!cleanerProfileId) redirect('/cleaner/apply');

  const { data: booking } = await supabase
    .from('bookings')
    .select(
      `id, state, clock_in_at, clock_out_at,
       customer_profiles!bookings_customer_id_fkey(
         users!customer_profiles_user_id_fkey(full_name)
       )`,
    )
    .eq('id', id)
    .eq('cleaner_id', cleanerProfileId)
    .single();

  if (!booking) redirect('/app/cleaner');

  const cpRaw = Array.isArray(booking.customer_profiles)
    ? booking.customer_profiles[0]
    : booking.customer_profiles;
  const cpUser = Array.isArray((cpRaw as { users?: unknown })?.users)
    ? ((cpRaw as { users: unknown[] }).users)[0]
    : (cpRaw as { users?: unknown })?.users;
  const customerName = (cpUser as { full_name?: string } | null)?.full_name ?? 'the customer';

  const hoursWorked =
    booking.clock_in_at && booking.clock_out_at
      ? (() => {
          const mins = Math.round(
            (new Date(booking.clock_out_at).getTime() -
              new Date(booking.clock_in_at).getTime()) /
              60000,
          );
          return `${Math.floor(mins / 60)}h ${mins % 60}m`;
        })()
      : '—';

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="mx-auto w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-light">
          <svg className="h-10 w-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Job submitted!</h1>
          <p className="mt-2 text-neutral-600">
            Waiting for {customerName} to approve your work.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-tier1">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500">Time logged</span>
              <span className="text-sm font-semibold text-neutral-900">{hoursWorked}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500">Status</span>
              <span className="text-sm font-semibold text-warning">Awaiting approval</span>
            </div>
            <p className="border-t border-neutral-100 pt-3 text-xs text-neutral-400">
              If {customerName} doesn&apos;t respond within 24 hours, the job auto-approves and you&apos;ll be paid on Friday.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/app/cleaner">
            <Button className="w-full" size="lg">Back to dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JobCompletePage;
