import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type PaymentMethodRow = {
  id: string;
  stripe_customer_id: string;
  stripe_payment_method_id: string;
  method_type: 'card' | 'bank_account';
  card_brand: string | null;
  card_last_four: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  is_default: boolean;
};

export type ChargeRow = {
  id: string;
  state: string;
  amount_cents: number;
  application_fee_cents: number;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  authorized_at: string | null;
  captured_at: string | null;
  failed_at: string | null;
  failed_reason: string | null;
  total_refunded_cents: number;
  payment_method_id: string;
};

export type PayoutRow = {
  id: string;
  state: string;
  amount_cents: number;
  net_amount_cents: number;
  instant_fee_cents: number;
  is_instant: boolean;
  stripe_payout_id: string | null;
  initiated_at: string;
  in_transit_at: string | null;
  paid_at: string | null;
  failed_at: string | null;
  failed_reason: string | null;
  period_start_at: string | null;
  period_end_at: string | null;
};

export type PayoutLineItemRow = {
  id: string;
  amount_cents: number;
  description: string;
  earned_at: string;
  booking_id: string | null;
  payout_id: string | null;
};

export const getMyPaymentMethods = async (): Promise<PaymentMethodRow[]> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();
  if (!profile) return [];

  const { data } = await supabase
    .from('payment_methods')
    .select(
      'id, stripe_customer_id, stripe_payment_method_id, method_type, card_brand, card_last_four, card_exp_month, card_exp_year, is_default',
    )
    .eq('customer_id', profile.id)
    .is('deleted_at', null)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  return (data ?? []) as PaymentMethodRow[];
};

export const getDefaultPaymentMethod = async (
  customerId: string,
): Promise<PaymentMethodRow | null> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('payment_methods')
    .select(
      'id, stripe_customer_id, stripe_payment_method_id, method_type, card_brand, card_last_four, card_exp_month, card_exp_year, is_default',
    )
    .eq('customer_id', customerId)
    .eq('is_default', true)
    .is('deleted_at', null)
    .maybeSingle();

  return (data as PaymentMethodRow | null) ?? null;
};

export const getChargeForBooking = async (bookingId: string): Promise<ChargeRow | null> => {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('charges')
    .select(
      'id, state, amount_cents, application_fee_cents, stripe_payment_intent_id, stripe_charge_id, authorized_at, captured_at, failed_at, failed_reason, total_refunded_cents, payment_method_id',
    )
    .eq('booking_id', bookingId)
    .is('tip_id', null)
    .maybeSingle();

  return (data as ChargeRow | null) ?? null;
};

export const getCleanerPayouts = async (cleanerId: string): Promise<PayoutRow[]> => {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('payouts')
    .select(
      'id, state, amount_cents, net_amount_cents, instant_fee_cents, is_instant, stripe_payout_id, initiated_at, in_transit_at, paid_at, failed_at, failed_reason, period_start_at, period_end_at',
    )
    .eq('cleaner_id', cleanerId)
    .order('initiated_at', { ascending: false })
    .limit(50);

  return (data ?? []) as PayoutRow[];
};

export const getUnpaidLineItems = async (cleanerId: string): Promise<PayoutLineItemRow[]> => {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('payout_line_items')
    .select('id, amount_cents, description, earned_at, booking_id, payout_id')
    .eq('cleaner_id', cleanerId)
    .is('payout_id', null)
    .order('earned_at', { ascending: false });

  return (data ?? []) as PayoutLineItemRow[];
};

export const getMyCleanerEarnings = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from('cleaner_profiles')
    .select('id, stripe_connect_account_id, instant_payout_enabled')
    .eq('user_id', user.id)
    .single();
  if (!profile) return null;

  const [payouts, pendingItems] = await Promise.all([
    getCleanerPayouts(profile.id),
    getUnpaidLineItems(profile.id),
  ]);

  const pendingBalanceCents = pendingItems.reduce((sum, item) => sum + item.amount_cents, 0);

  return {
    cleanerId: profile.id,
    stripeConnectAccountId: profile.stripe_connect_account_id,
    instantPayoutEnabled: profile.instant_payout_enabled,
    pendingBalanceCents,
    pendingItems,
    payouts,
  };
};
