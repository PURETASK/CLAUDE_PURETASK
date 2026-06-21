'use server';

import { revalidatePath } from 'next/cache';

import { type BookingState } from '@/features/booking/lib/booking-states';
import { settleApprovedBooking } from '@/features/booking/lib/settle-approval';
import { notifyBookingParty } from '@/features/notifications/dispatch';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database.types';

import { DEFAULT_GEOFENCE_RADIUS_METERS, haversineMeters } from './geofence';
import { meetsRequirements, type PhotoPurpose, type ServiceType } from './photo-rules';

export type VerificationActionState = { ok: boolean; error: string | null };

const asState = (s: string): BookingState => s as BookingState;

type User = { id: string };

type RequireCleanerCtx = { ok: false; error: string } | { ok: true; user: User; cleanerId: string };

type RequireCustomerCtx =
  | { ok: false; error: string }
  | { ok: true; user: User; customerId: string };

const requireUserAndCleaner = async (): Promise<RequireCleanerCtx> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: cleaner } = await supabase
    .from('cleaner_profiles')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();
  if (!cleaner) return { ok: false, error: 'Cleaner profile not found.' };

  return { ok: true, user, cleanerId: cleaner.id };
};

const requireUserAndCustomer = async (): Promise<RequireCustomerCtx> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: customer } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();
  if (!customer) return { ok: false, error: 'Customer profile not found.' };

  return { ok: true, user, customerId: customer.id };
};

const recordTransition = async (
  bookingId: string,
  prev: BookingState,
  next: BookingState,
  userId: string,
  reason: string,
  metadata: Record<string, unknown> = {},
) => {
  const admin = createSupabaseAdminClient();
  await admin.from('booking_state_events').insert({
    booking_id: bookingId,
    previous_state: prev,
    new_state: next,
    triggered_by_user_id: userId,
    reason,
    metadata: metadata as Json,
  });
};

export const startTransitAction = async (bookingId: string): Promise<VerificationActionState> => {
  const ctx = await requireUserAndCleaner();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const admin = createSupabaseAdminClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('id, state, cleaner_id')
    .eq('id', bookingId)
    .single();
  if (!booking) return { ok: false, error: 'Booking not found.' };
  if (booking.cleaner_id !== ctx.cleanerId) return { ok: false, error: 'Not your booking.' };
  if (!['confirmed', 'imminent'].includes(booking.state)) {
    return { ok: false, error: 'Booking is not ready for transit.' };
  }

  await admin
    .from('bookings')
    .update({ state: asState('in_transit'), cleaner_started_transit_at: new Date().toISOString() })
    .eq('id', bookingId);
  await recordTransition(
    bookingId,
    asState(booking.state),
    asState('in_transit'),
    ctx.user.id,
    'Cleaner started transit.',
  );

  void notifyBookingParty(bookingId, 'customer', {
    type: 'cleaner_on_the_way',
    title: 'Your cleaner is on the way',
    body: 'Your cleaner has started heading to your address.',
    deepLink: `/app/bookings/${bookingId}`,
  });

  revalidatePath(`/app/cleaner/bookings/${bookingId}`);
  return { ok: true, error: null };
};

export const markArrivedAction = async (
  bookingId: string,
  latitude: number,
  longitude: number,
): Promise<VerificationActionState> => {
  const ctx = await requireUserAndCleaner();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const admin = createSupabaseAdminClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('id, state, cleaner_id, address_id')
    .eq('id', bookingId)
    .single();
  if (!booking) return { ok: false, error: 'Booking not found.' };
  if (booking.cleaner_id !== ctx.cleanerId) return { ok: false, error: 'Not your booking.' };
  if (booking.state !== 'in_transit') {
    return { ok: false, error: 'Booking is not in transit.' };
  }

  const { data: address } = await admin
    .from('addresses')
    .select('latitude, longitude')
    .eq('id', booking.address_id)
    .single();

  let distanceMeters: number | null = null;
  if (address?.latitude != null && address?.longitude != null) {
    distanceMeters = haversineMeters(
      { latitude, longitude },
      { latitude: Number(address.latitude), longitude: Number(address.longitude) },
    );
    if (distanceMeters > DEFAULT_GEOFENCE_RADIUS_METERS) {
      return {
        ok: false,
        error: `Outside the ${DEFAULT_GEOFENCE_RADIUS_METERS}m geofence (${Math.round(distanceMeters)}m away).`,
      };
    }
  }

  await admin
    .from('bookings')
    .update({ state: asState('arrived'), cleaner_arrived_at: new Date().toISOString() })
    .eq('id', bookingId);
  await recordTransition(
    bookingId,
    asState('in_transit'),
    asState('arrived'),
    ctx.user.id,
    'Geofence hit; cleaner marked arrived.',
    { latitude, longitude, distanceMeters },
  );

  void notifyBookingParty(bookingId, 'customer', {
    type: 'cleaner_arrived',
    title: 'Your cleaner has arrived',
    body: 'Your cleaner is at your address and starting soon.',
    deepLink: `/app/bookings/${bookingId}`,
  });

  revalidatePath(`/app/cleaner/bookings/${bookingId}`);
  return { ok: true, error: null };
};

export const clockInAction = async (bookingId: string): Promise<VerificationActionState> => {
  const ctx = await requireUserAndCleaner();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const admin = createSupabaseAdminClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('id, state, cleaner_id')
    .eq('id', bookingId)
    .single();
  if (!booking) return { ok: false, error: 'Booking not found.' };
  if (booking.cleaner_id !== ctx.cleanerId) return { ok: false, error: 'Not your booking.' };
  if (booking.state !== 'arrived') {
    return { ok: false, error: 'Cleaner must be marked arrived before clock-in.' };
  }

  await admin
    .from('bookings')
    .update({ state: asState('in_progress'), clock_in_at: new Date().toISOString() })
    .eq('id', bookingId);
  await recordTransition(
    bookingId,
    asState('arrived'),
    asState('in_progress'),
    ctx.user.id,
    'Cleaner clocked in.',
  );

  revalidatePath(`/app/cleaner/bookings/${bookingId}`);
  return { ok: true, error: null };
};

export const uploadBookingPhotoAction = async (
  bookingId: string,
  purpose: PhotoPurpose,
  file: File,
): Promise<VerificationActionState> => {
  const ctx = await requireUserAndCleaner();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  if (!['before_clock_in', 'after_clock_out'].includes(purpose)) {
    return { ok: false, error: 'Invalid photo purpose for clock-in/out evidence.' };
  }

  const admin = createSupabaseAdminClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('id, state, cleaner_id, end_at')
    .eq('id', bookingId)
    .single();
  if (!booking) return { ok: false, error: 'Booking not found.' };
  if (booking.cleaner_id !== ctx.cleanerId) return { ok: false, error: 'Not your booking.' };
  if (booking.state !== 'in_progress') {
    return { ok: false, error: 'Photos can only be uploaded while in_progress.' };
  }

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
  const photoId = crypto.randomUUID();
  const storageKey = `bookings/${bookingId}/photos/${photoId}.${ext}`;

  const upload = await admin.storage
    .from('booking-photos')
    .upload(storageKey, file, { contentType: file.type, upsert: false });
  if (upload.error) return { ok: false, error: `Storage upload failed: ${upload.error.message}` };

  const deleteAfterAt = new Date(new Date(booking.end_at).getTime() + 90 * 24 * 60 * 60 * 1000);

  const { error: insertError } = await admin.from('booking_photos').insert({
    id: photoId,
    booking_id: bookingId,
    uploaded_by_user_id: ctx.user.id,
    purpose,
    storage_key: storageKey,
    file_size_bytes: file.size,
    mime_type: file.type,
    delete_after_at: deleteAfterAt.toISOString(),
  });
  if (insertError) {
    await admin.storage.from('booking-photos').remove([storageKey]);
    return { ok: false, error: `Failed to record photo: ${insertError.message}` };
  }

  revalidatePath(`/app/cleaner/bookings/${bookingId}`);
  return { ok: true, error: null };
};

export const clockOutAction = async (bookingId: string): Promise<VerificationActionState> => {
  const ctx = await requireUserAndCleaner();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const admin = createSupabaseAdminClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('id, state, cleaner_id, service_id')
    .eq('id', bookingId)
    .single();
  if (!booking) return { ok: false, error: 'Booking not found.' };
  if (booking.cleaner_id !== ctx.cleanerId) return { ok: false, error: 'Not your booking.' };
  if (booking.state !== 'in_progress') {
    return { ok: false, error: 'Booking is not in_progress.' };
  }

  const { data: service } = await admin
    .from('services')
    .select('service_type')
    .eq('id', booking.service_id)
    .single();
  if (!service) return { ok: false, error: 'Service not found.' };

  const { data: photos } = await admin
    .from('booking_photos')
    .select('purpose')
    .eq('booking_id', bookingId)
    .is('deleted_at', null);
  const counts = {
    before: photos?.filter((p) => p.purpose === 'before_clock_in').length ?? 0,
    after: photos?.filter((p) => p.purpose === 'after_clock_out').length ?? 0,
  };

  if (!meetsRequirements(counts, service.service_type as ServiceType)) {
    return { ok: false, error: 'Required photos not uploaded yet.' };
  }

  const now = new Date();
  const dueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  await admin
    .from('bookings')
    .update({
      state: asState('awaiting_approval'),
      clock_out_at: now.toISOString(),
      cleaning_completed_at: now.toISOString(),
      auto_approval_due_at: dueAt.toISOString(),
    })
    .eq('id', bookingId);
  await recordTransition(
    bookingId,
    asState('in_progress'),
    asState('awaiting_approval'),
    ctx.user.id,
    'Cleaner clocked out; awaiting customer approval.',
    { auto_approval_due_at: dueAt.toISOString() },
  );

  void notifyBookingParty(bookingId, 'customer', {
    type: 'cleaning_complete',
    title: 'Your cleaning is complete',
    body: 'Review the photos and approve the work — payment is held until you approve (or auto-approves in 24h).',
    deepLink: `/app/bookings/${bookingId}`,
  });

  revalidatePath(`/app/cleaner/bookings/${bookingId}`);
  revalidatePath(`/app/bookings/${bookingId}`);
  return { ok: true, error: null };
};

export const approveBookingAction = async (bookingId: string): Promise<VerificationActionState> => {
  const ctx = await requireUserAndCustomer();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const admin = createSupabaseAdminClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('id, state, customer_id')
    .eq('id', bookingId)
    .single();
  if (!booking) return { ok: false, error: 'Booking not found.' };
  if (booking.customer_id !== ctx.customerId) return { ok: false, error: 'Not your booking.' };

  // Funnel through the shared settler so this approval path also captures the
  // payment and creates the cleaner payout (previously it was state-only).
  const result = await settleApprovedBooking(admin, {
    bookingId,
    newState: 'paid',
    actorUserId: ctx.user.id,
    reason: 'Customer approved the cleaning.',
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath(`/app/bookings/${bookingId}`);
  return { ok: true, error: null };
};

export const disputeBookingAction = async (
  bookingId: string,
  reason: string,
): Promise<VerificationActionState> => {
  const ctx = await requireUserAndCustomer();
  if (!ctx.ok) return { ok: false, error: ctx.error };
  if (reason.trim().length < 10) {
    return { ok: false, error: 'Please provide at least 10 characters explaining the issue.' };
  }

  const admin = createSupabaseAdminClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('id, state, customer_id')
    .eq('id', bookingId)
    .single();
  if (!booking) return { ok: false, error: 'Booking not found.' };
  if (booking.customer_id !== ctx.customerId) return { ok: false, error: 'Not your booking.' };
  if (!['awaiting_approval', 'paid'].includes(booking.state)) {
    return { ok: false, error: 'Booking cannot be disputed in its current state.' };
  }

  await admin
    .from('bookings')
    .update({ state: asState('disputed') })
    .eq('id', bookingId);
  await recordTransition(
    bookingId,
    asState(booking.state),
    asState('disputed'),
    ctx.user.id,
    `Customer filed dispute: ${reason}`,
    { reason },
  );

  revalidatePath(`/app/bookings/${bookingId}`);
  return { ok: true, error: null };
};
