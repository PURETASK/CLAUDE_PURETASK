import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type ServiceRow = {
  id: string;
  service_type: string;
  display_name: string;
  min_hours_by_tier: Record<string, number>;
};

export type BookingListItem = {
  id: string;
  booking_number: string;
  state: string;
  start_at: string;
  end_at: string;
  duration_hours_decimal: number;
  total_charge_cents: number;
  cleaner_payout_cents: number;
  service_display_name: string;
  other_party_name: string;
  address_street: string;
};

export type BookingDetail = BookingListItem & {
  hourly_rate_cents: number;
  cleaner_subtotal_cents: number;
  platform_fee_cents: number;
  customer_notes: string | null;
  tier_at_booking: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  customer_id: string;
  cleaner_id: string | null;
};

export const listServices = async (): Promise<ServiceRow[]> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('services')
    .select('id, service_type, display_name, min_hours_by_tier')
    .eq('is_active', true)
    .order('display_order');
  return (data ?? []).map((s) => ({
    ...s,
    min_hours_by_tier: (s.min_hours_by_tier ?? {}) as Record<string, number>,
  }));
};

export const getMyCleanerProfileId = async (): Promise<string | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('cleaner_profiles')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single();
  return data?.id ?? null;
};

export const getMyCustomerProfileId = async (): Promise<string | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();
  return data?.id ?? null;
};

export const getMyBookingsAsCustomer = async (): Promise<BookingListItem[]> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('bookings')
    .select(
      `id, booking_number, state, start_at, end_at, duration_hours_decimal,
       total_charge_cents, cleaner_payout_cents,
       services!bookings_service_id_fkey(display_name),
       addresses!bookings_address_id_fkey(street_1),
       cleaner_profiles!bookings_cleaner_id_fkey(
         users!cleaner_profiles_user_id_fkey(full_name)
       )`,
    )
    .order('start_at', { ascending: false });

  return (data ?? []).map((row) => {
    const service = Array.isArray(row.services) ? row.services[0] : row.services;
    const address = Array.isArray(row.addresses) ? row.addresses[0] : row.addresses;
    const cleanerProfile = Array.isArray(row.cleaner_profiles)
      ? row.cleaner_profiles[0]
      : row.cleaner_profiles;
    const cleanerUser = cleanerProfile
      ? Array.isArray((cleanerProfile as { users: unknown }).users)
        ? ((cleanerProfile as { users: { full_name: string }[] }).users[0] ?? null)
        : ((cleanerProfile as { users: { full_name: string } | null }).users ?? null)
      : null;

    return {
      id: row.id,
      booking_number: row.booking_number,
      state: row.state,
      start_at: row.start_at,
      end_at: row.end_at,
      duration_hours_decimal: row.duration_hours_decimal,
      total_charge_cents: row.total_charge_cents,
      cleaner_payout_cents: row.cleaner_payout_cents,
      service_display_name: (service as { display_name: string } | null)?.display_name ?? '—',
      other_party_name: (cleanerUser as { full_name: string } | null)?.full_name ?? 'Cleaner TBD',
      address_street: (address as { street_1: string } | null)?.street_1 ?? '—',
    };
  });
};

export const getMyBookingsAsCleaner = async (): Promise<BookingListItem[]> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('bookings')
    .select(
      `id, booking_number, state, start_at, end_at, duration_hours_decimal,
       total_charge_cents, cleaner_payout_cents,
       services!bookings_service_id_fkey(display_name),
       addresses!bookings_address_id_fkey(street_1),
       customer_profiles!bookings_customer_id_fkey(
         users!customer_profiles_user_id_fkey(full_name)
       )`,
    )
    .order('start_at', { ascending: false });

  return (data ?? []).map((row) => {
    const service = Array.isArray(row.services) ? row.services[0] : row.services;
    const address = Array.isArray(row.addresses) ? row.addresses[0] : row.addresses;
    const customerProfile = Array.isArray(row.customer_profiles)
      ? row.customer_profiles[0]
      : row.customer_profiles;
    const customerUser = customerProfile
      ? Array.isArray((customerProfile as { users: unknown }).users)
        ? ((customerProfile as { users: { full_name: string }[] }).users[0] ?? null)
        : ((customerProfile as { users: { full_name: string } | null }).users ?? null)
      : null;

    return {
      id: row.id,
      booking_number: row.booking_number,
      state: row.state,
      start_at: row.start_at,
      end_at: row.end_at,
      duration_hours_decimal: row.duration_hours_decimal,
      total_charge_cents: row.total_charge_cents,
      cleaner_payout_cents: row.cleaner_payout_cents,
      service_display_name: (service as { display_name: string } | null)?.display_name ?? '—',
      other_party_name: (customerUser as { full_name: string } | null)?.full_name ?? 'Customer',
      address_street: (address as { street_1: string } | null)?.street_1 ?? '—',
    };
  });
};

export const getBookingById = async (id: string): Promise<BookingDetail | null> => {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('bookings')
    .select(
      `id, booking_number, state, start_at, end_at, duration_hours_decimal,
       hourly_rate_cents, cleaner_subtotal_cents, platform_fee_cents,
       total_charge_cents, cleaner_payout_cents, tier_at_booking,
       customer_notes, cancelled_at, cancellation_reason,
       customer_id, cleaner_id,
       services!bookings_service_id_fkey(display_name),
       addresses!bookings_address_id_fkey(street_1),
       customer_profiles!bookings_customer_id_fkey(
         users!customer_profiles_user_id_fkey(full_name)
       ),
       cleaner_profiles!bookings_cleaner_id_fkey(
         users!cleaner_profiles_user_id_fkey(full_name)
       )`,
    )
    .eq('id', id)
    .single();

  if (!data) return null;

  const service = Array.isArray(data.services) ? data.services[0] : data.services;
  const address = Array.isArray(data.addresses) ? data.addresses[0] : data.addresses;
  const customerProfile = Array.isArray(data.customer_profiles)
    ? data.customer_profiles[0]
    : data.customer_profiles;
  const cleanerProfile = Array.isArray(data.cleaner_profiles)
    ? data.cleaner_profiles[0]
    : data.cleaner_profiles;

  const customerUser = customerProfile
    ? Array.isArray((customerProfile as { users: unknown }).users)
      ? ((customerProfile as { users: { full_name: string }[] }).users[0] ?? null)
      : ((customerProfile as { users: { full_name: string } | null }).users ?? null)
    : null;
  const cleanerUser = cleanerProfile
    ? Array.isArray((cleanerProfile as { users: unknown }).users)
      ? ((cleanerProfile as { users: { full_name: string }[] }).users[0] ?? null)
      : ((cleanerProfile as { users: { full_name: string } | null }).users ?? null)
    : null;

  return {
    id: data.id,
    booking_number: data.booking_number,
    state: data.state,
    start_at: data.start_at,
    end_at: data.end_at,
    duration_hours_decimal: data.duration_hours_decimal,
    hourly_rate_cents: data.hourly_rate_cents,
    cleaner_subtotal_cents: data.cleaner_subtotal_cents,
    platform_fee_cents: data.platform_fee_cents,
    total_charge_cents: data.total_charge_cents,
    cleaner_payout_cents: data.cleaner_payout_cents,
    tier_at_booking: data.tier_at_booking,
    customer_notes: data.customer_notes ?? null,
    cancelled_at: data.cancelled_at ?? null,
    cancellation_reason: data.cancellation_reason ?? null,
    customer_id: data.customer_id,
    cleaner_id: data.cleaner_id ?? null,
    service_display_name: (service as { display_name: string } | null)?.display_name ?? '—',
    other_party_name:
      (cleanerUser as { full_name: string } | null)?.full_name ??
      (customerUser as { full_name: string } | null)?.full_name ??
      '—',
    address_street: (address as { street_1: string } | null)?.street_1 ?? '—',
  };
};
