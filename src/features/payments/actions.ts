'use server';

import { revalidatePath } from 'next/cache';

import { env } from '@/lib/env';
import { sendEmail } from '@/lib/email/resend';
import { payoutInitiatedEmail } from '@/lib/email/templates';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/webhooks';

export type PaymentActionState = { ok: boolean; error: string | null };

// ── Payment method management ─────────────────────────────────────────────

export const addPaymentMethodAction = async (
  _prevState: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> => {
  const token = formData.get('stripe_token') as string | null;
  if (!token) return { ok: false, error: 'No payment token provided.' };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('id, default_payment_method_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();
  if (!profile) return { ok: false, error: 'Customer profile not found.' };

  const admin = createSupabaseAdminClient();

  // Find existing stripe_customer_id from any existing PM for this customer
  const { data: existingPm } = await admin
    .from('payment_methods')
    .select('stripe_customer_id')
    .eq('customer_id', profile.id)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  let stripeCustomerId = existingPm?.stripe_customer_id ?? null;

  // Create Stripe Customer if none exists
  if (!stripeCustomerId) {
    const { data: userData } = await supabase.auth.getUser();
    const customer = await stripe.customers.create({
      email: userData.user?.email ?? undefined,
      metadata: { supabase_user_id: user.id, customer_profile_id: profile.id },
    });
    stripeCustomerId = customer.id;
  }

  // Convert token (from Stripe.js) to a PaymentMethod then attach it
  const pm = await stripe.paymentMethods.create({
    type: 'card',
    card: { token },
  });

  await stripe.paymentMethods.attach(pm.id, { customer: stripeCustomerId });

  const card = pm.card;
  const isFirst = !profile.default_payment_method_id;

  const { data: newPm, error } = await admin
    .from('payment_methods')
    .insert({
      customer_id: profile.id,
      stripe_customer_id: stripeCustomerId,
      stripe_payment_method_id: pm.id,
      method_type: 'card',
      card_brand: card?.brand ?? null,
      card_last_four: card?.last4 ?? null,
      card_exp_month: card?.exp_month ?? null,
      card_exp_year: card?.exp_year ?? null,
      is_default: isFirst,
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };

  // Set as default if first card
  if (isFirst) {
    await admin
      .from('customer_profiles')
      .update({ default_payment_method_id: newPm.id })
      .eq('id', profile.id);
  }

  revalidatePath('/app/settings/payment-methods');
  return { ok: true, error: null };
};

export const setDefaultPaymentMethodAction = async (
  paymentMethodId: string,
): Promise<PaymentActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();
  if (!profile) return { ok: false, error: 'Customer profile not found.' };

  const admin = createSupabaseAdminClient();

  // Verify this PM belongs to this customer
  const { data: pm } = await admin
    .from('payment_methods')
    .select('id')
    .eq('id', paymentMethodId)
    .eq('customer_id', profile.id)
    .is('deleted_at', null)
    .single();
  if (!pm) return { ok: false, error: 'Payment method not found.' };

  await Promise.all([
    admin.from('payment_methods').update({ is_default: false }).eq('customer_id', profile.id),
    admin.from('payment_methods').update({ is_default: true }).eq('id', paymentMethodId),
    admin
      .from('customer_profiles')
      .update({ default_payment_method_id: paymentMethodId })
      .eq('id', profile.id),
  ]);

  revalidatePath('/app/settings/payment-methods');
  return { ok: true, error: null };
};

export const deletePaymentMethodAction = async (
  paymentMethodId: string,
): Promise<PaymentActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('id, default_payment_method_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();
  if (!profile) return { ok: false, error: 'Customer profile not found.' };

  const admin = createSupabaseAdminClient();

  const { data: pm } = await admin
    .from('payment_methods')
    .select('id, stripe_payment_method_id, is_default')
    .eq('id', paymentMethodId)
    .eq('customer_id', profile.id)
    .is('deleted_at', null)
    .single();
  if (!pm) return { ok: false, error: 'Payment method not found.' };

  await stripe.paymentMethods.detach(pm.stripe_payment_method_id);

  await admin
    .from('payment_methods')
    .update({ deleted_at: new Date().toISOString(), is_default: false })
    .eq('id', paymentMethodId);

  // If deleted PM was default, clear the reference
  if (pm.is_default) {
    await admin
      .from('customer_profiles')
      .update({ default_payment_method_id: null })
      .eq('id', profile.id);
  }

  revalidatePath('/app/settings/payment-methods');
  return { ok: true, error: null };
};

// ── Instant payout ────────────────────────────────────────────────────────

export const requestInstantPayoutAction = async (): Promise<PaymentActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const admin = createSupabaseAdminClient();

  const { data: profile } = await admin
    .from('cleaner_profiles')
    .select('id, stripe_connect_account_id, instant_payout_enabled')
    .eq('user_id', user.id)
    .single();
  if (!profile) return { ok: false, error: 'Cleaner profile not found.' };
  if (!profile.instant_payout_enabled) return { ok: false, error: 'Instant payout not enabled.' };
  if (!profile.stripe_connect_account_id)
    return { ok: false, error: 'Stripe Connect account not set up.' };

  // Gather unpaid line items
  const { data: lineItems } = await admin
    .from('payout_line_items')
    .select('id, amount_cents')
    .eq('cleaner_id', profile.id)
    .is('payout_id', null);

  if (!lineItems || lineItems.length === 0)
    return { ok: false, error: 'No pending earnings to pay out.' };

  const totalCents = lineItems.reduce((sum, li) => sum + li.amount_cents, 0);
  const feeCents = Math.round(totalCents * 0.05);
  const netCents = totalCents - feeCents;

  if (netCents <= 0) return { ok: false, error: 'Payout amount too small after fee.' };

  const now = new Date().toISOString();

  const { data: payout, error: payoutError } = await admin
    .from('payouts')
    .insert({
      cleaner_id: profile.id,
      stripe_account_id: profile.stripe_connect_account_id,
      amount_cents: totalCents,
      net_amount_cents: netCents,
      instant_fee_cents: feeCents,
      is_instant: true,
      currency: 'usd',
      state: 'pending',
      initiated_at: now,
    })
    .select('id')
    .single();

  if (payoutError) return { ok: false, error: payoutError.message };

  // Create Stripe transfer with instant method
  try {
    const transfer = await stripe.transfers.create({
      amount: netCents,
      currency: 'usd',
      destination: profile.stripe_connect_account_id,
      metadata: { payout_id: payout.id },
    });

    await admin
      .from('payouts')
      .update({
        stripe_payout_id: transfer.id,
        state: 'in_transit',
        in_transit_at: now,
      })
      .eq('id', payout.id);
  } catch (err) {
    await admin
      .from('payouts')
      .update({ state: 'failed', failed_at: now, failed_reason: String(err) })
      .eq('id', payout.id);
    return { ok: false, error: 'Stripe transfer failed. Please try again.' };
  }

  // Link line items to payout
  await admin
    .from('payout_line_items')
    .update({ payout_id: payout.id })
    .in(
      'id',
      lineItems.map((li) => li.id),
    );

  // Notify cleaner of instant payout (fire-and-forget)
  void (async () => {
    const { data: cleanerUser } = await admin
      .from('users')
      .select('email, full_name')
      .eq('id', user.id)
      .single();
    if (cleanerUser?.email) {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(netCents / 100);
      await sendEmail({
        to: cleanerUser.email,
        ...payoutInitiatedEmail({
          cleanerName: cleanerUser.full_name ?? 'Cleaner',
          amountFormatted: formatted,
          isInstant: true,
        }),
      });
    }
  })();

  revalidatePath('/app/cleaner/earnings');
  return { ok: true, error: null };
};

// ── Instant payout toggle ─────────────────────────────────────────────────

export const toggleInstantPayoutAction = async (enabled: boolean): Promise<PaymentActionState> => {
  if (!env.STRIPE_SECRET_KEY) return { ok: false, error: 'Stripe not configured.' };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('cleaner_profiles')
    .update({ instant_payout_enabled: enabled })
    .eq('user_id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/app/cleaner/earnings');
  return { ok: true, error: null };
};
