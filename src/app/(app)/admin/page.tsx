import { redirect } from 'next/navigation';

import { ActivityFeed } from '@/features/admin/components/ActivityFeed';
import { GmvSparkline } from '@/features/admin/components/GmvSparkline';
import { KpiGrid } from '@/features/admin/components/KpiGrid';
import { NeedsAttention } from '@/features/admin/components/NeedsAttention';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const AdminDashboardPage = async () => {
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

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [bookingsTodayRes, gmvTodayRes, applicationsRes, disputesRes, stateEventsRes, adminActionsRes, sparklineRes] =
    await Promise.all([
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString()),
      supabase
        .from('bookings')
        .select('total_charge_cents')
        .gte('created_at', todayStart.toISOString())
        .in('state', ['approved', 'auto_approved', 'paid']),
      supabase
        .from('cleaner_applications')
        .select('id', { count: 'exact', head: true })
        .eq('state', 'submitted'),
      supabase
        .from('disputes')
        .select('id', { count: 'exact', head: true })
        .in('state', ['open', 'escalated', 'in_mediation']),
      supabase
        .from('booking_state_events')
        .select('id, new_state, booking_id, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('admin_actions')
        .select('id, action_type, description, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('bookings')
        .select('total_charge_cents, created_at')
        .in('state', ['approved', 'auto_approved', 'paid'])
        .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

  const gmvTodayCents = (gmvTodayRes.data ?? []).reduce(
    (sum, b) => sum + (b.total_charge_cents ?? 0),
    0,
  );

  const sparklineData = (() => {
    const days: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days[key] = 0;
    }
    for (const booking of sparklineRes.data ?? []) {
      const key = new Date(booking.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      if (key in days) days[key]! += booking.total_charge_cents ?? 0;
    }
    return Object.entries(days).map(([date, gmvCents]) => ({ date, gmvCents }));
  })();

  const stateEvents = (stateEventsRes.data ?? []).map((e) => ({
    id: e.id,
    description: `Booking ${e.booking_id.slice(0, 8)}… → ${e.new_state}`,
    createdAt: e.created_at,
    type: 'booking' as const,
  }));

  const adminEvents = (adminActionsRes.data ?? []).map((e) => ({
    id: `admin-${e.id}`,
    description: e.description ?? e.action_type,
    createdAt: e.created_at,
    type: 'admin' as const,
  }));

  const allActivity = [...stateEvents, ...adminEvents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  const attentionItems = [];
  if ((disputesRes.count ?? 0) > 0) {
    attentionItems.push({
      id: 'disputes',
      label: 'Disputes open > 48h',
      href: '/admin/disputes',
      severity: 'critical' as const,
      count: disputesRes.count ?? 0,
    });
  }
  if ((applicationsRes.count ?? 0) > 0) {
    attentionItems.push({
      id: 'applications',
      label: 'Applications pending review',
      href: '/admin/applications',
      severity: 'warning' as const,
      count: applicationsRes.count ?? 0,
    });
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>

        <KpiGrid
          bookingsToday={bookingsTodayRes.count ?? 0}
          gmvTodayCents={gmvTodayCents}
          newApplications={applicationsRes.count ?? 0}
          openDisputes={disputesRes.count ?? 0}
        />

        <GmvSparkline data={sparklineData} />

        <div className="grid gap-6 lg:grid-cols-2">
          <NeedsAttention items={attentionItems} />
          <ActivityFeed events={allActivity} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
