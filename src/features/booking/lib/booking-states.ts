import type { SupabaseClient } from '@supabase/supabase-js';

export type BookingState =
  | 'booking_requested'
  | 'confirmed'
  | 'imminent'
  | 'in_transit'
  | 'arrived'
  | 'in_progress'
  | 'awaiting_approval'
  | 'approved'
  | 'auto_approved'
  | 'paid'
  | 'disputed'
  | 'dispute_resolved'
  | 'reschedule_pending'
  | 'cancelled_by_customer'
  | 'cancelled_by_cleaner'
  | 'completed';

export const BOOKING_STATE_LABELS: Record<string, string> = {
  booking_requested: 'Requested',
  confirmed: 'Confirmed',
  imminent: 'Starting soon',
  in_transit: 'On the way',
  arrived: 'Arrived',
  in_progress: 'In progress',
  awaiting_approval: 'Awaiting approval',
  approved: 'Approved',
  auto_approved: 'Auto-approved',
  paid: 'Paid',
  disputed: 'Disputed',
  dispute_resolved: 'Resolved',
  reschedule_pending: 'Reschedule pending',
  cancelled_by_customer: 'Cancelled',
  cancelled_by_cleaner: 'Cancelled by cleaner',
  completed: 'Completed',
};

export const CLEANER_ACTIVE_STATES: BookingState[] = [
  'confirmed',
  'imminent',
  'in_transit',
  'arrived',
  'in_progress',
  'awaiting_approval',
];

export const CUSTOMER_ACTIVE_STATES: BookingState[] = [
  ...CLEANER_ACTIVE_STATES,
  'approved',
  'auto_approved',
];

export async function writeBookingStateEvent(
  supabase: SupabaseClient,
  bookingId: string,
  newState: BookingState,
  actorId: string,
  metadata?: Record<string, unknown>,
): Promise<{ error: Error | null }> {
  const { data: current } = await supabase
    .from('bookings')
    .select('state')
    .eq('id', bookingId)
    .single();

  const { error } = await supabase.from('booking_state_events').insert({
    booking_id: bookingId,
    previous_state: current?.state ?? null,
    new_state: newState,
    triggered_by_user_id: actorId,
    metadata: metadata ?? {},
  });

  if (error) return { error: new Error(error.message) };

  const updatePayload: Record<string, unknown> = { state: newState };

  if (newState === 'in_transit') {
    updatePayload.cleaner_started_transit_at = new Date().toISOString();
  }
  if (newState === 'arrived') {
    updatePayload.cleaner_arrived_at = new Date().toISOString();
  }
  if (newState === 'in_progress') {
    updatePayload.clock_in_at = new Date().toISOString();
  }
  if (newState === 'awaiting_approval') {
    updatePayload.clock_out_at = new Date().toISOString();
    updatePayload.cleaning_completed_at = new Date().toISOString();
    updatePayload.auto_approval_due_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }
  if (newState === 'approved') {
    updatePayload.customer_approved_at = new Date().toISOString();
  }
  if (newState === 'auto_approved') {
    updatePayload.auto_approved_at = new Date().toISOString();
  }
  if (newState === 'cancelled_by_customer' || newState === 'cancelled_by_cleaner') {
    updatePayload.cancelled_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from('bookings')
    .update(updatePayload)
    .eq('id', bookingId);

  return { error: updateError ? new Error(updateError.message) : null };
}
